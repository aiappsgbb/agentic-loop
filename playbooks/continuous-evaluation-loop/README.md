# Continuous Evaluation Loop: Retail Support Agent

## Intro

### Improve a fictional retail support agent from production evidence.

This playbook builds **ResolveRight**, a fictional customer-support agent for Contoso Outfitters. It answers questions about mock orders, returns, warranties, and damaged shipments, then turns representative production traces into regression cases and evidence-backed improvement pull requests.

**Use when:** You need to catch regressions in production and close the improvement loop automatically.

**Core tech stack:** Copilot SDK, Foundry Hosted Agents, Foundry Skills API, Foundry Evaluations, Application Insights

The agent consumes a `support-resolution` skill containing issue classification, evidence requirements, response structure, escalation rules, and tool boundaries. Every evaluation result is tied to an immutable Foundry skill version so the team can promote, compare, or roll back the behavior that produced each score.

The playbook is organized in three chapters:

- **Build** — go from a prompt to an agent with offline scoring and eval gates.
- **Run** — capture production traces, build regression sets, and score continuously.
- **Scale** — automate improvement PRs and expand coverage through the loop.

---

### What we will build

A retail support chat backed by synthetic orders, return policies, warranty rules, and resolved tickets. The Copilot SDK agent downloads the promoted `support-resolution` skill at runtime and emits OpenTelemetry traces containing its version. Traces are curated into a regression dataset, scored with Foundry Evaluations, and regressions open a human-reviewed PR with the proposed skill or agent change and before/after results.

```mermaid
flowchart LR
  User[User turns] --> Agent[Foundry Hosted Agent]
  Agent --> Skill[support-resolution skill]
  Skill --> SkillsAPI[Foundry Skills API]
  Agent --> Model[Foundry Model]
  Agent --> Traces[OTel traces]
  Traces --> Insights[Application Insights]
  Insights --> Mine[Trace mining / curation]
  Mine --> Regset[(Regression dataset)]
  Regset --> Evals[Foundry Evaluations]
  Evals --> Scores[Scores + regressions]
  Scores -->|regression| PR[Improvement PR:<br/>proposed fix + eval results]
  Scores -->|pass| Gate[Promotion gate]
  PR --> Review[Human review]
  Review --> Agent
```

| Layer | Choice for this scenario | Why |
|---|---|---|
| Frontend | React + Vite on Azure Container Apps | Surface to generate real turns and traces. |
| Backend API | Python + FastAPI on Azure Container Apps | Hosts the agent session and trace export. |
| Agent | Copilot SDK hosted in Microsoft Foundry | Governed runtime with per-turn tracing. |
| Runtime skill | Foundry Skills API | Versions and distributes `support-resolution`; provides evaluation lineage. |
| Model | Foundry Models | Keeps model usage and capacity on the Foundry platform. |
| Evaluation | Foundry Evaluations (offline + scheduled) | Scores groundedness, quality, safety, and regressions. |
| Trace store | OpenTelemetry → Application Insights | Source of truth for production behavior and regression mining. |
| Improvement loop | Copilot-authored PRs | Proposes fixes with evidence, gated by human review. |
| Infra | `azd` + Bicep (Azure Verified Modules) | Reproducible provisioning with keyless identity. |

**Done means:**

- Offline evals score the agent on a curated dataset before deploy.
- Production turns emit traces that land in Application Insights.
- Traces are curated into a regression dataset.
- Scheduled scoring catches regressions against a baseline.
- Every score and trace identifies the effective `support-resolution` version.
- A regression opens an improvement PR with proposed changes and eval results.

**Out of scope for the first build:**

- Fully autonomous merge — improvement PRs stay human-reviewed at first.
- Every possible metric — start with a focused scorecard and expand.
- Private networking — a production hardening step.

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

**Scenario-specific prerequisites:** Approved sample traces, a representative regression dataset and supported evaluation/judge model access. Review trace redaction and evaluation costs before a run. See [Clean up](#clean-up).

## Build

### Create a new project

Take an empty workspace through the **Specify → Implement → Verify → Deploy** loop and produce an agent with offline scoring and eval gates.

```bash
mkdir continuous-evaluation-loop
cd continuous-evaluation-loop
```

> Want version control from minute one? Create a private GitHub repo instead:
> ```bash
> gh repo create continuous-evaluation-loop --private --clone
> ```
> A repo is recommended for this playbook so the improvement loop can open PRs.

---

### Open GitHub Copilot

This playbook uses the **GitHub Copilot App** and its bundled Foundry Agentic Loop canvas; the workflow also runs in Copilot CLI.

> **Using the CLI instead?** Run `copilot --allow-all` only in a sandbox workspace, or omit the flag to approve each action.

**1. Add your project.** Choose **+ -> Add project from -> Local folder or repository**, then select `continuous-evaluation-loop`.

**2. Open the bundled canvas.** In your project session, ask **open the agentic loop**. Choose **SDD** on Start and confirm the subscription. Planning is inside Specify; the other tabs are Build, Explore and Optimize. Rapid is an alternative for an existing project, with local verification before a separately approved deployment.


**3. Choose a model and mode.**

| Mode | Behavior |
|---|---|
| Interactive | Step-by-step collaboration; you confirm each stage |
| Plan | Plans first, executes once you approve |
| Autopilot | Automates work, but the SDD workflow still pauses at the spec and deployment approval gates |

---

### Run the build loop

Paste this starter prompt:

```text
Use the foundry-agentic-loop skill in SDD mode to build ResolveRight, a customer-support resolution agent for the fictional retailer Contoso Outfitters. Customers ask about synthetic orders, returns, warranties, and damaged shipments. The agent must classify the issue, gather the evidence required by mock policy, give the allowed next step, and escalate exceptions rather than inventing resolutions.

Use the `foundry-agentic-loop` skill and `foundry-agentic-loop-workflow`. Require spec approval and always pause before `azd up`. Confirm billable changes, run RBAC and placement preflight before creating resources, and stop on BLOCKED or ERROR. Freeze the contract in Specify and prove the minimal hosted integration before parallel work. Keep Azure settings only in `.azure/deployment-plan.md`, respect the `AGENTS.md` mode lock, and preserve evidence, `.agentic-loop/runs/` flight records and `docs/LOOP.md` lessons.

Create a realistic mock corpus under data/contoso-support with order records, return and warranty policies, product facts, resolved-ticket examples, edge cases, and a labeled offline evaluation set. Author skills/support-resolution/SKILL.md with issue taxonomy, evidence checklist, response format, escalation rules, and tool boundaries.

Create an immutable support-resolution version through the Foundry Skills API, evaluate that exact version, promote it to default_version only when gates pass, attach it to the versioned agent toolbox, and download it into a writable runtime directory before each Copilot SDK session. Configure skill_directories to the downloaded folder. Record skill name/version in traces, evaluation datasets, baselines, and improvement PRs so regressions can be attributed and rolled back.

Emit OpenTelemetry traces to Application Insights. Include offline Foundry Evaluations that gate deploys, mine approved traces into a regression dataset, score it on a schedule against a committed baseline, and open a human-reviewed improvement PR when a regression is detected. The PR must contain affected cases, current and candidate skill versions, proposed changes, and fresh before/after results.
```

> Foundry Skills are a preview capability. Opt in explicitly (for example, `allow_preview=True`) and fail visibly if publication, promotion, or runtime download does not succeed.

> `foundry-agentic-loop-workflow` runs the same four-phase SDD loop as Getting Started. The prompt explicitly invokes `foundry-agentic-loop`; the remaining requirements define this playbook's datasets, scorecards, trace mining, regression gates, and improvement PRs.

> For one phase or a range, ask Copilot to run `specify`, `implement`, `verify` or `deploy`; the workflow supports `from` and `to`. Planning is part of Specify. Each phase has fresh-context review and bounded fix rounds; a failed gate pauses with evidence. Ask to `resume` paused work instead of repeating completed steps.

Use these recommended answers if Copilot asks clarifying questions:

| Question area | Recommended answer |
|---|---|
| Metrics | Start with groundedness, relevance/quality, and safety. |
| Offline gate | Evals must pass before deploy. |
| Regression source | Mine production traces from Application Insights. |
| Scoring cadence | Scheduled scoring against a committed baseline. |
| Improvement action | Open a human-reviewed PR with the proposed fix and eval results. |
| Runtime skill | `support-resolution`, with score and trace lineage by Foundry skill version. |
| Identity | Managed identity, keyless RBAC. |

When the skill finishes, review `docs/spec.md` for these must-have requirements: mock retail support corpus, offline eval gate, Foundry skill versioning/promotion/download, runtime skill consumption, skill-version trace lineage, regression curation, scheduled scoring, baseline comparison, and automated improvement PRs.

---

### Review the generated plan

Turn the spec into a reviewable implementation and deployment plan.

```text
Review the Specify artifacts and frozen implementation contract before implementation.
```

The deployment plan should include:

| Section | What good looks like |
|---|---|
| Resource graph | Foundry project, hosted agent, model deployment, versioned toolbox, governed skill, Application Insights, managed identity, ACA apps, scheduled runner. |
| RBAC | Least-privilege roles for Foundry, Application Insights read, and telemetry. |
| Eval scorecard | Metrics, datasets, and pass thresholds for offline and scheduled runs. |
| Regression pipeline | Trace query, curation, dataset storage, and baseline comparison. |
| Improvement loop | PR creation trigger, contents, and human-review gate. |
| Skill lifecycle | Author, create, evaluate, promote, attach, download, consume, trace, and roll back `support-resolution`. |
| azd template | `minimal` / `azd init --minimal`. |

Review `docs/spec.md` and `.azure/deployment-plan.md` before continuing.

---

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
├── src/
│   ├── frontend/                 # chat UI
│   ├── backend/                  # agent session + trace export
│   └── agents/
│       └── evaluated-agent/      # hosted-agent definition
├── skills/
│   └── support-resolution/
│       └── SKILL.md
├── data/
│   └── contoso-support/          # mock orders, policies, tickets, labels
├── evals/
│   ├── offline/                  # curated pre-deploy dataset + scorecard
│   ├── regression/               # mined production dataset + baseline
│   └── scorers/                  # metric definitions
└── docs/
```

The implementation should wire:

1. **Governed skill** — create and promote `support-resolution`, then download it into the Copilot SDK runtime skill directory.
2. **Tracing** — every turn emits OTel spans with the effective skill version.
3. **Offline evals** — score the exact agent and skill versions and gate deploy.
4. **Trace mining** — curate approved support traces into a regression dataset.
5. **Improvement PRs** — a regression opens a PR with the fix, skill lineage, and before/after results.

Commit a checkpoint once the diff looks right:

```bash
git add .
git commit -m "feat: scaffold continuous evaluation loop"
```

---

### Verify locally

Validate locally against real Azure dependencies.

```text
/verify
```

| Test | Action | Expected result |
|---|---|---|
| Trace emission | Send a few turns. | Spans land in Application Insights. |
| Offline gate | Run offline evals. | Scores compute and the gate passes/fails correctly. |
| Skill adherence | Run order, return, warranty, and escalation cases. | Responses follow the governed resolution flow. |
| Version lineage | Compare two skill versions. | Traces and eval results identify the exact version used. |
| Trace mining | Curate recent traces. | A regression dataset is produced. |
| Baseline compare | Score against the baseline. | Regressions are detected relative to baseline. |
| Improvement PR | Introduce a deliberate regression. | The loop opens a PR with the fix and eval results. |

---

### Deploy

Deploy after local verification passes.

```text
/deploy
```

Deployment readiness checklist:

- [ ] Hosted agent has a valid `agent.yaml` and, where used, `code_configuration`.
- [ ] Application Insights read access uses managed identity, not keys.
- [ ] Offline eval gate is enforced before deploy.
- [ ] `support-resolution` has an immutable version, promoted `default_version`, and rollback target.
- [ ] Runtime downloads the governed skill to writable storage and configures `skill_directories`.
- [ ] Regression baseline is committed to the repo.
- [ ] Scheduled scoring job is provisioned.
- [ ] Improvement PRs require human review before merge.
- [ ] Application Insights receives per-turn telemetry.

After approved deployment, Copilot reports the verified frontend URL. Use Explore to exercise the app and the Foundry portal to inspect agents, models, tools and correlated traces.

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Eval scores cannot be reproduced | Dataset or scorer versions drifted | Commit datasets, scorer configuration, and baseline versions together. |
| Regression set is noisy | Raw traces are used without curation | Redact, deduplicate, label, and approve traces before adding them. |
| Improvement PRs lack evidence | Eval output is not attached | Include changed cases, before/after scores, and the proposed fix in every PR. |
| Production traces are absent | Telemetry is incomplete | Verify the backend and hosted agent export to the same Application Insights resource. |

## Run

### Run the evaluation loop

Open ResolveRight and exercise mock order, return, warranty, damaged-shipment, and escalation cases. Confirm that traces record the promoted `support-resolution` version, become curated regression cases, compare against the committed baseline, and produce an evidence-backed improvement PR after a deliberate skill regression.

---

### Observe

Use telemetry to keep the regression set representative and the scorecard trustworthy.

Track:

- Eval scores over time by metric, with the baseline overlaid.
- Regression detections and the turns that triggered them.
- Coverage: share of production turn types represented in the regression set.
- Improvement-PR count, merge rate, and time-to-merge.

Useful Application Insights questions:

| Question | Signal |
|---|---|
| Are scores drifting? | Metric trend vs. committed baseline. |
| Is the regression set representative? | Distribution of mined turns vs. live traffic. |
| Are regressions caught early? | Time from regression to detection to PR. |
| Are fixes landing? | Improvement-PR merge rate and score recovery. |

### Evaluate

Maintain both an offline scorecard and a scheduled regression scorecard.

| Eval | Dataset shape | Pass condition |
|---|---|---|
| Groundedness | Question, answer, sources | Claims are supported. |
| Relevance/quality | Question, reference answer | Answer matches reference intent. |
| Safety | Adversarial prompts | Unsafe content is blocked. |
| Regression | Mined turns + baseline scores | No score drops below the baseline threshold. |
| Skill adherence | Support case, expected classification and evidence | Agent follows the promoted resolution procedure. |
| Latency | Representative turns | p95 latency stays within target. |

Set gates before promoting: offline evals pass, no regression below baseline, and the scorecard covers the top production turn types.

### Iterate

Safe iteration loop:

1. Review the latest scheduled scores and any improvement PRs.
2. Merge or refine fixes, or add missing cases to the regression set.
3. Re-baseline intentionally when the agent legitimately changes behavior.
4. Commit a checkpoint before changing scorers or baselines.

```bash
git add .
git commit -m "chore: refresh regression baseline and scorers"
```

## Scale

### Automate more of the loop

Start with human-reviewed improvement PRs. As trust grows, auto-merge low-risk fixes that pass all evals, and expand the scorecard with domain-specific metrics.

---

### Expand coverage

Mine more turn types into the regression set, add per-segment scorecards (by user cohort, topic, or locale), and track score trends per segment.

---

### Promote across environments

Use separate azd environments per stage:

```bash
azd env new continuous-evaluation-loop-test-eus2
azd env new continuous-evaluation-loop-prod-eus2
```

Promotion checklist: explicit RBAC per environment, offline and regression evals run before promotion, baselines committed per environment, and score dashboards in place before production rollout.

---

### Take it further

- **Customize the scorecard** — add metrics or judges tailored to your domain, then push the change through the loop.
- **Explore the other playbooks** — combine continuous evaluation with grounding, orchestration, or governance.

> Tip: run the loop fully unattended for larger changes:
> ```bash
> copilot -p "Use the foundry-agentic-loop skill in SDD mode to <your next big idea>" --no-ask-user --yolo -- autopilot
> ```

---

### Clean up

When you are done experimenting, delete every Azure resource the loop created. Run this from the project root, where `azure.yaml` lives:

```bash
azd down --purge --force
```

`--purge` also removes soft-deleted resources (such as the Foundry/AI Services account and Key Vault) so their names are immediately reusable.

---

### References

- [Evaluation of generative AI applications](https://learn.microsoft.com/azure/ai-foundry/concepts/evaluation-approach-gen-ai)
- [Evaluate your AI application locally with the Azure AI Evaluation SDK](https://learn.microsoft.com/azure/ai-foundry/how-to/develop/evaluate-sdk)
- [Continuously monitor and evaluate agents](https://learn.microsoft.com/azure/ai-foundry/how-to/continuous-evaluation-agents)
- [Trace and observe generative AI applications](https://learn.microsoft.com/azure/ai-foundry/concepts/observability)
- [About GitHub Copilot coding agent](https://docs.github.com/en/copilot/using-github-copilot/coding-agent/about-copilot-coding-agent)
