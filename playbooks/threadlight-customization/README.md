# Threadlight Customization: surfaces from one agent

**One Foundry hosted agent. Many surfaces — and one place to enforce the rules.** A Workspace UI, a Teams 1:1 chat, and M365 Copilot Chat can all be powered by the *same* agent, with guardrails enforced once, not three times. This playbook is how you tailor that agent to a specific customer: their **process**, their **industry**, and the **operator surfaces** they actually work in.

> Companion to the [Threadlight Pilot Pipeline](/playbooks/threadlight-pilot-pipeline). The pipeline gets you a deployed agent in one session; this playbook makes it *theirs* — FSI, MFG, Retail, Telco, or Healthcare, each tailored to domain-specific rules and data.

### One agent, many surfaces

Customization is not a fork. Every surface reads the **same** `specs/SPEC.md`, the **same** seed data, and the **same** governance. You're adding layers, not rewriting:

```text
specs/SPEC.md  (the customization contract)
  │
  ├─ § 4/5/11d  ─► threadlight-demo-data-factory   → industry-realistic seed + reset
  ├─ § 8        ─► threadlight-hitl-patterns        → Teams Adaptive Cards (7 gates)
  ├─ § 8b       ─► threadlight-workspace-ui         → operator dashboard (pick the shape)
  └─ § 10/10b   ─► threadlight-event-triggers       → ACA jobs / HTTP / KEDA receivers
       │
       ▼
one agent ──► Workspace UI · Teams 1:1 · M365 Copilot Chat   (guardrails enforced once)
```

This playbook is organized as four chapters: **Tailor the Process → Operator Surfaces → Event & Channel Surfaces → Start From a Template.**

### Setup

Customization skills all read the SPEC, so a designed project is the prerequisite. If you don't have one yet, run the pipeline's Design stage first:

```text
threadlight-design
# then: "Design a {process} for a {industry} customer. Fast PoC mode."
```

> Every skill below assumes `specs/SPEC.md` + `specs/manifest.json` exist and are well-formed. The SPEC sections (§ 4, § 8, § 8b, § 10) are the input contract for each surface.

---

## Tailor the Process

Make the agent speak the customer's domain — its entities, its business rules, and data that looks real enough to demo.

---

### Start from the SPEC — the customization contract

Customization is spec-driven. The selectors and sections written by `threadlight-design` decide which surfaces get generated and how they bind:

| SPEC section      | Drives                                                                 |
|-------------------|-----------------------------------------------------------------------|
| § 4 data models   | Entity field schemas every card and dashboard binds to                |
| § 5 systems       | Which integrations are `real` vs `mock` (mock systems need seed data) |
| § 8 action gates  | The human approval flows (`threadlight-hitl-patterns`)                 |
| § 8b workspace UX | The operator dashboard shape (`threadlight-workspace-ui`)             |
| § 10 / § 10b      | Scheduled / event-driven triggers (`threadlight-event-triggers`)      |
| § 11d demo data   | Volumes, distributions, named golden cases, reset semantics           |

> Customize the SPEC, not the generated code. If a surface comes out wrong, fix the SPEC section it reads and re-run the skill — the selector vocabulary in `manifest.json` is the contract every surface shares.

---

### Pre-load industry realism

`threadlight-design` ships a per-industry realism canon and domain primers so the spec starts with the right vocabulary instead of generic placeholders:

- **Domain primers** (e.g. `fsi-kyc-aml.md`) pre-load typical entities, business rules, and vocabulary at design time.
- **Per-industry data-realism canons** (`fsi.md`, `retail.md`, `telco.md`, `mfg.md`) govern what "realistic" means for the demo data in the next step.

> Pick the primer that matches the customer's industry before you design — it's the difference between a claims agent that knows what an adjuster does and one that invents plausible-sounding nonsense.

---

### Generate industry-realistic demo data

Every demo surface — mock MCP, workspace UI, eval dataset — must read the *same* canonical seed, or the second demo take contradicts the first.

```text
threadlight-demo-data-factory
```

It reads SPEC § 4, § 5, and § 11d plus the per-industry realism canon, then writes:

- `specs/sample-data/<entity>.json` — fully populated, each with a `_meta` generator block.
- `scripts/seed_data.py` and `scripts/reset_data.py` — idempotent Cosmos seed and **reset for live-demo recovery**.

---

### What good looks like — Tailor the Process

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Domain fit          | SPEC entities, BR-XXX rules, and vocabulary match the customer's industry |
| Single seed         | Every surface reads the same `specs/sample-data/` — no divergent fixtures |
| Named golden cases  | § 11d golden cases exist so the demo always has a known-good story    |
| Reset works         | `scripts/reset_data.py` restores a clean state between takes          |

---

## Operator Surfaces

Where the human actually works. Two surfaces, both generated from the SPEC and both binding to the same entity schemas.

---

### Teams approval cards — the seven canonical gates

`threadlight-hitl-patterns` generates Teams Adaptive Card 1.5 flows for the seven canonical action gates declared in SPEC § 8: **approve, edit-and-approve, reject, escalate, signoff, audit-view, request-info.**

```text
threadlight-hitl-patterns
```

It produces (paired with `foundry-teams-bot` for the bot itself):

- `cards/<gate>.json` — the Adaptive Card template per gate.
- `cards/<gate>-handler.py` — the `Action.Submit` handler.
- `src/bot/cards/card_router.py`, `audit_trail.py`, `card_registry.json`.

> Skip this when the process is fully autonomous or the operator lives only in the workspace UI. This skill owns the **gate UX**; the bot skill owns the **bot**.

---

### Workspace UI — pick the shape

`threadlight-workspace-ui` generates **one** polished, framework-agnostic operator dashboard the customer can rebuild faithfully in their preferred stack (React / Angular / Vue / Blazor).

```text
threadlight-workspace-ui
```

Pick the shape that matches SPEC § 8b:

| Shape       | For…                                              |
|-------------|---------------------------------------------------|
| case-list   | Queue of cases an operator works top-down         |
| inbox       | Triage / assignment flows                         |
| dashboard   | Status + KPI overview                             |
| console     | Single-record deep work                          |
| kanban      | Stage / status pipelines                         |
| map         | Geospatial dispatch                              |

Outputs include a single-file vanilla-JS reference (`index.html` + `workspace.css` + `workspace.js` + `seed-data.js`), broken-out components, and a `README.md` framework-mapping guide. In production it is **ACA-hosted** behind Easy Auth — not `file://`.

---

### What good looks like — Operator Surfaces

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Gate coverage       | Every SPEC § 8 gate has a card template + handler                     |
| Card binding        | Cards bind to § 4 entity fields and link back to their BR-XXX rule    |
| Workspace shape     | The generated dashboard matches the § 8b shape and seeds from sample-data |
| Audit               | Every gate action appends to the audit trail                          |

---

## Event & Channel Surfaces

The agent doesn't only answer chat. Wire the non-interactive triggers, then surface the *same* agent across every channel.

---

### Non-interactive triggers

`threadlight-event-triggers` scaffolds **ACA-first** receivers — jobs, app HTTP receivers, KEDA-scaled consumers — with Azure Functions only when narrow constraints demand it. It wires idempotency + dead-letter rules per SPEC § 10b.

```text
threadlight-event-triggers
```

Outputs:

- `src/triggers/<trigger-name>/{receiver.py, pyproject.toml, Dockerfile, README.md}`.
- `infra/triggers/<trigger-name>.bicep` + `dead-letter.bicep`.
- Updates to `azure.yaml` registering the new service.

> Skip this when the process is purely chat / on-demand and goes through the agent directly.

---

### One agent, three channels

The point of customization is leverage: the Workspace UI, Teams 1:1 chat, and M365 Copilot Chat are all powered by the **same** Foundry hosted agent.

| Channel          | Surface                                  | Powered by         |
|------------------|------------------------------------------|--------------------|
| Workspace UI     | Operator dashboard (`workspace-ui`)      | Same hosted agent  |
| Teams 1:1        | Adaptive Card gates (`hitl-patterns`)    | Same hosted agent  |
| M365 Copilot     | In-context chat                          | Same hosted agent  |

> **Guardrails enforced in one place, not three.** Because every channel calls the same agent, identity, telemetry, citation rules, and the audit trail are enforced once — see the [Productionization playbook](/playbooks/threadlight-productionization).

---

### What good looks like — Event & Channel Surfaces

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Idempotency         | Each receiver has an idempotency key + dedup window per § 10b         |
| Dead-letter         | Failed events route to a dead-letter path, not a silent drop         |
| Single agent        | Every channel invokes the same hosted agent — no per-channel forks    |
| Registered          | New trigger services appear in `azure.yaml` and deploy with the agent |

---

## Start From a Template

Sometimes the fastest customization is to start from one that already exists.

---

### The Threadlight Process Library

When the customer's process is close to a known pattern, start from a pre-built one and customize from there:

- **13 ready-to-demo processes** across FSI, MFG, Retail, and Telco — each with a SPEC, demo prompts, and a workshop format.
- Pick one, deploy it, then customize with the full skill chain when the customer says yes.

> In a rush before a workshop? Browse the process catalog, pick the closest match, and use it as the starting SPEC instead of designing from a blank brief.

---

### The bigger picture — Zava

Threadlight customizes **one** agent. When the pitch is "the enterprise operating system" rather than "this one process", that's [Zava](https://github.com/aiappsgbb): a multi-domain control plane that wraps your Threadlight agents into a living organisational twin — branded with the customer's executives, their industry's entity kinds, and live API routes with fleet telemetry.

| Use…                                    | When the pitch is…                          |
|-----------------------------------------|---------------------------------------------|
| Threadlight (this chain)                | "We can build *this process* in a session"  |
| Zava (`research-company`, `compose-org`, `zava-workspace-deploy`) | "Here's your whole organisation, as an operating system" |
| Both together                           | The full-day workshop                       |

> Customization is the bridge between the two: a Threadlight agent tailored to the customer's process is exactly what Zava composes into the larger twin.
