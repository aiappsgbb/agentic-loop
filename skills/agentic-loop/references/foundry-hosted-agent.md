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
| **MAF agent** | pinned `agent-framework-*` sub-packages | Microsoft Agent Framework runtime (use instead of `github-copilot-sdk` when the agent is MAF) — see the pitfall below |
| **Toolbox over MCP** | `httpx` | Streamable-HTTP MCP bridge to the Foundry toolbox endpoint |
| **Skill download from Foundry** | `azure-ai-projects` | `AIProjectClient` to create/version skills and download their content |
| **Observability (ON by default)** | `azure-monitor-opentelemetry-exporter`, `opentelemetry-sdk`, `opentelemetry-api` | Export traces/metrics/logs straight to Application Insights, no collector |
| **Observability — model-call tracing** | `opentelemetry-instrumentation-openai-v2` | Instrument in-process OpenAI/Foundry model calls |

Drop the toolbox/skill rows when the agent uses neither; drop the model-tracing row only if no in-process model calls are made. Keep the observability core rows because telemetry is **ON by default**.

> **MAF meta-package pitfall.** Do **not** ship the `agent-framework` meta-package — it pulls broken/unused extras that fail remote dependency resolution on the hosted-agent build. Pin only the specific sub-packages the agent imports (e.g. `agent-framework-core`, `agent-framework-foundry`, `agent-framework-foundry-hosting`) plus undeclared transitive imports (e.g. `mcp`), and validate with a **clean install** before deploy.

## Packaging shared code

The hosted-agent payload is deployed in isolation — any local module the agent imports (shared retrieval/ACL/config/telemetry helpers, e.g. a `hr_common` package) **must be present inside the payload**, or the agent crashes at import on first invocation. Two options:

- **Package it** (preferred): make the shared code an installable dependency (path/editable install in `pyproject.toml`, or a built wheel) so one source of truth ships with the agent. No drift.
- **Vendor it**: copy the shared modules under the agent directory. If you vendor, treat the copy as **build output, not a second source** — re-sync it from the canonical package **before every `azd deploy`** (script it; a hand copy drifts silently and ships stale grounding logic). A vendored copy that lags the canonical module is a classic "fixed locally, still broken in the deployed agent" trap.

Scope the payload with `.agentignore` so only the agent code + its shared package ship (not the whole repo). Combined with the read-only filesystem rule above, verify a clean packaged install imports and runs before deploying.

## Read-only container filesystem

Hosted-agent container filesystems are **read-only except `/tmp`**. Any path the agent writes at runtime (downloaded skills cache, session/scratch state, generated files) must default under `tempfile.gettempdir()`. Defaulting writable paths under the app directory crashes on first invocation. See [`foundry-toolbox.md`](foundry-toolbox.md) for the skills-download cache (`SKILLS_DIR`) and [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) for the `working_directory` default.
