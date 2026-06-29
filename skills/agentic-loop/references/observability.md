# Observability contract

Reference for the `agentic-loop` skill: the end-to-end monitoring contract the generated infra must satisfy. `agentic-loop` declares the intent (telemetry **ON by default**, one Application Insights, keyless); this file holds the baseline infra, per-tier instrumentation, agent-observability, and content-capture detail. Defer SDK/instrumentation wiring to `appinsights-instrumentation` and role assignments to `azure-rbac`.

End-to-end monitoring is **on by default**: every tier - **backend, hosted agents, MCP servers, and Foundry models** - emits OpenTelemetry into **one Application Insights** resource so a single distributed trace follows a request from the browser through the backend, the agent loop, each tool/MCP call, and every model call. The generated Bicep must provision and wire it.

## Baseline infra (generated Bicep)

- Provision **one Application Insights** resource (backed by a Log Analytics workspace) shared by all components - this is what makes the **Application Map** and end-to-end transaction search work.
- Inject its connection string into every app, agent, and MCP server as `APPLICATIONINSIGHTS_CONNECTION_STRING`; authenticate the telemetry channel with each component's **managed identity** via the **Monitoring Metrics Publisher** assignments in [`rbac-contract.md`](rbac-contract.md) - **no instrumentation key, no connection-string secret on the data plane**.
- **Connect the same Application Insights resource to the Foundry project** (Foundry portal → Agents → Traces → Connect, or an Application Insights connection on the project) so Foundry **server-side** agent/model traces land in the same resource.
- Grant operators **Log Analytics Reader** on the resource so they can query telemetry.

## Per-tier instrumentation (defer wiring to `appinsights-instrumentation`)

| Tier | How it's instrumented | What lands in Application Insights |
| --- | --- | --- |
| **Backend** (API) | Azure Monitor OpenTelemetry distro (`configure_azure_monitor()` / `useAzureMonitor()` / `.UseAzureMonitor()`); auto-instruments inbound + outbound HTTP | Request/dependency spans, logs, metrics; W3C `traceparent` propagated to agents, MCP servers, and models |
| **Hosted agent** (MAF or Copilot SDK) | See *Agent observability* below | `invoke_agent` / `chat` / `execute_tool` spans, GenAI metrics, prompts & responses (when content capture is on) |
| **MCP server** | Azure Monitor OTel distro on the server process; record tool name, arguments, and result as span attributes | Tool-call spans that nest under the agent's `execute_tool` span via propagated trace context |
| **Foundry models** | Foundry **server-side tracing** (automatic once App Insights is connected) plus model-SDK instrumentation when you call models from your own code | `gen_ai` chat spans: model, token usage, finish reason, and prompt/response content (when capture is on) |

## Agent observability (MAF and Copilot SDK)

- **MAF** is natively instrumented and **on by default** (`ENABLE_INSTRUMENTATION=true`). At startup call `configure_azure_monitor(connection_string=os.environ["APPLICATIONINSIGHTS_CONNECTION_STRING"])` (or `FoundryChatClient.configure_azure_monitor(...)`, which pulls the string from the project); it then emits `invoke_agent` / `chat` / `execute_tool` spans and `gen_ai` metrics.
- **Copilot SDK** — for the agent's **own in-process** telemetry, call `configure_otel()` from the reference agent [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) once at startup (before the client/session is created). It wires the Azure Monitor exporters straight from `APPLICATIONINSIGHTS_CONNECTION_STRING` (no collector) and emits `conversation_turn` spans, `execute_tool <name>` MCP tool-I/O spans, and a `gen_ai.client.token.usage` token-consumption metric; it is a no-op when the connection string is unset. The spawned **CLI's own** `gen_ai` spans are separate: build the client with `CopilotClient(telemetry=TelemetryConfig(...))` (see `_copilot_telemetry()` in the same file). The CLI exports **OTLP**, which App Insights does not ingest directly - route it through an **OpenTelemetry Collector** with the Azure Monitor exporter. See [`foundry-toolbox.md`](foundry-toolbox.md#observability--send-agent-execution-telemetry-to-application-insights-opentelemetry).
- **Foundry-hosted agents** get `APPLICATIONINSIGHTS_CONNECTION_STRING` injected automatically and produce **server-side traces** (agent runs, tool calls, model calls, and the conversation view) with no code change; client-side instrumentation layers on top for your own app code.

## Capture the full detail (request data, prompts, responses)

Content capture is **off by default** because spans then carry prompts, completions, tool arguments/results, and request bodies (PII/secrets risk). Turn it on per layer:

| Layer | Flag to capture content |
| --- | --- |
| MAF | `ENABLE_SENSITIVE_DATA=true` (or `enable_sensitive_telemetry()`) |
| Copilot SDK / CLI | `TelemetryConfig(capture_content=True)` / `ENABLE_SENSITIVE_DATA=true` |
| Model SDK (OpenAI / Azure AI Inference) | `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true` (or `AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED=true`) |
| Backend / MCP server | add request/response bodies and tool args/results as span attributes explicitly |

- **Treat captured content as sensitive**: enable it in **dev/test** by default; in production gate it behind config, redact secrets/PII before it reaches telemetry, and apply the same access controls and retention as production logs.
- Set a distinct **cloud role name / `service.name`** per component (frontend, backend, agent, mcp-server) so the **Application Map** renders the topology and transactions correlate across tiers.
- Defer SDK/instrumentation wiring to `appinsights-instrumentation` and the role assignments to `azure-rbac`.
