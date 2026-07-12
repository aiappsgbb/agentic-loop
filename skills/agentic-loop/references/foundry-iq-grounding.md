# Foundry IQ grounding

Reference for the `agentic-loop` skill: how a GitHub Copilot SDK **hosted agent** grounds enterprise answers through a **Foundry IQ** knowledge base by consuming a governed Foundry **toolbox MCP endpoint**. `agentic-loop` decides *that* grounding is Foundry IQ; this file holds the access path, identity, refusal, ACL, validation, and escape-hatch guidance. Defer index/knowledge-base provisioning to `microsoft-foundry` and role GUIDs to `azure-rbac`.

## Primary pattern: hosted agent + toolbox MCP

Default agentic-loop grounding uses:

1. **GitHub Copilot SDK hosted agent** running on Foundry hosted agents and exposing the Responses API by default.
2. **Foundry Skills API** for behavioral instructions; the agent downloads governed skill versions into a writable temp directory at runtime.
3. **Foundry IQ knowledge base** exposed through a Foundry toolbox connection/tool, typically a `CognitiveSearch` or Foundry IQ grounding connection backed by Azure AI Search.
4. **Foundry toolbox MCP endpoint** as the only runtime tool and grounding surface the agent calls.

The hosted agent should not import `azure-search-documents`, instantiate Search clients, or call Foundry IQ retrieval APIs by default. It bridges the toolbox MCP endpoint, lets the toolbox broker grounding/tool identity, and treats the toolbox response as the source of answer evidence and citations.

## No-bypass rule

Every enterprise answer flows through the toolbox-hosted Foundry IQ grounding tool. The app and agent must not issue ad hoc Azure AI Search queries that sidestep the knowledge base, toolbox governance, ACL path, or citation contract. Direct in-code retrieval belongs only in the [escape hatch](#escape-hatch-direct-in-code-retrieval).

## Grounding identity

The primary toolbox path is brokered:

| Retrieval path | Authenticates as | Grant needed |
| --- | --- | --- |
| **Toolbox MCP grounding tool** - a Foundry IQ / `CognitiveSearch` connection attached to the toolbox | Hosted-agent **agent identity** (`agentIdentityId`) via Agent Service-brokered tool identity | Search / knowledge-base data-plane role on `agentIdentityId`; repeat after publish because agent identity can change |
| **Direct in-code retrieval escape hatch** - agent code calls Search / Foundry IQ APIs with `DefaultAzureCredential` | Hosted-agent **runtime instance managed identity** | Search Index Data Reader on the Search service, granted in `postdeploy` after the runtime identity exists |

Generated plans should make the brokered toolbox/tool identity path the default. Runtime instance managed identity Search Reader is not part of the baseline; add it only when direct retrieval is explicitly selected for troubleshooting or unsupported-tool scenarios.

## Caller-aware ACL filtering

Carry ACL metadata on every chunk (allowed Entra groups / personas) at ingestion, and filter at query time by the caller's resolved groups before synthesis. Do not post-filter the answer. An unauthorized caller must not receive restricted evidence or a summary derived from it.

For the primary toolbox path, pass caller context to the grounding tool using the tool schema the toolbox exposes, and validate that ACL-deny documents are absent from retrieved evidence. Pair each ACL-deny document with an eval.

## Citations and refusal

Return source document, section, and anchor/chunk id for every grounded claim, sourced from retrieved evidence. Treat "answer with zero citations" as a refusal in the API contract.

Refusal must be deterministic. Prefer a structural signal from the grounding tool - no authorized citations survived retrieval / reranking - rather than string-matching model prose. If the toolbox exposes a reranker or relevance threshold, keep it environment-configurable per corpus and apply it before synthesis so weak or ACL-residual matches become empty evidence.

## Runtime validation

Post-deploy validation must invoke the **deployed** hosted agent with a known-answer question and assert:

1. The toolbox MCP endpoint initializes and `tools/list` exposes the grounding tool.
2. The answer includes at least one citation from the expected authorized source.
3. An ACL-deny query returns no restricted citation and produces the deterministic refusal.
4. Agent logs show toolbox/tool calls, not direct Search client calls.

If a known-answer query refuses with empty citations, inspect the toolbox call result and agent logs for brokered identity / role assignment failures before tuning prompts.

## Escape hatch: direct in-code retrieval

Use direct in-code Search / Foundry IQ retrieval only when the toolbox path cannot support a required diagnostic or unsupported preview capability. Make it explicit in the plan and keep it isolated from the default agent runtime.

Escape-hatch implications:

- Add the direct retrieval SDK dependency only in that variant; do not include `azure-search-documents` in default hosted-agent dependencies.
- The call authenticates as the hosted-agent **runtime instance managed identity**, not `agentIdentityId`.
- Grant **Search Index Data Reader** to the runtime instance identity in a reproducible `postdeploy` hook because Bicep cannot assign a role to an identity that does not exist until the agent is deployed.
- Validate both auth paths if the app also runs direct retrieval in-process; the backend app identity and hosted-agent runtime identity need separate Search access.

Common direct-retrieval APIs include `KnowledgeAgentRetrievalClient` and `SearchIndexKnowledgeSourceParams`. Keep examples and troubleshooting for those APIs in this escape-hatch section so they are not mistaken for the primary architecture.

## Source

- [Use skills with Microsoft Foundry agents (preview) - azd](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/skills?pivots=azd)
- [Curate intent-based toolbox in Foundry (preview)](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/toolbox)
- [Foundry hosted agents](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/concepts/hosted-agents?view=foundry)
