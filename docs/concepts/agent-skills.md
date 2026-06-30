# Agent Skills and `SKILL.md` 🍳

Agent Skills are reusable capability packages for AI agents. Think of them as **cooking recipes**: the base agent is the cook, tools are the kitchen appliances, and a skill is the tested recipe card that tells the cook **when to use it, what steps to follow, which ingredients or references matter, and what good output looks like**.

The simplest skill is a folder with a `SKILL.md` file. That file contains YAML front matter for discovery plus Markdown instructions for execution. More advanced skills can include scripts, references, templates, assets, examples, evals, and governance metadata.

There are two useful categories:

- **Build skills** help builders create software and infrastructure.
- **Run skills** help hosted agents perform business work at runtime.

## The cooking recipe analogy 👨‍🍳

| Agent concept | Cooking analogy | What it means |
| --- | --- | --- |
| Agent | Cook | Decides what to do next based on the user's goal. |
| Skill | Recipe | Reusable instructions for a specific task or domain. |
| `name` and `description` | Recipe title and summary | Lets the cook quickly decide whether this recipe fits the meal. |
| `SKILL.md` body | Step-by-step method | The full guidance loaded only when the task needs it. |
| `scripts/` | Kitchen gadgets with buttons | Executable helpers the agent can run when appropriate. |
| `references/` | Cookbook appendix | Deeper details loaded only when needed. |
| `assets/` | Templates, forms, mise en place | Static resources the skill can reuse. |
| Tools / MCP | Oven, mixer, thermometer | External capabilities the agent can call; the skill explains how to use them well. |

This distinction matters: a **tool** gives the agent an action it can perform, while a **skill** gives the agent a repeatable way to perform a task well. A recipe can say "use the oven at 180 C"; it does not replace the oven.

## Standard `SKILL.md` shape 📦

The [Agent Skills specification](https://agentskills.io/specification) defines a skill as a directory containing at least `SKILL.md`:

    skill-name/
      SKILL.md
      scripts/
      references/
      assets/

The `SKILL.md` file has YAML front matter followed by Markdown:

    ---
    name: pdf-processing
    description: Extract PDF text, fill forms, and merge PDF files. Use when handling PDFs, forms, or document extraction.
    ---

    # PDF processing

    Follow these steps when the user asks for PDF extraction, form filling, or merging...

Key rules from the spec:

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Lowercase letters, numbers, and hyphens; max 64 chars; must match the parent folder name. |
| `description` | Yes | Max 1,024 chars; should say both **what** the skill does and **when** to use it. |
| `license` | No | License name or bundled license file reference. |
| `compatibility` | No | Runtime requirements such as intended agent, packages, or network access. |
| `metadata` | No | Extra key-value metadata for owners, versions, classifications, or registry fields. |
| `allowed-tools` | No | Experimental tool allow-list; support varies by agent implementation. |

## Progressive disclosure 🧠

Skills are designed to avoid loading an entire knowledge base into every prompt.

1. **Discover** - the agent sees lightweight metadata such as `name` and `description`.
2. **Activate** - when the user's task matches the description, the agent reads the full `SKILL.md`.
3. **Load resources** - scripts, reference files, and assets are pulled in only when needed.

This is why descriptions matter so much. A vague description like "Helps with PDFs" is like a recipe titled "Food"; the cook cannot reliably know when to use it. A good description names the concrete trigger terms and tasks.

## Build skills vs run skills 🧱

Not every skill belongs in the same place. Use **build skills** for engineering
work, and **run skills** for the agent's production business behavior.

| Type | Primary user | What it teaches | Where it lives | Example |
| --- | --- | --- | --- | --- |
| **Build skill** | Builder, developer, platform engineer | How to build, test, deploy, or operate a specific technology stack. | Developer environments such as `.github/skills/`, `.code/`, `.claude/`, `.opencode/`, or a local skill/plugin install. | `microsoft-foundry` from [microsoft/skills](https://github.com/microsoft/skills), which guides a coding agent through Foundry services, hosted agents, toolboxes, models, and deployment patterns. |
| **Run skill** | Hosted business agent | How to perform a business process, follow domain policy, find knowledge, and respond consistently. | Hosted agent runtime, for example a GitHub Copilot SDK agent deployed as a Foundry Hosted Agent and loading skills through Foundry Skills or Toolbox/MCP. | A retail-banking skill that explains how to block a credit card, where to find FAQs, when to escalate, and which customer-verification rules apply. |

In the cooking analogy, **build skills** are recipes for the kitchen builder:
how to install the oven, wire the mixer, and set up the restaurant workflow.
**Run skills** are recipes for service time: how to cook the dish, plate it,
and follow the restaurant's policy for allergies or substitutions.

### Build skills 🛠️

Build skills are usually technology-specific. They help coding agents in local
or cloud development environments produce correct implementation work.

Use build skills for:

- Azure, Microsoft Foundry, GitHub Copilot SDK, MCP, SDK, IaC, or framework guidance.
- Repeatable coding, migration, deployment, troubleshooting, and testing patterns.
- Developer onboarding into a stack that has many product-specific best practices.

They are often installed from repositories such as
[microsoft/skills](https://github.com/microsoft/skills) or
[github/awesome-copilot](https://github.com/github/awesome-copilot), then used
by builders through Copilot CLI, VS Code, Claude Code, Cursor, OpenCode, or
similar coding agents.

### Run skills 🏦

Run skills are domain- or industry-specific. They help the production agent
understand the business process it is executing for users.

Use run skills for:

- Business procedures such as blocking a credit card, handling a return, opening
  a support ticket, or triaging an insurance claim.
- Domain policies, escalation rules, customer-verification steps, tone, and
  compliance boundaries.
- Knowledge routing such as where FAQs live, which system owns a record, and
  when to use a specific tool or handoff.

Run skills should be versioned, reviewed, evaluated, and observed like production
behavior. In a Microsoft-first architecture, they are good candidates for
Foundry Skills, attached to a Foundry Toolbox, and consumed by a GitHub Copilot
SDK agent running as a Foundry Hosted Agent.

## Foundry Skills API 🏗️

[Microsoft Foundry Skills](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills) store `SKILL.md` content centrally for Foundry-connected agents. This is especially useful for **run skills** that need governed runtime distribution. The docs describe two consumption modes:

| Mode | How it works | Best fit |
| --- | --- | --- |
| **Attach to a toolbox** | Skills are attached to a Foundry Toolbox and exposed as MCP resources. Clients discover with `resources/list` and load with `resources/read`. | Agents that support MCP-style dynamic discovery. |
| **Direct download** | Download a skill version into a hosted or local agent project. | Deterministic deployments that need the exact skill bundled. |

Foundry Skills are versioned. Every update creates an immutable `SkillVersion`; the parent skill tracks `latest_version` and `default_version`. A toolbox can follow the default version or pin an exact version.

> [!WARNING]
> ⚠️ Foundry Skills are currently preview. Treat them as a strong operating
> model for Foundry-heavy agent architectures, but pin versions and keep a
> fallback path for strict production/SLA requirements.

## Lifecycle and governance 🔁

The local lifecycle guidance in [`SKILL-LIFECYCLE.md`](./SKILL-LIFECYCLE.md) recommends a Microsoft Foundry-first operating model for governed runtime skills:

    Git repo with SKILL.md
      -> PR review + validation + evals
      -> create immutable Foundry SkillVersion
      -> test an agent pinned to that version
      -> promote default version or update the agent pin
      -> observe skill usage in the hosted runtime

Practical lifecycle stages:

| Stage | What happens | Recipe analogy |
| --- | --- | --- |
| **Author** | Write the skill in Git with clear metadata, instructions, examples, and resources. | Draft the recipe card. |
| **Review** | Use PR review, ownership, data classification, allowed tools, and source provenance. | Have another chef check ingredients and safety. |
| **Validate** | Check front matter, folder/name match, references, scripts, and smoke/eval tests. | Cook the recipe in a test kitchen. |
| **Package** | Publish an immutable Foundry `SkillVersion` or bundle a pinned local copy. | Print a numbered recipe edition. |
| **Stage** | Test an agent pinned to the candidate version. | Serve it to a tasting panel. |
| **Promote** | Move `default_version` or update production pins intentionally. | Add the approved recipe to the restaurant menu. |
| **Operate** | Emit telemetry such as `skill.loaded`, `skill.activated`, version, agent, environment, and outcome. | Track which recipe was used and whether diners liked it. |
| **Deprecate / retire** | Mark old versions as deprecated, update pins, and keep rollback paths. | Retire outdated recipe cards without losing history. |

The key governance principle is: **Git remains the authoring source, Foundry Skills becomes the runtime registry for run skills**. Build skills can stay in developer tooling and repo-local folders. Production agents should not clone arbitrary public repos at runtime. Pin exact run-skill versions for production unless the agent owner explicitly accepts following `default_version`.

## What good skills contain ✅

Strong skills usually include:

- A precise `description` with trigger words.
- Step-by-step instructions for the common path.
- Examples of inputs and expected outputs.
- Edge cases and "do not do this" guidance.
- References split into smaller files instead of one giant `SKILL.md`.
- Scripts with clear errors and documented dependencies.
- Ownership, source repo/path/commit, support contact, allowed tools, and data classification when used in an enterprise environment.
- Evals or smoke tests that prove the skill improves behavior.

## Well-known skill repositories 🔗

| Repository | Why it is useful |
| --- | --- |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | Community collection of GitHub Copilot agents, instructions, skills, hooks, workflows, and plugins. |
| [microsoft/skills](https://github.com/microsoft/skills) | Microsoft skills, custom agents, AGENTS.md templates, and MCP configs for Azure SDKs and Microsoft Foundry. |
| [anthropics/skills](https://github.com/anthropics/skills) | Anthropic's Claude-oriented skill examples, templates, and document skills. |

## Source links 📚

- [Agent Skills overview](https://agentskills.io/home)
- [Agent Skills specification](https://agentskills.io/specification)
- [Agent Skills documentation index](https://agentskills.io/llms.txt)
- [Use skills in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills)
- [Local lifecycle guidance](./SKILL-LIFECYCLE.md)