# Foundry hosted agent

Reference for the `agentic-loop` skill: runtime concerns for an agent hosted on Microsoft Foundry via the **invocations** protocol. `agentic-loop` decides *that* the agent is hosted and *which framework* it uses; this file holds the hosted-agent runtime detail. The reference agent is [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py).

## Python dependency contract (`requirements.txt`)

When post-processing the spec, declare the hosted agent's Python dependencies so the generated `requirements.txt` (or `pyproject.toml`) is complete. Pin versions in the generated repo; the list below is the **required intent**, conditional on the choices already made (framework, toolbox, telemetry). The reference agent [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) imports exactly this set.

| When | Package | Why |
| --- | --- | --- |
| **Always** (keyless auth) | `azure-identity` | `DefaultAzureCredential` for managed-identity / `az login` tokens |
| **Always** (local config) | `python-dotenv` | Load `.env` in local dev (`load_dotenv`) |
| **Hosted agent runtime** | `azure-ai-agentserver-invocations` | Serve the **invocations** protocol (`InvocationAgentServerHost`) the Foundry platform calls |
| **GitHub Copilot SDK** | `github-copilot-sdk` | `CopilotClient`, skills, integrated agent loop, BYOK provider |
| **MAF agent** | `agent-framework` | Microsoft Agent Framework runtime (use instead of `github-copilot-sdk` when the agent is MAF) |
| **Toolbox over MCP** | `httpx` | Streamable-HTTP MCP bridge to the Foundry toolbox endpoint |
| **Skill download from Foundry** | `azure-ai-projects` | `AIProjectClient` to create/version skills and download their content |
| **Observability (ON by default)** | `azure-monitor-opentelemetry-exporter`, `opentelemetry-sdk`, `opentelemetry-api` | Export traces/metrics/logs straight to Application Insights, no collector |
| **Observability — model-call tracing** | `opentelemetry-instrumentation-openai-v2` | Instrument in-process OpenAI/Foundry model calls |

Drop the toolbox/skill rows when the agent uses neither; drop the model-tracing row only if no in-process model calls are made. Keep the observability core rows because telemetry is **ON by default**.

## Read-only container filesystem

Hosted-agent container filesystems are **read-only except `/tmp`**. Any path the agent writes at runtime (downloaded skills cache, session/scratch state, generated files) must default under `tempfile.gettempdir()`. Defaulting writable paths under the app directory crashes on first invocation. See [`foundry-toolbox.md`](foundry-toolbox.md) for the skills-download cache (`SKILLS_DIR`) and [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) for the `working_directory` default.
