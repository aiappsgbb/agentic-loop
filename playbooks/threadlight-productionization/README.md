# Threadlight Productionization: the paved path to production

**What you get:** a pilot your CISO will sign — five guardrails (keyless identity, telemetry, citation grounding, audit trail, evals) enforced in the substrate, proven by a gate, and landed in the AI Citadel production zone. From the **same artefacts** the pilot produced, **no rewrite**.

**How you get it:** the guardrails are already generated into the SPEC, code, and Bicep — your job is to enforce and land them by **prompting** the gate and the Citadel skills:

1. **`threadlight-safe-check`** — prove all five guardrails are green (`gaps: []`)
2. **`foundry-evals` + `foundry-observability`** — promote evals + telemetry to operational
3. **`citadel-hub-deploy`** — stand up the governance hub
4. **`citadel-spoke-onboarding` + `foundry-agt`** — land the agent behind APIM + in-process policy

> Companion to the [Pilot Pipeline](/playbooks/threadlight-pilot-pipeline) and [Customization](/playbooks/threadlight-customization): those build and tailor the agent; this makes it production-grade — *from the same artefacts, no rewrite.*

### The substrate is the paved path

The guardrails aren't a checklist you apply at the end. They're encoded in the generated SPEC, code, and Bicep — and the same substrate that demos is the substrate that hardens:

![The substrate as paved path — five guardrails (keyless identity, telemetry, citation grounding, audit, evals) enforced once, gated by threadlight-safe-check across design, pre-deploy and post-deploy, then hardened by the AI Citadel landing zone.](./images/paved-path.svg)

Four chapters: **Five Guardrails → Enforce the Gate → Harden to Production → The Paved Path to AI Citadel.**

---

## Five Guardrails

**What you get:** five guardrails generated into every pilot — keyless identity, telemetry, citation grounding, audit trail, evals — each owned by a specific skill so it stays enforced, not bolted on at the end. **How:** they ship with the deploy; this chapter is what to verify in each.

---

### Guardrail 1 — Keyless identity, end-to-end

**`DefaultAzureCredential` everywhere.** A user-assigned managed identity (UAMI) for the agent, the MCP server, the workspace, Cosmos, and AI Search.

> **Zero API keys committed to source. Zero secrets in environment variables.** If a generated artefact reaches for a key, that's the bug — not the missing key.

---

### Guardrail 2 — Telemetry from minute one

**App Insights + Log Analytics in Bicep.** A Foundry account-level connection so hosted agents auto-inject the connection string, with `configure_azure_monitor()` wrapped for local-dev safety.

> The first trace lands **before the first customer call**. Telemetry is infrastructure, not an afterthought you wire up the night before the demo.

---

### Guardrail 3 — Citation-grounded answers

**Every answer carries at least one citation.** Every claim about an account, a policy, or a comms-template version is reproducible.

> Refusals are **explicit** ("no matching content") rather than confabulated. *Owned by per-process `AGENTS.md`, enforced by `foundry-evals`.*

---

### Guardrail 4 — Audit-grade trail

**Append-only audit emit on every invocation**, with a tiered retention lifecycle:

| Tier         | Window        |
|--------------|---------------|
| Cosmos hot   | 0–90 days     |
| Cosmos cool  | 90 d → 1 year |
| ADLS archive | 1 year → 7 years |

> The FCA examiner question pattern is answerable on **day one, not day ninety.**

---

### Guardrail 5 — Evals from day one

**SPEC § 9 eval scenarios are generated from the BR-XXX business rules.** The eval dataset shape carries `tool_calls` + `tool_outputs`, so the scorer can see what the agent actually read.

> A **continuous-eval baseline ships with the deploy.** *Owned by `foundry-evals`.*

---

### What good looks like — Five Guardrails

| Guardrail        | Pass condition                                                        |
|------------------|----------------------------------------------------------------------|
| Keyless identity | No keys/secrets in source or env; UAMI wired for every component      |
| Telemetry        | App Insights + Log Analytics in Bicep; first trace before first call  |
| Citation         | ≥1 citation per answer; refusals explicit, not confabulated           |
| Audit            | Append-only emit; hot → cool → archive retention configured           |
| Evals            | § 9 scenarios derived from BR-XXX; continuous-eval baseline deployed   |

---

## Enforce the Gate

**What you get:** a ship / no-ship verdict that refuses to pass when a guardrail is missing. **How:** prompt `threadlight-safe-check` across all three lifecycle phases until `gaps: []`.

---

### How to get it — prompt the gate across all three lifecycles

Prompt `threadlight-safe-check` at each stage — it validates the project against the encoded guardrails. It's not a linter; it's the ship/no-ship gate.

```text
threadlight-safe-check
# then: "Run the design phase — is the SPEC complete across all five guardrails?"
# then: "Run pre-deploy — do Bicep, identity, and telemetry config validate?"
# then: "Run post-deploy — verify the live deployment."
```

> Under the hood each phase is `python -m threadlight.safe_check --phase <design|pre-deploy|post-deploy>` — but you drive it by prompting the skill.

The post-deploy pass is the one your reviewer cares about — it expects a clean result:

```text
gaps: []
```

> A non-empty `gaps:` list is a hard stop. Each gap names the missing guardrail (no telemetry connection, no eval baseline, a key in source) and the SPEC section that should have produced it. Fix the SPEC / artefact, re-run, repeat until `gaps: []`.

---

### What good looks like — Enforce the Gate

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Design phase        | SPEC is complete — all five guardrail sections present                |
| Pre-deploy phase    | Bicep + identity + telemetry config validate before `azd up`          |
| Post-deploy phase   | `gaps: []` against the live deployment                                |
| Traceability        | Every reported gap maps to a SPEC section, not a mystery              |

---

## Harden to Production

**What you get:** demo-grade guarantees turned operational — CI evals, App Insights dashboards, monitored identity and audit — without changing the artefacts. **How:** prompt `foundry-evals` and `foundry-observability` to promote the baselines; add new surfaces with one prompt each.

---

### Same substrate, hardened

> One session → working agent on your Azure. SPEC, code, Bicep, telemetry, evals — all generated. **Production-grade from the same artefacts.**

Harden the pilot in place:

- **Continuous evals in CI** — promote the deploy-time eval baseline to a gate on every change. *(`foundry-evals`)*
- **App Insights dashboards** — turn minute-one telemetry into operational dashboards and alerts. *(`foundry-observability`)*
- **Keyless identity + audit trail** — already there from the guardrails; now monitored.
- **Production hosting** — the hosted agent and surfaces are ACA + Foundry from day one. *(`foundry-hosted-agents`)*

---

### Add surfaces without a rewrite

Production isn't only hardening — it's reach. Add capabilities to the **same** agent, same SPEC, same governance:

| Add…                          | Skill                          |
|-------------------------------|--------------------------------|
| Knowledge bases / enterprise RAG | `foundry-iq`                |
| Vision & voice                | `foundry-doc-vision-speech`    |
| Teams channel                 | `foundry-teams-bot`            |
| Workspace UI                  | `threadlight-workspace-ui`     |

> No new agent, no migration — every addition reads the same SPEC and inherits the same five guardrails. (Surfaces are the subject of the [Customization playbook](/playbooks/threadlight-customization).)

---

### What good looks like — Harden to Production

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| CI evals            | Eval suite runs on every change and blocks regressions                |
| Dashboards          | App Insights dashboards + alerts on the agent's traces                |
| Same artefacts      | Hardening changed config/CI, not a rewrite of the agent               |
| Reach               | New surfaces inherit identity, telemetry, citations, audit, evals     |

---

## The Paved Path to AI Citadel

**What you get:** the same agent landed in the production governance zone — an APIM perimeter and AGT in-process policy on one audit chain, the point where your CISO signs off. **How:** prompt `citadel-hub-deploy`, `citadel-spoke-onboarding`, and `foundry-agt`.

---

### Governance layers — defense in depth

> **Two layers, one audit chain.**

| Layer       | What it is                                                            |
|-------------|----------------------------------------------------------------------|
| Perimeter   | **AI Citadel APIM gateway** — JWT auth, rate limiting, content filter |
| In-process  | **AGT in-process middleware** inside the agent — 8–12 µs/eval, hash-chained audit |

> `CITADEL APIM · AGT 3.6 · OWASP ASI 2026`. The APIM gateway guards the edge; AGT enforces policy inside the agent on every call. Both feed one audit chain.

---

### Land it in the production landing zone

The pilot substrate IS the paved path — harden it, extend it, and land it in the AI Citadel production landing zone. **APIM gateway + AGT in-process middleware + VNet isolation. Your CISO signs off here.**

| Step                        | Skill                          |
|-----------------------------|--------------------------------|
| Stand up the governance hub | `citadel-hub-deploy`           |
| Onboard the agent as a spoke| `citadel-spoke-onboarding`     |
| In-process policy middleware| `foundry-agt`                  |

> **No rewrite. No migration. Just layers.** The agent that demoed in the workshop is the agent that lands in the landing zone — Bicep your CISO reviewed before anything shipped.

---

### Beyond one agent — Zava

Once agents are governed and landed, the enterprise pitch is the control plane: [Zava](https://github.com/aiappsgbb) wraps your Threadlight agents into a multi-domain twin — a live dashboard with 170 API routes, SSE fleet telemetry, and persona-driven decision orchestration.

> Productionization is the prerequisite: only a governed, observable, audit-grade agent belongs in a fleet. Get the five guardrails green, land it in Citadel, *then* compose it into Zava.

---

### What good looks like — The Paved Path

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Perimeter           | APIM gateway enforces JWT, rate limit, content filter                 |
| In-process          | AGT middleware enforces policy with a hash-chained audit              |
| One audit chain     | Perimeter + in-process events reconcile to a single trail             |
| CISO sign-off       | All of it is Bicep, reviewed before anything shipped                  |
