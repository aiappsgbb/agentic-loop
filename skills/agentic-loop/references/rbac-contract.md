# Keyless identity & RBAC contract

Reference for the `agentic-loop` skill: the principal → scope → role matrix the generated **Bicep must create as part of provisioning**. `agentic-loop` declares the intent (managed identities + least-privilege RBAC, no admin keys or connection strings on the control/data plane); this file holds the full matrix and notes. Defer exact role GUIDs and `Microsoft.Authorization/roleAssignments` syntax to the maintained `microsoft-foundry/rbac` sub-skill.

Two matrices live here, and they answer different questions:

| Matrix | Principal | When it applies |
| --- | --- | --- |
| [Runtime matrix](#runtime-matrix-service-managed-identities) (below) | The solution's **managed identities** | Created **by** the generated Bicep, during provisioning |
| [Deployer prerequisites](#deployer-prerequisites-pre-flight) | The **caller** running the loop | Must already exist **before step 1**, or provisioning breaks partway through |

## Runtime matrix (service managed identities)

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

## Deployer prerequisites (pre-flight)

Every row of the runtime matrix above is created **by the deployment**, which means the caller running the loop needs rights both to create the resources *and* to write those role assignments. Missing caller rights do not fail cleanly at the start - they fail on the first operation that needs them, **after** partial resources exist.

These assignments must therefore be verified **before step 1** by the [RBAC pre-flight](rbac-preflight.md), which diffs this table against the caller's effective assignments and reports every gap in one list.

| Principal | Scope | Azure role | Why |
| --- | --- | --- | --- |
| Caller (deploying principal) | Subscription | **Contributor** | Create the resource group and every resource in the reference architecture |
| Caller (deploying principal) | Subscription | **Role Based Access Control Administrator** | `Microsoft.Authorization/roleAssignments/write` - the Bicep creates every row of the runtime matrix |
| Caller (deploying principal) | Resource group | **Contributor** | Deploy into a **pre-created** resource group when the caller has no subscription-level rights |
| Caller (deploying principal) | Resource group | **Role Based Access Control Administrator** | Write the resource-group-scoped rows of the runtime matrix (ACR pulls, App Insights publishers) |
| Caller (deploying principal) | Foundry **AI account** | **Azure AI Account Owner** | Create the project, model deployments, and connections |
| Caller (deploying principal) | Foundry **project** | **Azure AI Project Manager** | Create/publish hosted agents, skills, and toolboxes on the project |

- **Broader satisfies narrower - with one exception.** **Owner** satisfies Contributor *and* Role Based Access Control Administrator; **User Access Administrator** satisfies Role Based Access Control Administrator; **Azure AI Account Owner** satisfies the project-scoped role beneath it. A fully-permissioned Owner therefore reports no gaps rather than a wall of false positives. The exception: **Owner and Contributor do not satisfy the Foundry roles** - `Azure AI Account Owner` and `Azure AI Project Manager` carry `dataActions`, and Owner's `*` covers `actions` only, so a subscription Owner still cannot create agents, skills, or toolboxes on a project. Grant the Foundry roles explicitly.
- **Inheritance counts.** An assignment at the subscription applies to the resource group and to the Foundry account and project beneath it; the pre-flight resolves effective (inherited and group-derived) assignments, not just direct ones.
- **Resource-group scope is conditional.** Resource-group rows are only required when the resource group already exists and the caller lacks the equivalent subscription-scoped role. A caller with subscription Contributor + RBAC Administrator inherits both.
- **Foundry scopes only exist after the account/project do.** On a greenfield run the account and project are created by the deployment, so the pre-flight checks the inherited subscription-scoped rights that will allow their creation, and re-checks the concrete Foundry scopes when they are supplied (a brownfield run against an existing project).
- Grant these to the caller once, up front - do not work around a gap by falling back to admin keys or connection strings, which would break the keyless contract above.
