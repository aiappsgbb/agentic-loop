# Hosted-agent guarantee

Reference for the `agentic-loop` skill: how the loop **always** ends up with a Microsoft Foundry **hosted agent** as the provisioned artifact — never a prompt/declarative agent that merely looks like one in the portal. This file is a self-contained step (declare → build → confirm → repair) so it can be reused unchanged by any playbook.

> **Why this exists.** A playbook run once provisioned a *prompt* agent instead of a hosted agent. The run reported success, because nothing in the loop ever stated the artifact type as a requirement or checked what was actually created. The fix is not a late gate that fails the build — it is making the hosted agent the only artifact the loop can produce, and correcting course automatically when it isn't.

## The required artifact

The agentic backbone for every agentic-loop spec is **GitHub Copilot SDK → Foundry hosted agent → Foundry model(s)**, with tools and grounding resolved from a governed toolbox MCP endpoint. The hosted agent is the deployable unit: your container image, your agent loop, run by Foundry, exposing the **Responses API**. See [`foundry-hosted-agent.md`](foundry-hosted-agent.md#required-artifact-type) for the artifact-type table and [`reference-architecture.md`](reference-architecture.md) for the wider service map.

## 1. Declare it (specify → plan)

Before `implement` starts, the plan must state the backbone explicitly. Write these three lines into `./docs/plan.md` (and confirm them in `./docs/spec.md`) — an unstated artifact type is how the wrong one gets built:

- **Agent artifact**: Foundry **hosted agent** (`kind: hosted`), exposing the **Responses API**.
- **Agent framework**: **GitHub Copilot SDK** (or MAF, only when explicitly requested or clearly graph/workflow orchestration).
- **Model**: the selected Foundry model deployment the agent runs BYOK against.

If the plan cannot name all three, resolve that before implementing. Do not begin implement with an unspecified agent artifact.

## 2. Build it so it can only be hosted (implement)

The artifact type is decided by *what you author*, not by intent. Author the hosted shape and the prompt-agent outcome becomes unreachable:

1. **Initialize from a hosted-agent manifest** — `azd ai agent init -m <hosted-agent manifest>` produces an `agent.manifest.yaml` describing a container-backed hosted agent. Keep that manifest in the repo as the source of truth for the agent's identity, environment variables, and model binding.
2. **Serve the Responses API from your own code** — the agent module hosts `azure-ai-agentserver-responses` (`InvocationAgentServerHost` only for the explicit invocations fallback), with the Copilot SDK `CopilotClient` inside. See [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py).
3. **Register it as an azd service** — the agent is built and pushed as a container image and deployed through `azure.yaml`, not created as a portal object.
4. **Never author the declarative path by default** — no `PromptAgentDefinition`, no portal "create agent" flow, no `create_agent(...)` call whose payload is only instructions + model + tools. Those produce `kind: prompt`. They are an escape hatch for an explicitly requested prompt agent, and must be recorded as a deviation in `./docs/plan.md`.

> **Note.** A prompt agent and a hosted agent look similar in the Foundry portal's agent list. The distinguishing field is `kind`, not the display name.

## 3. Confirm it (verify, after `azd provision` / `azd deploy`)

Read the agent **back from the Foundry project**. Do not trust the deploy step's own return value — the failure mode this guards against is exactly a deploy path that reports success for the wrong artifact.

```bash
# Reference check — copy scripts/check_agent_kind.py from the agentic-loop skill
python ./scripts/check_agent_kind.py --agent-name "$AGENT_NAME"
```

The check resolves the agent by name (or lists the project's agents when no name is given) and compares the observed `kind` with `hosted`:

| Observed `kind` | Verdict | Meaning |
| --- | --- | --- |
| `hosted` | `PASS` | Foundry hosted agent — your image, your agent loop, run by Foundry. The required artifact. |
| `prompt` | `REPAIR` | Declarative/prompt agent — instructions + model + tools only. **Not** the agentic-loop backbone. |
| `container_app` | `REPAIR` | Agent backed by an external Container App rather than a Foundry hosted runtime. |
| `workflow` | `REPAIR` | Workflow/orchestration agent, not the hosted runtime. |
| *(none found)* | `REPAIR` | Nothing was provisioned under that name — the deploy did not create the agent. |

Record the observed kind in `./docs/verify.md` so the artifact type is auditable after the fact.

## 4. Repair it (the loop's response to a `REPAIR` verdict)

A wrong artifact is a **correctable** condition, not a dead end. On `REPAIR`, do not report the loop successful, and do not simply abort — fix it:

1. **Report** the mismatch in the loop's output using the message contract below, so the human sees what happened.
2. **Find the cause** in the repo: a `PromptAgentDefinition` / declarative `create_agent` call, a missing or non-hosted `agent.manifest.yaml`, or an agent service missing from `azure.yaml`.
3. **Re-author** the agent to the hosted shape per step 2 above.
4. **Remove the wrong artifact** so the project does not keep a stale prompt agent under the same name, then re-run `azd provision` / `azd deploy`.
5. **Re-run the check.** Repeat at most twice; if it still does not converge, stop and hand the human the observed kind, the attempted corrections, and this document. Stopping is the last resort, not the first response.

Message contract for the report (keep all four parts — this is what made the original failure invisible):

```text
Provisioned agent artifact is not a Foundry hosted agent.
  agent:    <agent name> (project <foundry project endpoint>)
  observed: kind=prompt
  required: kind=hosted (Foundry hosted agent, Responses API)
  reference: skills/agentic-loop/references/foundry-hosted-agent.md#required-artifact-type
  action:   re-authoring the agent from the hosted-agent manifest and re-provisioning
```

## Reuse

This step is deliberately self-contained: it depends only on the Foundry project endpoint and the agent name, and touches no playbook-specific state. Any playbook — including ones that drive a different build-skill set — can adopt it by running the confirm step after provisioning and following the repair procedure on a `REPAIR` verdict.

## Source

- [What is Microsoft Foundry Agent Service? — agent types](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview)
- [Foundry hosted agents](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/concepts/hosted-agents?view=foundry)
- [Manage hosted agents (azd)](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/hosted-agents/manage?pivots=azd)
