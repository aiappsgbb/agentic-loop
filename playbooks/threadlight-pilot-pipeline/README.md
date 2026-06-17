# Threadlight Pilot Pipeline: business process → working agent

**AI agent PoCs, demos, and MVPs — dramatically simplified.** Describe a business process to a coding agent; it drafts the spec, scaffolds the agent, validates it locally, and deploys it to the customer's Azure — with governance, telemetry, and evals generated as auditable artefacts. **One guided session.**

### Why Threadlight is the wedge

> *The artefact is the agent, not the deck. The proof is the telemetry, not the demo. The path to production is paved, not planned.*

Threadlight is **the wedge** in the GBB AI Apps motion: a chain of eight `threadlight-*` Copilot skills that turn a one-paragraph brief into a deployed, evaluated, observable **Microsoft Foundry hosted agent** on the customer's tenant — in a single working session. A recent Tier-1 European telco engagement went from paragraph brief to deployed agent, with audit-grade citations, **inside one working day**.

> Use this when you're running an **enterprise pilot** (FSI, Mfg, Retail, Telco, Healthcare) and want the fastest path from a vague brief to a governed, demo-ready agent — not a from-scratch greenfield build.

This playbook is the **core in-session pipeline**. Two companion playbooks go deeper on the other two proof points the experience promises:

- **[Threadlight Customization](/playbooks/threadlight-customization)** — *surfaces from one agent*: tailor the agent to the customer's process, industry, and operator surfaces (Teams cards, workspace UI, event channels).
- **[Threadlight Productionization](/playbooks/threadlight-productionization)** — *defense in depth*: the five guardrails the chain refuses to ship without, and the paved path from pilot to the AI Citadel production landing zone.

### The chain at a glance

The chain flows in canonical order. Every skill after `threadlight-design` reads `specs/SPEC.md` as its input contract:

```text
brief
  │
  ▼
threadlight-design ─────────► specs/SPEC.md + manifest.json + AGENTS.md
  │
  ├─ (optional) threadlight-demo-data-factory  → synthetic data + Cosmos seed/reset
  ▼
threadlight-local-test ─────► http://localhost:8501        (inner loop, no azd)
  │
  ├─ (optional) hitl-patterns · workspace-ui · event-triggers
  ▼
threadlight-deploy ─────────► azd up   (ACR · Bicep/AVM · Foundry hosted agent)
  │
  ▼
threadlight-safe-check ─────► --phase post-deploy → gaps: []   (mandatory gate)
  │
  ▼
foundry-evals + foundry-observability  → traces · regression sets · flywheel
```

This playbook is organized as five chapters that mirror the pipeline: **Design → Local Test → Deploy → Safe-Check → Evaluate & Observe.**

### Pick your entry skill

**Pick your entry skill by what the customer handed you**, not by which skill sounds most exciting:

| You start with…                                  | Entry skill                              | Then chain into…                       |
|--------------------------------------------------|------------------------------------------|----------------------------------------|
| Vague brief, no spec yet                         | `threadlight-design`                     | demo-data-factory → local-test → deploy |
| A spec, but no mock data / Cosmos seed           | `threadlight-demo-data-factory`          | local-test → deploy                    |
| Spec + data, need a screen-shareable PoC <30 min | `threadlight-local-test`                 | iterate; deploy when ready             |
| Spec + data, ready to ship to a sandbox          | `threadlight-deploy`                     | safe-check (post-deploy)               |
| An inherited deploy you need to triage           | `threadlight-safe-check --phase post-deploy` | deploy (re-run) → safe-check        |

> **Fast path — one prompt, full auto.** [`threadlight-auto`](https://github.com/aiappsgbb/threadlight-skills/tree/main/skills/threadlight-auto) drives the whole chain from a single freeform prompt:
> ```text
> threadlight-auto
> # then: "Build me an auto-claim triage agent for Contoso Mutual."
> ```
> It runs design → (optional) local-test → deploy → safe-check → live invoke, auto-continuing at every gate and **hard-stopping** only on tenant-assertion failure or quota exhaustion. The chapters below are the same chain, run by hand so you can review each stage.

### Setup

Install both plugins — Threadlight cross-references `foundry-*`, `azd-patterns`, and `citadel-*` skills from [awesome-gbb](https://github.com/aiappsgbb/awesome-gbb):

```bash
copilot plugin marketplace add aiappsgbb/awesome-gbb
copilot plugin install awesome-gbb@awesome-gbb

copilot plugin marketplace add aiappsgbb/threadlight-skills
copilot plugin install threadlight-skills@threadlight-skills
```

Sanity check before you go further:

```bash
copilot --version
az account show          # the deploy stage needs a real, logged-in tenant
azd version
```

> Only `threadlight-design` runs cleanly inside Microsoft Copilot Cowork. Every runtime stage below (`local-test`, `deploy`, `safe-check`) needs a **real shell** with Azure auth.

---

## Design

Turn a vague brief into a durable SpecKit specification and derive the agent surface. This is the one stage that has no upstream dependency — and the one every other skill reads from.

---

### What `threadlight-design` produces

The spec is the contract. `threadlight-design` writes a numbered, machine-checkable specification plus the agent surface derived from it:

| Artifact                       | What it is                                                                                  |
|--------------------------------|---------------------------------------------------------------------------------------------|
| `specs/SPEC.md`                | Numbered business rules (BR-XXX), data models with system-of-record, tool contracts, § 8 human interaction points, § 8b workspace UX, § 10 triggers, § 11c tech-stack selectors, § 11d demo-data realism, § 9 eval scenarios |
| `specs/manifest.json`          | The machine-readable `deployment_manifest{}` selector contract — input for every downstream skill |
| `AGENTS.md` + `src/agent/skills/` | The agent definition and per-process skills                                              |
| `specs/overview.html`          | A self-contained, dark-themed seller pitch page                                             |
| `specs/sample-data/*.json`     | Initial mock-data shells (full generation is the demo-data factory's job)                   |

---

### Run `threadlight-design`

Invoke the skill, then describe the process, the customer industry, and the regulatory frame in one or two sentences. Two operating modes: **Full** (stakeholder review, checkpoint after the interview) and **Fast-PoC** (2–3 questions, then proceed).

```text
threadlight-design
# then: "Design an auto-claim triage process for a commercial P&C insurer. Fast PoC mode."
```

> Optionally pre-load a domain primer (e.g. `fsi-kyc-aml.md`) so the spec starts with the right entities, business rules, and vocabulary instead of generic placeholders.

---

### (Optional) Seed realistic demo data

If the process has `availability: mock` systems, generate synthetic data so every surface — mock MCP, workspace UI, eval dataset — reads the same canonical seed.

```text
threadlight-demo-data-factory
```

It reads SPEC § 4 (data models), § 5 (which systems are mock), and § 11d (volumes, distributions, named golden cases, reset semantics), then writes:

- `specs/sample-data/<entity>.json` — fully populated, each with a `_meta` generator block.
- `scripts/seed_data.py` and `scripts/reset_data.py` — idempotent Cosmos seed and **reset for live-demo recovery** between takes.

---

### What good looks like — Design

| Check                | Pass condition                                                                 |
|----------------------|--------------------------------------------------------------------------------|
| Spec completeness    | `specs/SPEC.md` has numbered BR-XXX rules, § 8 gates, § 10 triggers, § 11c selectors |
| Manifest contract    | `specs/manifest.json` `deployment_manifest{}` exists and uses registered selectors |
| Agent surface        | `AGENTS.md` + `src/agent/skills/` derived from the spec, not hand-waved         |
| Data availability    | Every system marked `real` or `mock` — no ambiguous integrations               |

---

## Local Test

Run the designed PoC entirely on the dev box — no `azd up`, no 20–30 min deploy round-trip. Iteration on tools, prompts, and the workspace UI happens in seconds.

---

### Boot the inner loop (Pattern 0 — Quickstart)

The default pattern boots a MAF Agent + SkillsProvider + JSON stub tools + a Streamlit UI on `localhost:8501`, with a **single** LLM dependency (a Foundry project *or* Azure OpenAI).

```text
threadlight-local-test
# Pattern 0 (Quickstart) → http://localhost:8501
```

```bash
python -m threadlight_quickstart   # under the hood
```

> LLM calls always hit a real deployment; everything else stays local. There are **no persistent artifacts** here — this is the inner-loop skill.

---

### Pick the pattern that matches the iteration need

| # | Pattern               | What it runs                                                                 |
|---|-----------------------|------------------------------------------------------------------------------|
| 0 | **Quickstart** (default) | MAF Agent + SkillsProvider + stub tools + Streamlit on `localhost:8501`    |
| 1 | MCP-direct            | Register the local FastMCP server in `~/.copilot/mcp.json`; iterate tool contracts in the CLI |
| 2 | Smoke-client          | `agent.run_async()` — bypasses the host server; fastest reasoning-trace loop |
| 3 | Local-stack           | `docker-compose` with the Cosmos emulator (Linux / Windows x86 only)         |

---

### (Optional) Layer in the human + event surfaces

These three skills attach to the same spec and can be added before or alongside deploy:

| Skill                        | Adds                                                                 | Reads        |
|------------------------------|---------------------------------------------------------------------|--------------|
| `threadlight-hitl-patterns`  | Teams Adaptive Card flows for the 7 canonical gates (approve, edit-and-approve, reject, escalate, signoff, audit-view, request-info) + audit trail | SPEC § 8     |
| `threadlight-workspace-ui`   | One framework-agnostic operator dashboard (case-list / inbox / dashboard / console / kanban / map) the customer can rebuild | SPEC § 8b    |
| `threadlight-event-triggers` | ACA-first non-interactive receivers (jobs, HTTP, KEDA consumers) with idempotency + dead-letter wiring | SPEC § 10b   |

> Skip `hitl-patterns` when the process is fully autonomous; skip `workspace-ui` when the operator lives only in Teams cards; skip `event-triggers` when the process is purely chat / on-demand.

---

### What good looks like — Local Test

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Inner loop runs     | `http://localhost:8501` responds and the agent answers with tool calls |
| Single LLM dep      | Only one of Foundry / Azure OpenAI is required — no Azure provisioning |
| Tool round-trip     | Stub tools return canonical seed data; reasoning traces are visible   |
| Fast iteration      | Prompt / tool edits reflect in seconds, not minutes                   |

---

## Deploy

Take the designed project and generate everything needed to run as a Microsoft Foundry Hosted Agent. **One command — `azd up` — does the rest.**

---

### Generate the deployment artifacts

`threadlight-deploy` reads `specs/SPEC.md`, `AGENTS.md`, `src/agent/skills/`, and the § 11c selectors in `specs/manifest.json`, then vendors the runtime + infra:

```text
threadlight-deploy
```

| Artifact                    | What it is                                                                 |
|-----------------------------|---------------------------------------------------------------------------|
| `container.py`              | GHCP SDK runtime by default (falls back to MAF when `@tool` functions are needed) |
| `Dockerfile`                | uv-based on `python:3.12-slim`                                             |
| `pyproject.toml`            | With prerelease handling for hosting packages                             |
| `agent.yaml` + `azure.yaml` | The `azd ai agent` extension scaffold                                     |
| `infra/`                    | Vendored Bicep (AVM) modules per the § 11c selectors                      |
| `mcp-config.json`           | Wired to mock (or real) MCP endpoints                                     |
| `copilot-instructions.md`   | System prompt derived from `AGENTS.md`                                    |
| `deploy-notes.md`           | Full deployment guide, including mock-system warnings                     |

---

### Run `azd up`

One command provisions and deploys — ACR build, Bicep/AVM modules, hooks, the Foundry hosted agent, and (when present) Citadel governance wiring:

```bash
azd up
```

> The deploy stage pulls RBAC + identity defaults from `foundry-hosted-agents`, MCP deploy from `foundry-mcp-aca`, and the 3-layer telemetry wiring from `foundry-observability` — keyless UAMI, no connection strings.

---

### What good looks like — Deploy

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Resource graph      | One Foundry project, one ACA env, one UAMI, ACR, App Insights, Log Analytics |
| Identity            | UAMI bound to the apps; **no** connection strings or shared secrets   |
| Image               | The container runs **your** image — not the `containerapps-helloworld` placeholder |
| Endpoint            | `azd ai agent invoke` returns a real response from the hosted agent   |

---

## Safe-Check

The single mandatory completeness gate. It catches the silent failures that `azd up` reports as success — placeholder images, dead cron jobs, empty App Insights, unreachable channels.

---

### The three-lifecycle gate

One CLI, three phases. Run it after design, **before** `azd up`, and **after** `azd up` — every time:

```bash
python -m threadlight.safe_check --phase design        # SPEC ↔ manifest contract
python -m threadlight.safe_check --phase pre-deploy    # manifest ↔ azure.yaml ↔ Bicep ↔ src/
python -m threadlight.safe_check --phase post-deploy   # manifest ↔ deployed resources ↔ channel reach
```

Each run writes a manifest under `tests/` with a top-level `"gaps": []`. **Empty array = pass.** Exit `0` on pass, `1` on fail.

```text
threadlight-safe-check --phase post-deploy   # expects: gaps: []
```

---

### What the post-deploy phase asserts (non-negotiable)

1. Every `expected_resource_types` entry is present in `az resource list`.
2. **No** container running the azuredocs `containerapps-helloworld` placeholder image.
3. **No** ACA Job whose last 5 executions are all `Failed` (cron rot ships clean).
4. App Insights exists when the SPEC declared it.
5. All `channels` reach HTTP / JWT-OK.

---

### What good looks like — Safe-Check

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Design phase        | `tests/safe-check-design-manifest.json` → `gaps: []`                  |
| Pre-deploy phase    | Every selector maps to a service in `azure.yaml` + a Bicep module + `src/<dir>/` |
| Post-deploy phase   | `tests/postdeploy-manifest.json` → `gaps: []`, exit code `0`          |
| Channel reach       | Every declared channel answers HTTP / JWT-OK                          |

---

## Evaluate & Observe

A pilot isn't done when it deploys — it's done when you can prove it works and watch it in production. The chain hands off to two companion skills from `awesome-gbb`.

---

### Wire evaluation

Turn the spec's § 9 eval scenarios into a runnable regression set with [`foundry-evals`](https://github.com/aiappsgbb/awesome-gbb). The demo-data factory's canonical seed is what makes scores reproducible across runs.

```text
foundry-evals
```

| Build into the eval set | Why                                                              |
|-------------------------|-----------------------------------------------------------------|
| § 9 eval scenarios      | The spec already names the cases that matter                     |
| Golden seed data        | Same input every run → comparable scores, no flakiness           |
| Grounding checks        | Confirm answers cite tool output rather than fabricating         |

---

### Wire observability

`foundry-observability` provides the 3-layer telemetry wiring (already referenced at deploy time): OpenTelemetry traces → Application Insights. Confirm traces land and build the dashboards / alerts you'll watch during the pilot.

```text
foundry-observability
```

> If `azd up` returned `0` but App Insights is empty, that's exactly the silent failure `safe-check --phase post-deploy` is built to catch — re-run the gate before you trust the dashboard.

---

### Day-2 and the flywheel

Production traces feed regression sets; regression sets catch drift; fixes ship as PRs. That's the improvement loop the Threadlight chain is designed to close.

- **Reset between demo takes** with `scripts/reset_data.py` so the second run isn't broken by the first.
- **Re-run `safe-check`** after every redeploy — cron rot and placeholder images ship clean.
- The customer / leadership narrative (manifesto, KPIs, animated chain, flywheel) lives in [`threadlight-experience.html`](https://aiappsgbb.github.io/threadlight-skills/).

---

### What good looks like — Evaluate & Observe

| Check               | Pass condition                                                        |
|---------------------|----------------------------------------------------------------------|
| Evals run           | § 9 scenarios execute against the deployed agent with reproducible scores |
| Grounding           | `tool_output_utilization` passes for grounded answers                 |
| Traces land         | App Insights shows end-to-end spans for live invocations              |
| Flywheel            | Production traces feed regression sets that gate the next redeploy     |
