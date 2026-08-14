# Foundry hosted agent

Reference for the `agentic-loop` skill: runtime concerns for an agent hosted on Microsoft Foundry. Hosted agents should expose the **Responses API** by default; use invocations only when explicitly required for compatibility. `agentic-loop` decides *that* the agent is hosted and *which framework* it uses; this file holds the hosted-agent runtime detail. The reference agent is [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py).

## Hosted-agent protocol

Default to the **Responses API** protocol for hosted agents. Responses exposes an OpenAI-compatible `/responses` endpoint, and the platform manages conversation history, streaming, and session lifecycle. Prefer it for new hosted agents and generated plans.

Use the **invocations** protocol only when the user explicitly requests it, when an existing deployed agent already depends on it, or when a required sample/runtime is not yet available through Responses. If invocations is selected, document the reason in `./docs/plan.md`.

## Python dependency contract (`requirements.txt`)

When post-processing the spec, declare the hosted agent's Python dependencies so the generated `requirements.txt` (or `pyproject.toml`) is complete. Pin versions in the generated repo; the list below is the **required intent**, conditional on the choices already made (framework, toolbox, telemetry). The reference agent [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) imports exactly this set.

| When | Package | Why |
| --- | --- | --- |
| **Always** (keyless auth) | `azure-identity` | `DefaultAzureCredential` for managed-identity / `az login` tokens |
| **Always** (local config) | `python-dotenv` | Load `.env` in local dev (`load_dotenv`) |
| **Hosted agent runtime** | `azure-ai-agentserver-responses` | Serve the **Responses API** endpoint the Foundry platform calls |
| **Hosted agent runtime - invocations fallback** | `azure-ai-agentserver-invocations` | Include only when invocations is explicitly selected for compatibility (`InvocationAgentServerHost`) |
| **GitHub Copilot SDK** | `github-copilot-sdk` | Default hosted-agent framework: `CopilotClient`, Foundry Skills API downloads, toolbox MCP bridge, integrated agent loop, BYOK provider |
| **MAF agent** | `agent-framework` | Microsoft Agent Framework runtime (include only when explicitly requested or clearly needed for graph/workflow orchestration) |
| **Toolbox over MCP** | `httpx` | Streamable-HTTP MCP bridge to the Foundry toolbox endpoint |
| **Runtime skill download from Foundry** | `azure-ai-projects` | `AIProjectClient` to download governed skill content at hosted-agent startup; create/update/list/show/download management operations should prefer `azd ai skill` outside the runtime |
| **Observability (ON by default)** | `azure-monitor-opentelemetry-exporter`, `opentelemetry-sdk`, `opentelemetry-api` | Export traces/metrics/logs straight to Application Insights, no collector |
| **Observability — model-call tracing** | `opentelemetry-instrumentation-openai-v2` | Instrument in-process OpenAI/Foundry model calls |

Keep the Copilot SDK, toolbox, and skill-download rows for the default agentic-loop hosted agent. Drop them only for an explicit MAF/non-toolbox variant. Do **not** add `azure-search-documents` to the default runtime dependency set; Foundry IQ grounding is consumed through the toolbox MCP endpoint. Add Search SDK dependencies only for the direct-retrieval escape hatch in [`foundry-iq-grounding.md`](foundry-iq-grounding.md#escape-hatch-direct-in-code-retrieval). Drop the model-tracing row only if no in-process model calls are made. Keep the observability core rows because telemetry is **ON by default**.

## Copilot SDK compatibility

Generated code and documentation examples must match the pinned package rather than a moving upstream branch. The reference agent and CI currently target:

| Contract | `github-copilot-sdk==1.0.9` |
| --- | --- |
| Python | 3.11+ |
| Session creation | `await client.create_session(**config)`; all session options are keyword-only |
| Prompt send | `await session.send_and_wait(prompt)` where `prompt` is a string |
| Return shape | `SessionEvent \| None` |
| Event shape | `SessionEvent.type` plus typed `SessionEvent.data`; streaming text is `AssistantMessageDeltaData.delta_content`, final text is `AssistantMessageData.content` |
| Lifecycle | Prefer `async with CopilotClient()` and `async with await client.create_session(...)` |

When updating the pin, update this table, the reference agent, and its executable compatibility test together. If current companion-skill guidance conflicts with the installed package source, treat that guidance as an upstream documentation defect and follow the package API.

When reviewing or correcting generated SDK code, include the relevant compatibility facts in the response: package pin, Python minimum, session-creation shape, prompt-send shape, return/event shape, and lifecycle pattern. This makes the correction independently verifiable instead of leaving important constraints implicit in this reference.

## Read-only container filesystem

Hosted-agent container filesystems are **read-only except `/tmp`**. Any path the agent writes at runtime (downloaded skills cache, session/scratch state, generated files) must default under `tempfile.gettempdir()`. Defaulting writable paths under the app directory crashes on first invocation. See [`foundry-toolbox.md`](foundry-toolbox.md) for the skills-download cache (`SKILLS_DIR`) and [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) for the `working_directory` default.
