# Threadlight Pilot Pipeline: business process → working agent

**What you get:** a deployed, evaluated, observable **Microsoft Foundry hosted agent** on the customer's Azure — with its spec, governance, telemetry, and an eval baseline generated as auditable artefacts. From a one-paragraph brief, in one guided session.

**How you get it:** you drive a chain of eight `threadlight-*` Copilot skills **by prompting them** — each stage is a skill you invoke with a sentence of intent, not a script you run by hand. The canonical order:

1. **`threadlight-design`** — brief → `specs/SPEC.md`, the contract every later stage reads
2. **`threadlight-demo-data-factory`** *(optional)* — seed realistic demo data
3. **`threadlight-local-test`** — run the PoC on `localhost` in seconds
4. **`threadlight-deploy`** → `azd up` — ship to the customer's Azure
5. **`threadlight-safe-check`** — the ship / no-ship completeness gate
6. **`foundry-evals` + `foundry-observability`** — prove it works, then watch it run

> **Use this** when you're running an **enterprise pilot** (FSI, Mfg, Retail, Telco, Healthcare) and want the fastest governed path from a vague brief to a demo-ready agent. *A Tier-1 European telco went from paragraph brief to a deployed, audit-grade agent in one working day.*

Two companion playbooks go deeper once you have an agent:

- **[Threadlight Customization](/playbooks/threadlight-customization)** — tailor the agent to the customer's process, industry, and operator surfaces (Teams cards, workspace UI, event channels).
- **[Threadlight Productionization](/playbooks/threadlight-productionization)** — the five guardrails the chain refuses to ship without, and the paved path to the AI Citadel landing zone.

### The chain at a glance

The chain flows in canonical order. Every skill after `threadlight-design` reads `specs/SPEC.md` as its input contract:

![The pilot chain — brief → design → local-test → deploy → safe-check gate → evals + observability, with optional steps that slot in anywhere.](./images/chain.svg)

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

> **Fast path — one prompt, full auto.** Name the skill and describe the agent you want in a single sentence; [`threadlight-auto`](https://github.com/aiappsgbb/threadlight-skills/tree/main/skills/threadlight-auto) drives the whole chain:
> ```text
> Use the threadlight-auto skill to build me an auto-claim triage agent for Contoso Mutual in my Azure sandbox.
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

**What you get:** a numbered, machine-checkable `specs/SPEC.md` plus the agent surface derived from it — the contract every later stage reads. **How:** prompt `threadlight-design` with the process, industry, and regulatory frame in a sentence or two. This is the only stage with no upstream dependency.

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

### How to get it — prompt for a design

Name the skill, then describe the process, the customer's industry, and the regulatory frame in a sentence or two. Add **"quick PoC"** (or "fast demo") to skip the stakeholder interview and go straight to artifacts; omit it for the full **stakeholder-review** mode that checkpoints after the interview.

```text
Use the threadlight-design skill to design an auto-claim triage process for a commercial P&C insurer. Quick PoC.
```

> Optionally pre-load a domain primer (e.g. `fsi-kyc-aml.md`) so the spec starts with the right entities, business rules, and vocabulary instead of generic placeholders.

---

### (Optional) Seed realistic demo data

If the process has `availability: mock` systems, generate synthetic data so every surface — mock MCP, workspace UI, eval dataset — reads the same canonical seed.

```text
Use the threadlight-demo-data-factory skill to generate synthetic demo data and Cosmos seed/reset scripts for this pilot's mock systems.
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

**What you get:** the designed PoC running entirely on your dev box — no `azd up`, no 20–30 min deploy round-trip — so tool, prompt, and UI edits reflect in seconds. **How:** prompt `threadlight-local-test` and pick the pattern that matches your iteration need.

---

### Boot the inner loop (Pattern 0 — Quickstart)

The default pattern boots a MAF Agent + SkillsProvider + JSON stub tools + a Streamlit UI on `localhost:8501`, with a **single** LLM dependency (a Foundry project *or* Azure OpenAI).

```text
Use the threadlight-local-test skill to run my pilot locally with the Streamlit quickstart — boot the agent, skills, and stub tools, no azd.
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

**What you get:** everything needed to run as a Microsoft Foundry Hosted Agent — runtime, `Dockerfile`, Bicep/AVM infra, telemetry wiring — generated from the spec. **How:** prompt `threadlight-deploy` to vendor the artefacts, then run **one command — `azd up`** — to provision and deploy.

---

### Generate the deployment artifacts

`threadlight-deploy` reads `specs/SPEC.md`, `AGENTS.md`, `src/agent/skills/`, and the § 11c selectors in `specs/manifest.json`, then vendors the runtime + infra:

```text
Use the threadlight-deploy skill to make this pilot deployable to Foundry — generate the container, Dockerfile, azd project, and infra, then azd up.
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

**What you get:** a ship / no-ship verdict (`gaps: []` or a named list of what's missing) that catches the silent failures `azd up` reports as success — placeholder images, dead cron jobs, empty App Insights, unreachable channels. **How:** prompt `threadlight-safe-check` at each lifecycle phase.

---

### How to get it — prompt the gate at each phase

One skill, three phases — name it in each prompt so the right gate runs. Prompt it after design, **before** `azd up`, and **after** `azd up`:

```text
Use the threadlight-safe-check skill to run the design-phase gate — does specs/manifest.json's deployment_manifest match every § 11c selector in the SPEC?

Use the threadlight-safe-check skill to run the pre-deploy gate before I azd up — is every `yes` selector wired in azure.yaml, infra/main.bicep, and a src Dockerfile, with no orphan modules?

Use the threadlight-safe-check skill to run the post-deploy gate — is every expected resource live, no placeholder images, no scheduled job failing its last 5 runs, all channels reachable?
```

Each run writes a manifest under `tests/` with a top-level `"gaps": []`. **Empty array = pass** (exit `0`); any gap is a hard stop (exit `1`).

> Under the hood each phase is `python -m threadlight.safe_check --phase <design|pre-deploy|post-deploy>` — but you drive it by prompting.

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

**What you get:** a runnable eval regression set scoring the deployed agent, plus live OpenTelemetry traces in App Insights — the proof a pilot works and the dashboard to watch it. **How:** prompt `foundry-evals`, then `foundry-observability` (both from `awesome-gbb`).

---

### Wire evaluation

Turn the spec's § 9 eval scenarios into a runnable regression set with [`foundry-evals`](https://github.com/aiappsgbb/awesome-gbb). The demo-data factory's canonical seed is what makes scores reproducible across runs.

```text
Use the foundry-evals skill to turn my SPEC § 9 eval scenarios into a runnable regression set, scored against the golden seed data.
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
