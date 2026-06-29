# Microsoft Foundry Toolbox

Reference for the `agentic-loop` skill: manage Foundry toolboxes with `azd ai toolbox` and consume a toolbox by default from a GitHub Copilot SDK agent. The full reference agent is [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py).

A **toolbox** is a versioned, curated bundle of **connections, skills, and tools** that agents consume through a single runtime **MCP endpoint**. A **skill** is a `SKILL.md` (YAML front matter + Markdown body) capturing reusable behavioral guidance, stored centrally in a Foundry project via the versioned **Skills API**; promoting a new default version rolls out with **no agent redeploy**. This reference covers **managing toolboxes** with the `azd ai toolbox` command and **consuming a toolbox by default** from a GitHub Copilot SDK agent — bridging the toolbox **MCP endpoint** to call its tools and downloading its skills into a writable temp directory at runtime.

> Skills are **public preview** (no SLA, not for production). All Skills API calls require `allow_preview=True` on the client.

> **The agent source tree contains no `skills/` folder at all.** Skills are versioned centrally in Foundry; at startup the agent **creates a writable skills directory under `tempfile.gettempdir()` if it doesn't exist** (override with `SKILLS_DIR`) and downloads each `SKILL.md` into it from Foundry. It defaults to the OS temp dir because **hosted-agent container filesystems are read-only except `/tmp`** — defaulting under the app directory crashes on first invocation. Because the directory is generated at runtime and never lives in the repo, there is nothing to commit, `COPY`, or exclude — the image and source ship without it. Promote a new default version and every agent picks it up with **no rebuild or redeploy**.

## Prerequisites

- A Foundry project endpoint: `https://<account>.services.ai.azure.com/api/projects/<project>`
- **RBAC**: `Foundry User` on the project. Auth: `DefaultAzureCredential` (`az login`); SDK uses scope `https://ai.azure.com/.default`.
- `pip install azure-ai-projects azure-identity`
- Toolbox path only: the **`azd` CLI** with the `azd ai` commands; toolbox connections must already exist on the project (list them with `azd ai agent connection list`).
- Copilot SDK path only: a GitHub **fine-grained** PAT (`github_pat_…`) with **Copilot requests: Read-only** (classic `ghp_` not supported).
- Telemetry path only: `pip install copilot-sdk[telemetry]` to export the Copilot SDK/CLI's OpenTelemetry spans over OTLP (see [Observability](#observability--send-agent-execution-telemetry-to-application-insights-opentelemetry)).

## Manage toolboxes with `azd ai toolbox`

A toolbox bundles existing project **connections**, **skills**, and **tools** into one versioned MCP endpoint. `azd ai toolbox create <name>` creates the toolbox **and its initial version** — and because Foundry requires that first version to ship at least one tool entry, the inputs come from a JSON/YAML file via `--from-file`.

```bash
azd ai toolbox create research --from-file ./tools.json
azd ai toolbox create research --from-file ./tools.yaml --output json
```

Initial-version file (`tools.yaml`):

```yaml
description: research toolbox
connections:
  - name: my-mcp                 # RemoteTool (MCP)
  - name: my-search             # CognitiveSearch — 'index' required
    index: products
  - name: my-bing               # GroundingWithCustomSearch — 'instance_name' required
    instance_name: docs-config
  - name: my-a2a                # RemoteA2A
skills:
  - name: my-skill
    version: "2"                 # omit to follow the skill's default version
  - name: qa-skill
tools:
  - type: web_search            # connectionless built-in tool
    name: web
  - type: file_search
    name: files
```

| Field | Notes |
| --- | --- |
| `description` | Optional. Stored on the initial toolbox version. |
| `connections` | Existing project connections to attach by `name`. `index` required only for **CognitiveSearch** (Azure AI Search); `instance_name` required only for **GroundingWithCustomSearch**. Categories: **RemoteTool (MCP)**, **CognitiveSearch**, **RemoteA2A**, **GroundingWithCustomSearch**. |
| `skills` | Optional. Existing project skills attached by reference — each needs `name`; `version` is optional (omit to follow the skill's default version). |
| `tools` | Raw Foundry tool entries (OpenAI.Tool shape), forwarded verbatim. Use for connectionless tools (`web_search`, `file_search`, `code_interpreter`, `capture_structured_outputs`) or any type not exposed by `connections`. Each needs `type`; an optional `name` must match `^[A-Za-z0-9_-]+$`. |
| `policies` | Optional per-version governance. `policies.rai_config.rai_policy_name` selects the Responsible AI content-filter policy applied to this version (the alias `name` is also accepted). |

- **At least one** of `connections`, `skills`, or `tools` must be non-empty.
- Connections must **already exist** on the project — `create` does not create them. List them with `azd ai agent connection list`.
- On success the toolbox's runtime MCP endpoint is written to the active azd environment as **`TOOLBOX_<NORMALIZED_NAME>_MCP_ENDPOINT`** (the same key agents consume) — `<NORMALIZED_NAME>` is the toolbox name uppercased with non-alphanumeric character runs replaced by underscores (e.g. `research` → `TOOLBOX_RESEARCH_MCP_ENDPOINT`).

Useful flags: `--from-file <path>` (required), `--output table|json`, `-e/--environment <name>`, `--project-endpoint <url>` (falls back to the active azd env, azd user config, then `FOUNDRY_PROJECT_ENDPOINT`), `--no-prompt`, `-C/--cwd`, `--debug`.

## Consume the toolbox from a GitHub Copilot SDK agent

By default the agent **consumes the toolbox over MCP**: it bridges the toolbox's runtime MCP endpoint and exposes every toolbox tool (MCP servers, `web_search`, `file_search`, ...) to the Copilot SDK session, and it **downloads the toolbox's skills** into a writable temp directory so the SDK loads each `SKILL.md` as instructions. The agent source ships **without** a `skills/` folder — it's generated at runtime under `tempfile.gettempdir()` because hosted-agent container filesystems are read-only except `/tmp` (override with `SKILLS_DIR`). See [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py).

```bash
# Scaffold from the sample manifest, set the PAT (omit for BYOK Managed-Identity inference)
azd ai agent init -m https://github.com/microsoft-foundry/foundry-samples/blob/main/samples/python/hosted-agents/bring-your-own/invocations/github-copilot/agent.manifest.yaml
azd env set GITHUB_TOKEN="github_pat_..."
# Point the agent at the toolbox (TOOLBOX_<NAME>_MCP_ENDPOINT is emitted by `azd ai toolbox create`)
azd env set TOOLBOX_NAME "research"
azd env set TOOLBOX_VERSION "1"
# Run + test locally (skills download into the temp skills dir on first run), then deploy
azd ai agent run                       # separate terminal: azd ai agent invoke --local '{"input": "Hi, I am Alex!"}'
azd provision && azd deploy            # then: azd ai agent invoke '{"input": "Hi, I am Alex!"}'
```

> PowerShell: escape inner quotes — `'{\"input\": \"Hi, I am Alex!\"}'`.

### Bridge the toolbox MCP endpoint

The toolbox is reachable at `<project-endpoint>/toolboxes/<toolbox-name>/versions/<version>/mcp?api-version=v1` — or read the `TOOLBOX_<NORMALIZED_NAME>_MCP_ENDPOINT` value `azd ai toolbox create` wrote. Authenticate every call with a **bearer token** for `https://ai.azure.com/.default` and send the **`Foundry-Features: Toolboxes=V1Preview`** header. The `McpBridge` helper in [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) runs the streamable-HTTP MCP handshake (`initialize` → `notifications/initialized`, carrying the returned `mcp-session-id`), then `tools/list` and `tools/call`; `_make_copilot_tools()` wraps each MCP tool as a Copilot SDK `Tool` — sanitizing `.`/`-` in the name to `_` (the SDK rejects them) — whose handler forwards the invocation through the bridge.

```python
from copilot.tools import Tool, ToolInvocation, ToolResult

bridge = McpBridge(toolbox_url, _get_toolbox_token())          # bearer token + Foundry-Features header
await bridge.initialize()                                      # MCP initialize + notifications/initialized
tools = _make_copilot_tools(bridge, await bridge.list_tools()) # toolbox tools/list → Copilot Tool[]
session = await client.create_session({..., "tools": tools})   # tools resolve from the governed toolbox
```

### `copilot-sdk-with-toolbox.py` — Copilot SDK agent consuming the toolbox

Full agent: [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) — `_toolbox_url()` (endpoint from `TOOLBOX_MCP_ENDPOINT`, else `<name>`/`<version>`), `McpBridge` (HTTP MCP client), `_make_copilot_tools()` (toolbox MCP tools → Copilot `Tool`s), `_ensure_skills_downloaded()` (download-if-missing skills), `_byok_provider()` (Managed Identity → Foundry model), and `_session_config()` wiring both the toolbox `tools` and `skill_directories` into the session.

| Env var | Purpose |
| --- | --- |
| `FOUNDRY_PROJECT_ENDPOINT` | Foundry project endpoint — builds the toolbox URL and downloads skills. |
| `TOOLBOX_MCP_ENDPOINT` | Explicit toolbox MCP endpoint (e.g. the `TOOLBOX_<NAME>_MCP_ENDPOINT` value azd writes). Takes precedence. |
| `TOOLBOX_NAME` / `TOOLBOX_VERSION` | Build the MCP endpoint when `TOOLBOX_MCP_ENDPOINT` is unset. |
| `AZURE_AI_MODEL_DEPLOYMENT_NAME` | BYOK Foundry model deployment for inference (with `FOUNDRY_PROJECT_ENDPOINT`). |
| `SKILLS_DIR` | Override the local skills folder (default: a `skills/` dir under `tempfile.gettempdir()`, e.g. `/tmp/skills`). |

> Install: `pip install copilot-sdk httpx` (plus `azure-ai-projects azure-identity`), and authenticate the Copilot CLI. Auth: BYOK mode (`FOUNDRY_PROJECT_ENDPOINT` + `AZURE_AI_MODEL_DEPLOYMENT_NAME`) uses Managed Identity — no GitHub token; otherwise the SDK uses the Copilot CLI's GitHub session. Bridging the toolbox and downloading skills both need `FOUNDRY_PROJECT_ENDPOINT` and `Foundry User` RBAC on the project.

### Observability — send agent execution telemetry to Application Insights (OpenTelemetry)

The Copilot SDK / CLI emits its own OpenTelemetry `gen_ai` spans (`invoke_agent` / `chat` / `execute_tool`, [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)) — **off unless** the `CopilotClient` is built with a `TelemetryConfig`. The CLI exports over **OTLP**, and Application Insights does not ingest raw OTLP from the child process, so route it through an [OpenTelemetry Collector](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-add-modify?tabs=python#send-telemetry-using-the-opentelemetry-collector) configured with the Azure Monitor exporter.

Build the client with a `TelemetryConfig` ([`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) `_copilot_telemetry()`):

```python
from copilot import CopilotClient, TelemetryConfig

telemetry = TelemetryConfig(otlp_endpoint=os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"], exporter_type="otlp-http", source_name="foundry-toolbox-agent")
client = CopilotClient(telemetry=telemetry)  # the CLI now exports its own spans over OTLP
```

Install the Python OTel API for the SDK with `pip install copilot-sdk[telemetry]`, and point `OTEL_EXPORTER_OTLP_ENDPOINT` at an OpenTelemetry Collector running the Azure Monitor exporter (the Collector holds the App Insights connection string).

| Env var | Default | Purpose |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset | Copilot SDK/CLI → OTLP Collector endpoint (e.g. `http://localhost:4318`). |
| `ENABLE_SENSITIVE_DATA` | `false` | Capture prompts, completions, and tool args. **Dev/test only.** |

> The Collector authenticates to Application Insights with its **managed identity** (assign **Monitoring Metrics Publisher** on the resource) — no instrumentation key on the data plane. Inspect the trace in Application Insights → **Transaction search** / the **Application map**.

[foundry-download]: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/skills?pivots=python#download-skill-content

## Skills & tools (MCP) lifecycle across the loop

When the spec includes agent skills or MCP-server tools, orchestrate them across the loop stages on a single Foundry **toolbox** (a toolbox version carries both skills and tools). Defer MCP server authoring to `python-mcp-server-generator`, and MCP/tool routing governance to `azure-aigateway`.

**Implement stage - author skills and MCP servers locally**

1. Create each skill as `./skills/<skill-name>/SKILL.md`. The agent-skill format is a YAML front-matter block with `name` (unquoted, lowercase/hyphen) and `description`, and a Markdown body holding the instructions.
2. Build each **MCP server** the agent depends on (FastMCP / streamable HTTP) - or identify the existing ones it calls - and reference them by connection, never by hardcoded URL or secret.
3. Build the hosted agent with **MAF or the GitHub Copilot SDK** - skill-using and integrated-loop agents use the **Copilot SDK**. Skill content and MCP tools are registered and wired in the verify stage, not bundled now.

**Verify stage - register on Foundry, then wire the agent (after `azd provision`)**

4. Run `azd provision` so the Foundry project (and any MCP server hosting) exists.
5. **Create & version** each skill on the Foundry project using **inline content** read from the local `SKILL.md`; promote the intended version to `default_version`.
6. **Register & version** each **MCP server the agent uses as a tool** on the Foundry project (its MCP endpoint + auth as a connection-backed tool), keyless via managed identity + RBAC.
7. **Attach** the versioned skill references **and the MCP-server tools** to a Foundry **toolbox** version and promote that toolbox version to `default_version` - one governed toolbox carries both.
8. **Download** each skill's content back into `./skills/<skill-name>/` so the agent runs against the governed, versioned copy.
9. **Wire the agent** - for a **Copilot SDK** agent, initialize the `CopilotClient` session with `skill_directories` pointing to `./skills` so the SDK injects every `SKILL.md` at session start; for any agent (MAF or Copilot SDK), point tool discovery at the **toolbox MCP endpoint** so its MCP tools resolve from the governed toolbox instead of raw server URLs. Reference: [github-copilot hosted-agent `main.py`](https://github.com/microsoft-foundry/foundry-samples/blob/main/samples/python/hosted-agents/bring-your-own/invocations/github-copilot/main.py).
10. **Verify discovery** - confirm the skills appear as MCP resources (`resources/list`) and the MCP servers appear as tools (`tools/list`) on the toolbox endpoint (header `Foundry-Features: Toolboxes=V1Preview`).

This keeps **both skills and MCP tools** versioned, auditable, and updatable without rebuilding the agent image: re-version on Foundry, promote the toolbox `default_version` (re-download skills into `./skills`), and the agent picks up the change on its next session.

## Workflow checklist

1. Create the toolbox + initial version from a `--from-file` JSON/YAML (`azd ai toolbox create <name> --from-file ...`); confirm its connections already exist and capture the emitted `TOOLBOX_<NAME>_MCP_ENDPOINT`.
2. Consume the toolbox **by default** — bridge its MCP endpoint to expose its tools to the Copilot session and download its skills into `./skills` (no source `skills/` folder); re-version on Foundry and promote the new toolbox/skill default to roll out with no rebuild.
3. Validate (`azd ai agent run` + `azd ai agent invoke --local`), then `azd provision && azd deploy`.
4. Export agent execution telemetry via OpenTelemetry — build the `CopilotClient` with a `TelemetryConfig` so the SDK/CLI emits its `invoke_agent` / `chat` / `execute_tool` spans over OTLP; route them through a Collector and confirm they appear in Application Insights Transaction search.

## Source

- [Use skills with Microsoft Foundry agents (preview)](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/skills?pivots=python)
- [Curate intent-based toolbox in Foundry (preview)](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/toolbox)
- [Copilot SDK hosted-agent sample](https://github.com/microsoft-foundry/foundry-samples/tree/main/samples/python/hosted-agents/bring-your-own/invocations/github-copilot)
- [Send telemetry via the OpenTelemetry Collector](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-add-modify?tabs=python#send-telemetry-using-the-opentelemetry-collector) · [Azure Monitor OpenTelemetry distro](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=python)
