---
name: agentic-loop
description: Post-processes the spec produced by specify by applying additional defaults (Foundry hosted agents, GitHub Copilot SDK + Foundry Skills API as the default agent pattern, toolbox MCP for tools and grounding, and Microsoft Agent Framework only when explicitly requested or clearly needed for graph/workflow orchestration), selects the right Foundry models / regions / SKUs for the spec, and recommends the companion skills to install.
---

# Agentic Loop Skill

## Purpose

Encodes the inner development loop - Specify to Plan to Implement to Verify to Deploy - and the defaults (Foundry, GitHub Copilot SDK + Foundry Skills API, toolbox MCP, azd, Entra + keyless RBAC, OTel, Foundry Evals) that take a pilot from idea to a deployed, observable change in a dev environment, ready for the outer CI/CD loop.

## Defaults to apply (extends the included Spec2Cloud opinionated defaults)

When choices are unspecified, prefer:

- **Agent hosting** - Use Foundry **hosted agents** to implement AI agents. Proactively propose an agent-based design even when the user didn't explicitly ask for agents, if the use case involves reasoning over tools, multi-step workflows, data grounding, or external system calls.
- **Agent framework** - Default to the **GitHub Copilot SDK** for hosted agents. It runs BYOK against Microsoft Foundry models through the **invocations** protocol, consumes Foundry Skills from the Skills API, and bridges the Foundry toolbox MCP endpoint for tools and grounding. Use **Microsoft Agent Framework (MAF)** only when the user explicitly asks for MAF or the task is clearly graph/workflow orchestration. Pick one framework per agent; do not combine them.
- **Skills first** - Treat **Foundry Skills API** skills as the default reusable behavior layer for agentic-loop specs. Author each skill as `./skills/<skill-name>/SKILL.md` in the implement stage, then add a `postprovision` hook in `azure.yaml` that publishes each one with `azd ai skill create <skill-name> --file ./skills/<skill-name>/SKILL.md`. The hosted agent image must not copy this folder; at runtime the Copilot SDK agent downloads the governed skill versions from Foundry into a temp directory.
- **Tools and grounding through toolbox MCP** - Govern custom MCP servers, Foundry IQ / CognitiveSearch grounding connections, A2A tools, and connectionless tools through Foundry **connections** and a single **toolbox**. Do not hardcode tool URLs, Search clients, or connection secrets in the agent runtime by default.
- **Toolbox** - Bundle the published skills, MCP connections, Foundry IQ grounding connection, and any connectionless tools (e.g. `web_search`, `file_search`) into one governed **toolbox** the agent consumes through a single MCP endpoint. Author `./src/tools.yaml` in the implement stage (see [`references/foundry-toolbox.md`](references/foundry-toolbox.md)), then add a `postprovision` hook in `azure.yaml` - **ordered after the skill and connection hooks**, since it references them by name - that runs `azd ai toolbox create <toolbox-name> --from-file ./src/tools.yaml`. The command writes the runtime endpoint to `TOOLBOX_<NORMALIZED_NAME>_MCP_ENDPOINT`; point the Copilot SDK agent's tool discovery at it.
- **Foundry model** - Use `gpt-5.4-mini` as the default Foundry model for general-purpose agent and chat workloads unless the spec clearly requires stronger reasoning, embeddings, image/audio, document AI, or cost routing.
- **Grounded retrieval (Foundry IQ)** - When the agent answers over enterprise/private knowledge, ground it through a **Foundry IQ** knowledge base exposed as a toolbox MCP tool (typically a brokered `CognitiveSearch` / Foundry IQ connection on the toolbox). Keep grounding caller-aware (ACL-filtered), cited, and deterministically refused when no authorized source supports the answer. Direct in-code Search / Foundry IQ retrieval is an escape hatch only; see [`references/foundry-iq-grounding.md`](references/foundry-iq-grounding.md).
- **Evals** - Use **Foundry Evals** for model and agent quality, safety, and regression gates. Out of scope unless the user explicitly calls for evals; when in scope, wire them in from day one.
- **Guardrails** - Use **Foundry Guardrails** to reduce safety and security risks, so users can engage with AI apps and agents confidently. Adding custom guardrail controls is out of scope unless the user explicitly calls for custom guardrails.
- **Identity & keyless RBAC** - All service-to-service auth uses **managed identities + least-privilege RBAC**; never admin keys, connection strings, or shared secrets on the control/data plane. The generated infra (Bicep, owned by `azure-prepare` / `microsoft-foundry`) **must** create every role assignment in the [Keyless identity & RBAC contract](#keyless-identity--rbac-contract) below. Defer exact role IDs and assignment syntax to `azure-rbac`.
- **Observability** - Agent and app **telemetry is ON by default** with **end-to-end monitoring**: OpenTelemetry traces, logs, and metrics from the **backend, hosted agents, MCP servers, and Foundry models** are exported to **one Application Insights** resource from day one, so a single distributed trace follows a request from the browser through the backend, the agent loop, every tool/MCP call, and each model call. Capture the **full detail** - request data, prompts, completions, and tool arguments/results - by turning on content capture per layer (dev/test by default; gated and redacted in production). The generated infra must provision Application Insights, connect it to the Foundry project, and wire it per the [Observability contract](#observability-contract) below. Defer instrumentation detail to `appinsights-instrumentation`.

### Skills & tools (MCP) lifecycle across the loop

When the spec includes agent skills, MCP-server tools, or Foundry IQ grounding, orchestrate them across the loop stages on a single Foundry **toolbox** (a toolbox version carries skills, tools, and grounding connections). This file orchestrates; the **full Implement→Verify lifecycle** (author skills/MCP servers locally → `azd provision` → create/version skills, register MCP-server tools and grounding connections, attach to a toolbox, download skills to a temp runtime directory, wire the agent, verify discovery) and the toolbox mechanics (`azd ai toolbox create`, the `McpBridge`, the `CopilotClient` agent) live in [`references/foundry-toolbox.md`](references/foundry-toolbox.md#skills--tools-mcp-lifecycle-across-the-loop) and its reference agent [`references/copilot-sdk-with-toolbox.py`](references/copilot-sdk-with-toolbox.py). Defer MCP server authoring to `python-mcp-server-generator`, and MCP/tool routing governance to `azure-aigateway`.

The net effect: **both skills and MCP tools** stay versioned, auditable, and updatable without rebuilding the agent image — re-version on Foundry, promote the toolbox `default_version`, and the agent picks up the change on its next session.

## Greenfield readiness policy

`agentic-loop` owns defaults, decision policy, and generated contracts. It should make future `verify` and `deploy` runs smoother by declaring the right architecture and repository expectations before implementation starts.

### Agent Framework selection

**Default to the GitHub Copilot SDK.** Build hosted agents with the **GitHub Copilot SDK** unless the user explicitly asks for MAF or the task is clearly graph/workflow orchestration. Both framework paths can run BYOK against Foundry models and host on Foundry hosted agents, but the Copilot SDK is the default because it consumes Foundry Skills API content and the toolbox MCP endpoint directly. Don't combine frameworks in one agent.

| Agent shape | Build with | Companion skill(s) |
| --- | --- | --- |
| **Default hosted agent** - unspecified framework, tools, grounding, skills, or integrated agent loop | **GitHub Copilot SDK** | `copilot-sdk` |
| **Graph/workflow orchestration agent** - user explicitly requests MAF, or the design is clearly a graph/workflow orchestrator | **MAF** | `microsoft-agent-framework` |

Install `copilot-sdk` by default for agentic-loop specs. Install `microsoft-agent-framework` only for explicit MAF or graph/workflow orchestration. Document in `./docs/spec.md` or `./docs/plan.md` which framework each agent uses (Copilot SDK default, or MAF with the trigger that justified it).

### Python dependency contract (`requirements.txt`)

When post-processing the spec, declare the hosted agent's Python dependencies so the generated `requirements.txt` (or `pyproject.toml`) is complete. The full conditional package list (auth, framework, hosted-agent runtime, toolbox, skill download, observability) — keyed to the choices already made and matching the reference agent's imports — lives in [`references/foundry-hosted-agent.md`](references/foundry-hosted-agent.md#python-dependency-contract-requirementstxt). Pin versions in the generated repo.

### Greenfield contract to declare

When post-processing a spec, explicitly add or confirm these contracts in the generated requirements/plan:

| Contract | Required guidance |
| --- | --- |
| **azd environment naming** | Suggest a convention-based name and let the user accept or override it. Example: `agentic-loop-weather-dev-eus2` from app name, stage, and region. |
| **Durable azd artifacts** | Keep `.azure/deployment-plan.md` as a durable repo artifact. If `.azure/` is ignored, prefer `.azure/*` plus `!.azure/deployment-plan.md`. |
| **Playbook artifact option** | When the user wants the fastest deploy path, offer a deploy-ready playbook artifact that can be downloaded and deployed without rebuilding from source. |

### Keyless identity & RBAC contract

Every component authenticates with a **managed identity** (user-assigned preferred) and **least-privilege RBAC** - no admin keys, no connection strings on the control/data plane. When post-processing the spec, declare the role assignments so the generated **Bicep creates them as part of provisioning**. The full principal → scope → role matrix (frontend/backend ACR pulls, backend → AI account, the Foundry project MI, hosted-agent runtime MIs for BYOK inference, the agent identity for tools, and telemetry publishers) and its notes live in [`references/rbac-contract.md`](references/rbac-contract.md). Defer exact role GUIDs and `Microsoft.Authorization/roleAssignments` syntax to `azure-rbac`.

### Observability contract

End-to-end monitoring is **on by default**: every tier - **backend, hosted agents, MCP servers, and Foundry models** - emits OpenTelemetry into **one Application Insights** resource (backed by Log Analytics) so a single distributed trace follows a request across the backend, the agent loop, every tool/MCP call, and each model call. The generated Bicep must provision it, inject `APPLICATIONINSIGHTS_CONNECTION_STRING` into every component (keyless, authenticated by each component's managed identity via **Monitoring Metrics Publisher**), and connect the same resource to the Foundry project so server-side agent/model traces land there too. The **baseline infra, per-tier instrumentation, agent observability (MAF vs Copilot SDK), and content-capture** detail lives in [`references/observability.md`](references/observability.md). Defer SDK/instrumentation wiring to `appinsights-instrumentation`.

When implementing a **GitHub Copilot SDK hosted agent**, wire in the `configure_otel()` setup from the reference agent [`references/copilot-sdk-with-toolbox.py`](references/copilot-sdk-with-toolbox.py) and call it once at startup (before the client/session is created). It reads `APPLICATIONINSIGHTS_CONNECTION_STRING` and emits conversation-turn spans, MCP tool input/output spans, and a `gen_ai.client.token.usage` token-consumption metric straight to Application Insights (no collector); it is a safe no-op when the connection string is unset (local dev). Pair it with `_copilot_telemetry()` from the same file to capture the Copilot CLI child process's gen_ai spans over OTLP.

### Reference architecture service map

Propose additional Azure services only when the spec needs them — never turn every reference-architecture box into a default resource. The full area → "add when" → service → companion-skill map is in [`references/reference-architecture.md`](references/reference-architecture.md). The default greenfield baseline stays GitHub Copilot SDK + Foundry Skills API + toolbox MCP + Foundry hosted agent + Foundry model.

## Foundry Models Selector

Select the right Foundry models and regions for the spec, then set the `AZURE_LOCATION` and `AI_PROJECT_DEPLOYMENTS` azd environment variables. Defaults: model `gpt-5.4-mini`, region `eastus2` (fall back to `swedencentral` for EU data residency).

The full catalog lives in [`references/foundry-models.md`](references/foundry-models.md) — preferred models by task/modality, region availability, `azd env set` syntax, deployment entry format, selection workflow, and quick-start examples. Use it to pick a model, then run the `azd env set` commands.

For model deployment, provisioning, quota, and RBAC details, invoke or recommend `microsoft-foundry`.

## Install suggested skills

Match the current `./docs/spec.md` against the [skill catalog](references/build-skills-catalog.md) and suggest installing every skill whose trigger appears in the spec. `microsoft-foundry` and `copilot-sdk` are the defaults for every agentic-loop spec; install `microsoft-agent-framework` only for explicit MAF or graph/workflow orchestration. The **Copilot SDK skills default** (author each `./skills/<skill-name>/SKILL.md`, version on Foundry, attach to a toolbox, download into a temp runtime directory) is owned by this skill — see [`references/foundry-toolbox.md`](references/foundry-toolbox.md).

Before installing, run a lightweight preflight:

```bash
gh --version
gh skills list
```

Require GitHub CLI `v2.90.0+`; upgrade if older. Use `gh skills` as the canonical command (not the Copilot CLI plugin command `copilot plugin install ...`). Treat `gh skills list` output as the source of truth for what is already present, and **never reinstall a skill that already appears there** - skip it and note that it is already installed.

### Propose and install

1. Run `gh skills list` first and record which catalog skills are already installed.
2. List each matching skill back to the user with the spec evidence that triggered it. Mark any skill already present from step 1 as **already installed** and exclude it from the install set.
3. For each remaining (not-yet-installed) skill, ask the user to **approve**, **modify**, or **reject**, and to pick **automatic** or **manual** install. When running in an unattended mode (e.g., the orchestrator), default to approve + automatic.
4. For automatic installs, run the command below only for skills missing from `gh skills list`:

   ```bash
   gh skills install <repository> <skill> --agent github-copilot --scope project
   ```

5. For manual installs, point the user at the repository's install instructions and move on.

### Reuse named run skills

When the prompt **explicitly names** a run-phase skill, reuse it instead of generating a new one. Match the named skill against the [run skills catalog](references/run-skills-catalog.md): if it is listed, install/download the existing skill into `./skills/<skill-name>/` as the repo authoring artifact rather than authoring a fresh `SKILL.md`, then create the versioned skill on the Foundry project and attach it to the agent's toolbox. The hosted agent still downloads the governed skill version into temp at runtime (the Copilot SDK skills default — see [`references/foundry-toolbox.md`](references/foundry-toolbox.md)). Only author a brand-new skill when the named skill is **not** in the catalog.
