# Agentic Loop

<p align="center">
  <a href="https://aka.ms/agentic-loop"><strong>✨ Explore the live Agentic Loop →</strong></a>
</p>

> From idea to enterprise-ready agentic solution on Azure.

**Agentic Loop helps teams close the gap between an idea and a production-ready agentic solution.** It gives Microsoft field teams and their customers a streamlined, repeatable way to turn business intent into agents that are built with GitHub Copilot and run securely on Microsoft Foundry and Azure.

An idea can be something entirely new, an existing business process that should work better, or a known problem that AI agents may be able to solve. Agentic Loop simplifies the path from that starting point to a specified, implemented, verified, deployed, and observable solution.

## Who this is for

Agentic Loop is designed for **Microsoft customer-facing field roles and the customers they support**.

- Microsoft field teams can use it to position the Microsoft agentic approach, shape customer conversations, demonstrate production patterns, and move from opportunity to implementation.
- Customers can use it with their Microsoft teams to translate a business idea or problem into an enterprise-ready agentic solution on Azure.
- Builders using coding agents such as GitHub Copilot, Claude Code, or Codex can use it to turn locally working prototypes into governed, observable, deployable solutions on Azure—not solutions that run only on one developer's laptop.
- Architects and engineers can use its opinionated playbooks, skills, and deployment workflow to avoid assembling every design decision from scratch.

## What this changes

Creating an agent demo that works locally is no longer the hard part. Coding agents have made pilots fast. The difficult work is translating an idea into a production system with the right architecture, tools, grounding, identity, governance, evaluation, observability, and deployment model.

Without a repeatable approach, agents either remain developer-led experiments that the business cannot evolve or spread through business-led experimentation faster than IT can govern.

That streamlining comes from standardizing on a **proven, repeatable, enterprise-ready reference architecture for Azure**. Instead of freezing the architecture into one rigid set of infrastructure-as-code templates that can become brittle and difficult to maintain, Agentic Loop expresses its architectural intent, production defaults, and guardrails through agent skills and maintained references. GitHub Copilot translates those instructions into scenario-appropriate application and infrastructure code, so implementations can evolve without losing architectural consistency.

Agentic Loop streamlines that translation. It turns customer intent and requirements into:

- a clear solution specification;
- recommended build and run skills;
- reusable implementation playbooks;
- an opinionated Microsoft Foundry and Azure architecture;
- working application, agent, tool, and infrastructure code;
- verification, safety, evaluation, and observability gates; and
- a repeatable deployment path ending in `azd up`.

The result is a simpler path from **idea → pilot → production**, with enterprise readiness built into the process rather than added afterward.

## The Microsoft agentic approach

Agentic Loop brings together:

- **GitHub Copilot** to specify, plan, implement, verify, and deploy the solution.
- **GitHub Copilot SDK** as the default execution harness for agentic loops.
- **SKILLs** as reusable specialization packages for domain knowledge, instructions, tools, and workflows.
- **Microsoft Foundry Hosted Agents** as the governed runtime for secure and scalable execution.
- **Foundry Models** as the intelligence layer, connected to evaluation, optimization, and measurable consumption.
- **Foundry Skills and Toolboxes** to distribute versioned behavior, tools, and grounding without rebuilding the agent.
- **Azure** for identity, networking, data, integration, observability, governance, and deployment.

The default pattern is a GitHub Copilot SDK agent hosted on Microsoft Foundry, using Foundry Skills and a governed toolbox MCP endpoint. Microsoft Agent Framework is used when a solution explicitly requires graph or workflow orchestration.

## How the loop works

The inner development loop is:

1. **Specify** — turn the idea, business process, or problem into explicit requirements.
2. **Plan** — select the architecture, models, tools, skills, grounding, and Azure services the scenario needs.
3. **Implement** — first prove a minimal deployed agent integration, then expand the application, orchestration, infrastructure, and reusable skills.
4. **Verify** — test behavior, safety, identity, deployment readiness, and scenario-specific quality.
5. **Deploy** — provision and release the solution to Azure with `azd`.

The deployed solution then enters an outer production loop: observe, evaluate, learn, improve, and redeploy.

## Three ways to start

| Path | Use it when | Outcome |
| --- | --- | --- |
| **Kratos** | You want to experience a production-shaped reference implementation first. | A ready-to-use demonstration of agents, personas, and task skills. |
| **Agentic Launchpad** | You already have an idea, process, or problem to solve. | A Copilot-ready package of requirements, skills, playbooks, architecture, and deployment guidance. |
| **Industry scenarios** | You want to begin with a proven vertical use case. | A scenario-seeded package that can be adapted to the customer's requirements. |

The Launchpad and industry-scenario paths converge on the same playbook-driven workflow. A **scenario** answers *what outcome are we building?* A **playbook** answers *how do we implement a reusable part of it?*

## Use the build loop

Install the Agentic Loop skill into the project you want GitHub Copilot to build:

```bash
gh skill install aiappsgbb/agentic-loop agentic-loop \
  --agent github-copilot \
  --scope project
```

Open that project in GitHub Copilot App or the CLI, describe the idea or business problem, and run:

```text
Use Agentic Loop to guide me through building a complete agentic solution.
```

The concise Agentic Loop skill coordinates architecture, an early hosted integration checkpoint, application implementation and local end-to-end testing using the separately installed Microsoft Foundry skill. Before building the full app, it proves the required skill, MCP tool and model request with the deployed agent identity, terminal completion and schema-valid output—not merely HTTP 200, a successful CLI exit or an active agent. It defaults to hosted agents, Python 3.13 and the Responses API, with React/FastAPI app services. Frontend/backend deployment to Azure requires a separate approval after local testing succeeds.

Focused references cover the [hosted integration checkpoint](skills/agentic-loop/references/hosted-integration-checkpoint.md) (actual principals, distinct endpoints, diagnostics and contract tests) and [Copilot SDK with Foundry](skills/agentic-loop/references/copilot-sdk-foundry.md) (versioned configuration, token refresh, request-scoped caller context, host/runtime telemetry and optional bundled dependencies when remote resolution fails). Telemetry is configured before the minimal deployment, and the checkpoint requires correlated hosting, model and required tool spans before expansion. An Application Insights connection or host-only trace is insufficient; any additional collector infrastructure still needs approval.

After the hosted checkpoint passes, the skill parallelizes independent implementation with coding subagents using a shared contract and non-overlapping file ownership. The coordinator integrates their work and verifies the complete solution; shared configuration, Azure mutations and deployment approvals remain coordinated.

The skill immediately persists the confirmed project's full ARM ID as `FOUNDRY_PROJECT` in root `.env` after validation, including after successful creation or a project change; it does not wait for the app build to finish. Existing unrelated settings are preserved.

After recording the verified `LOCAL_FRONTEND` in `.env`, the skill writes root `LOOP.md` with evidence-backed proposals to improve its instructions for future builds. Later builds revisit these lessons and record outcomes; installed skill changes still require an explicit request.

It also checks management-plane and data-plane permissions, reuses named runtime skills, defines shared interfaces in the solution README, and verifies correlated Application Insights traces with sensitive content capture off by default. Placement, SDK compatibility and private-knowledge grounding checks apply only when relevant.

### Agentic Loop plugin and canvas

The [Agentic Loop plugin](plugins/agentic-loop/README.md) packages the concise skill and a five-tab canvas: **Setup, Resources, Build, Explore, and Optimize**. Check prerequisites, choose a Foundry project, start from an illustrated industry scenario, explore deployed resources, and improve agents through project-aware Chat prompts for Foundry Agent Optimizer, automatic evaluations and Insights scans. Optimize also retains session usage and actual Azure costs.

It requires the separately installed [Microsoft Foundry skill](https://github.com/microsoft/azure-skills/tree/main/skills/microsoft-foundry). The existing Foundry canvas is reused through its public APIs for management and testing. Run `npm run plugin:build` to create a self-contained local plugin in `dist/plugin/agentic-loop/`; see the plugin README for installation, permissions, limitations and Awesome Copilot contribution steps. The plugin is not yet published to a marketplace.

## Guiding outcomes

1. **Pilot to production, repeatably.** Every artifact should shorten the path to a governed, observable, evaluated production agent.
2. **Microsoft Foundry adoption.** Hosted agents, models, skills, tools, evaluation, and observability form one coherent production platform.
3. **Reusable field execution.** Customer learning becomes reusable scenarios, playbooks, skills, reference implementations, and improvements to the loop.

## Sources

- [Skills support in Microsoft Foundry Agents](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills)
- [Microsoft Foundry Agent Service overview](https://learn.microsoft.com/azure/foundry/agents/overview)
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [Azure Developer CLI](https://learn.microsoft.com/azure/developer/azure-developer-cli/)

## License

See [LICENSE](LICENSE).
