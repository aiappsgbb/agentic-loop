# Playbook Title: One-line subject

<!--
HOW THIS FILE RENDERS
- The page is a slide deck. Each `###` (H3) heading becomes one slide.
- Each `##` (H2) heading becomes a chapter in the progress rail.
- The `#` (H1) heading is the deck title only — it is not a slide.
- Text placed directly under a `#` or `##` heading (i.e. not under an `###`)
  is NOT shown. Put every piece of content inside an `### ` section.
- The first slide must be an `###` heading (see "Overview" below).
- Images live in ./images/ and are referenced as ./images/<file>; paths are
  rewritten automatically at render time.
- Use `---` between sections freely; it is stripped from slide bodies.
- Register the playbook in src/data/playbooks.json with a matching `slug`
  (must equal this folder's name).
-->

## Intro

### Overview

One paragraph on what this playbook teaches and the end state the reader reaches.

The playbook is organized in three chapters:

- **Build** — go from a prompt to a working prototype.
- **Run** — operate the deployed solution with telemetry enabled.
- **Scale** — evolve the running solution through the loop.

---

### What we will build

Describe the target solution in a sentence or two.

---

### Setup

What the reader needs before starting:

- Azure subscription with Contributor permissions, plus a GitHub Copilot plan.
- GitHub Copilot installed and logged in through the Copilot App, Copilot CLI, or VS Code.
- GitHub CLI (`gh`) installed and authenticated.
- Azure CLI (`az`) and Azure Developer CLI (`azd`) installed and authenticated.
- Git, Node.js, Python 3.13 and azd Foundry extensions.
- The **foundry-agentic-loop** plugin: in Copilot App use **Customize → Plugins → foundry-agentic-loop → Install**. It bundles the skill, canvas and SDD workflow.

> Install the [published Foundry Agentic Loop plugin](https://github.com/github/awesome-copilot/tree/main/plugins/foundry-agentic-loop). No separate lean plugin, policy-skill installation or Cockpit import is needed. If a bundled component is missing, Copilot asks before reinstalling the plugin. It never installs extensions from a URL or edits Copilot settings. Re-enable disabled extensions in your extension settings and continue in a new session. Without the canvas, continue in Chat; without the workflow, SDD cannot start. Switching to Rapid requires confirmation and an existing Foundry project.

Install the published plugin from Copilot CLI if preferred:

```bash
copilot plugin install foundry-agentic-loop@awesome-copilot
```

List every additional service permission, CLI, SDK, preview feature, device, or local dependency required by this playbook. Do not send readers to another playbook or to `playbooks/README.md` for prerequisite steps.

```bash
az account show                 # confirm the correct tenant and subscription
azd auth login --check-status   # confirm you are signed in to azd
copilot plugin list             # expect foundry-agentic-loop
```

> **Heads up on cost.** This playbook provisions billable Azure resources.
> See [Clean up](#clean-up) to remove everything when you are done.

## Build

### Create a new project

Create or clone the workspace that will hold the generated solution.

```bash
mkdir example-agent
cd example-agent
```

---

### Open GitHub Copilot

Open the project in GitHub Copilot App and ask **open the agentic loop**. Choose SDD on Start for a new project, or Rapid for an existing Foundry project. Confirm billable changes and any companion-skill installs separately.

---

### Run the build loop

Use the bundled `foundry-agentic-loop` skill. SDD runs Specify → Implement → Verify → Deploy; Specify includes planning. Each phase has independent review, bounded fixes and evidence gates. Require spec approval and separate deployment approval.

```text
Use the foundry-agentic-loop skill in SDD mode to <complete application prompt>

Use the `foundry-agentic-loop` skill and `foundry-agentic-loop-workflow`. Require spec approval and always pause before `azd up`. Confirm billable changes, run RBAC and placement preflight before creating resources, and stop on BLOCKED or ERROR. Freeze the contract in Specify and prove the minimal hosted integration before parallel work. Keep Azure settings only in `.azure/deployment-plan.md`, respect the `AGENTS.md` mode lock, and preserve evidence, `.agentic-loop/runs/` flight records and `docs/LOOP.md` lessons.
```

> For one phase or a range, ask Copilot to run `specify`, `implement`, `verify` or `deploy`, using the workflow's `from` and `to` options. Ask to `resume` paused work rather than repeating completed phases.

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Example failure | Explain the probable cause | Give a concrete recovery step |

## Run

### Run the solution

How to exercise the deployed solution and what to expect.

![Preview](./images/preview.png)

---

### Observe traces

How to read telemetry and debug a turn end to end.

## Scale

### Take it further

How to evolve the solution and push changes through the loop.

> Ask **improve the agentic loop** for measured, approval-required improvements from verified lessons and flight records. Never weaken the gates.

---

### Clean up

Tear down billable resources when finished. Run from the project root:

```bash
azd down --purge --force
```
