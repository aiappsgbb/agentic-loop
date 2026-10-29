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

<!-- shared-playbook-setup:start -->
**Shared prerequisites for every playbook**

- An Azure subscription with resource-creation, role-assignment and Foundry data-plane permissions. Preflight checks all required scopes before resources are created; subscription Owner alone does not grant every Foundry data-plane role.
- A GitHub Copilot plan and the [GitHub Copilot App](https://gh.io/app), installed and signed in. Use App Chat for the build; the [Copilot CLI](https://github.com/features/copilot/cli/) is an alternative execution environment.
- [GitHub CLI (`gh`)](https://cli.github.com/) v2.90.0+ with `gh skill` available, [Azure CLI (`az`)](https://learn.microsoft.com/cli/azure/install-azure-cli), [Azure Developer CLI (`azd`)](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd) with its Foundry extensions, Git, Node.js and Python 3.13. Approve missing-tool installations separately.

**Install once; reuse across playbooks.** In Copilot App, choose **Customize → Plugins**, find **foundry-agentic-loop**, then **Install**. The [published Foundry Agentic Loop plugin](https://github.com/github/awesome-copilot/tree/main/plugins/foundry-agentic-loop) bundles the build skill, canvas and SDD workflow. Do not separately install the bundled build skill, legacy policy skill, lean plugin or Cockpit.

Alternatively, install the plugin from Copilot CLI:

```bash
copilot plugin install foundry-agentic-loop@awesome-copilot
```

The **microsoft-foundry** companion skill is also required. Reuse an existing installation, including one supplied by the Azure plugin. Ask **open the agentic loop** in your project session; Copilot checks for the companion and asks before installing it if missing. For an approved manual installation, run this from your project folder, then reload skills or start a new session:

```bash
gh skill list
gh skill install microsoft/azure-skills microsoft-foundry --agent github-copilot --scope project
```

Run the install command only when the companion is missing. Build skills guide Copilot; runtime domain skills are separate and selected per playbook.

**Authenticate in the execution environment**, including when using a sandbox:

```bash
gh auth login
az login
azd auth login
```

Check the account, target subscription and tooling before building:

```bash
gh --version
gh auth status
gh skill list
az account show
azd version
azd auth login --check-status
```

**Open the bundled canvas.** Add your local folder or repository in Copilot App, start a project session and ask **open the agentic loop**. Check **Start** readiness and choose the intended mode. SDD starts from a subscription; Rapid requires an existing Foundry project. Alternative delivery playbooks such as Threadlight retain their own additional prerequisites and workflow. The canvas does not grant deployment permissions or replace Azure sign-in.

The screenshots show this portal's shared setup and project hand-off guidance, not proof that your local tools, plugin or Azure subscription are ready.

![Workshop environment checklist: plugin, companion skill and authentication guidance](../shared/images/environment-setup.png)

![Workshop project setup: add a project and open the bundled Agentic Loop canvas](../shared/images/project-setup.png)

> Important: If a bundled component is missing, Copilot asks before reinstalling the plugin. It never installs extensions from a URL or edits Copilot settings. Re-enable disabled extensions in your extension settings and continue in a new session. Without the canvas, continue in Chat; without the workflow, SDD cannot start. Switching to Rapid requires confirmation and an existing Foundry project.

> Warning: Builds can create billable Azure resources. Confirm the scope, target, model availability and cost before provisioning or deployment. Review each playbook's scenario-specific prerequisites and cleanup instructions; do not delete pre-existing resources.
<!-- shared-playbook-setup:end -->

**Scenario-specific prerequisites:** List required preview features, devices, approved data, permissions and additional skills here. Keep this separate from the shared setup block. Include the billable resources and link to [Clean up](#clean-up).

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
