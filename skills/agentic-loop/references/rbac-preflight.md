# RBAC pre-flight

Reference for the `agentic-loop` skill: the permission gate that runs **before step 1** of a playbook run, so missing role assignments are reported as one complete list *before* anything is created — never discovered one failure at a time, halfway through provisioning.

> **Why this exists.** A playbook run hit RBAC failures on the subscription, then the resource group, then the Foundry project. Each surfaced mid-provisioning, after partial resources already existed, and each had to be chased separately: request a grant, re-run, hit the next one. The whole set of missing assignments was knowable up front. This step makes it knowable up front.

This step is deliberately self-contained — it needs only the caller identity and the scopes in play — so any playbook can adopt it unchanged. It is owned by `agentic-loop`, the mandatory policy layer every playbook already invokes, so it applies **across playbooks with no playbook-specific wiring**.

## What it checks

The [runtime matrix](rbac-contract.md#runtime-matrix-service-managed-identities) describes the solution's **managed identities** — principals that do not exist yet before step 1. The pre-flight checks the other half of the contract: the [**deployer prerequisites**](rbac-contract.md#deployer-prerequisites-pre-flight), the rights the **caller** needs both to create the resources and to write every role assignment the generated Bicep will create.

Concretely:

1. **Enumerate required** assignments from the deployer-prerequisites table.
2. **Resolve effective** assignments for the caller at each scope in play — subscription, resource group, Foundry AI account, and Foundry project — including **inherited** and **group-derived** ones.
3. **Diff** required against effective, applying role equivalence (see below).
4. **Report every gap at once** as `principal → scope → role`, with a remediation block a subscription owner can run as-is.
5. **Fail fast** on any gap. Nothing has been provisioned at this point, so there is no partial state to unwind.

### Scopes

| Scope | Resolved from | Notes |
| --- | --- | --- |
| Subscription | `AZURE_SUBSCRIPTION_ID` / `--subscription` | Always checked. |
| Resource group | `AZURE_RESOURCE_GROUP` / `--resource-group` | Checked when the run targets a **pre-existing** resource group. Skipped on greenfield, where subscription-scoped rights cover its creation. |
| Foundry AI account | `AZURE_AI_ACCOUNT_ID` / `--ai-account` | Checked on a brownfield run against an existing account. |
| Foundry project | `AZURE_AI_PROJECT_ID` / `--ai-project` | Checked on a brownfield run against an existing project. |

Greenfield runs create the resource group, account, and project, so only the subscription scope can be evaluated — and it is exactly the scope whose rights permit those creations. Brownfield runs check the concrete scopes as well, which is where per-resource grants diverge from subscription-level ones.

### Role equivalence

A requirement is satisfied by an **equivalent-or-broader** assignment, so a fully-permissioned caller produces no findings rather than a wall of false positives:

| Required role | Also satisfied by |
| --- | --- |
| Contributor | Owner |
| Role Based Access Control Administrator | Owner, User Access Administrator |
| Azure AI Account Owner | *(nothing broader)* |
| Azure AI Project Manager | Azure AI Account Owner |

Assignments **inherited** from a broader scope also satisfy a narrower one: subscription Contributor satisfies the resource-group Contributor requirement.

> **Owner does not satisfy the Foundry roles.** `Azure AI Account Owner` and `Azure AI Project Manager` carry `dataActions`, and Owner's `*` covers `actions` only — so a subscription Owner still cannot create agents, skills, or toolboxes on a project. Treating them as equivalent would produce the exact false pass this check exists to prevent: it is why the Foundry-project failure surfaced *separately*, after the subscription and resource-group ones had already been fixed.

## Running it

```bash
# Reference check — copy scripts/check_rbac_preflight.py from the agentic-loop skill
python ./scripts/check_rbac_preflight.py \
  --subscription "$AZURE_SUBSCRIPTION_ID" \
  --resource-group "$AZURE_RESOURCE_GROUP"
```

Live mode shells out to the **Azure CLI** — `az ad signed-in-user show` to resolve the caller, then `az role assignment list --assignee <id> --scope <scope> --include-inherited --include-groups` per scope. No extra Python dependencies, and `az` is already present in any azd-driven run. Pass `--assignee` to check a principal other than the signed-in user (a service principal or CI identity).

`--from-file <observed.json>` replays a recorded set of assignments instead of calling Azure, so both the pass and the fail path can be exercised without a subscription.

## Verdicts

| Verdict | Exit code | Meaning |
| --- | --- | --- |
| `PASS` | `0` | Every required assignment is satisfied. **One** summary line is printed (`--quiet` prints nothing) — a fully-permissioned run adds no noise to the loop's output. |
| `BLOCKED` | `2` | One or more required assignments are missing. The full list is printed. **Do not start step 1.** |
| `ERROR` | `1` | The check could not be evaluated (no caller identity, `az` unavailable, CLI failure). Resolve it rather than skipping the gate. |

`BLOCKED` is not a repair loop — unlike the [hosted-agent guarantee](hosted-agent-guarantee.md), the loop cannot grant itself permissions. The correct response is to hand the report to someone who can, then re-run the pre-flight.

## Report contract

Print **every** missing assignment, not the first one — being handed the complete set in one go is the entire point:

```text
RBAC pre-flight: BLOCKED -- 3 required role assignments are missing.

  principal: sara@contoso.com (b3f1...c2a9)

  MISSING  sara@contoso.com -> /subscriptions/<sub-id>
           role: Role Based Access Control Administrator
           why:  Microsoft.Authorization/roleAssignments/write - the Bicep creates every row of the runtime matrix
  MISSING  sara@contoso.com -> /subscriptions/<sub-id>/resourceGroups/rg-app
           role: Contributor
           why:  Deploy into a pre-created resource group when the caller has no subscription-level rights
  MISSING  sara@contoso.com -> /subscriptions/<sub-id>/resourceGroups/rg-app/providers/Microsoft.CognitiveServices/accounts/aif-app/projects/proj
           role: Azure AI Project Manager
           why:  Create/publish hosted agents, skills, and toolboxes on the project

Ask a subscription owner to run:

  az role assignment create --assignee "b3f1...c2a9" --role "Role Based Access Control Administrator" --scope "/subscriptions/<sub-id>"
  az role assignment create --assignee "b3f1...c2a9" --role "Contributor" --scope "/subscriptions/<sub-id>/resourceGroups/rg-app"
  az role assignment create --assignee "b3f1...c2a9" --role "Azure AI Project Manager" --scope "/subscriptions/<sub-id>/resourceGroups/rg-app/providers/Microsoft.CognitiveServices/accounts/aif-app/projects/proj"

reference: skills/agentic-loop/references/rbac-contract.md#deployer-prerequisites-pre-flight
No resources have been created. Re-run this check once the assignments are in place.
```

Keep all four parts — the principal, one `MISSING` block per gap naming **scope and role**, the ready-to-run remediation, and the statement that nothing was created. The remediation block is what turns the report into a single request to a subscription owner instead of a conversation.

## Where it sits in the loop

Run it **before step 1**, after the target subscription/scopes are known and before any `azd provision`, resource creation, or Bicep deployment. In an azd-driven repo, wire the same script as a `preprovision` hook in `azure.yaml` so a direct `azd up` is gated too, not only a full playbook run.

Record the verdict in `./docs/plan.md` (or the run log) so a later failure can be told apart from a permission gap that was accepted and worked around.

## Reuse

The step depends only on the caller identity and the scopes in play, and touches no playbook-specific state — so every playbook inherits it through `agentic-loop` without its own wiring, and it can be lifted into a shared cross-playbook step unchanged.

## Source

- [Azure built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)
- [Role Based Access Control Administrator](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/privileged#role-based-access-control-administrator)
- [List role assignments with Azure CLI](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-list-cli)
- [Microsoft Foundry role-based access control](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/rbac-azure-ai-foundry)
