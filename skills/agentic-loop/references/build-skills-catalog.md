# Skill catalog

Match the agreed architecture in the root `README.md` against this catalog only when a companion capability is needed. `microsoft-foundry` is required. Use Copilot SDK for agents using runtime skills, and Microsoft Agent Framework for basic agents or explicit workflows. If a workflow also needs skills, clarify the framework choice. Explicit user/playbook framework choices override defaults; choose one framework per agent, not necessarily one for the entire solution.

Catalog membership is not proof that a skill still exists or is current. For a selected candidate, verify its source/version and available CLI support, using `gh skill preview <repository> <skill>` and installed skill metadata as appropriate. Respect pins and ask before installs or updates. Do not audit every installed skill or patch third-party copies. Project scope is the default installation scope unless the user chooses otherwise.

| Repository                | Skill                          | Suggest when the architecture needs |
| ------------------------- | ------------------------------ | ------------------------------ |
| `aiappsgbb/agentic-loop`   | `agentic-loop`                 | Complete agentic solutions spanning architecture, implementation, local testing and optional Azure deployment |
| `microsoft/azure-skills`  | `microsoft-foundry`            | Required platform executor for Agentic Loop; use its maintained RBAC guidance for Foundry management-plane and data-plane permissions |
| `microsoft/azure-skills`  | `azure-ai`                     | AI Search, vector/hybrid search, semantic search, Document Intelligence/OCR, Speech/STT/TTS |
| `microsoft/azure-skills`  | `azure-aigateway`              | AI Gateway, API Management for model/tool/agent routing, semantic caching, content safety, token limits, MCP governance |
| `microsoft/azure-skills`  | `appinsights-instrumentation`  | Application Insights SDK setup, telemetry instrumentation, traces, metrics, and app monitoring |
| `microsoft/azure-skills`  | `azure-kusto`                  | KQL analytics, Azure Data Explorer, Log Analytics-style telemetry exploration, time-series analysis |
| `microsoft/azure-skills`  | `azure-storage`                | Blob/File/Data Lake storage for grounding data, uploads, durable artifacts, or document/file landing zones |
| `microsoft/azure-skills`  | `azure-messaging`              | Service Bus, Event Hubs, async business actions, event ingestion, queues, topics, or messaging SDK troubleshooting |
| `microsoft/azure-skills`  | `entra-app-registration`       | Microsoft Graph/OAuth app registration, delegated auth, API permissions, MSAL integration |
| `microsoft/azure-skills`  | `entra-agent-id`               | Entra Agent Identity, agent OAuth, OBO, workload identity federation, cross-tenant agent auth |
| `microsoft/azure-skills`  | `azure-prepare`                | Explicitly chosen IaC/azd scaffolding; not required for the default Container Apps source deployment |
| `microsoft/azure-skills`  | `azure-validate`               | Validation of an explicitly chosen IaC/azd deployment, including configuration, RBAC and what-if checks |
| `microsoft/azure-skills`  | `azure-deploy`                 | Execution/recovery of an explicitly chosen prepared IaC/azd deployment |
| `github/awesome-copilot`  | `microsoft-agent-framework`    | Basic agents or explicit agent workflows, or an explicit MAF choice; clarify workflows that also need runtime skills |
| `github/awesome-copilot`  | `copilot-sdk`                  | Agents using runtime skills, or an explicit Copilot SDK choice; BYOK Foundry models, toolbox tools/skills and the Responses API |
| `github/awesome-copilot`  | `python-mcp-server-generator`  | A Python MCP server (FastMCP, streamable HTTP) |

Build skills help the coding assistant build the app; [run skills](run-skills-catalog.md) are executed by the resulting agent. Follow current `microsoft-foundry` workflows for governed skill versions and toolbox configuration, and verify generated code against installed SDK APIs. Catalog selection must not override the Basic sample's model, Python 3.13, Responses API or Container Apps `az containerapp up --source` defaults.
