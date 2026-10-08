# Getting started on the Agentic Loop: Weather Agent

## Intro

### Getting started playbook

This playbook walks you through building a simple **weather agent** end-to-end with the Agentic Loop. You drive the build loop from a single prompt, and the **agentic-loop** skill applies the proven recipe on top.

The playbook is organized in three chapters:

- **Build** — go from a basic prompt to a working prototype for the weather agent.
- **Run** — operate the deployed agent and full-stack app with telemetry enabled.
- **Scale** — evolve the running solution and push changes through the loop, optionally unattended.

---

### What we will build

A chat-style web app where the user talks to a Foundry **hosted agent**. The agent uses an MCP server that returns randomized weather data — enough to exercise the full tool-call round-trip without any external API — plus an agent skill managed through a Foundry toolbox.

![Weather agent architecture](./images/architecture.png)

| Layer            | Choice (from `agentic-loop` defaults)                                        |
|------------------|------------------------------------------------------------------------------|
| Frontend         | React + Vite on Azure Container Apps                                         |
| Backend API      | Python + FastAPI on Azure Container Apps                                     |
| Agent            | Copilot SDK hosted in Microsoft Foundry                  |
| Tool             | Python based MCP server (random data)          |
| Observability    | OpenTelemetry → Application Insights (wired via Foundry)                     |
| Infra            | `azd` + Bicep (Azure Verified Modules)                                       |

Artifacts produced in your workspace mirror the five build stages:

| Stage      | Artifact                                            |
|------------|-----------------------------------------------------|
| Specify    | `./docs/spec.md`, `.github/copilot-instructions.md` |
| Plan       | `./docs/plan.md`, `./.azure/deployment-plan.md`     |
| Implement  | `./docs/implement.md`, `./src/`, etc.               |
| Verify     | `./docs/verify.md`, provisioned Azure dependencies  |
| Deploy     | Deployed Azure endpoint, `./docs/deploy.md`         |

---

### Setup

You will need:

- Azure subscription with Contributor permissions, plus a GitHub Copilot plan.
- [GitHub Copilot App](https://gh.io/app) installed and signed in with your Copilot-enabled GitHub account. Use the App as the build tool throughout this guide.
- [GitHub CLI (`gh`)](https://cli.github.com/) installed and logged in.
- [Azure CLI (`az`)](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and [Azure Developer CLI (`azd`)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd) installed and authenticated to your Azure subscription.
- GitHub CLI `v2.90.0+` with the agent skills preview available (`gh skill --help`).
- The `lean-spec2cloud` Copilot plugin installed and updated. Click [here](https://github.com/copilot/app/launch?open=ghapp%3A%2F%2Fplugins%2Fmarketplace%2Fadd%3Fsource%3DAzure-Samples%2FSpec2Cloud)
to add the marketplace and [here](https://github.com/copilot/app/launch?open=ghapp%3A%2F%2Fplugins%2Finstall%3Fsource%3Dlean%2540Spec2Cloud) to install the plugin in the App. Confirm `lean@Spec2Cloud` is installed and enabled in the App's plugin settings.

Sign in to the supporting tools in your terminal before you go further. These commands are identical on Windows, macOS, and Linux:

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

Take an empty workspace through the **Specify → Plan → Implement → Verify → Deploy** loop and produce a running weather agent powered by a custom MCP server (random data) and agent skills.

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

Install the Agentic Loop skill into the project before opening Copilot. Project scope keeps the policy version explicit and prevents execution from depending on the nested copy inside `specify`.

```bash
gh skill install aiappsgbb/agentic-loop agentic-loop --agent github-copilot --scope project
gh skill list   # expect agentic-loop
```

The `agentic-loop` skill is the **build-time policy layer**, not a run skill for the weather agent. It translates the [reference architecture service map](../../skills/agentic-loop/references/reference-architecture.md) into specification and implementation decisions: Foundry hosted agents and models, Copilot SDK with governed Foundry skills and toolbox MCP, keyless identity, observability and `azd` deployment. The map adds complementary services only when the scope needs them, not every box in the architecture.

Check the installed source, version and pin state, and review available updates before relying on it:

```bash
gh skill list --json skillName,sourceURL,scope,version,pinned,path
gh skill update --dry-run
```

Installation is not invocation. The starter prompt below runs the readiness pre-flight before the build, then explicitly invokes the skill after Specify writes the spec and before Plan. Its decisions carry through the remaining stages. Do not depend on a nested copy inside `specify`.

---

### Open GitHub Copilot

Open **GitHub Copilot App**. The terminal commands above only prepare supporting tools and project files; the build prompt runs in App Chat. Review tool and deployment permissions before approving execution.

**1. Open the Spec2Cloud canvas** to watch the build loop execute. In the review panel on the right, click **+**, then pick **Spec2Cloud Cockpit** from the installed extensions. If it isn't listed, choose **Discover more → Import canvas from gist/URL → User scope**, then paste:

```text
https://github.com/Azure-Samples/Spec2Cloud/tree/main/.github/extensions/spec2cloud
```

The **Spec2Cloud** tab should appear now in the review panel. If doesn't appear automatically, click on **+** again and select **Spec2Cloud cockpit** from the Installed extensions.

**2. Add your project.** On the left, click **+ → Add project from → Local folder or repository**, then select the `weather-agent` folder you created.

**3. Choose a model and mode.** In the prompt box, pick a strong reasoning model (e.g. Claude Opus 4.8) and a run mode:

| Mode | Behavior |
|------|----------|
| Interactive | Step-by-step collaboration; you confirm each stage |
| Plan | Plans first, executes once you approve |
| Autopilot *(recommended)* | Runs the full loop end-to-end without interruption |

---

### Run the build loop

Paste the following starter prompt:

```text
/spec2cloud A polished, modern weather app that provides weather information and forecasts through two interfaces: a visual SVG map of Europe or a chat interface. The app retrieves data from a custom MCP server, processes it through an integrated agent skill for specialized forecasting, and offers multiple forecasting styles—optimistic, pessimistic, and others—that users can select based on their preference. All features are fully functional except for the weather data, which is randomly generated for demonstration. The app includes a trace toggle that displays agent event information, such as the tools (input/output) and skills (skill.md content) used during forecasting.

Run the skill-owned RBAC pre-flight before step 1. Report all permission gaps together and stop on BLOCKED or ERROR; do not create resources or grant permissions to bypass this gate.

Immediately after Specify writes ./docs/spec.md and before Plan starts, invoke the installed agentic-loop skill as the mandatory policy layer. Do not rely on Specify embedding or transitively referencing it. If the skill is missing or cannot be invoked, stop and report the blocker rather than continuing with generic defaults.

Apply the skill's defaults and implementation contracts to the concrete specification before planning, then carry them through Implement, Verify and Deploy. Record the invoked skill's path, the pre-flight verdict and the resulting architecture decisions in ./docs/spec.md, then carry those decisions into ./docs/plan.md. Installation alone is not evidence of invocation.
```

![Run](./images/run.png)

> Tip: GitHub Copilot App supports voice dictation using a local modal to make it easier to write your prompts.

> `/spec2cloud` runs the build loop; the explicitly invoked `agentic-loop` skill applies the architecture defaults and readiness gates. Review its recorded decisions in the spec and plan rather than assuming the command or plugin loaded the policy automatically.

> Tip: **Prefer to run the loop one stage at a time?** Use the same prompt with `/specify` first, then advance through each stage, reviewing the artifact it produces before moving on:
>
> | Command | Produces | Review in |
> |---------|----------|-----------|
> | `/specify <prompt>` | Specification | `docs/spec.md` |
> | `/plan` | Implementation + Azure deployment plan | `docs/plan.md`, `.azure/deployment-plan.md` |
> | `/implement` | azd template + source code | `src/`, `infra/`, `azure.yaml` |
> | `/verify` | Provisioned Foundry project; local smoke test | `docs/verify.md` |
> | `/deploy` | Full solution deployed to Azure | `docs/deploy.md` |

End-to-end execution time varies, but typically completes in under an hour.

When the loop finishes, Copilot returns the deployed frontend URL and the Spec2Cloud canvas auto-previews it. Clicking the **Deploy** stage opens the frontend URL (or `docs/deploy.md`).

On the canvas, click the **Azure** icon to see the deployed resources, and the **Foundry** icon to see the agents, models, and toolbox. Open the Foundry portal to review the models, agents, tools, and skills that were deployed.

![Canvas Foundry](./images/canvas-foundry.png)

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Copilot App's plugin settings don't show an enabled `lean@Spec2Cloud` | Plugin not installed or enabled | Use the App marketplace and plugin links in [Setup](#build-setup), then enable the plugin |
| `gh skill list` doesn't show `agentic-loop` | Required project skill not installed | Run the project-scoped install command in [Create a new project](#build-create-a-new-project) |
| The **Spec2Cloud** tab never appears | Canvas extension not imported | Re-import via **Discover more → Import canvas from gist/URL → User scope** with the URL above |
| `azd` fails with an auth or subscription error | Wrong tenant or subscription selected | Run `azd auth login`, then `az account set --subscription <id>` |
| Deploy fails on quota or region | Model capacity unavailable in the chosen region | Pick a region with capacity (or lower the requested capacity) and re-run `/deploy` |
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

Every span the agent emits already lands in Application Insights — that wiring is part of the `agentic-loop` defaults. The goal here is to **learn to read those traces** so you can debug an agent the way you'd debug a microservice.

Use the canvas to open the hosted agent in the Foundry project, then click **Traces**. Inspect a trace to see exactly what the agent did on each turn — the model call, the `get_weather` tool invocation, and the response — end to end.

![Foundry Trace](./images/foundry-trace.png)

---

## Scale

### Take it further

You built, ran, and scaled a full-stack agent without hand-writing the spec, infrastructure, or glue code. From here:

- **Customize the agent** — change its instructions, add tools, or swap the model, then push the change through the loop.
- **Explore the other playbooks** — apply the same loop to richer, production-grade scenarios.

> Tip: To run the loop fully unattended and scale to many more use cases, you can use the following command:
> ```bash
> copilot -p "/spec2cloud <your next big idea>" --no-ask-user --yolo -- autopilot
> ```

---

### Clean up

When you are done experimenting, delete every Azure resource the loop created so you stop incurring charges. Run this from the project root, where `azure.yaml` lives:

```bash
azd down --purge --force
```

`--purge` also removes soft-deleted resources (such as the Foundry/AI Services account and Key Vault) so their names are immediately reusable.
