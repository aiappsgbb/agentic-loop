# Agentic Loop Plugin

Build complete agentic solutions with a repeatable development and improvement loop on Microsoft Foundry and Azure.

## Included

- The concise `agentic-loop` solution-coordination skill, with Microsoft Foundry defaults and an eight-step implementation/deployment workflow.
- The Agentic Loop canvas: **Setup**, **Resources**, **Build**, **Explore**, and **Cost**.
- Industry scenario prompts and images, packaged from this repository's scenario catalog.

The source manifest follows [Awesome Copilot's declarative plugin format](https://github.com/github/awesome-copilot/blob/main/CONTRIBUTING.md#adding-plugins). This plugin is not yet published to its marketplace.

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

| Tab | Behavior |
| --- | --- |
| Setup | Checks enabled skills, CLI versions, Azure token validity and `azd` authentication on load. Green check only when all checks pass. |
| Resources | Lists enabled subscriptions and Foundry projects. Uses the saved session selection or the first project in the current/default subscription. Shows the actual resource group, detects project-level Application Insights connections, and offers creation/repair prompts. |
| Build | Green check when `LOCAL_FRONTEND` or `DEPLOYED_FRONTEND` is nonempty in the workspace root `.env` (configuration only, not a health check). Searches, filters and sorts the catalog with scenario images. Selecting a scenario replaces the search and results with its starting prompt for review. **Back to scenarios** restores filters and list position; **Send to Chat** starts a Copilot turn with the selected project context. Also offers guided creation. |
| Explore | Opens configured local/deployed frontend URLs in the integrated browser or an external browser, even without a Foundry project selected. Searchable resource explorer with type filters, collapsible sections, counts and labeled model metadata. Each agent and model deployment has a **Test in Foundry** link to its portal playground in a new tab, preserving project scope and the latest agent version when returned. Agents also have **Inspect locally**, which rechecks the agent in the selected project and asks Copilot in Chat to launch Agent Inspector with that agent's name, version and project endpoint. This checks tooling/source prerequisites instead of silently inspecting a different workspace agent; it does not immediately start Inspector or send test prompts. Portal sign-in is required; running prompts can incur usage charges. Distinguishes project agents/toolboxes, account-level model deployments and resource-group resources; unavailable sections show errors and a retry action rather than zero counts. Connects to the existing Foundry canvas through public APIs rather than copying its compiled code. |
| Cost | Reads actual current-session Copilot usage by model, queries month-to-date resource-group Azure charges, and sends workload assumptions to Chat for estimates using the Azure Retail Prices API. No manual price inputs are required. |

The Foundry button sends an explicit request to Chat to open the existing panel and synchronize the selected project through the supported project-selection tool. **Refresh Foundry panel** directly invokes its public `refreshWorkspaceState` action. No private Foundry HTTP endpoints or installed-plugin filesystem paths are used.

Settings, selected project, prompt drafts and estimate inputs persist in the session workspace, not in the repository or under a transient panel ID. Azure credentials remain in the CLI credential stores. Servers bind to loopback and protect state/actions with a per-panel token and origin checks.

Frontend URLs are read from `.env` in the session's current working directory, not the plugin installation or session-state directory. Only `LOCAL_FRONTEND` and `DEPLOYED_FRONTEND` are exposed to the panel; other values are never returned or loaded into the process environment. Quoted values, comments and `export` syntax are supported, without executing shell code or expanding variables. Links must be absolute HTTP(S) URLs without credentials. Invalid values are reported without creating links. Configuration refreshes on open, Build/Explore visits, Refresh, window focus and every five seconds while visible. Missing `.env` or empty values leave Build unchecked. External links use the host's standard new-window handling; integrated links use the public Browser canvas API and report unavailable-host errors.

Azure public-cloud Foundry projects are currently supported. Authentication, permissions, private-network failures and unsupported APIs are shown as errors, not empty successful results. Model deployments are account-scoped; Azure spend is resource-group-scoped and may include other workloads. Copilot credits are not USD, and Copilot tokens are not Foundry runtime usage. Estimate prompts direct Copilot to query `https://prices.azure.com/api/retail/prices`, match region/SKU/meters, follow pagination, normalize pricing units and cite retrieved rates. Unavailable rates must be reported rather than invented or treated as zero. Estimates are calculated in Chat, not by a local fixed-rate calculator.

## Contribute to Awesome Copilot

For a curated contribution, include the plugin manifest, complete skill source, canonical extension source and bundled scenario assets. This repository's `plugin:build` supplies the scenario JSON and images; Awesome Copilot's materializer does not know about this site's `src/data` or `public` directories. Copy the generated extension's `assets/scenarios.json` and `assets/images/` into the contributed `extensions/agentic-loop/assets/` directory, alongside `assets/preview.png`.

Update the manifest repository URL for the destination, preserve license attribution and document the Microsoft Foundry prerequisite. In the Awesome Copilot checkout, run `npm run plugin:validate`, `npm run skill:validate` and `npm run build`, then smoke-test the materialized plugin.

If distribution remains in this repository, publish the self-contained bundle at a stable repository path with an immutable release tag/SHA and use Awesome Copilot's external plugin submission issue workflow. Do not directly add a new external listing to `plugins/external.json`.

## License

MIT. See the repository's `LICENSE` (also included in the materialized plugin).
