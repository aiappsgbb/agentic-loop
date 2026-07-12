# Skill catalog

Match the current `./docs/spec.md` against this catalog and suggest installing every skill whose trigger appears in the spec. A spec that includes Foundry hosted agents implies the `microsoft-foundry` skill and, by default, the `copilot-sdk` skill. Use the GitHub Copilot SDK + Foundry Skills API + toolbox MCP endpoint unless the user explicitly requests MAF or the spec is clearly graph/workflow orchestration; suggest `microsoft-agent-framework` only for that MAF path.

| Repository                | Skill                          | Suggest when the spec includes |
| ------------------------- | ------------------------------ | ------------------------------ |
| `microsoft/azure-skills`  | `microsoft-foundry`            | Microsoft Foundry (always - default for every agentic-loop spec) |
| `microsoft/azure-skills`  | `azure-ai`                     | AI Search, vector/hybrid search, semantic search, Document Intelligence/OCR, Speech/STT/TTS |
| `microsoft/azure-skills`  | `azure-aigateway`              | AI Gateway, API Management for model/tool/agent routing, semantic caching, content safety, token limits, MCP governance |
| `microsoft/azure-skills`  | `appinsights-instrumentation`  | Application Insights SDK setup, telemetry instrumentation, traces, metrics, and app monitoring |
| `microsoft/azure-skills`  | `azure-kusto`                  | KQL analytics, Azure Data Explorer, Log Analytics-style telemetry exploration, time-series analysis |
| `microsoft/azure-skills`  | `azure-storage`                | Blob/File/Data Lake storage for grounding data, uploads, durable artifacts, or document/file landing zones |
| `microsoft/azure-skills`  | `azure-messaging`              | Service Bus, Event Hubs, async business actions, event ingestion, queues, topics, or messaging SDK troubleshooting |
| `microsoft/azure-skills`  | `entra-app-registration`       | Microsoft Graph/OAuth app registration, delegated auth, API permissions, MSAL integration |
| `microsoft/azure-skills`  | `entra-agent-id`               | Entra Agent Identity, agent OAuth, OBO, workload identity federation, cross-tenant agent auth |
| `microsoft/azure-skills`  | `azure-rbac`                   | Least-privilege Azure RBAC role selection, role assignments, managed identity permissions |
| `microsoft/azure-skills`  | `azure-prepare`                | Azure app deployment scaffold, azure.yaml, Bicep/Terraform, Dockerfiles for prepared cloud deployment |
| `microsoft/azure-skills`  | `azure-validate`               | Pre-deployment readiness, Bicep/Terraform validation, RBAC checks, what-if analysis, configuration preflight |
| `microsoft/azure-skills`  | `azure-deploy`                 | Executing an already prepared deployment with azd/Bicep/Terraform and deployment error recovery |
| `github/awesome-copilot`  | `microsoft-agent-framework`    | Microsoft Agent Framework (install only when explicitly requested or when the design is clearly graph/workflow orchestration) |
| `github/awesome-copilot`  | `copilot-sdk`                  | GitHub Copilot SDK (default companion skill for agentic-loop specs; BYOK Foundry models, Foundry Skills API, toolbox MCP, invocations protocol) |
| `github/awesome-copilot`  | `python-mcp-server-generator`  | A Python MCP server (FastMCP, streamable HTTP) |

> **Copilot SDK skills default.** Agentic-loop agents are built with the **GitHub Copilot SDK** (BYOK Foundry models, invocations protocol) unless MAF is explicitly requested or clearly needed for graph/workflow orchestration. Treat skills as governed artifacts: author each `./skills/<skill-name>/SKILL.md`, then during verify (after `azd provision`) create the versioned skill on the Foundry project from **inline content**, promote `default_version`, and attach it to a Foundry **toolbox**. At runtime, the hosted agent **downloads** each governed skill version into a writable temp directory and initializes the `CopilotClient` session with `skill_directories` pointing there; the agent image does not ship a `skills/` folder. Register MCP servers and Foundry IQ grounding as toolbox connections/tools on the **same Foundry toolbox**, promote `default_version`, and resolve the agent's tools and grounding from the governed toolbox MCP endpoint instead of hardcoded URLs or direct Search clients. The full toolbox mechanics live in [`foundry-toolbox.md`](foundry-toolbox.md) and its reference agent [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py), owned by this `agentic-loop` skill.
