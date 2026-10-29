# Bring Your Own Skills

## Intro

### Graduate an existing skill into a governed agent.

Start with the skills that already work for your team. Install the **Foundry Agentic Loop plugin** for the build workflow and use `gh skill install` for your runtime domain skills, then build and verify the skill-backed application.

**Use when:** A proven local or GitHub-hosted `SKILL.md` needs enterprise identity, governance, runtime distribution, observability, evals, and repeatable deployment.

**Core tech stack:** GitHub Skills CLI, `foundry-agentic-loop`, GitHub Copilot SDK, Foundry Hosted Agents, Foundry Models, Foundry Skills API

The plugin's `foundry-agentic-loop` skill coordinates the build. Project skills are runtime domain instructions installed into `.agents/skills` with GitHub CLI, then published through the Foundry Skills API and consumed by the deployed agent. Do not install the legacy policy skill alongside the plugin for a new build.

The playbook is organized in three chapters:

- **Build** - install the build and runtime skills, then implement the first enterprise skill-backed app.
- **Run** - monitor SKILL usage, versions, tools, latency, failures, and eval outcomes.
- **Scale** - grow from one prototype to a governed SKILL catalog, multiple teams, and multiple frontends.

---

Personal agent surfaces are excellent for proving that a skill makes an assistant materially better. The enterprise question is how to let other users rely on that skill without turning a personal prototype into unmanaged production software.

The answer is an agentic backbone:

1. Preserve the SKILL content that already works.
2. Install it into the project with `gh skill install`.
3. Use `foundry-agentic-loop` to build the application and publish immutable **Foundry Skills** versions.
4. Download approved versions into writable runtime storage.
5. Add Entra identity, tool policy, telemetry, evals, promotion, and rollback.

### What we will build

You will create an application around the skills installed in `.agents/skills/`. The `foundry-agentic-loop` plugin coordinates the build. The selected user skills are published as immutable Foundry skill versions, promoted after evaluation, and downloaded into writable runtime storage for Copilot SDK sessions.

```mermaid
flowchart LR
  BuildPlugin[Foundry Agentic Loop plugin] --> Loop[Build workflow]
  UserRepo[User skill repo or local folder] --> CLI
  CLI --> Project[.agents/skills]
  Project --> Loop
  Loop --> Skills[Publish with Foundry Skills API]
  Skills --> Download[Download selected skill versions]
  Download --> SkillDir[Writable runtime skill directory]
  User[Enterprise user] --> Frontend[Chosen application frontend]
  Frontend --> App[Application backend or session API]
  App --> SDK[GitHub Copilot SDK agentic loop]
  SDK --> Agent[Foundry Hosted Agent]
  Agent --> Models[Foundry Models]
  Agent --> SkillDir
  Agent --> Tools[Approved APIs, MCP servers, connectors]
  Entra[Microsoft Entra ID + RBAC] --> Frontend
  Entra --> App
  Entra --> Agent
  Entra --> Tools
  Frontend --> Insights[Application Insights + OpenTelemetry]
  App --> Insights[Application Insights + OpenTelemetry]
  Agent --> Monitor[Foundry monitoring + evals]
  Monitor --> Gates[Skill/version release gates]
```

| Layer | Choice | Why |
|---|---|---|
| Build coordination | `foundry-agentic-loop` plugin | Bundles the skill, canvas and SDD workflow. |
| Project skills | `gh skill install` into `.agents/skills` | Installs the runtime skills, not the build plugin. |
| Skill lifecycle | Foundry Skills API | Gives versioned, immutable skill snapshots and `default_version` promotion. |
| Skill injection | Foundry Skills API download into writable runtime storage | Lets Copilot SDK load the governed copy through `skill_directories`. |
| Agentic loop | GitHub Copilot SDK | Default harness for long-running app loops, streaming, tools, and session integration. |
| Runtime | Foundry Hosted Agents using Responses by default | Moves the app to a governed runtime with identity, sessions, scaling, and observability. |
| Model backend | Foundry Models | Keeps model consumption measurable on the Foundry platform. |
| Frontend | Confirmed during Specify | Matches the application and users the supplied skills support. |
| Identity | Entra ID + managed identities + `DefaultAzureCredential` | Enables keyless workload access and enterprise authorization. |
| Observability | OpenTelemetry -> Application Insights + Foundry monitoring | Makes runtime health, SKILL usage, tool calls, and eval outcomes visible. |
| Infra | `azd init --minimal` + Bicep | Generates only the resources required by the selected application. |

**Done means:**

- The `foundry-agentic-loop` plugin is enabled and the selected user skills are installed with `gh skill install`.
- Approved user skills are published as immutable Foundry skill versions.
- Selected skill versions are downloaded from Foundry into writable runtime storage before the agent starts a session.
- The agent runs on Foundry Hosted Agents and uses Foundry Models.
- The deployed agent follows the selected user-provided skill instructions and tool boundaries.
- Skill usage, selected version, tool calls, errors, latency, token usage, and eval results are observable.
- A tested skill version can be promoted, pinned, or rolled back without rewriting the agent.

**Out of scope for the first pilot:**

- Rewriting the user's skill content unless validation finds enterprise-blocking issues.
- Treating SKILLs as a replacement for APIs, MCP servers, or enterprise connectors.
- Requiring private networking before the first pilot works end to end.
- Designing a new agent surface or agent scaffold; this playbook assumes the agentic-loop backbone owns that.

### Skill preflight checklist

Start by treating every personal SKILL prototype as unreviewed input. A valid enterprise candidate needs both technical validity and ownership/governance metadata.

| Area | Check |
|---|---|
| File shape | One skill per subdirectory; each skill has a `SKILL.md`; optional resources stay in the same skill folder. |
| Front matter | YAML front matter includes required unquoted `name` and `description`. |
| Name | Lowercase letters, numbers, and hyphens only; max 64 characters; stable across versions. |
| Description | Clear enough for routing and discovery; explains when the skill should be used. |
| Body | Contains useful Markdown instructions, constraints, examples, and resource references. |
| Ownership | Owner, maintainer contact, source repo/path, commit SHA, and lifecycle stage are known. |
| Compatibility | Lists compatible agent surfaces, expected model/runtime assumptions, and known limitations. |
| Allowed tools | Maps the skill to approved APIs, MCP servers, connectors, and RBAC scopes. |
| Data sensitivity | Classifies likely inputs/outputs and whether regulated or confidential data may appear. |
| Evals | Defines routing, instruction-adherence, tool-boundary, safety, regression, and user-acceptance evals. |
| Readiness | Records approval status, release notes, rollback path, and retirement path. |

> Tool boundary: a SKILL packages instructions and specialization. Approved APIs, MCP servers, and enterprise connectors perform actions. Do not let skill text imply hidden access to tools or data.

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

**Scenario-specific prerequisites:** Access to the repository or local directory containing your runtime skills and to `aiappsgbb/agentic-loop`. Verify `gh skill --help` and Bicep (`az bicep version`). Install the selected runtime domain skills separately; do not reinstall the bundled build skill. This build can provision Container Apps, Foundry/AI Services, Application Insights and optionally Container Registry. See [Clean up](#clean-up).

## Build

### Create a new project

Create a clean workspace and initialize a GitHub repository.

```pwsh
gh repo create my-skill-backed-agent --private --clone
cd my-skill-backed-agent
```

Prefer local only? This is fine for the first run:

```pwsh
mkdir my-skill-backed-agent
cd my-skill-backed-agent
git init
```

### Install your runtime skills

The build skill is already bundled in the plugin. Install only the runtime domain skills your application needs.

Install your skill from GitHub:

```pwsh
gh skill install OWNER/REPO SKILL_NAME --agent github-copilot --scope project
```

Pin it when reproducibility matters:

```pwsh
gh skill install OWNER/REPO SKILL_NAME --pin v1.2.0 --agent github-copilot --scope project
```

If the skill only exists locally:

```pwsh
gh skill install C:\path\to\skills-repo --from-local --agent github-copilot --scope project
```

`gh skill install` is in preview. Review the [GitHub CLI command](https://cli.github.com/manual/gh_skill_install) and [GitHub agent-skills guidance](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) for current behavior.

Before continuing, confirm the plugin is enabled and your runtime skills are installed:

```pwsh
gh skill list
Get-ChildItem .agents\skills -Recurse -Filter SKILL.md
git add .agents\skills
git commit -m "chore: add agent skills"
```

---

### Open GitHub Copilot

This playbook uses the **GitHub Copilot App** and its bundled Foundry Agentic Loop canvas; the workflow also runs in Copilot CLI.

> **Using the CLI instead?** Run `copilot --allow-all` only in a sandbox workspace, or omit the flag to approve each action.

**1. Add your project.** Choose **+ -> Add project from -> Local folder or repository**, then select `my-skill-backed-agent`.

**2. Open the bundled canvas.** In your project session, ask **open the agentic loop**. Choose **SDD** on Start and confirm the subscription. Planning is inside Specify; the other tabs are Build, Explore and Optimize. Rapid is an alternative for an existing project, with local verification before a separately approved deployment.


**3. Choose a model and mode.**

| Mode | Behavior |
|---|---|
| Interactive | Step-by-step collaboration; you confirm each stage |
| Plan | Plans first, executes once you approve |
| Autopilot | Automates work, but the SDD workflow still pauses at the spec and deployment approval gates |

---

### Run the build loop

Take the new workspace through **Specify -> Implement -> Verify -> Deploy** with one prompt.

> **Build versus run:** The starter prompt invokes the bundled `foundry-agentic-loop` skill. The installed project skills are the runtime domain skills deployed through the Foundry Skills API.

```text
Use the foundry-agentic-loop skill in SDD mode to build [describe the application, target users, and business outcome]. Use the user-provided project skills installed under .agents/skills as the application's runtime domain instructions. Ask me to confirm which installed skills the deployed agent should use, the frontend, and any required APIs or MCP tools before finalizing the specification.

Use the `foundry-agentic-loop` skill and `foundry-agentic-loop-workflow`. Require spec approval and always pause before `azd up`. Confirm billable changes, run RBAC and placement preflight before creating resources, and stop on BLOCKED or ERROR. Freeze the contract in Specify and prove the minimal hosted integration before parallel work. Keep Azure settings only in `.azure/deployment-plan.md`, respect the `AGENTS.md` mode lock, and preserve evidence, `.agentic-loop/runs/` flight records and `docs/LOOP.md` lessons.

Publish the selected installed user skills directly through the Foundry Skills API; do not build a separate skill-importer service. Create immutable versions, run routing, instruction-adherence, tool-boundary, safety, and scenario-specific evaluations against those exact versions, then promote passing versions to default_version. Before each Copilot SDK session, download the governed versions into writable runtime storage and configure skill_directories to those folders.

Build the confirmed frontend and a Foundry Hosted Agent using the GitHub Copilot SDK and Foundry Models. Use managed identity and DefaultAzureCredential. Trace skill name/version, routing, tool calls, instruction adherence, latency, errors, and evaluation lineage. Support pinning and rollback without rebuilding the agent image.
```

> `foundry-agentic-loop-workflow` runs the same four-phase SDD loop as Getting Started. The prompt explicitly invokes `foundry-agentic-loop`; the remaining requirements define skill installation, Foundry publication, runtime injection, evaluation, and promotion.

> For one phase or a range, ask Copilot to run `specify`, `implement`, `verify` or `deploy`; the workflow supports `from` and `to`. Planning is part of Specify. Each phase has fresh-context review and bounded fix rounds; a failed gate pauses with evidence. Ask to `resume` paused work instead of repeating completed steps.

Use these recommended answers if Copilot asks clarifying questions:

| Question area | Recommended answer |
|---|---|
| Application scenario | Use the user's app name, target users, workflow, and business outcome. |
| Skill input | One or more project skills installed with `gh skill install`. |
| Frontend | Select the surface the users need: web app, Teams app, Copilot extension, internal portal, or API. |
| Runtime | Foundry Hosted Agents using the Responses protocol by default. Add Invocations only for custom payloads or protocol bridging. |
| Harness | GitHub Copilot SDK by default. Use Microsoft Agent Framework only if orchestration or framework-specific skill providers are required. |
| Skill consumption | Use Foundry Skills API download/direct injection into the agent project's `skills/` directory. |
| Publication | Publish selected user skills directly through the Foundry Skills API; no custom importer service. |
| Authentication | Entra-backed users, managed identities, `DefaultAzureCredential`, and no shared secrets. |
| Networking | Public endpoints are acceptable for the first pilot; private networking is production hardening. |
| Sample data | Use real non-sensitive project inputs where available; otherwise create only the minimum fixtures needed for evals. |

When the skill finishes, review `docs/spec.md` for these must-have requirements:

- Foundry Skills version creation, download, `default_version` promotion, pinning, and rollback.
- Foundry Skills API download into writable runtime storage and Copilot SDK `skill_directories` configuration.
- Installed skill selection and source/version lineage.
- Entra identity, managed identity, RBAC, and no shared secrets.
- Tool-boundary policy per skill.
- Application Insights, Foundry monitoring, and eval gates.
- Skill name/version, routing, instruction-adherence, and tool-boundary telemetry.

Checkpoint before planning:

```pwsh
git --no-pager status --short
git --no-pager diff -- docs\spec.md
```

### Review the generated plan

Turn the spec into a reviewable implementation and deployment plan.

```text
Review the Specify artifacts and frozen implementation contract before implementation.
```

For this playbook, choose:

```text
Use minimal: azd init --minimal
```

Why minimal? This pattern combines GitHub Copilot SDK, Foundry Hosted Agents, Foundry Skills API publication/download, a user-selected frontend, and deploy-readiness checks. No separate ingestion service is required.

Use a convention-based environment name unless you have a customer naming standard:

```text
bring-your-own-skills-dev-eus2
```

Review:

- `docs/spec.md`
- `.azure/deployment-plan.md`

The deployment plan should include:

| Section | What good looks like |
|---|---|
| Resource graph | Foundry project, hosted agent, Foundry Models, Foundry Skills API, Application Insights, managed identity, selected frontend, and ACR if needed. |
| RBAC | Least-privilege roles for Foundry, telemetry, container registry, optional Key Vault, and approved tools. |
| Skill lifecycle | Validation, packaging, immutable versions, default promotion, production pinning, and rollback. |
| Consumption | Foundry Skills API download into writable runtime storage before Copilot SDK sessions start. |
| Evals | Routing, instruction adherence, allowed-tool boundaries, safety, regression, and user acceptance. |
| azd template | `minimal` / `azd init --minimal`. |

Protect the deployment plan while ignoring local azd state:

```gitignore
.azure/*
!.azure/README.md
!.azure/deployment-plan.md
```

Checkpoint before implementation:

```pwsh
git --no-pager status --short
git --no-pager diff -- docs\plan.md .azure\deployment-plan.md .gitignore
```

### Review the implementation

Generate the source and infrastructure from the plan.

```text
/implement
```

Expected generated artifacts:

```text
.
├── azure.yaml
├── infra/
│   ├── main.bicep
│   ├── main.parameters.json
│   └── modules/
├── src/
│   ├── frontend/                              # selected application frontend
│   ├── backend/                               # API/session adapter
│   ├── agent/                                 # existing agentic-loop scaffold; do not redesign
│   └── skills/                                # runtime download/bootstrap code
│       └── <skill-name>/
│           └── SKILL.md
├── .agents/
│   └── skills/                                # gh skill install output
│       └── <skill-name>/
│           └── SKILL.md
├── .agentignore
├── src/**/.dockerignore
└── docs/
    ├── spec.md
    ├── plan.md
    └── implementation.md
```

The implementation should wire:

1. **Project skills** - uses the skills already installed by `gh skill install`; do not add another ingestion layer.
2. **Foundry publication** - publishes selected user skills as immutable Foundry skill versions.
3. **Skill injection** - downloads selected versions to writable runtime storage and configures Copilot SDK `skill_directories`.
4. **Agentic app** - uses the existing agentic-loop scaffold with GitHub Copilot SDK, Foundry Hosted Agents, and Foundry Models.
5. **Tool policy** - maps each skill to only the APIs, MCP servers, or connectors it may use.
6. **Telemetry and evals** - records skill/version, routing, tool calls, errors, latency, tokens, and evaluation results.

Expected RBAC matrix:

| Principal | Scope | Role | Purpose |
|---|---|---|---|
| Deployer user/group | Resource group | Contributor | Provision resources with `azd`. |
| Deployer user/group | Resource group | User Access Administrator or RBAC delegation equivalent | Create role assignments. |
| Application UAMI / agent identity | Foundry project | Foundry User | Invoke project resources, hosted agents, skills, and models. |
| Project managed identity | Azure Container Registry | Repository Reader / AcrPull equivalent | Let Foundry pull hosted-agent container images when needed. |
| Deployment identity | Foundry project | Foundry User | Create, list, promote, and download skill versions during deployment. |
| Application UAMI | Application Insights | Monitoring Metrics Publisher | Emit telemetry where required. |
| Operators | Application Insights / Log Analytics | Monitoring Reader / Log Analytics Reader | View dashboards, logs, and eval evidence. |
| Application UAMI | Key Vault | Key Vault Secrets User | Only if Key Vault-backed config is unavoidable. |

#### Foundry Skills lifecycle

Use Foundry Skills as the production packaging boundary:

1. Validate the source `SKILL.md` and resources.
2. Create a new skill version from inline content or a ZIP package.
3. Store source repo, source path, commit SHA, content hash, owner, and approval evidence.
4. Treat each skill version as immutable.
5. Run evals against the exact version.
6. Promote the tested version to `default_version` for dev/test consumers.
7. Attach the promoted skill reference to the versioned agent toolbox.
8. Pin production apps to a known-good skill version when stability matters more than automatic default updates.
9. Roll back by repointing `default_version` or reverting the app's pinned version.

Foundry Skills are in preview. Opt in explicitly with `allow_preview=True`, and fail deployment rather than silently bypassing skill publication or download.

#### Deterministic skill injection

Use the Foundry Skills hosted-agent direct-injection pattern:

1. Create or update Foundry skill versions from each approved `SKILL.md`.
2. Select the version to use: follow `default_version` in dev/test or pin a specific version in production.
3. Download the selected skill content from the Foundry Skills API.
4. Extract it into a writable temporary runtime directory such as `<temp>/skills/<skill-name>/`; do not assume the hosted-agent image is writable.
5. Start the Copilot SDK session with that directory in `skill_directories`.
6. Emit the selected skill name, version, and content hash on the session trace.

Do not design a second skill-discovery surface for this playbook. Use the Foundry Skills API as the system of record, and use download/injection as the deterministic runtime path.

Before moving on:

```pwsh
git --no-pager status --short
git --no-pager diff --stat
git --no-pager diff -- azure.yaml infra src docs\implementation.md
```

Commit a useful checkpoint if the diff looks right:

```pwsh
git add .
git commit -m "feat: scaffold bring your own skills app"
```

### Verify locally

Validate locally against real Azure dependencies and the user-provided skills.

```text
/verify
```

Preflight checks:

```pwsh
gh --version
gh skill --help
gh skill list
copilot plugin list
az account show
azd version
bicep --version
git --no-pager status --short
git --no-pager diff --stat
```

If `bicep --version` is missing, confirm Azure CLI bundled Bicep before provisioning:

```pwsh
az bicep version
```

Skill validation and runtime verification:

| Test | Action | Expected result |
|---|---|---|
| CLI installation | Run `gh skill list`. | Agentic Loop and the selected user skills are present. |
| Foundry publication | Publish an installed user skill. | Foundry skill version has the expected name, body, source version, and content hash. |
| Invalid front matter | Remove required front matter or use an invalid name. | Import fails with actionable feedback. |
| Foundry download | Download the selected skill version from the Foundry Skills API. | The package extracts into a writable temporary skill directory. |
| Hosted-agent injection | Start a Copilot SDK session with `skill_directories`. | Agent follows the downloaded skill without requiring a new scaffold. |
| Instruction adherence | Run a representative scenario from the selected skill. | Agent follows the skill's constraints and response procedure. |
| Source lineage | Inspect the created Foundry version. | Metadata identifies the repository, commit, path, and content hash. |
| Tool boundary | Ask the skill to use an unapproved tool. | Agent refuses or selects an approved alternative. |
| Regression eval | Run evals against a new version. | Version is not promoted until gates pass. |
| Telemetry | Query Application Insights / Foundry monitoring. | Skill name/version, tool calls, latency, errors, tokens, and eval outcomes are visible. |

### Deploy

Deploy after local verification passes.

```text
/deploy
```

Deployment readiness checklist:

- [ ] Existing agentic-loop hosted-agent scaffold is present and intentionally reused.
- [ ] Existing hosted-agent deployment metadata remains valid for the target runtime.
- [ ] Hosted-agent dependencies use a focused `requirements.txt` when remote `uv.lock` resolution is risky.
- [ ] `.agentignore` excludes local dependency folders, build outputs, and files that should not be shipped.
- [ ] Each containerized service has a service-specific `.dockerignore`.
- [ ] Backend and frontend containers pass startup checks before cloud deployment.
- [ ] `/liveness` and `/readiness` return HTTP 200 where applicable.
- [ ] Shell entrypoints use LF line endings or are normalized during Docker build.
- [ ] Azure resource names meet service-specific limits, including Azure Container Apps' 32-character app-name limit.
- [ ] `azd` and the Foundry agent extension are current enough for hosted-agent deployment.
- [ ] Skill front matter validation passes for all imported skills.
- [ ] Foundry skill versions can be created, listed, downloaded, and promoted.
- [ ] Runtime downloads the governed skill to writable temporary storage and configures `skill_directories`.
- [ ] Every selected skill has a promoted `default_version`, toolbox reference where appropriate, and rollback target.
- [ ] Skill routing, allowed-tool, safety, and regression evals pass before `default_version` promotion.
- [ ] Application Insights receives app, agent, skill-loading, tool-call, and error telemetry.

After deployment, capture:

```pwsh
azd env get-values
azd show
git --no-pager status --short
```

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Skill import fails | Front matter or folder shape is invalid | Validate one `SKILL.md` per folder with a stable lowercase name and clear description. |
| Agent ignores the skill | The governed version was not downloaded before session start | Resolve the selected version and populate the configured skill directory first. |
| Skill can call an unapproved tool | Tool policy is not bound to the skill | Map each skill version to an explicit allowlist and default deny. |
| A new version regresses behavior | Promotion happened before evals | Keep versions immutable and promote only after routing, safety, and regression gates pass. |

---

## Run

### Run the skill-backed app

Open the deployed application and exercise representative tasks that should and should not select each imported skill. Confirm that the expected governed versions load, only approved tools run, and the agent follows each skill's instructions and constraints.

---

### Observe

Use telemetry to understand whether the SKILL-backed app is healthy, useful, and safe.

Track:

- Request count, latency, and failures by app route.
- Hosted-agent session readiness and errors.
- Selected skill name and version.
- Which Foundry skill version was downloaded into the agent project.
- Tool calls by skill and whether any calls were denied by policy.
- Token usage and model deployment capacity by skill/version.
- Foundry skill version promotion, rollback, and download events.
- Eval runs, failures, regressions, and promotion blockers.

Useful operations questions:

| Question | Signal |
|---|---|
| Which skills are actually used? | Request traces grouped by skill name/version. |
| Which version is active? | App config, `default_version`, and pinned-version telemetry. |
| Are users getting successful outcomes? | Success rate, latency, conversation outcome, and user feedback. |
| Are tool boundaries working? | Approved vs denied tool-call traces by skill. |
| Are evals regressing after changes? | Eval run trend and failed cases by version. |
| Are we overloading context? | Prompt token usage and number of full skill bodies loaded per session. |

### Evaluate

Create a small evaluation suite before broad rollout. Run it for every candidate skill version before promotion.

| Eval | Dataset shape | Pass condition |
|---|---|---|
| Skill routing | User task, expected skill or no-skill decision | Correct skill is selected, or no skill is selected. |
| Instruction adherence | Prompt, selected skill, expected constraints | Agent follows the SKILL instructions and preserves constraints. |
| Tool-boundary compliance | Prompt, selected skill, allowed tools | Agent uses only approved tools or refuses. |
| Safety / red-team | Prompt-injection and unsafe-action attempts | Tool policy and system constraints are not bypassed. |
| Groundedness, when required | Question, authorized evidence, expected answer | Claims are supported by the skill's approved evidence. |
| Safety boundary | Unsafe or unsupported task | Agent stops or escalates according to the skill. |
| Regression | Critical user journeys across old/new versions | New version does not regress required behavior. |
| User acceptance | Representative end-user tasks | Users can complete the target workflow with acceptable quality. |

Set gates before promotion:

- No critical safety or tool-boundary failures.
- Routing accuracy above the agreed threshold.
- No high-severity instruction-adherence regressions.
- Observability is complete enough to debug failures.
- The release owner approves `default_version` promotion or production pin update.

### Iterate

Safe iteration loop:

1. Create a new skill version; do not edit an existing immutable version.
2. Run validation and evals against the new version.
3. Download the selected version into writable runtime storage and configure `skill_directories`.
4. Compare telemetry and eval outcomes to the previous version.
5. Promote to `default_version` or update production pins only after gates pass.
6. Keep rollback instructions with the release evidence.

```pwsh
git --no-pager status --short
git --no-pager diff --stat
git add .
git commit -m "chore: promote bring your own skills version"
```

---

## Scale

### Grow the catalog

Start with one scenario and one owner. Add more SKILLs only after the baseline import, eval, and telemetry path works.

| Scaling axis | Recommendation |
|---|---|
| Multiple skills | Install additional skills with `gh skill install`; keep selection explicit and evaluation-backed. |
| Multiple teams | Require owner, lifecycle stage, allowed tools, eval suite, and support contact per skill. |
| Multiple versions | Pin production apps; let dev/test follow `default_version` where appropriate. |
| Multiple frontends | Reuse the same skill lifecycle and agent backbone for web, API, Teams, Copilot, and internal tools. |
| Multiple environments | Use separate azd environments, Foundry projects, pinned skill versions, and eval gates. |
| Retirement | Mark deprecated skills, remove them from selection, then retire after usage drops and owners approve. |

### Move to private networking

Private networking is a production hardening path, not the first pilot default. When required:

- Put app services and private resources behind the approved enterprise network boundary.
- Use managed identity and private endpoints for Azure services that support them.
- Validate Foundry Hosted Agents, Foundry Skills API download, telemetry, and approved tools under the chosen network model.
- Add private DNS and connectivity checks to `/verify` and `/deploy`.

### Promote across environments

Use separate azd environments:

```pwsh
azd env new skill-backed-agent-test-eus2
azd env new skill-backed-agent-prod-eus2
```

Promotion checklist:

- Separate Foundry projects or clearly separated project resources per environment.
- Explicit RBAC assignments per environment.
- Skill versions are pinned or promoted intentionally.
- Evals run before promotion.
- Telemetry dashboards exist before production rollout.
- Deployment plan reviewed and committed.

### Reuse and contribution

Promote reusable pieces when they stabilize:

- SKILL validation rules.
- Foundry skill publication and runtime-download helpers.
- Allowed-tool policy schema.
- Eval datasets and scoring prompts.
- Deploy-readiness checklist.
- Optional packaged/deploy-ready artifact for users who want to skip local scaffolding.
- Playbook improvements back to this repo.

---

### Clean up

When you are done experimenting, delete every Azure resource the loop created. Run this from the project root, where `azure.yaml` lives:

```bash
azd down --purge --force
```

`--purge` also removes soft-deleted resources so their names are immediately reusable.

---

### References

- [Use skills in Foundry](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills)
- [What are hosted agents?](https://learn.microsoft.com/azure/foundry/agents/concepts/hosted-agents)
- [Monitor agents with the Agent Monitoring Dashboard](https://learn.microsoft.com/azure/foundry/observability/how-to/how-to-monitor-agents-dashboard)
- [Assess your AI application with Foundry evaluations](https://learn.microsoft.com/azure/ai-foundry/concepts/evaluation-approach-gen-ai)
- [Agentic Loop & SKILLs reference architecture](../../README.md)
