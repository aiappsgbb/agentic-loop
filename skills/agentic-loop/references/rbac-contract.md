# Keyless identity & RBAC contract

Reference for the `agentic-loop` skill: the principal → scope → role matrix the generated **Bicep must create as part of provisioning**. `agentic-loop` declares the intent (managed identities + least-privilege RBAC, no admin keys or connection strings on the control/data plane); this file holds the full matrix and notes. Defer exact role GUIDs and `Microsoft.Authorization/roleAssignments` syntax to `azure-rbac`.

Every component authenticates with a **managed identity** (user-assigned preferred) and **least-privilege RBAC** - no admin keys, no connection strings on the control/data plane.

| Principal (managed identity) | Scope / target resource | Azure role | Why |
| --- | --- | --- | --- |
| Frontend container app | Azure Container Registry (ACR) | **AcrPull** | Pull the frontend container image |
| Backend container app | Azure Container Registry (ACR) | **AcrPull** | Pull the backend container image |
| Backend container app | Foundry **AI account** (AI Services / Foundry account) | **Azure AI User** | Invoke Foundry hosted agents |
| Foundry **project** managed identity | Azure Container Registry (ACR) | **Container Registry Repository Reader** (or **AcrPull**) | Pull the **hosted-agent image** at runtime |
| Foundry **project** managed identity | Foundry **AI account** | **Foundry User** | Project-brokered model inference (usually auto-assigned at project creation) |
| Hosted-agent **runtime** managed identities (instance + blueprint) | Foundry **AI account** | **Cognitive Services OpenAI User** (+ **Foundry User** if it calls non-OpenAI account capabilities) | **BYOK direct inference** (Copilot SDK / MAF calling the model endpoint with its own token) |
| Hosted-agent **agent identity** (`agentIdentityId`) | Each downstream tool/grounding resource (Storage, AI Search / Foundry IQ backing service, Cosmos, Key Vault, ...) | The resource's data role (e.g. **Storage Blob Data Contributor**, **Search Index Data Reader**) | Default toolbox MCP path: Agent Service brokers tool and grounding access with the agent identity |
| Hosted-agent **runtime instance managed identity** | Azure AI Search (Foundry IQ backing service) | **Search Index Data Reader** | Escape hatch only: direct in-code Search / Foundry IQ retrieval with `DefaultAzureCredential`; not part of the default toolbox path |
| Foundry **project** managed identity | Log Analytics workspace | **Log Analytics Data Reader** | Only when **Foundry Evals** are in scope (read traces) |
| Frontend container app | Application Insights | **Monitoring Metrics Publisher** | Send telemetry |
| Backend container app | Application Insights | **Monitoring Metrics Publisher** | Send telemetry |
| Hosted agent | Application Insights | **Monitoring Metrics Publisher** | Send telemetry |
| MCP server (container app) | Application Insights | **Monitoring Metrics Publisher** | Send telemetry |

- Scope **Azure AI User** to the **AI account** (not a single project) so the backend can invoke any hosted agent in it.
- **Model inference depends on the inference path.** Project-brokered inference as the **agent identity** is covered by *implicit access* — no role needed. **BYOK direct inference** (the Copilot SDK / MAF agent calling the model endpoint with a token from `DefaultAzureCredential`) authenticates as the **runtime managed identities (instance + blueprint)**, which have **no** implicit access — grant them **Cognitive Services OpenAI User** at the **AI account** scope or inference fails with `401 PermissionDenied`. Make this grant reproducible in a `postprovision` hook / `postdeploy.sh` (azd only auto-assigns `Foundry User` to the shared project agent identity, not the runtime MIs).
- Scope **Cognitive Services OpenAI User** to the AI account hosting the model deployment.
- **Tool/MCP and default Foundry IQ grounding access are authorized against the `agentIdentityId`, not the runtime MI** — Agent Service brokers an agent-identity token for `AgenticIdentityToken`/`AgenticIdentity` connections. On **publish**, the agent can get a **new** `agentIdentityId`; repeat these assignments (shared-project roles don't carry over).
- **Runtime instance MI Search access is an escape hatch, not the baseline.** Grant **Search Index Data Reader** to the runtime instance MI only when the agent performs direct in-code Search / Foundry IQ retrieval instead of consuming the brokered toolbox grounding tool. The instance identity is minted at deploy/publish time, so make that grant reproducible in a `postdeploy` hook if the escape hatch is used. See [`foundry-iq-grounding.md`](foundry-iq-grounding.md#escape-hatch-direct-in-code-retrieval).
- Scope **AcrPull** to the registry and use managed-identity image pull - keep the ACR admin user disabled.
- Assign roles to each app/agent's identity, not to a shared principal, so the matrix stays least-privilege and auditable.
