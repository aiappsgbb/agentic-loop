# Agentic Loop

<p align="left">
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
3. **Implement** — build the agent, application, integrations, infrastructure, and reusable skills.
4. **Verify** — test behavior, safety, identity, deployment readiness, and scenario-specific quality.
5. **Deploy** — provision and release the solution to Azure with `azd`.

The deployed solution then enters an outer production loop: observe, evaluate, learn, improve, and redeploy.

## Start a customer conversation

| Path | Use it when | Outcome |
| --- | --- | --- |
| **Start a technical workshop** (`/workshop`) | Bring a customer brief, optionally seeded from an industry example. | Review coverage, adapt maintained guidance, then confirm scope and copy the complete build prompt. |
| **Show an industry demo** (`/scenarios`) | Explore existing examples without setup. | Showcase available industry demos; Kratos stays directly accessible. |

The workshop recomposes the existing Agentic Launchpad. Old playbook/scenario routes and the home `#prompt` anchor remain usable. The library separates practice exercises, capability guides, delivery workflows, operations and shared infrastructure. A playbook is reusable guidance, not prerequisite homework.

**Reuse first; build only what is missing.** Workshop preparation uses curated, deterministic rules entirely in your browser. Partial coverage preserves existing guides and surfaces gaps for manual decisions in scope notes. No packaged match is not technical infeasibility. Candidate patterns require review. Editing upstream inputs invalidates scope confirmation. Essential identity, safe data handling and scenario verification remain in every MVP; a generated or deployed workshop pilot is not production-ready.

## Run the portal

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/agentic-loop/workshop`. Preparation, guide matching, scope review and prompt assembly are client-side. There is no local AI companion, SDK runtime, analysis endpoint or Copilot sign-in requirement to prepare a workshop. Development and public static hosting use the same flow.

See [the workshop specification](docs/spec.md#47-client-side-customer-workshop-preparation) and [the workshop facilitator guide](docs/workshop-guide.md). The [original implementation plan](docs/customer-workshop-plan.md) is historical; its SDK preparation requirements have been superseded.

New customer workshops start with one of three randomly selected, editable sample briefs. Scenario links retain their own context. Workshop drafts are held only in browser memory. Navigation preserves them; refreshing starts a new sample draft. Preparation does not transmit customer text to a service or put it in browser storage. Copying the prompt is explicit; submitting it to Copilot happens separately in your project.

## Use the build loop

Install the Agentic Loop skill into the project you want GitHub Copilot to build:

```bash
gh skill install aiappsgbb/agentic-loop agentic-loop \
  --agent github-copilot \
  --scope project
```

Open that project in GitHub Copilot App or the CLI, describe the idea or business problem, and run:

```text
/spec2cloud
```

The workflow carries the solution through **Specify → Plan → Implement → Verify → Deploy**. The Agentic Loop skill applies the Microsoft Foundry and Azure production defaults, selects relevant companion skills, and keeps the generated architecture aligned with the requirements.

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
