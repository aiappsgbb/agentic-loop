# Agentic Loop Plugin

Build complete agentic solutions with a repeatable development and improvement loop on Microsoft Foundry and Azure.

## Included

- The concise `agentic-loop` solution-coordination skill, with Microsoft Foundry defaults and an eight-step integration-first implementation/deployment workflow.
- The Agentic Loop canvas: **Setup**, **Resources**, **Build**, **Explore**, and **Optimize**.
- Industry scenario prompts and images, packaged from this repository's scenario catalog.

The source manifest follows [Awesome Copilot's declarative plugin format](https://github.com/github/awesome-copilot/blob/main/CONTRIBUTING.md#adding-plugins). This plugin is not yet published to its marketplace.

The skill proves a minimal deployed agent's required skill, MCP tool and model request before building the full application. Its bundled references, `references/hosted-integration-checkpoint.md` and `references/copilot-sdk-foundry.md`, cover post-deployment identities, endpoint contracts, terminal-status evidence, SDK configuration, host/runtime telemetry and optional dependency bundling. Telemetry is configured before the minimal deployment; correlated hosting, model and required tool spans are checkpoint evidence, not a later addition. A project connection or host-only trace is insufficient, and new collector infrastructure requires approval. Platform execution still uses `microsoft-foundry`; cloud frontend/backend deployment remains a separate approval after local acceptance.

The skill updates root `LOOP.md` immediately whenever a failure is verified as resolved, including before local acceptance or after cloud deployment. It records the failure, fix, verification evidence and proposed reusable improvement, preserving prior notes and distinguishing a verified app fix from a validated skill change. The coordinator owns writes during parallel work; local acceptance consolidates lessons without duplicates.

## Dependencies

Install the maintained [Microsoft Foundry skill](https://github.com/microsoft/azure-skills/tree/main/skills/microsoft-foundry) in your target project:

```bash
gh skill install microsoft/azure-skills microsoft-foundry \
  --agent github-copilot \
  --scope project
```

Alternatively, install Microsoft's Azure skills plugin from Copilot CLI:

```text
/plugin marketplace add microsoft/azure-skills
/plugin install azure@azure-skills
```

The Microsoft Foundry **canvas** is a separate optional integration, required for the Explore tab's Foundry panel controls. Install it through [Foundry DevPack](https://learn.microsoft.com/azure/foundry/how-to/develop/install-cli-sdk#install-foundry-devpack). The Azure skills plugin alone does not supply that canvas.

The Agent Plugins manifest has no standard dependency field. Microsoft Foundry remains an explicit prerequisite, not a remote source in the composition array or an automatic install. The Setup tab checks the session's enabled skills and guides project-scope (default) or user-scope installation.

Live Azure features require `az`, `azd`, the `azd ai` Foundry extension, and authentication in both CLIs. Setup guides missing tooling through DevPack and points out that Azure CLI may need a separate installation. No installation, sign-in or Azure resource creation happens automatically.

## Develop and install locally

The project loader at `.github/extensions/agentic-loop/extension.mjs` imports the canonical source in `extensions/agentic-loop/`. Reload extensions in Copilot App, then ask to open the **Agentic Loop** canvas.

Build a self-contained plugin from the repository root:

```bash
npm run plugin:test
npm run plugin:build
copilot --plugin-dir ./dist/plugin/agentic-loop
```

`plugin:build` regenerates only `dist/plugin/agentic-loop/`. It copies the declared skill, extension, catalog, images, preview and license, and removes the source-only Awesome Copilot namespace. No frontend build or additional npm dependencies are required for the canvas. A canvas-renderer-capable Copilot host with the SDK's canvas, skill-list and session-usage APIs is required; a terminal-only host can still use the skill.

Restart or reload the target session after installation. Avoid enabling both the source extension and the packaged extension in the same checkout: both declare the same canvas ID. The plugin does not itself bundle the `/spec2cloud` workflow; install that separately when needed.

## Canvas behavior

The external-link icon beside the Agentic Loop title opens `https://aka.ms/agentic-loop` in the external browser.

| Tab | Behavior |
| --- | --- |
| Setup | Checks enabled skills, CLI versions, Azure token validity and `azd` authentication on load. **Skills** is expanded by default; **Azure tools and sign-in** is collapsed by default. Both groups show readiness counts and visible warnings when attention is needed. Refresh preserves each group's expanded/collapsed choice. Shows only setup help matching failed skill, CLI or authentication checks; all-ready hides setup help. Sign-in help waits until the relevant CLI is available; skill discovery failures request a recheck instead of suggesting installation. Green check only when all checks pass. |
| Resources | Lists enabled subscriptions and Foundry projects. A valid `FOUNDRY_PROJECT` in root `.env` takes priority on open; subsequent changes automatically select the matching project and subscription after discovery. Otherwise uses the saved session selection or first available project. Shows the actual resource group, detects project-level Application Insights connections, and offers creation/repair prompts. |
| Build | Green check when `LOCAL_FRONTEND` or `DEPLOYED_FRONTEND` is nonempty in the workspace root `.env` (configuration only, not a health check). Searches, filters and sorts the catalog with scenario images. Selecting a scenario replaces the search and results with its starting prompt for review. **Back to scenarios** restores filters and list position; **Send to Chat** starts a Copilot turn with the selected project context. Also offers guided creation. |
| Explore | Opens configured local/deployed frontend URLs in the integrated browser or an external browser, even without a Foundry project selected. Searchable resource explorer with type filters, collapsible sections, counts and labeled model metadata. Each agent and model deployment has a **Test in Foundry** link to its portal playground in a new tab, preserving project scope and the latest agent version when returned. Agents also have **Inspect locally**, which rechecks the agent in the selected project and asks Copilot in Chat to launch Agent Inspector with that agent's name, version and project endpoint. This checks tooling/source prerequisites instead of silently inspecting a different workspace agent; it does not immediately start Inspector or send test prompts. Portal sign-in is required; running prompts can incur usage charges. Distinguishes project agents/toolboxes, account-level model deployments and resource-group resources; unavailable sections show errors and a retry action rather than zero counts. Connects to the existing Foundry canvas through public APIs rather than copying its compiled code. |
| Optimize | Offers project-aware Chat prompts and Microsoft documentation links for Foundry Agent Optimizer, automatic evaluations and an on-demand Agent Insights scan. Copilot confirms the target agent, prerequisites, evaluation/analysis scope and approval boundaries in Chat; opening the tab does not run an optimization, evaluation or scan. Also reads actual current-session Copilot usage by model and month-to-date resource-group Azure charges. No monthly workload estimator. |

The Foundry button sends an explicit request to Chat to open the existing panel and synchronize the selected project through the supported project-selection tool. **Refresh Foundry panel** directly invokes its public `refreshWorkspaceState` action. No private Foundry HTTP endpoints or installed-plugin filesystem paths are used.

In Explore, each Azure resource has an **Open in Azure Portal** link to its resource overview. Each toolbox has an **Open in Foundry Portal** link to that named toolbox in the selected project. Both open in a new tab and may require portal sign-in.

Settings, selected project and prompt drafts persist in the session workspace, not in the repository or under a transient panel ID. Saved Cost-tab selections migrate to Optimize and obsolete estimate inputs are removed on load. Azure credentials remain in the CLI credential stores. Servers bind to loopback and protect state/actions with a per-panel token and origin checks.

Copilot usage is bound to the session that owns the canvas, not the selected Foundry project or another foreground session. Optimize shows that session's ID, session accounting and a separate live model breakdown. The runtime can restore accumulated credits without restoring all token/request/model counters after resume, so those counters are explicitly not guaranteed lifetime totals; unavailable counters are not shown as zero. Usage refreshes on Optimize visits, focus/visibility restoration and every 15 seconds while visible. A session mismatch fails explicitly rather than showing another session's metrics.

Frontend URLs are read from `.env` in the session's current working directory, not the plugin installation or session-state directory. Only `LOCAL_FRONTEND`, `DEPLOYED_FRONTEND` and the validated `FOUNDRY_PROJECT` ARM ID are exposed to the panel, alongside an opaque file-metadata revision for change detection; other values are never returned or loaded into the process environment. Quoted values, comments and `export` syntax are supported, without executing shell code or expanding variables. Links must be absolute HTTP(S) URLs without credentials. Invalid values are reported without creating links. Configuration refreshes on open, Build/Explore visits, Refresh, window focus and every five seconds while visible. After the initial read, creating or updating `.env` with a nonempty `LOCAL_FRONTEND` automatically switches to **Explore**, including when an editor replaces the file on save. Unchanged checks do not switch tabs again; an existing file on open, an empty local value or a deployed-only value does not trigger navigation. Invalid local URLs still switch to Explore so their validation error is visible, without opening a browser. Missing `.env` or empty values leave Build unchecked. External links use the host's standard new-window handling; integrated links use the public Browser canvas API and report unavailable-host errors.

Project synchronization uses the same visible-panel polling, focus and Refresh checks. Changed `FOUNDRY_PROJECT` values trigger Azure discovery, update the subscription/project/resource-group context, and invalidate monitoring, inventory and cost data. Unchanged values do not undo a later manual selection; clearing/removing the key keeps the current selection. Invalid or inaccessible targets show an error and preserve the previous selection rather than falling back to a different project. Failed discovery retries at most every 30 seconds, or immediately with Refresh. Synchronization is read-only in Azure and never rewrites `.env`.

Azure public-cloud Foundry projects are currently supported. Authentication, permissions, private-network failures and unsupported APIs are shown as errors, not empty successful results. Model deployments are account-scoped; Azure spend is resource-group-scoped and may include other workloads. Copilot credits are not USD, and Copilot tokens are not Foundry runtime usage. Optimize prompts check feature/region support, protect against tool side effects and sensitive-data exposure, and require approval for billable runs, recurring execution and changes to deployed agents. Evaluation automation clarifies CI versus supported scheduled/continuous execution before configuring a trigger; Insights scans remain on-demand unless separately requested.

## Contribute to Awesome Copilot

For a curated contribution, include the plugin manifest, complete skill source, canonical extension source and bundled scenario assets. This repository's `plugin:build` supplies the scenario JSON and images; Awesome Copilot's materializer does not know about this site's `src/data` or `public` directories. Copy the generated extension's `assets/scenarios.json` and `assets/images/` into the contributed `extensions/agentic-loop/assets/` directory, alongside `assets/preview.png`.

Update the manifest repository URL for the destination, preserve license attribution and document the Microsoft Foundry prerequisite. In the Awesome Copilot checkout, run `npm run plugin:validate`, `npm run skill:validate` and `npm run build`, then smoke-test the materialized plugin.

If distribution remains in this repository, publish the self-contained bundle at a stable repository path with an immutable release tag/SHA and use Awesome Copilot's external plugin submission issue workflow. Do not directly add a new external listing to `plugins/external.json`.

## License

MIT. See the repository's `LICENSE` (also included in the materialized plugin).
