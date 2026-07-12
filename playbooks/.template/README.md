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
- The `lean-spec2cloud` Copilot plugin installed and updated.

```bash
copilot plugin marketplace add Azure-Samples/Spec2Cloud
copilot plugin install lean@Spec2Cloud
```

List every additional service permission, CLI, SDK, preview feature, device, or local dependency required by this playbook. Do not send readers to another playbook or to `playbooks/README.md` for prerequisite steps.

```bash
az account show                 # confirm the correct tenant and subscription
azd auth login --check-status   # confirm you are signed in to azd
copilot plugin list             # expect lean@Spec2Cloud
```

> **Heads up on cost.** This playbook provisions billable Azure resources.
> See [Clean up](#clean-up) to remove everything when you are done.

## Build

### Create a new project

Create or clone the workspace that will hold the generated solution.

```bash
mkdir example-agent
```

---

### Open GitHub Copilot

Open the project in the GitHub Copilot App, Copilot CLI, or VS Code. In the app, open the Spec2Cloud Cockpit and choose a run mode.

---

### Run the build loop

Use `/spec2cloud` for the golden end-to-end path. The command invokes Specify, Plan, Implement, Verify, and Deploy. Invoke `agentic-loop` naturally in the prompt; installation and repository details belong in setup instructions, not in the application prompt.

```text
/spec2cloud <complete application prompt>

Use the `agentic-loop` skill.
```

> To run one stage at a time, start with `/specify`, then use `/plan`, `/implement`, `/verify`, and `/deploy`.

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

> Tip: run the loop unattended for larger changes.

---

### Clean up

Tear down billable resources when finished. Run from the project root:

```bash
azd down --purge --force
```
