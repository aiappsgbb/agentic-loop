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
- **GitHub Copilot SDK** as the execution harness for agents using runtime skills.
- **SKILLs** as reusable specialization packages for domain knowledge, instructions, tools, and workflows.
- **Microsoft Foundry Hosted Agents** as the governed runtime for secure and scalable execution.
- **Foundry Models** as the intelligence layer, connected to evaluation, optimization, and measurable consumption.
- **Foundry Skills and Toolboxes** to distribute versioned behavior, tools, and grounding without rebuilding the agent.
- **Azure** for identity, networking, data, integration, observability, governance, and deployment.

Agents run on Microsoft Foundry with a governed toolbox MCP endpoint. The new build plugin uses GitHub Copilot SDK for agents with runtime skills and Microsoft Agent Framework for basic agents and explicit workflows. A workflow that also needs skills requires clarification; keep one framework per agent.

## How the loop works

The Foundry Agentic Loop plugin offers two build modes:

| Mode | Start with | Outcome |
| --- | --- | --- |
| **Rapid prototyping** | An existing Foundry project | Build and verify locally from Chat; deploy separately after approval. |
| **Spec-driven development (SDD)** | A brief and an Azure subscription | Create a project and run **Specify → Implement → Verify → Deploy** with `azd`. |

SDD folds architecture planning and the frozen implementation contract into **Specify**. Each phase has a lead, an independent fresh-context reviewer and bounded fix rounds; only evidence passes the gate. Review the spec before implementation, and approve `azd up` separately. Durable flight records support journaled resume without repeating completed work.

The deployed solution then enters an outer production loop: observe, evaluate, learn, improve, and redeploy.

## Start a customer conversation

| Path | Use it when | Outcome |
| --- | --- | --- |
| **Start a technical workshop** (`/workshop`) | Bring a customer brief, optionally seeded from an industry example. | Review coverage, adapt maintained guidance, then confirm scope and copy the complete build prompt. |
| **Show an industry demo** (`/scenarios`) | Explore existing examples without setup. | Showcase available industry demos. |

The workshop recomposes the existing Agentic Launchpad. Old playbook/scenario routes and the home `#prompt` anchor remain usable. The library separates practice exercises, capability guides, delivery workflows, operations and shared infrastructure. A playbook is reusable guidance, not prerequisite homework.

The former Kratos reference demo and persona import flow have been retired. Its old portal URLs now show the standard not-found page; workshops, industry examples and library routes are unchanged. See [production hosting](infra/README.md) for the corresponding Front Door route retirement.

**Reuse first; build only what is missing.** Workshop preparation uses curated, deterministic rules entirely in your browser. Partial coverage preserves existing guides and surfaces gaps for manual decisions in scope notes. No packaged match is not technical infeasibility. Candidate patterns require review. Editing upstream inputs invalidates scope confirmation. Essential identity, safe data handling and scenario verification remain in every MVP; a generated or deployed workshop pilot is not production-ready.

## Use the hosted portal

Open the [production Agentic Loop portal](https://aka.ms/agentic-loop) and select **Start a technical workshop**. No repository clone, package installation or local development server is required. Preparation, guide matching, scope review and prompt assembly run entirely in your browser. There is no local AI companion, SDK runtime, analysis endpoint or Copilot sign-in requirement to prepare a workshop.

See [the workshop specification](docs/spec.md#47-client-side-customer-workshop-preparation) and [the workshop facilitator guide](docs/workshop-guide.md). The [original implementation plan](docs/customer-workshop-plan.md) is historical; its SDK preparation requirements have been superseded.

New customer workshops start with one of three randomly selected, editable sample briefs. Scenario links retain their own context. Workshop drafts are held only in browser memory. Navigation preserves them; refreshing starts a new sample draft. Preparation does not transmit customer text to a service or put it in browser storage. Copying the prompt is explicit; submitting it to Copilot happens separately in your project.

### Local development (portal contributors only)

These commands are optional and only needed when changing the portal's source code:

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/agentic-loop/workshop`. Development and production static hosting use the same client-side flow. Production deployments build static assets in GitHub Actions; they do not run a Vite development server.

## Use the build loop

The [Foundry Agentic Loop plugin](https://github.com/github/awesome-copilot/tree/main/plugins/foundry-agentic-loop) is available in the awesome-copilot marketplace. It replaces the separate lean/Spec2Cloud setup for new builds.

In **GitHub Copilot App → Customize → Plugins**, install **foundry-agentic-loop**. Or use the Copilot CLI:

```bash
copilot plugin install foundry-agentic-loop@awesome-copilot
```

The plugin bundles one build skill, the canvas and the SDD workflow. No separate policy-skill install or Cockpit import is needed. Open your workspace in GitHub Copilot App and ask:

```text
Open the agentic loop.
```

On **Start**, choose **Rapid** (existing project) or **SDD** (subscription), then shape an idea or select a prompt template and **Send to Chat**. The canvas also has **Build**, **Explore** and **Optimize** tabs. The portal's workshop prompt preserves your confirmed customer scope and chosen mode.

If a bundled component is missing, Copilot asks before reinstalling the plugin. It never installs extensions from a URL or edits Copilot settings. Re-enable disabled extensions in your extension settings and continue in a new session. Without the canvas, continue in Chat; without the workflow, SDD cannot start. Switching to Rapid requires confirmation and an existing Foundry project.

The first build records its mode and short-command routing in root `AGENTS.md`; all Azure settings stay in `.azure/deployment-plan.md`. Mode switches need confirmation. Verified lessons live in `docs/LOOP.md`, and SDD flight records in `.agentic-loop/runs/`. Ask **improve the agentic loop** for measured, evidence-backed skill/workflow changes, applied only after approval without weakening gates.

Both modes need Azure authentication, resource and role-assignment permissions, model capacity and approved data. They create billable resources only after confirmation. The portal prepares instructions; it does not execute builds or certify production readiness. Existing projects can retain the [legacy policy skill](skills/agentic-loop/SKILL.md); new prompts use `foundry-agentic-loop`.

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
