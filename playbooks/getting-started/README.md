# Getting started on the Agentic Loop: Weather Agent

## Intro

### Getting started playbook

This playbook walks you through building a simple **weather agent** with the **Foundry Agentic Loop plugin**. One plugin bundles the build skill, canvas and evidence-gated SDD workflow.

The playbook is organized in three chapters:

- **Build** — go from a basic prompt to a working prototype for the weather agent.
- **Run** — operate the deployed agent and full-stack app with telemetry enabled.
- **Scale** — evolve the running solution and push changes through the loop, optionally unattended.

---

### What we will build

A chat-style web app where the user talks to a Foundry **hosted agent**. The agent uses an MCP server that returns randomized weather data — enough to exercise the full tool-call round-trip without any external API — plus an agent skill managed through a Foundry toolbox.

![Weather agent architecture](./images/architecture.png)

| Layer            | Choice for this skill-using agent                                        |
|------------------|------------------------------------------------------------------------------|
| Frontend         | React + Vite on Azure Container Apps                                         |
| Backend API      | Python + FastAPI on Azure Container Apps                                     |
| Agent            | Copilot SDK hosted in Microsoft Foundry                  |
| Tool             | Python based MCP server (random data)          |
| Observability    | OpenTelemetry → Application Insights (wired via Foundry)                     |
| Infra            | `azd` + Bicep (Azure Verified Modules)                                       |

Artifacts produced in your workspace mirror the four SDD phases. Planning is part of Specify:

| Stage      | Artifact                                            |
|------------|-----------------------------------------------------|
| Specify    | `./docs/spec.md` (requirements, contract, workstreams), `./.azure/deployment-plan.md` |
| Implement  | `./docs/implementation.md`, `./src/`, provisioned Azure dependencies |
| Verify     | `./docs/verify.md`, local E2E tests and agent evaluations |
| Deploy     | Deployed Azure endpoint, `./docs/deploy.md`         |

The mode lock lives in root `AGENTS.md`. SDD flight records live in `.agentic-loop/runs/`, and verified lessons in `docs/LOOP.md`. Azure settings stay only in `.azure/deployment-plan.md`.

---

### Setup

You will need:

- Azure subscription with resource-creation, role-assignment and Foundry data-plane permissions, plus a GitHub Copilot plan. Preflight checks all required scopes before creating resources.
- [GitHub Copilot App](https://gh.io/app) installed and signed in with your Copilot-enabled GitHub account. Use the App as the build tool throughout this guide.
- [GitHub CLI (`gh`)](https://cli.github.com/) installed and logged in.
- [Azure CLI (`az`)](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and [Azure Developer CLI (`azd`)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd) installed and authenticated to your Azure subscription.
- Git, Node.js, Python 3.13 and the azd Foundry extensions. The canvas readiness check helps identify missing tools; approve installation separately.
- The `foundry-agentic-loop` plugin. In Copilot App, choose **Customize → Plugins**, find **foundry-agentic-loop**, then **Install**.

> Install the [published Foundry Agentic Loop plugin](https://github.com/github/awesome-copilot/tree/main/plugins/foundry-agentic-loop). No separate lean plugin, policy-skill installation or Cockpit import is needed. If a bundled component is missing, Copilot asks before reinstalling the plugin. It never installs extensions from a URL or edits Copilot settings. Re-enable disabled extensions in your extension settings and continue in a new session. Without the canvas, continue in Chat; without the workflow, SDD cannot start. Switching to Rapid requires confirmation and an existing Foundry project.

Alternatively, install the published plugin from Copilot CLI:

```bash
copilot plugin install foundry-agentic-loop@awesome-copilot
```

**Open the bundled canvas.** In your project session, ask **open the agentic loop**. No separate lean plugin, policy-skill install or Cockpit import is needed. The canvas does not grant deployment permissions or replace Azure sign-in.

Sign in to the supporting tools in the terminal of the environment where Copilot executes the build, including when using a sandbox. These commands are identical on Windows, macOS, and Linux:

```bash
gh auth login
az login
azd auth login
```

Check the correct account and subscription:

```bash
az account show       # confirm the correct tenant and subscription
azd auth login --check-status   # confirm you are signed in to azd
gh auth status       # confirm GitHub CLI authentication
```

> **Heads up on cost.** This playbook provisions billable Azure resources (Container Apps, a Foundry/AI Services account, and Application Insights). Leaving them running incurs charges — see [Clean up](#clean-up) to remove everything when you are done.

## Build

### Create a new project

Take an empty workspace through **Specify → Implement → Verify → Deploy** in SDD mode to produce a weather agent powered by a custom MCP server (random data) and runtime skills. For a quick local build in an existing Foundry project, choose Rapid instead; deployment remains separate and approved.

Create an empty folder to host the solution. A local folder gives the loop's artifacts (spec, plan, source, infra) a place to live.

```bash
mkdir weather-agent
cd weather-agent
```

> Want version control from minute one? Create a private GitHub repo
> instead:
> ```bash
> gh repo create weather-agent --private --clone
> cd weather-agent
> ```

The `foundry-agentic-loop` build skill comes with the plugin. It is not a run skill for the weather agent. It coordinates readiness, Foundry defaults and the chosen mode, and asks before installing the `microsoft-foundry` companion skill. Only add complementary services when the confirmed scope needs them.

---

### Open GitHub Copilot

Open **GitHub Copilot App**. The terminal commands above only prepare supporting tools and project files; the build prompt runs in App Chat. Review tool and deployment permissions before approving execution.

**1. Add your project.** Choose **+ → Add project from → Local folder or repository**, then select `weather-agent`.

**2. Open the agentic loop.** Ask this in Chat to open the bundled canvas. Its tabs are **Start**, **Build**, **Explore** and **Optimize**.

**3. Choose SDD on Start**, confirm your subscription, then use the prompt below. Rapid instead requires an existing Foundry project and produces a verified local app first. Copilot records the mode in `AGENTS.md`; switching modes needs confirmation.

---

### Run the build loop

Paste the following starter prompt:

```text
Use the foundry-agentic-loop skill in SDD mode to build a polished, modern weather app that provides weather information and forecasts through two interfaces: a visual SVG map of Europe or a chat interface. The app retrieves data from a custom MCP server, processes it through an integrated agent skill for specialized forecasting, and offers multiple forecasting styles—optimistic, pessimistic, and others—that users can select based on their preference. All features are fully functional except for the weather data, which is randomly generated for demonstration. The app includes a trace toggle that displays agent event information, such as the tools (input/output) and skills (skill.md content) used during forecasting.

Run the skill-owned read-only RBAC and placement preflight before creating resources. Report all permission gaps together and stop on BLOCKED or ERROR; do not grant permissions to bypass this gate. Confirm billable changes before making them.

Use foundry-agentic-loop-workflow: Specify → Implement → Verify → Deploy. Planning is part of Specify, not a separate Plan phase. Require spec approval and always pause before azd up. Respect any existing AGENTS.md mode lock; confirm a mode switch and keep Azure settings only in .azure/deployment-plan.md.

Freeze the implementation contract before parallel work and prove the minimal hosted integration first. Each SDD phase needs independent fresh-context review, evidence-based gates and bounded fix rounds. Preserve flight records in .agentic-loop/runs/ and verified lessons in docs/LOOP.md. Report missing bundled components and ask before reinstalling the plugin; never install extensions from a URL or edit Copilot settings. Ask the user to re-enable disabled extensions in their extension settings and start a new session. Without the canvas, continue in Chat; without the workflow, SDD cannot start. Offer Rapid only with user confirmation and an existing Foundry project.
```

![Run](./images/run.png)

> Tip: GitHub Copilot App supports voice dictation using a local modal to make it easier to write your prompts.

The **Build** tab shows progress and gates. A lead implements, an independent reviewer reruns checks, and bounded fix rounds either pass on evidence or pause for your decision. Spec approval and deployment approval are distinct. Execution time varies; do not treat a time estimate as a readiness guarantee.

For one phase or a range, ask Copilot to run `specify`, `implement`, `verify` or `deploy`; the workflow supports `from` and `to`. Ask to `resume` a paused run instead of repeating completed work. Deployment approval is tied to the spec, plan, verify report and Azure target; changed inputs require fresh approval.

After completion, use **Explore** and the verified endpoint to exercise the app. Open Foundry to inspect agents, models, toolboxes and traces.

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Canvas or workflow is missing | Bundled component unavailable | Ask before reinstalling the plugin; do not install extensions from a URL or edit Copilot settings |
| Canvas or workflow is disabled | An extension was disabled in an earlier session | Re-enable it and continue in a new session |
| Gate remains blocked | Evidence check failed or permissions are missing | Inspect all reported issues, fix and verify, then ask to resume; never weaken the gate |
| `azd` fails with an auth or subscription error | Wrong tenant or subscription selected | Run `azd auth login`, then `az account set --subscription <id>` |
| Deploy fails on quota or region | Model capacity unavailable in the chosen region | Reconcile the deployment plan with the placement check and request fresh approval before `deploy` |
| The agent replies but no traces appear | Looking too early | Spans take a few seconds to land in Application Insights — refresh the **Traces** view |

---

## Run

### Run the Agentic Loop

Open the weather frontend and send a few prompts (e.g. *"What's the weather in Madrid?"*). Each turn is part of a conversation with the hosted agent running on Foundry.

![App Preview](./images/preview.png)

> The picture above illustrates a previous run using the same prompt. Most likely you will get different results. To match a specific look and feel, paste a screenshot of an existing web site and ask Copilot to match it.

---

### Check the trace information

Copilot SDK emits events on which tools and skills it has used.

![App trace](./images/app-trace.png)

---

### Observe traces

OpenTelemetry into one Application Insights resource is part of the plugin's defaults. Verify correlated spans from the backend, agent, tools and model calls rather than assuming instrumentation succeeded. Keep sensitive content capture off unless approved with redaction and retention controls.

Use the canvas to open the hosted agent in the Foundry project, then click **Traces**. Inspect a trace to see exactly what the agent did on each turn — the model call, the `get_weather` tool invocation, and the response — end to end.

![Foundry Trace](./images/foundry-trace.png)

---

## Scale

### Take it further

You built, ran, and scaled a full-stack agent without hand-writing the spec, infrastructure, or glue code. From here:

- **Customize the agent** — change its instructions, add tools, or swap the model, then push the change through the loop.
- **Explore the other playbooks** — apply the same loop to richer, production-grade scenarios.

Ask **improve the agentic loop** to mine `docs/LOOP.md` and flight records for evidence-backed skill and workflow improvements. Changes are measured against the base commit and applied only after approval; approvals, RBAC, safety and evidence gates are never weakened.

---

### Clean up

Review the exact environment and subscription, then explicitly approve teardown before running this from the SDD project root, where `azure.yaml` lives:

```bash
azd down --purge --force
```

`--purge` also removes soft-deleted resources. Entra app registrations live outside the resource group: review the build-created registrations in `docs/implementation.md` and approve their removal separately. For Rapid, do not tear down the pre-existing Foundry project.
