---
name: agentic-loop
description: Post-processes the spec produced by specify by applying additional defaults (Foundry hosted agents, Microsoft Agent Framework or the GitHub Copilot SDK as the agent framework - both BYOK against Foundry models, the Copilot SDK for skills and integrated agent loops), selects the right Foundry models / regions / SKUs for the spec, and recommends the companion skills to install.
---

# Agentic Loop Skill

## Purpose

Encodes the inner development loop - Specify to Plan to Implement to Verify to Deploy - and the defaults (Foundry, Microsoft Agent Framework or the GitHub Copilot SDK as the agent framework, azd, Entra + keyless RBAC, OTel, Foundry Evals) that take a pilot from idea to a deployed, observable change in a dev environment, ready for the outer CI/CD loop.

## Defaults to apply (extends the included Spec2Cloud opinionated defaults)

When choices are unspecified, prefer:

- **Agent hosting** - Use Foundry **hosted agents** to implement AI agents. Proactively propose an agent-based design even when the user didn't explicitly ask for agents, if the use case involves reasoning over tools, multi-step workflows, data grounding, or external system calls.
- **Agent framework** - Build every agent with **Microsoft Agent Framework (MAF)** **or** the **GitHub Copilot SDK** - pick one framework per agent, don't combine them. Both run BYOK against Microsoft Foundry models and host on Foundry **hosted agents** (the Copilot SDK via the **invocations** protocol). Use **MAF** for basic agents (simple model calls, light tool use, no skills) and for graph/workflow orchestration. Use the **GitHub Copilot SDK** when the use case benefits from **agent skills** or the **integrated agent loop**.
- **Skills first** - When the design uses agent skills, **author them locally before implementing the agent, then publish them on Foundry**. Skills are governed artifacts the agent depends on: author each as `./skills/<skill-name>/SKILL.md` in the implement stage, then add a `postprovision` hook in `azure.yaml` that publishes each one with `azd ai skill create <skill-name> --file ./skills/<skill-name>/SKILL.md`.
- **Custom MCP servers** - When the design uses **custom MCP servers** (or other tools), govern them through Foundry **connections** instead of hardcoding endpoints in agent code or images. Add a `postprovision` hook in `azure.yaml` that registers each MCP server the agent uses as a connection with `azd ai connection create <mcp-server-name> --kind remote-tool --target <mcp-server-url> `.
- **Toolbox** - Bundle the published skills, MCP connections, and any connectionless tools (e.g. `web_search`, `file_search`) into one governed **toolbox** the agent consumes through a single MCP endpoint. Author `./src/tools.yaml` in the implement stage (see [`references/foundry-toolbox.md`](references/foundry-toolbox.md)), then add a `postprovision` hook in `azure.yaml` - **ordered after the skill and connection hooks**, since it references them by name - that runs `azd ai toolbox create <toolbox-name> --from-file ./src/tools.yaml`. The command writes the runtime endpoint to `TOOLBOX_<NORMALIZED_NAME>_MCP_ENDPOINT`; point the agent's tool discovery at it.
- **Foundry model** - Use `gpt-5.4-mini` as the default Foundry model for general-purpose agent and chat workloads unless the spec clearly requires stronger reasoning, embeddings, image/audio, document AI, or cost routing.
- **Evals** - Use **Foundry Evals** for model and agent quality, safety, and regression gates. Out of scope unless the user explicitly calls for evals; when in scope, wire them in from day one.
- **Guardrails** - Use **Foundry Guardrails** to reduce safety and security risks, so users can engage with AI apps and agents confidently. Adding custom guardrail controls is out of scope unless the user explicitly calls for custom guardrails.
- **Identity & keyless RBAC** - All service-to-service auth uses **managed identities + least-privilege RBAC**; never admin keys, connection strings, or shared secrets on the control/data plane. The generated infra (Bicep, owned by `azure-prepare` / `microsoft-foundry`) **must** create every role assignment in the [Keyless identity & RBAC contract](#keyless-identity--rbac-contract) below. Defer exact role IDs and assignment syntax to `azure-rbac`.
- **Observability** - Agent and app **telemetry is ON by default** with **end-to-end monitoring**: OpenTelemetry traces, logs, and metrics from the **backend, hosted agents, MCP servers, and Foundry models** are exported to **one Application Insights** resource from day one, so a single distributed trace follows a request from the browser through the backend, the agent loop, every tool/MCP call, and each model call. Capture the **full detail** - request data, prompts, completions, and tool arguments/results - by turning on content capture per layer (dev/test by default; gated and redacted in production). The generated infra must provision Application Insights, connect it to the Foundry project, and wire it per the [Observability contract](#observability-contract) below. Defer instrumentation detail to `appinsights-instrumentation`.

### Skills & tools (MCP) lifecycle across the loop

When the spec includes agent skills or MCP-server tools, orchestrate them across the loop stages on a single Foundry **toolbox** (a toolbox version carries both skills and tools). This file orchestrates; the **full Implement→Verify lifecycle** (author skills/MCP servers locally → `azd provision` → create/version skills, register MCP-server tools, attach to a toolbox, download skills back into `./skills`, wire the agent, verify discovery) and the toolbox mechanics (`azd ai toolbox create`, the `McpBridge`, the `CopilotClient` agent) live in [`references/foundry-toolbox.md`](references/foundry-toolbox.md#skills--tools-mcp-lifecycle-across-the-loop) and its reference agent [`references/copilot-sdk-with-toolbox.py`](references/copilot-sdk-with-toolbox.py). Defer MCP server authoring to `python-mcp-server-generator`, and MCP/tool routing governance to `azure-aigateway`.

The net effect: **both skills and MCP tools** stay versioned, auditable, and updatable without rebuilding the agent image — re-version on Foundry, promote the toolbox `default_version`, and the agent picks up the change on its next session.

## Greenfield readiness policy

`agentic-loop` owns defaults, decision policy, and generated contracts. It should make future `verify` and `deploy` runs smoother by declaring the right architecture and repository expectations before implementation starts.

### Agent Framework selection

**Two frameworks, pick one per agent** - build each agent with **either Microsoft Agent Framework (MAF)** or the **GitHub Copilot SDK** (BYOK Foundry models, invocations protocol). MAF covers basic agents and graph/workflow orchestration; the Copilot SDK covers skill-using agents and the integrated agent loop. Don't combine them in one agent.

| Agent shape | Build with | Companion skill(s) |
| --- | --- | --- |
| **Basic / orchestration agent** - simple model calls, light tool/function use, or graph/workflow orchestration; no agent skills | **MAF** | `microsoft-agent-framework` |
| **Skill-using / integrated-loop agent** - uses agent skills or the integrated agent loop | **GitHub Copilot SDK** | `copilot-sdk` |

Install `microsoft-agent-framework` for MAF agents and `copilot-sdk` for Copilot SDK agents. Document in `./docs/spec.md` or `./docs/plan.md` which framework each agent uses (MAF or Copilot SDK).

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

Propose additional Azure services only when the spec needs them — never turn every reference-architecture box into a default resource. The full area → "add when" → service → companion-skill map is in [`references/reference-architecture.md`](references/reference-architecture.md). The default greenfield baseline stays MAF or the GitHub Copilot SDK + Foundry hosted agent + Foundry model.

## Foundry Models Selector

Select the right Foundry models and regions for the spec, then set the `AZURE_LOCATION` and `AI_PROJECT_DEPLOYMENTS` azd environment variables. Defaults: model `gpt-5.4-mini`, region `eastus2` (fall back to `swedencentral` for EU data residency).

The full catalog lives in [`references/foundry-models.md`](references/foundry-models.md) — preferred models by task/modality, region availability, `azd env set` syntax, deployment entry format, selection workflow, and quick-start examples. Use it to pick a model, then run the `azd env set` commands.

For model deployment, provisioning, quota, and RBAC details, invoke or recommend `microsoft-foundry`.

## Install suggested skills

Match the current `./docs/spec.md` against the [skill catalog](references/skill-catalog.md) and suggest installing every skill whose trigger appears in the spec. `microsoft-foundry` is the default for every agentic-loop spec; install `microsoft-agent-framework` for MAF agents (basic agents, graph/workflow orchestration) and `copilot-sdk` for Copilot SDK agents (skill-using or integrated-loop). The **Copilot SDK skills default** (author each `./skills/<skill-name>/SKILL.md`, version on Foundry, attach to a toolbox, download into `./skills`) is owned by this skill — see [`references/foundry-toolbox.md`](references/foundry-toolbox.md).

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
