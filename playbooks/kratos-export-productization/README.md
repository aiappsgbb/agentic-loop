# Kratos Export Review & Productization: pick a persona, ship it

**What you get:** the exact Kratos demo persona the customer loved — running, governed, on **their** Azure as a standalone [Microsoft Foundry Hosted Agent](https://learn.microsoft.com/azure/ai-foundry/agents/). No Kratos backend at runtime, no rebuild. ([Kratos](https://github.com/kmavrodis/kratos-agent) is a production-ready reference architecture — one agent, N skills — and any persona exports as a self-contained ZIP.)

**How you get it:** picking an export is a triage, not a build. Export one persona, review it, deploy it, prove it, then harden it — driving the skill steps **by prompting**:

1. **Export** — pick the persona that matches the customer's process; download it as a Foundry agent (UI button or `GET …/export`)
2. **Review** — inspect the ZIP and boot it locally before you spend an `azd up`
3. **`azd up`** — deploy into the customer subscription, then register the agent in Foundry
4. **`foundry-evals`** — score it; smoke-test the 23 surfaces with `e2e-smoke`
5. **`threadlight-safe-check` + `citadel-spoke-onboarding`** — harden through the five guardrails and land in AI Citadel

> Use this when a Kratos demo persona resonated and you want to hand the customer *that* agent — not a slide, not a rebuild — on their own tenant with governance and telemetry.

The exported ZIP is the **same artefact shape** a Threadlight pilot produces (`main.py`, `Dockerfile`, `agent.yaml`, `azure.yaml`, `infra/` Bicep), so it drops straight into the production motion. Two companion playbooks pick up where this one ends:

- **[Threadlight Productionization](/playbooks/threadlight-productionization)** — the five guardrails and the paved path to the AI Citadel landing zone. This playbook's final chapter hands off here.
- **[Threadlight Customization](/playbooks/threadlight-customization)** — add surfaces (Teams, workspace UI, event channels) to the exported agent without a rewrite.

### The review-to-production path

The whole flow at a glance:

![The Kratos review-to-production path — pick one of eight personas, GET the export, then review, azd up, register, and e2e-smoke 23 surfaces, evaluate with traces, harden via the five guardrails, and optionally land in AI Citadel.](./images/review-to-prod.svg)

This deck is organized as five chapters: **Pick the Export → Review the Export → Deploy & Validate → Evaluate & Observe → Productize.**

### Setup

You need the Kratos repo (to trigger an export and to deploy) and the standard `azd` toolchain:

```text
azd ≥ 1.12 · Azure CLI · Docker · Node.js 20+ · Python 3.11+
git clone https://github.com/kmavrodis/kratos-agent && cd kratos-agent
```

> You can export from a **running** Kratos instance (the UI's "Download as Foundry Agent" button, or the API) — you don't have to deploy Kratos yourself if a shared instance already exists.

---

## Pick the Export

**What you get:** one persona, exported as one self-contained ZIP — the one whose skills and mocks match the customer's process. **How:** survey the eight personas, pick by process (not flashiest demo), then download it as a Foundry agent.

---

### Survey the personas

Kratos ships eight configurable use-case personas, each with its own system prompt, skills, and APM manifest:

| Persona               | Slug                     | What it does                                                        |
|-----------------------|--------------------------|--------------------------------------------------------------------|
| Generic               | `generic`                | Web search, code interpreter, file sharing — general assistant     |
| Retail Banking        | `retail-banking`         | Account lookup, transactions, mortgage calc, spending analysis     |
| Wealth Management     | `wealth-management`      | Portfolio review, tax analysis, branded PDF wealth reports         |
| Insurance             | `insurance`              | Policy info, claims processing, coverage analysis                  |
| Sales Account Review  | `sales-account-review`   | AE/CSM co-pilot vs the `salesforce-mcp-server` mock                |
| HR Onboarding         | `hr-onboarding`          | People-team co-pilot vs the `workday-mcp-server` mock              |
| IT Service Desk L1    | `it-service-desk`        | L1 triage/KB/resolve vs the `servicenow-mcp-server` mock           |
| Clinician Visit Prep  | `clinician-visit-prep`   | Outpatient co-pilot vs the `epic-fhir-mcp-server` mock (FHIR R4)   |

> **Pick by the customer's process, not by the flashiest demo.** Each persona carries a `SYSTEM_PROMPT.md`, a `skills/` catalog, and an `apm.yml` of remote skill dependencies — so the persona you pick is the persona you ship.

---

### Download as a Foundry Hosted Agent

Trigger the export from the UI ("Download as Foundry Agent" under the persona picker) or directly from the API:

```bash
curl -OJ http://localhost:8000/api/use-cases/insurance/export
# → insurance-foundry-agent.zip
```

The endpoint is `GET /api/use-cases/{use_case}/export`. The ZIP is self-contained — it surfaces in the target Foundry project alongside any other hosted agents, with no Kratos backend at runtime.

---

### What good looks like — Pick the Export

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Persona fit         | The chosen persona's skills + mocks match the customer's process      |
| Single artefact     | You exported one persona as one ZIP — not the whole Kratos backend    |
| Named target        | You know which customer subscription / Foundry project it lands in    |

---

## Review the Export

**What you get:** confidence the export is what you think it is — the right system prompt, the right skills, booting clean — before you spend an `azd up`. **How:** inspect the ZIP, then run it locally with the Kratos full-local stack (no Azure needed).

---

### Inspect the ZIP

A `<persona>-foundry-agent.zip` ships everything to run the same agent standalone:

| File / folder              | What it is                                                        |
|----------------------------|-------------------------------------------------------------------|
| `copilot-instructions.md`  | The persona's system prompt                                       |
| `skills/`                  | Every `SKILL.md` and supporting script/asset                      |
| `mcp-config.json`          | The persona's MCP server map                                      |
| `mocks/packages/`          | Referenced local stdio mock servers, ready for `npm install -g`   |
| `main.py`                  | ~300-LoC single-tenant runtime (Copilot SDK + Foundry host)       |
| `Dockerfile`, `pyproject.toml`, `agent.yaml` | Container + runtime + agent manifest            |
| `azure.yaml`, `infra/`     | `azd` service map + Bicep (Managed Identity, VNet, telemetry)     |

> This is the **review** step: read `copilot-instructions.md` to confirm the persona's behavior, scan `skills/` for the tools it can call, and check `mocks/packages/` — a mock means that integration is *not* yet wired to a real customer system.

---

### Run it locally first

Before spending an `azd up`, confirm the export boots. Kratos's full-local mode needs no Azure — a Copilot token replaces Foundry models, SQLite replaces Cosmos, Azurite replaces Blob:

```bash
cp .env.local.example .env.local
# set COPILOT_GITHUB_TOKEN=ghu_xxx  (github.com/settings/tokens, Copilot scope)
./run-local.sh            # or .\run-local.ps1 on Windows
```

> The exported `main.py` is a single-tenant runtime; the local Kratos stack is the fastest way to exercise the persona's skills and mocks before you commit it to a customer subscription.

---

### What good looks like — Review the Export

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Prompt reviewed     | `copilot-instructions.md` matches the behavior the customer saw       |
| Skills accounted    | Every `skills/` entry is intentional; you know which are mocked       |
| Boots clean         | The persona runs locally and answers a representative prompt          |
| Mocks flagged       | Every `mocks/packages/` server has a real-integration owner / plan    |

---

## Deploy & Validate

**What you get:** the agent provisioned in the customer's Foundry project and proven green across 23 surfaces. **How:** run `azd up`, register the agent in Foundry (one manual step), then prompt the `e2e-smoke` skill.

---

### Deploy with azd up

```bash
unzip insurance-foundry-agent.zip && cd insurance-agent
azd auth login && azd env new my-insurance && azd up
```

`azd up` provisions the infra via Bicep, builds and pushes the container, deploys the hosted agent to Microsoft Foundry, and wires all Managed Identity role assignments.

---

### Register the agent in Foundry

One manual step remains — it can't be automated because the Foundry control plane creates internal metadata linking the APIM API to the tracing pipeline:

1. Open [Microsoft Foundry](https://ai.azure.com) → your project → **Operate** → **Agents**.
2. **+ Register agent** (Custom Agent).
3. Name it, select the provisioned APIM gateway, enter the Container App URL as backend.
4. Complete the wizard.

> `azd env get-values | grep AGENT_SERVICE` surfaces the Container App and gateway URLs you'll paste into the wizard.

---

### Smoke-test the 23 surfaces

Kratos ships a Playwright **`e2e-smoke` skill** that asserts **23 critical surfaces** (health, scenarios, chat, evals, traces, UI, regression, interactive UX) of a deployed instance in ~66s. Prompt it with the deployed URLs:

```text
e2e-smoke
# then: "Smoke-test the deployed instance — backend https://<backend>.azurecontainerapps.io,
#        frontend https://<frontend>.azurestaticapps.net."
```

> Under the hood: `cd .copilot/skills/e2e-smoke && KRATOS_BACKEND_URL=… KRATOS_FRONTEND_URL=… ./run.sh`. Run it after **every** deploy — a green smoke run is the difference between "it deployed" and "it works".

---

### What good looks like — Deploy & Validate

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Provisioned         | `azd up` completes; the agent appears in the target Foundry project   |
| Registered          | The agent is registered in **Operate → Agents** so traces flow        |
| Smoke green         | The e2e-smoke skill passes all 23 surfaces                            |
| Right tenant        | Everything landed in the customer subscription, not yours             |

---

## Evaluate & Observe

**What you get:** per-persona eval scores and a filterable trace waterfall — the proof the agent works and the view inside it. **How:** prompt `foundry-evals` to run the persona's suite (validation + foundry modes), then query the Traces tab.

---

### Per-use-case eval scenarios

Each persona carries its own eval suite under `use-cases/<name>/evals/` — an `eval_config.json` (evaluators + judge model) and committed JSON `scenarios/`. Each scenario declares an `input_message`, `expected_behavior`, `expected_tool_calls`, and the Foundry evaluator set (`Relevance`, `Coherence`, `TaskAdherence`, `IntentResolution`, `ToolCallAccuracy`).

> The "Generate Scenarios" modal (or `POST /api/use-cases/{uc}/evals/scenarios/generate`) drafts realistic conversations from the persona's `SYSTEM_PROMPT.md` and skill catalog. Each draft is **hand-reviewable before commit** — and FSI-shaped personas get industry-realism canons injected from `threadlight-demo-data-factory`.

---

### Two eval modes

| Mode           | Pattern                                                        | Speed   | Use                          |
|----------------|---------------------------------------------------------------|---------|------------------------------|
| **validation** | In-process: invoke sequentially → score locally (`azure-ai-evaluation`) | Seconds | Fast feedback, CI smoke      |
| **foundry**    | Full Foundry eval pipeline, same evaluators, hosted scoring   | Minutes | Pre-release, shareable links |

Both follow the **two-phase invoke + score** pattern from the `foundry-evals` skill — prompt it to run either mode:

```text
foundry-evals
# then: "Run the insurance use-case evals in validation mode for a CI smoke."
# then: "Run the insurance use-case evals in foundry mode for a shareable pre-release report."
```

> Under the hood (CI): `python scripts/run_evals.py --use-case insurance --mode <validation|foundry>`.

---

### Traces and telemetry

The export ships OpenTelemetry + Azure Monitor exporters. The "Traces" admin tab queries App Insights and renders a per-operation waterfall classified into `llm / agent / tool / skill / http / platform / error` spans, filterable by `use_case`, `conversation_id`, and `run_id`. Spans carry `kratos.use_case`, `kratos.conversation_id`, and `kratos.eval_run_id`.

```bash
python scripts/fetch_traces.py --conversation-id abc123
```

---

### What good looks like — Evaluate & Observe

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Scenarios committed | The persona's `evals/scenarios/` cover its core flows                 |
| Evals pass          | `validation` mode green in CI; a `foundry` run before release         |
| Traces visible      | App Insights waterfall renders, filterable by `use_case` / `run_id`   |
| Reviewed data       | Generated scenarios were hand-checked, not blindly committed          |

---

## Productize

**What you get:** all five guardrails green and the agent landed in AI Citadel — production-grade, from the same artefacts. **How:** prompt `threadlight-safe-check` until `gaps: []`, add the two guardrails the export lacks, then prompt `citadel-spoke-onboarding`.

---

### The export is already most of the way there

Kratos exports ship real production posture by default — **three of the five** guardrails the productionization motion demands are already in the box:

| Guardrail (Threadlight) | In the Kratos export?                                              |
|-------------------------|-------------------------------------------------------------------|
| Keyless identity        | ✅ `ChainedTokenCredential` (Managed Identity → Azure CLI); zero secrets in code |
| Telemetry               | ✅ OpenTelemetry + Azure Monitor exporters wired in Bicep        |
| Evals                   | ✅ Per-use-case eval suites (validation + foundry modes)         |
| Citation grounding      | ⚠️ Persona-dependent — enforce ≥1 citation per answer            |
| Audit-grade trail       | ❌ Add the append-only audit emit + tiered retention            |

> **Bonus the export also carries:** VNet private endpoints + Foundry prompt shields / jailbreak detection. So productization isn't a rewrite — it's confirming the three green guardrails for *this* customer and adding the two it doesn't, behind the safe-check **gate**, then dropping it into the AI Citadel **landing zone**.

---

### Run it through the five guardrails

Because the export is the same artefact shape as a Threadlight pilot, the [Threadlight Productionization](/playbooks/threadlight-productionization) playbook applies directly:

- **Enforce the gate** — run `threadlight-safe-check` against the deployment until `gaps: []`.
- **Citation grounding** — enforce ≥1 citation per answer (owned by per-process `AGENTS.md`, scored by `foundry-evals`).
- **Audit-grade trail** — add the append-only audit emit + tiered retention the export doesn't include by default.
- **Continuous evals in CI** — promote the persona's eval suite to a gate on every change.

> Keyless identity, telemetry, and evals are already green from the export. Add citation grounding and the audit trail and all **five guardrails** are covered — the productionization deck walks each one.

---

### Land it in AI Citadel

The paved path doesn't stop at one governed agent. Land the exported agent in the AI Citadel production landing zone — APIM gateway on the perimeter, AGT in-process middleware, VNet isolation:

- `citadel-spoke-onboarding` — onboard the agent as a spoke.
- Add surfaces (Teams, workspace UI) with the [Customization](/playbooks/threadlight-customization) playbook — same agent, same governance.

> **No rewrite. No migration. Just layers.** The persona that demoed in Kratos is the agent that lands in the customer's production zone.

---

### What good looks like — Productize

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Gate green          | `threadlight-safe-check` reports `gaps: []`                           |
| Five guardrails     | Keyless identity, telemetry, citations, audit trail, evals all in place |
| Landed              | The agent is onboarded as a Citadel spoke behind APIM + AGT           |
| Handoff clear       | Ownership, surfaces, and the eval/observability flywheel are assigned  |
