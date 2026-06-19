# Process Findings 🧭

> **Captured:** 2026-06-19

## Context 🌦️

This repository was initialized through the Spec2Cloud `/lean:specify` and `/lean:plan` flow for a weather chat app where users interact with a Foundry hosted agent. The agent uses Microsoft Agent Framework and a Python function-calling tool that returns random demo weather data.

## What worked ✅

1. `/lean:specify` produced a complete `docs/spec.md` with no unresolved clarification markers.
2. The `agentic-loop` post-processing step successfully refined the AI defaults:
   - Foundry hosted agent
   - Microsoft Agent Framework
   - `gpt-5.4-mini`
   - `eastus2`
   - Global Standard capacity 100
3. `/lean:plan` produced `docs/plan.md` and `.azure/deployment-plan.md`.
4. Azure account discovery worked with both Azure CLI and Azure MCP subscription tooling.
5. Resource group collision check worked:
   - `az group exists --name rg-agentic-loop-weather-dev`
   - Result: `false`
6. After upgrading GitHub CLI, companion skills installed successfully:
   - `.github/skills/microsoft-foundry`
   - `.github/skills/microsoft-agent-framework`
7. The `dev` azd environment was selected and had the expected subscription and resource-group values.

## Issues and friction ⚠️

### 1. Skill install command drift

The `agentic-loop` instructions initially suggested:

```powershell
gh skills install microsoft/azure-skills microsoft-foundry --dir .github/skills --agent github-copilot
```

On GitHub CLI `2.59.0`, this failed because `gh skills` did not exist.

After upgrading to GitHub CLI `2.95.0`, the command surface was available as:

```powershell
gh skill install microsoft/azure-skills microsoft-foundry --dir .github/skills --agent github-copilot
gh skill install github/awesome-copilot microsoft-agent-framework --dir .github/skills --agent github-copilot
```

`gh skills` is now an alias, but the canonical command shown by the CLI is `gh skill`.

### 2. GitHub CLI minimum version was implicit

The workflow depended on GitHub CLI `v2.90.0+`, but the installed version was `2.59.0`. The process should check `gh --version` before attempting skill installation and either:

1. Upgrade first:

   ```powershell
   winget upgrade --id GitHub.cli --accept-source-agreements --accept-package-agreements
   ```

2. Or fall back to manual skill-folder copying with clear instructions.

### 3. Copilot CLI plugins and GitHub CLI skills are different mechanisms

There are two related but different install paths:

```powershell
copilot plugin install azure@awesome-copilot
```

installs a Copilot CLI plugin, while:

```powershell
gh skill install github/awesome-copilot microsoft-agent-framework
```

installs an individual agent skill folder. The process should distinguish "plugin install" from "skill install" explicitly.

### 4. Azure best-practices MCP timed out

The Azure best-practices MCP request timed out during planning. Planning still completed using the Spec2Cloud defaults, Agentic Loop defaults, and Azure CLI/account checks.

The same MCP also timed out during verification, so the process continued with the verify skill's required `azd provision -e dev` step.

Process improvement: this is just a symptom of the user's environment having other skills and tools already deployed that interfer with the agentic-loop. A solution could be Github Copilot Sandboxes.

### 5. `.azure/deployment-plan.md` is source-of-truth but `.azure/` is ignored

The Plan skill says `.azure/deployment-plan.md` is the Azure deployment source of truth, but the Protect step added:

```gitignore
.azure/
```

This hides `.azure/deployment-plan.md` from git by default. That may be intentional for local azd state, but it conflicts with treating the deployment plan as a durable repo artifact.

Recommended improvement: ignore only azd local environment state, or explicitly unignore the deployment plan:

```gitignore
.azure/*
!.azure/deployment-plan.md
```

### 6. Built playbook artifact could skip setup friction

It may be useful to offer the playbook as a fully built artifact that can be downloaded and deployed directly. This would let users skip the local build process when they only want to run or deploy the recommended workflow.

### 7. Slide 9 manual git checks should move into the skill

Slide 9 currently implies a manual `git status` and `git diff` check. This would be better as part of the agent skill so users do not need to remember to inspect the working tree manually before deciding what changed.

### 8. Slide 9 commit workflow should be automated or instructed

The slide 9 flow should also include `git add` and `git commit`, either directly in the skill or as explicit Copilot instructions. The goal is to regularly create commits with appropriate commit messages instead of leaving useful intermediate changes uncommitted.

### 9. Evaluate where `/fleet` and `/subagent` fit

Check where it makes sense to use `/fleet` and `/subagent` in the workflow. These may help split larger process steps into parallel or specialized workstreams instead of keeping everything in one linear agent loop.

### 10. Evaluate `/rubber-duck` for review checkpoints

Check where `/rubber-duck` would be useful as a structured review step. It could help challenge assumptions, catch logic gaps, and improve plans before implementation or deployment.

### 11. Add tooling guidance for GHCP surfaces

Todo: provide guidance on where to use GitHub Copilot / GHCP across the available surfaces: VS Code, standalone PowerShell, the Copilot app, and PowerShell inside VS Code. The process should make clear which surface is best for each task and when to switch contexts.

### 12. Provisioning failed on missing `agent.yaml` template kind

`azd provision -e dev` failed before Azure deployment started because the azd agent extension rejected `src\agents\weather-agent\agent.yaml`: `template.kind` was missing or empty and must be one of `hosted` or `workflow`.

### 13. Auto-suggest stronger azd environment names

The azd environment name should be chosen automatically using a more sophisticated convention, with an option for the user to correct it or provide their own. For example, instead of defaulting to `dev`, suggest `agentic-loop-weather-dev-eus2` from the app name, stage, and Azure region, then let the user accept or override it.

### 14. Provisioning hit ACA Container App name length limit

Provisioning got past the agent metadata issue and created most Azure resources, then failed on a new Bicep issue: the generated frontend Container App name was longer than Azure Container Apps' 32-character limit. The naming constants need to be checked before deciding whether to patch and rerun provisioning.

### 15. Verify paused on OpenTelemetry SDK incompatibility

The verify step paused because the backend local server failed to start: `azure-monitor-opentelemetry` imports `LogData`, which is missing from the resolved OpenTelemetry SDK version.

### 16. Preflight paused on missing standalone Bicep CLI

Preflight paused because the standalone `bicep` command was missing, although Azure CLI was present. The process continued by checking whether Azure CLI's bundled Bicep was available and installing the standalone Bicep CLI if needed.

### 17. Prefer GitHub Copilot SDK as agentic-loop default

Proposal: specifically for the `agentic-loop` skill, the default agent framework should be GitHub Copilot SDK. Microsoft Agent Framework should be considered only when workflow orchestration is required to manage agent sequences or true multi-agent orchestration.

### 18. Hosted-agent code deploy needs dependency strategy guidance

Foundry hosted-agent code deploy failed when remote build selected `uv.lock` and encountered a transitive OpenTelemetry package. Excluding uv metadata and shipping a focused `requirements.txt` allowed the remote build to continue. The process should document when hosted agents should use uv lock files versus pip requirements.

### 19. Remote Docker builds need generated `.dockerignore` files

Frontend remote build copied local Windows `node_modules`, which caused `tsc: Permission denied` in the Linux build image. The scaffold should always generate `.dockerignore` files for Node and Python services before enabling `remoteBuild: true`.

### 20. Backend Foundry client needs async transport dependency check

The deployed backend container crashed because `azure-ai-projects` needed `aiohttp` for its async client path, but the fresh pip image did not install it. The process should include containerized startup checks, not only local uv checks.

### 21. Foundry hosted sessions require `/readiness`

The hosted agent was active but prompt sessions failed with `session_not_ready` until `/readiness` was added. Hosted-agent scaffolds should include both `/liveness` and `/readiness` routes by default.

### 22. Frontend shell entrypoints need Linux line-ending normalization

The frontend Container App served the ACA welcome page because the latest frontend revision crashed with `exec /docker-entrypoint.sh: no such file or directory`. The root cause was Windows line endings in the shell entrypoint. Dockerfiles generated on Windows should normalize entrypoint scripts during build or enforce LF via `.gitattributes`.

## Deployment issue log 🚢

These were the concrete deploy-stage failures and fixes from the first successful Azure deployment.

| Issue | Symptom | Root cause | Fix |
|---|---|---|---|
| Missing standalone Bicep | Deploy preflight could not run `bicep --version`. | Azure CLI bundled Bicep was present, but standalone `bicep` was not on `PATH`. | Installed standalone Bicep and kept the check in deploy preflight. |
| Stale azd / agent extension | Hosted-agent deployment behavior did not match current docs and samples. | Local `azd` and `azure.ai.agents` extension were behind the current preview command surface. | Upgraded `azd` and the `azure.ai.agents` extension before deploying. |
| Hosted agent used container packaging | `azd deploy` tried Docker/Pack/Oryx packaging and hit Docker API compatibility friction. | `agent.yaml` did not include `code_configuration`, so azd did not use hosted-agent code deploy. | Added `code_configuration` with `runtime: python_3_13`, `entry_point: main.py`, and `dependency_resolution: remote_build`. |
| Hosted-agent remote uv build failed | Code deploy failed with a `uv.lock` / OpenTelemetry transitive dependency error. | Foundry remote build selected uv metadata and rejected the generated lock path. | Excluded `pyproject.toml` and `uv.lock` from `.agentignore`; shipped a focused `requirements.txt` for hosted code deploy. |
| Frontend remote build copied Windows dependencies | Remote Linux build failed with `tsc: Permission denied`. | Local Windows `node_modules` was included in the Docker build context. | Added `.dockerignore` for frontend and backend dependency/build artifacts. |
| Backend Container App crashed | Backend health endpoint timed out; latest revision had `ActivationFailed`. | Fresh container image lacked `aiohttp`, which the async Azure AI Projects client imports at runtime. | Added explicit backend dependency `aiohttp>=3.14.0` and validated the container image locally. |
| Hosted agent sessions never became ready | Backend chat returned Foundry `session_not_ready` / HTTP 424. | Hosted runtime expected `/readiness` to return HTTP 200, but the agent only exposed `/liveness`. | Added both `/liveness` and `/readiness` health routes to the hosted agent. |
| Hosted agent crashed after readiness fix | Foundry session logs showed `ModuleNotFoundError: No module named 'mcp'`. | `agent-framework-foundry-hosting` imported `mcp`, but it was not installed transitively in hosted code deploy. | Added explicit agent dependency `mcp>=1.28.0` and included it in `requirements.txt`. |
| Frontend Container App served welcome page | Public frontend URL returned the Azure Container Apps welcome page. | New frontend revision crashed because `/docker-entrypoint.sh` had Windows CRLF line endings. | Normalized the shell entrypoint in the Dockerfile with `sed -i 's/\r$//'` before `chmod +x`. |

Process improvement: add a generated deploy checklist that validates `code_configuration`, `.agentignore`, `requirements.txt`, `.dockerignore`, container startup, `/readiness`, and Linux line endings before the first `azd deploy`.

## Recommended skill ownership 🧩

The clean ownership model is:

| Skill | Primary responsibility | Summary |
|---|---|---|
| `agentic-loop` | Define defaults, decision policy, and generated contracts | Decide what the greenfield solution should look like before implementation starts. |
| `verify` | Validate local and pre-provision correctness | Catch schema, naming, dependency, and startup issues before cloud deployment. |
| `deploy` | Enforce packaging and cloud-runtime readiness | Catch remote build, hosted deploy, revision, and post-deploy health issues. |

### `agentic-loop` improvements 🧠

These belong in `agentic-loop` because they shape the default architecture, workflow, and companion-skill selection immediately after `specify`.

| Improvement | Why it belongs here |
|---|---|
| Prefer GitHub Copilot SDK by default; use Microsoft Agent Framework only for workflow orchestration, agent sequences, or true multi-agent coordination. | This is an architecture/default-selection policy. |
| Recommend `copilot-sdk` before `microsoft-agent-framework` unless orchestration triggers are present. | Companion skill selection belongs with post-spec interpretation. |
| Check GitHub CLI version, use `gh skill install` as canonical, and distinguish GitHub skills from Copilot CLI plugins. | This is setup guidance for installing companion skills. |
| Provide GHCP tooling guidance for VS Code, standalone PowerShell, the Copilot app, and PowerShell inside VS Code. | This is cross-cutting workflow guidance, not stage-specific validation. |
| Define when to use `/fleet`, `/subagent`, and `/rubber-duck`. | These choices shape the agentic workflow itself. |
| Auto-suggest convention-based azd environment names, such as `agentic-loop-weather-dev-eus2`, while allowing user override. | Naming policy should be established before provisioning. |
| Clarify `.azure/deployment-plan.md` source-of-truth and `.gitignore` handling. | `agentic-loop` can enforce the durable SDLC artifact contract, while Plan owns the artifact content. |
| Offer a deploy-ready playbook artifact path. | This is a workflow/productization option for users who want to skip local builds. |

### `verify` skill improvements ✅

These belong in `verify` because they should fail fast before `azd provision`, `azd deploy`, or cloud runtime debugging.

| Improvement | Why it belongs here |
|---|---|
| Validate `agent.yaml` includes `template.kind: hosted` or `workflow`. | This should be caught before provisioning. |
| Validate hosted-agent `code_configuration`, runtime, entry point, and dependency resolution. | Verify checks the file contract before deploy confirms behavior. |
| Validate Azure resource names against service-specific limits, including Azure Container Apps' 32-character app name limit. | Naming failures should be caught before provisioning. |
| Add Azure best-practices MCP retry/fallback behavior. | Verification can continue with documented fallback instead of blocking on an MCP timeout. |
| Check standalone `bicep` versus Azure CLI bundled Bicep availability. | This is preflight validation for provision/deploy readiness. |
| Pin or validate Azure Monitor and OpenTelemetry package compatibility. | Local backend startup should catch dependency incompatibilities. |
| Add containerized startup checks for backend and frontend images. | Local image startup catches missing runtime dependencies before cloud deploy. |
| Validate `/liveness` and `/readiness` routes for hosted agents. | Hosted-session readiness should be part of the pre-deploy contract. |

### `deploy` skill improvements 🚢

These belong in `deploy` because they are tied to remote build behavior, deployment payloads, and cloud runtime health.

| Improvement | Why it belongs here |
|---|---|
| Enforce hosted-agent dependency packaging strategy: when to use `uv.lock` versus focused `requirements.txt`. | This is specific to Foundry hosted code deploy packaging. |
| Generate or validate `.agentignore` for hosted-agent code deploy. | It controls the remote deployment payload. |
| Generate or validate service-specific `.dockerignore` files when `remoteBuild: true` is configured. | It prevents bad Docker build contexts in remote Linux builds. |
| Normalize Linux shell entrypoint line endings through `.gitattributes` or Dockerfile commands. | This prevents cloud/container runtime failures caused by Windows CRLF scripts. |
| Check `azd` and agent extension freshness before deploy. | Deploy behavior depends on current `azd` and extension command surfaces. |
| Run post-deploy health checks and revision diagnostics. | ACA revision state, hosted-agent sessions, and public URL behavior are cloud-runtime concerns. |

### Handoff contract 🔁

| Stage | Contract |
|---|---|
| `agentic-loop` | Declare what must be generated and which defaults apply. |
| `verify` | Validate that the generated project satisfies the contract locally and before provisioning. |
| `deploy` | Validate that remote build and cloud runtime satisfy the same contract after deployment. |

## Commands that should be preferred next time 🛠️

```powershell
gh --version
gh skill --help
gh skill install microsoft/azure-skills microsoft-foundry --dir .github/skills --agent github-copilot
gh skill install github/awesome-copilot microsoft-agent-framework --dir .github/skills --agent github-copilot
gh skill list --dir .github/skills
```

## Suggested process improvements 🚀

1. Add a preflight step before companion skill installation:
   - Check `gh --version`
   - Require `v2.90.0+`
   - Check `gh skill --help`
2. Update Agentic Loop instructions to use `gh skill install` as the canonical command.
3. Clarify when to install a Copilot CLI plugin versus a standalone agent skill.
4. Add a fallback path for MCP timeouts during planning.
5. Revisit `.gitignore` guidance for `.azure/` so durable deployment plans are not accidentally hidden.
6. Provide a downloadable, deploy-ready playbook artifact for users who want to skip the build process.
7. Move slide 9 `git status` / `git diff` checks into the agent skill.
8. Add slide 9 commit automation or Copilot instructions for regular `git add` / `git commit` checkpoints with appropriate commit messages.
9. Evaluate where `/fleet` and `/subagent` would improve the workflow through parallel or specialized agent execution.
10. Evaluate where `/rubber-duck` would add value as a structured review checkpoint.
11. Add tooling guidance that explains when to use GHCP in VS Code, standalone PowerShell, the Copilot app, and PowerShell inside VS Code.
12. Validate generated `agent.yaml` files before provisioning, including required `template.kind` values such as `hosted` or `workflow`.
13. Auto-suggest convention-based azd environment names, such as `agentic-loop-weather-dev-eus2`, while allowing users to accept, correct, or replace the suggestion.
14. Validate generated Azure resource names against service-specific limits, including Azure Container Apps' 32-character Container App name limit, before running `azd provision`.
15. Pin or validate compatible Azure Monitor and OpenTelemetry package versions before running local backend verification.
16. Include Bicep CLI preflight checks that distinguish standalone `bicep` availability from Azure CLI's bundled Bicep support.
17. Update `agentic-loop` defaults to prefer GitHub Copilot SDK, using Microsoft Agent Framework only for workflow orchestration or true multi-agent scenarios.
18. Document hosted-agent dependency packaging choices for uv lock files versus `requirements.txt`.
19. Generate service-specific `.dockerignore` files whenever `remoteBuild: true` is configured.
20. Add containerized startup checks for backend/frontend images before cloud deployment.
21. Include `/readiness` in Foundry hosted-agent scaffolds by default.
22. Normalize Linux shell entrypoint line endings during Docker builds or enforce LF via `.gitattributes`.
23. Add a deploy-stage checklist that validates hosted-agent `code_configuration`, dependency packaging, and health routes before running `azd deploy`.
