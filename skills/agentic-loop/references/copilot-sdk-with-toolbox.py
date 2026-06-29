"""GitHub Copilot SDK agent that consumes a Foundry toolbox over MCP.

By default the agent bridges the Foundry toolbox MCP endpoint and exposes every
toolbox tool (MCP servers, web_search, file_search, ...) to the Copilot SDK session,
and downloads the toolbox's skills from Foundry into a writable temp directory so the
SDK loads each SKILL.md as instructions. The skills directory is created at runtime and
is NOT part of the agent source tree, so the repo and image ship without a skills/
folder. It defaults under tempfile.gettempdir() because hosted-agent container
filesystems are read-only except /tmp; override the location with SKILLS_DIR.

The toolbox MCP endpoint is
<project-endpoint>/toolboxes/<name>/versions/<version>/mcp?api-version=v1 (or set
TOOLBOX_MCP_ENDPOINT directly — e.g. the TOOLBOX_<NAME>_MCP_ENDPOINT value that
`azd ai toolbox create` writes). Every call carries a bearer token for
https://ai.azure.com/.default and the `Foundry-Features: Toolboxes=V1Preview` header.

"""

import contextlib
import io
import json
import logging
import os
import pathlib
import tempfile
import zipfile

import httpx
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from copilot import CopilotClient, PermissionHandler, ProviderConfig, TelemetryConfig
from copilot.session_events import SessionEventType
from copilot.tools import Tool, ToolInvocation, ToolResult
from dotenv import load_dotenv
from opentelemetry import _logs, metrics, trace
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import ReadableSpan, TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace import Status, StatusCode

load_dotenv(override=False)

_logger = logging.getLogger(__name__)

# Runtime cache for downloaded skills: a writable temp directory (override with SKILLS_DIR).
# Defaults under tempfile.gettempdir() because hosted-agent container filesystems are read-only
# except /tmp — defaulting to ./skills under the app directory crashes on first invocation.
# Created and populated at startup — NOT part of the agent source tree, so the repo and image
# ship without a skills/ folder. Nothing to ignore because it never exists in source.
_skills_dir = pathlib.Path(
    os.environ.get("SKILLS_DIR") or os.path.join(tempfile.gettempdir(), "skills")
).resolve()

# Skills this agent depends on. Downloaded from Foundry into _skills_dir when missing.
_SKILL_NAMES = []
# Single shared credential so every call site reuses one managed-identity probe and the
# cached token, instead of constructing a new DefaultAzureCredential each time.
_credential_instance: DefaultAzureCredential | None = None


def _credential() -> DefaultAzureCredential:
    """Lazily build and reuse one process-wide DefaultAzureCredential."""
    global _credential_instance
    if _credential_instance is None:
        _credential_instance = DefaultAzureCredential()
    return _credential_instance

# ── Foundry toolbox over MCP (default tool source) ─────────────────────────────


def _toolbox_url() -> str | None:
    """Toolbox MCP endpoint: explicit TOOLBOX_MCP_ENDPOINT, else built from project + name + version."""
    explicit = os.environ.get("TOOLBOX_MCP_ENDPOINT")
    if explicit:
        return explicit
    endpoint = os.environ.get("FOUNDRY_PROJECT_ENDPOINT", "")
    name = os.environ.get("TOOLBOX_NAME", "")
    version = os.environ.get("TOOLBOX_VERSION", "")
    if not (endpoint and name and version):
        _logger.info("Toolbox endpoint not configured; running without toolbox tools.")
        return None
    return f"{endpoint.rstrip('/')}/toolboxes/{name}/versions/{version}/mcp?api-version=v1"


def _get_toolbox_token() -> str:
    """Bearer token for the toolbox MCP endpoint (keyless via Managed Identity / az login)."""
    return _credential().get_token("https://ai.azure.com/.default").token


def _toolbox_headers(token: str) -> dict:
    """Headers every toolbox MCP call needs, including the Toolboxes preview feature flag."""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "Foundry-Features": "Toolboxes=V1Preview",
    }


def _raise_jsonrpc_error(payload: dict) -> dict:
    """Raise on a JSON-RPC error object (MCP returns these as HTTP 200), else pass through."""
    if isinstance(payload, dict) and payload.get("error"):
        err = payload["error"]
        raise RuntimeError(f"MCP error {err.get('code')}: {err.get('message', 'unknown')}")
    return payload


class McpBridge:
    """Minimal streamable-HTTP MCP client for a Foundry toolbox MCP endpoint."""

    def __init__(self, endpoint: str, token: str) -> None:
        self.endpoint = endpoint
        self.headers = _toolbox_headers(token)
        self._session_id: str | None = None
        self._client = httpx.AsyncClient(timeout=60.0)
        self._req_id = 0

    def _next_id(self) -> int:
        self._req_id += 1
        return self._req_id

    def _request_headers(self) -> dict:
        headers = dict(self.headers)
        if self._session_id:
            headers["mcp-session-id"] = self._session_id
        return headers

    async def initialize(self) -> str:
        """MCP initialize + notifications/initialized; captures the mcp-session-id."""
        resp = await self._client.post(
            self.endpoint,
            headers=self.headers,
            json={
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-03-26",
                    "capabilities": {},
                    "clientInfo": {"name": "copilot-toolbox-bridge", "version": "1.0.0"},
                },
            },
        )
        resp.raise_for_status()
        data = _raise_jsonrpc_error(resp.json())
        self._session_id = resp.headers.get("mcp-session-id")
        await self._client.post(
            self.endpoint,
            headers=self._request_headers(),
            json={"jsonrpc": "2.0", "method": "notifications/initialized"},
        )
        return data.get("result", {}).get("serverInfo", {}).get("name", "unknown")

    async def list_tools(self) -> list[dict]:
        """tools/list → the tools array."""
        resp = await self._client.post(
            self.endpoint,
            headers=self._request_headers(),
            json={"jsonrpc": "2.0", "id": self._next_id(), "method": "tools/list", "params": {}},
        )
        resp.raise_for_status()
        return _raise_jsonrpc_error(resp.json()).get("result", {}).get("tools", [])

    async def call_tool(self, name: str, arguments: dict) -> str:
        """tools/call → the joined text result."""
        resp = await self._client.post(
            self.endpoint,
            headers=self._request_headers(),
            json={
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "tools/call",
                "params": {"name": name, "arguments": arguments},
            },
        )
        resp.raise_for_status()
        result = _raise_jsonrpc_error(resp.json()).get("result", {})
        content = result.get("content", [])
        texts = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"]
        return "\n".join(t for t in texts if t) or json.dumps(result)

    async def close(self) -> None:
        await self._client.aclose()


def _make_copilot_tools(bridge: McpBridge, mcp_tools: list[dict]) -> list[Tool]:
    """Wrap each toolbox MCP tool as a Copilot SDK Tool that forwards the call through the bridge."""
    tools: list[Tool] = []
    for mcp_tool in mcp_tools:
        mcp_name = mcp_tool["name"]
        sdk_name = mcp_name.replace(".", "_").replace("-", "_")  # Copilot SDK rejects dots/hyphens
        desc = mcp_tool.get("description", f"MCP tool: {mcp_name}")
        schema = mcp_tool.get("inputSchema", {"type": "object", "properties": {}})

        def _make_handler(original_name: str):
            async def handler(invocation: ToolInvocation) -> ToolResult:
                args = invocation.arguments if isinstance(invocation.arguments, dict) else {}
                # Trace each MCP tool call so its name, inputs, outputs, and errors land in App Insights.
                span_cm = (
                    _tracer.start_as_current_span(f"execute_tool {original_name}")
                    if _tracer
                    else contextlib.nullcontext(None)
                )
                with span_cm as span:
                    if span is not None:
                        span.set_attribute("gen_ai.tool.name", original_name)
                        span.set_attribute("gen_ai.tool.type", "mcp")
                        _set_span_io(span, "gen_ai.tool.call.arguments", args)
                    try:
                        output = await bridge.call_tool(original_name, args)
                    except Exception as exc:  # surface the tool error to the model and the trace
                        if span is not None:
                            span.record_exception(exc)
                            span.set_status(Status(StatusCode.ERROR, str(exc)))
                        return ToolResult(text_result_for_llm="", result_type="error", error=str(exc))
                    _set_span_io(span, "gen_ai.tool.call.result", output)
                    return ToolResult(text_result_for_llm=output)

            return handler

        tools.append(
            Tool(
                name=sdk_name,
                description=desc,
                parameters=schema,
                handler=_make_handler(mcp_name),
                skip_permission=True,
            )
        )
    return tools


# ── Telemetry: in-process Azure Monitor ────────────────

# HTTP methods worth keeping in traces — everything else is noise.
_TRACED_HTTP_METHODS = frozenset({"GET", "POST"})

# OTel instruments populated by configure_otel(); stay None in local dev when
# APPLICATIONINSIGHTS_CONNECTION_STRING is unset, so every call site degrades to a no-op.
_tracer: trace.Tracer | None = None
_token_usage_histogram: metrics.Histogram | None = None
# Record full prompt/tool-call content on spans (vs. only sizes). Set from
# AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED so production stays redacted by default.
_capture_content = False
# Cap span attribute payloads so one huge tool result can't bloat every trace.
_MAX_ATTR_LEN = 8192


def _set_span_io(span: trace.Span | None, key: str, value: object) -> None:
    """Attach tool/turn I/O to a span: full content when capture is on, else just its size."""
    if span is None:
        return
    text = value if isinstance(value, str) else json.dumps(value, default=str)
    if _capture_content:
        span.set_attribute(key, text[:_MAX_ATTR_LEN])
    else:
        span.set_attribute(f"{key}.size", len(text))


def _record_token_usage(usage: object, model: str | None) -> None:
    """Record input/output token counts (gen_ai.client.token.usage) when the SDK surfaces usage."""
    if _token_usage_histogram is None or usage is None:
        return
    attrs: dict[str, object] = {"gen_ai.operation.name": "invoke_agent"}
    if model:
        attrs["gen_ai.request.model"] = model
    input_tokens = getattr(usage, "input_tokens", None) or getattr(usage, "prompt_tokens", None)
    output_tokens = getattr(usage, "output_tokens", None) or getattr(usage, "completion_tokens", None)
    if input_tokens is not None:
        _token_usage_histogram.record(int(input_tokens), {**attrs, "gen_ai.token.type": "input"})
    if output_tokens is not None:
        _token_usage_histogram.record(int(output_tokens), {**attrs, "gen_ai.token.type": "output"})


class _FilteringSpanProcessor(BatchSpanProcessor):
    """BatchSpanProcessor that silently drops noisy ASGI/HTTP spans before export."""

    def on_end(self, span: ReadableSpan) -> None:
        # Drop ASGI internal send/receive spans that duplicate InProcess entries.
        if span.kind == trace.SpanKind.INTERNAL:
            name = span.name or ""
            if "http send" in name or "http receive" in name:
                return
        # Drop HTTP spans for methods we don't care about (OPTIONS, PATCH, DELETE, ...).
        attrs = span.attributes or {}
        method = attrs.get("http.request.method") or attrs.get("http.method")
        if method and method.upper() not in _TRACED_HTTP_METHODS:
            return
        super().on_end(span)


def configure_otel() -> None:
    """Configure OpenTelemetry with the Azure Monitor exporters (traces, metrics, logs).

    Wire the Application Insights connection string straight into the in-process OTel SDK so the agent's own
    spans, metrics, and logs land in App Insights without an OpenTelemetry Collector. Bridges Python logging
    into App Insights, instruments the OpenAI SDK for in-process Foundry model calls, and prepares the
    instruments the agent emits itself:

    - **Conversation turns** — each turn becomes a `conversation_turn` span carrying the prompt/completion
      (content gated by AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED).
    - **MCP tool inputs/outputs** — each toolbox call becomes an `execute_tool <name>` span with arguments,
      result, and error status (content gated the same way).
    - **Token consumption** — a `gen_ai.client.token.usage` histogram split by input/output, recorded from
      any usage the SDK surfaces (the model's own counts also arrive from the Copilot CLI over OTLP).

    No-op when APPLICATIONINSIGHTS_CONNECTION_STRING is unset (local dev).

    Install: pip install azure-monitor-opentelemetry-exporter opentelemetry-instrumentation-openai-v2
    """
    conn_str = os.environ.get("APPLICATIONINSIGHTS_CONNECTION_STRING")
    if not conn_str:
        _logger.info("APPLICATIONINSIGHTS_CONNECTION_STRING not set; skipping Azure Monitor telemetry.")
        return

    resource = Resource.create(
        {
            "service.name": os.environ.get("OTEL_SERVICE_NAME", "foundry-toolbox-agent"),
            "service.version": os.environ.get("OTEL_SERVICE_VERSION", "0.1.0"),
            "deployment.environment": os.environ.get("ENVIRONMENT", "development"),
        }
    )

    provider = TracerProvider(resource=resource)
    try:
        from azure.monitor.opentelemetry.exporter import (
            AzureMonitorLogExporter,
            AzureMonitorMetricExporter,
            AzureMonitorTraceExporter,
        )

        # Traces → AppInsights 'dependencies' and 'requests' tables.
        provider.add_span_processor(
            _FilteringSpanProcessor(AzureMonitorTraceExporter(connection_string=conn_str))
        )

        # Metrics → AppInsights 'customMetrics' table.
        reader = PeriodicExportingMetricReader(
            AzureMonitorMetricExporter(connection_string=conn_str),
            export_interval_millis=60000,
        )
        metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=[reader]))

        # Logs/events → AppInsights 'traces' and 'customEvents' tables, plus a Python
        # logging bridge so app logs are correlated with the active trace context.
        log_provider = LoggerProvider(resource=resource)
        log_provider.add_log_record_processor(
            BatchLogRecordProcessor(AzureMonitorLogExporter(connection_string=conn_str))
        )
        _logs.set_logger_provider(log_provider)
        logging.getLogger().addHandler(LoggingHandler(level=logging.INFO, logger_provider=log_provider))
    except Exception:  # never let telemetry wiring crash the agent
        _logger.warning("Failed to configure Azure Monitor exporters", exc_info=True)

    trace.set_tracer_provider(provider)

    # Capture conversation turns (prompts/completions) and the model's tool-call arguments on
    # gen_ai spans: opt into the latest GenAI semantic conventions and turn on message-content
    # recording. Gated by AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED so prod stays redacted.
    global _capture_content, _tracer, _token_usage_histogram
    _capture_content = os.environ.get("AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED", "").lower() == "true"
    os.environ.setdefault("OTEL_SEMCONV_STABILITY_OPT_IN", "gen_ai_latest_experimental")
    if _capture_content:
        os.environ["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "true"
        _logger.info("GenAI content recording enabled — prompts, completions, and tool I/O captured in traces.")

    # Instrument the OpenAI SDK so in-process Foundry model calls are traced, including the
    # gen_ai.client.token.usage metric and (when content capture is on) the conversation turns.
    try:
        from opentelemetry.instrumentation.openai_v2 import OpenAIInstrumentor

        OpenAIInstrumentor().instrument(tracer_provider=provider)
    except Exception:
        _logger.warning("Failed to instrument OpenAI SDK; model-call traces will be missing", exc_info=True)

    # Instruments the agent emits itself: conversation-turn and MCP tool-call spans, plus a
    # token-usage histogram for usage the SDK surfaces to us. (The model's own token counts also
    # arrive from the Copilot CLI child process over OTLP — see _copilot_telemetry.)
    _tracer = trace.get_tracer(__name__)
    _token_usage_histogram = metrics.get_meter(__name__).create_histogram(
        name="gen_ai.client.token.usage",
        unit="{token}",
        description="Tokens used per model request, split by gen_ai.token.type (input vs output).",
    )

    _logger.info("OpenTelemetry initialized with Azure Monitor exporters.")


def _copilot_telemetry() -> TelemetryConfig | None:
    """OTLP config for the Copilot SDK / CLI child process, or None to leave it off.

    configure_otel() handles the agent's own (in-process) telemetry via Azure Monitor,
    but the Copilot SDK / CLI emits its gen_ai spans from a separate child process that
    can only export over OTLP. Point OTEL_EXPORTER_OTLP_ENDPOINT at an OpenTelemetry
    Collector (running the Azure Monitor exporter) to land those CLI spans in App
    Insights too. Optional — omit it and you still get the in-process telemetry.
    Install the Python OTel API for the SDK: pip install copilot-sdk[telemetry].
    """
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        _logger.info("OTEL_EXPORTER_OTLP_ENDPOINT not set; skipping Copilot SDK CLI OTLP export.")
        return None
    return TelemetryConfig(
        otlp_endpoint=endpoint,
        exporter_type="otlp-http",
        source_name="foundry-toolbox-agent",
        capture_content=os.environ.get("ENABLE_SENSITIVE_DATA", "").lower() == "true",
    )


def _ensure_skills_downloaded() -> None:
    """Populate _skills_dir/<name>/ from the Foundry Skills API when a skill is absent."""
    missing = [n for n in _SKILL_NAMES if not (_skills_dir / n).exists()]
    if not missing:
        return  # all skills already bundled locally — nothing to download

    endpoint = os.environ["FOUNDRY_PROJECT_ENDPOINT"]
    with AIProjectClient(endpoint=endpoint, credential=_credential(), allow_preview=True) as project:
        for name in missing:
            target = _skills_dir / name
            target.mkdir(parents=True, exist_ok=True)
            # download streams the default_version as a ZIP archive
            zip_bytes = b"".join(project.beta.skills.download(name))
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                zf.extractall(target)  # writes SKILL.md (+ any sibling assets)


def _byok_provider() -> tuple[ProviderConfig | None, str | None]:
    """BYOK Foundry model via Managed Identity, or (None, None) for the GitHub Copilot model."""
    endpoint = os.environ.get("FOUNDRY_PROJECT_ENDPOINT", "")
    model = os.environ.get("AZURE_AI_MODEL_DEPLOYMENT_NAME", "")
    if not endpoint or not model:
        return None, None
    # BYOK calls the model endpoint directly with this token, so it authenticates as the
    # hosted-agent runtime managed identities (instance + blueprint) — NOT the implicit-access
    # agent identity. Grant them 'Cognitive Services OpenAI User' on the Foundry AI account or
    # inference fails with 401 PermissionDenied. Static token: fine for short invocations; a
    # long-lived session would need to re-mint it before the ~1h access token expires.
    token = _credential().get_token("https://ai.azure.com/.default").token
    provider: ProviderConfig = {"type": "azure", "base_url": endpoint, "wire_api": "responses", "bearer_token": token}
    return provider, model


def _session_config(tools: list[Tool]) -> dict:
    """Copilot SDK session config: toolbox tools + downloaded skills folder + BYOK provider when configured."""
    _ensure_skills_downloaded()  # download skills before the session loads the skills folder
    config: dict = {
        "system_message": {"content": "You are a helpful assistant."},
        "skill_directories": [str(_skills_dir)],  # SDK loads each SKILL.md as session instructions
        # The SDK/CLI writes session state and scratch files into its working directory; pin it to a
        # writable path because hosted-agent container filesystems are read-only except /tmp.
        "working_directory": os.environ.get("HOME") or tempfile.gettempdir(),
        "streaming": True,
        "on_permission_request": PermissionHandler.approve_all,
    }
    if tools:
        config["tools"] = tools  # toolbox MCP tools resolved from the governed toolbox
    provider, model = _byok_provider()
    if provider and model:
        config["provider"] = provider  # BYOK: route inference to the Foundry model deployment
        config["model"] = model
    return config


async def main() -> None:
    # In-process telemetry: configure Azure Monitor exporters from the App Insights
    # connection string before anything else runs.
    configure_otel()
    # Copilot SDK/CLI OpenTelemetry: build the client with a TelemetryConfig so the CLI
    # child process also exports its gen_ai spans over OTLP (omit to leave it untraced).
    telemetry = _copilot_telemetry()
    client = CopilotClient(telemetry=telemetry) if telemetry else CopilotClient()
    await client.start()

    bridge: McpBridge | None = None
    try:
        # Default tool source: bridge the toolbox MCP endpoint and expose its tools to the session.
        tools: list[Tool] = []
        url = _toolbox_url()
        if url:
            bridge = McpBridge(url, _get_toolbox_token())
            server = await bridge.initialize()
            tools = _make_copilot_tools(bridge, await bridge.list_tools())
            _logger.info("Connected to toolbox '%s' exposing %d tool(s).", server, len(tools))

        session = await client.create_session(_session_config(tools))

        model = os.environ.get("AZURE_AI_MODEL_DEPLOYMENT_NAME") or None
        assistant_chunks: list[str] = []

        def handle_event(event) -> None:
            if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                assistant_chunks.append(event.data.delta_content)
                print(event.data.delta_content, end="", flush=True)
            elif event.type == SessionEventType.SESSION_ERROR:
                _logger.error("Session error: %s", getattr(event.data, "message", "unknown"))
            # Record token consumption whenever the SDK surfaces usage on an event.
            _record_token_usage(getattr(getattr(event, "data", None), "usage", None), model)

        session.on(handle_event)

        # Wrap the turn in a conversation span so the prompt/response (content gated) and the
        # nested tool spans form one distributed trace in App Insights.
        prompt = "Hi, I am Alex! What tools are available?"
        turn_cm = (
            _tracer.start_as_current_span("conversation_turn") if _tracer else contextlib.nullcontext(None)
        )
        with turn_cm as span:
            if span is not None:
                span.set_attribute("gen_ai.operation.name", "invoke_agent")
                _set_span_io(span, "gen_ai.prompt", prompt)
            await session.send_and_wait({"prompt": prompt})
            if span is not None and assistant_chunks:
                _set_span_io(span, "gen_ai.completion", "".join(assistant_chunks))
    finally:
        if bridge:
            await bridge.close()
        await client.stop()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
