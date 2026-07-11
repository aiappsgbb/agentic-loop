# Foundry IQ grounding

Reference for the `agentic-loop` skill: how a Foundry **hosted agent** grounds answers through **Foundry IQ agentic retrieval** over an Azure AI Search-backed knowledge base — keyless, caller-aware (ACL-filtered), cited, and with a **deterministic** refusal when no authorized source supports the answer. `agentic-loop` decides *that* grounding is Foundry IQ; this file holds the retrieval-identity, refusal, ACL, and validation detail that make enterprise grounding run smoothly end to end. Defer index/knowledge-base provisioning to `microsoft-foundry` and role GUIDs to `azure-rbac`.

**No-bypass rule.** Every enterprise answer flows through Foundry IQ agentic retrieval. The app and agent must **not** issue ad hoc Azure AI Search queries that sidestep the knowledge base — grounding, ACL, and citations are only guaranteed on the Foundry IQ path.

## Retrieval identity — the silent-403 trap

There are **two** ways a hosted agent reaches the Foundry IQ / AI Search **data plane**, and they authenticate as **different identities**. Getting this wrong is the most common cause of a deployed agent that "refuses everything":

| Retrieval path | Authenticates as | Grant needed |
| --- | --- | --- |
| **Brokered tool connection** — a `CognitiveSearch` connection attached via the toolbox / `AgenticIdentity` | The hosted-agent **agent identity** (`agentIdentityId`) — Agent Service brokers the token | The search service's data role on `agentIdentityId` (see `rbac-contract.md`); re-granted on every publish |
| **Direct in-code retrieval** — MAF/SDK code calling the knowledge base itself (e.g. `KnowledgeAgentRetrievalClient` / `SearchIndexKnowledgeSourceParams`) with `DefaultAzureCredential` | The hosted-agent **runtime _instance_ managed identity** — **no implicit access** | **Search Index Data Reader** on the search service, granted to the *instance* identity |

If the agent does its own retrieval in code (the common Foundry IQ pattern), the call runs as the **instance runtime MI**, which has no implicit Search access. Without the grant, retrieval fails **`403 Forbidden`** on every call. Because MAF/SDK catch tool exceptions (see [Post-deploy validation](#post-deploy-validation--error-masking)), the agent then emits its ordinary refusal with `retrieved_count=0` — so the failure looks like "no authorized source" rather than an auth error.

**Make the grant reproducible.** The instance identity is minted at deploy and **re-minted on publish**, so a one-time portal grant silently breaks on the next `azd deploy`. Wire an idempotent `postdeploy` hook (in `azure.yaml`) that reads the current identity and grants the role:

```bash
# Instance Identity Principal ID changes on each publish — read it, then grant.
principal="$(azd ai agent show "$AGENT_NAME" | grep -Eo 'Instance Identity Principal ID[[:space:]]+[0-9a-fA-F-]{36}' | grep -Eo '[0-9a-fA-F-]{36}')"
scope="/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$AZURE_RESOURCE_GROUP/providers/Microsoft.Search/searchServices/$AZURE_AI_SEARCH_SERVICE_NAME"
az role assignment create --assignee-object-id "$principal" --assignee-principal-type ServicePrincipal \
  --role 1407120a-92aa-4202-b7e9-c0e197c71c8f --scope "$scope"   # Search Index Data Reader (idempotent)
```

Bicep cannot pre-create this assignment (the identity does not exist until the agent is deployed), which is why it belongs in a hook, not the infra template. Declare the intent in `rbac-contract.md` and generate the hook during implement.

## Deterministic refusal — relevance floor, not phrase matching

Refusal ("no authorized source") must be **deterministic**, but Foundry IQ synthesis is not: for a tangential or ACL-denied query the model sometimes declines and sometimes stitches a plausible answer from weakly-related authorized chunks. **Do not gate refusal on string-matching the model's decline phrasing** — it is run-to-run flaky and brittle to Unicode (synthesized text uses a curly apostrophe `U+2019`, so `"couldn't"` never matches a straight-quote marker).

Instead, apply a **semantic reranker relevance floor** on the knowledge-source retrieval — a native Foundry IQ / AI Search parameter, **not** a bypass:

```python
SearchIndexKnowledgeSourceParams(..., reranker_threshold=float(os.getenv("HR_RERANKER_THRESHOLD", "2.3")))
```

Azure AI Search semantic reranker scores run 0–4. In practice directly-relevant authorized docs rerank **≥ ~2.9**; tangential or ACL-residual docs land **≤ ~1.8**. A floor in the gap (**~2.3**) drops weak matches → empty citations → the agent refuses **deterministically**, without touching legitimate answers. Keep it env-overridable so the floor can be tuned per corpus. Refusal is then driven by "no citations survived retrieval," a structural signal, rather than by parsing prose.

## Caller-aware ACL filtering

Carry ACL metadata on every chunk (allowed Entra groups / personas) at ingestion, and **filter at query time** by the caller's resolved groups before synthesis — never post-filter the answer. An unauthorized caller must not receive restricted evidence *or* a summary derived from it. Pair each ACL-deny document with an ACL-deny eval, and combine ACL filtering with the reranker floor so residual weakly-matched restricted chunks are dropped on both axes.

## Citations

Return source document, section, and anchor/chunk id for every grounded claim, sourced from the retrieved evidence (not invented by the model). Treat "answer with zero citations" as a refusal in the API contract.

## Post-deploy validation & error masking

MAF/SDK **catch tool exceptions** and hand the model a generic `"Error: Function failed."`, after which the model emits the standard refusal. A retrieval `403`/timeout therefore surfaces as `retrieved_count=0 + refused=true` — **indistinguishable from a legitimate no-source refusal** unless you look deeper. Post-deploy validation must:

1. **Actively invoke** the deployed agent (`azd ai agent invoke`) with a **known-answer** question and assert `retrieved_count > 0` with a citation — not merely that the service responds.
2. On an unexpected empty retrieval, read agent logs (`azd ai agent monitor <agent> --session-id <sid>`) and look for `Forbidden` / auth errors before concluding "no source."
3. Validate **both** grounded surfaces if the backend runs its own in-process copy of the agent: the backend authenticates as the **app** managed identity, the hosted agent as its **instance** identity — they need Search access **independently**, so one can pass while the other 403s.
