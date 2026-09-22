---
name: agentic-loop
description: Build complete agentic applications with Microsoft Foundry agents, toolbox tools and skills, and a React/FastAPI application. Use for Agentic Loop requests or end-to-end agentic solutions spanning architecture, implementation, local testing, and optional Azure deployment. Supplies concise defaults to microsoft-foundry; not for unrelated UI edits or isolated Azure administration.
---

# Agentic Loop

Use this as the solution coordinator and `microsoft-foundry` for platform execution. Explicit user choices override defaults. Reuse known context; ask only for missing decisions. Read only the applicable Foundry workflow and its required references, not the whole skill tree. Report decisions, blockers, and endpoints concisely.

## Defaults

- **Agents:** hosted agents; prompt agents only when explicitly requested. For new hosted agents, use `microsoft-foundry`'s `foundry-agent/create/quick-start-hosted.md`. Start with the **Basic sample**, **Python 3.13**, **Responses API**, and **code deployment**. Resolve the current sample through the skill; do not guess its URL. Use its advanced workflow only when quick-start cannot support the requested capability, retaining these defaults.
- **Orchestration:** Copilot SDK for agents using agent skills; Microsoft Agent Framework for basic agents or explicit agent workflows. If a workflow also needs skills, clarify the framework choice. Use one framework per agent.
- **Models:** preserve the Basic sample's model deployment configuration unless the user supplies an existing deployment; then verify and reuse it. Do not replace it with a hard-coded model or silently create a duplicate.
- **App services:** React frontend, FastAPI backend, FastMCP custom MCP servers; Python 3.13 for Python services. Host these on Azure Container Apps using `az containerapp up --source <service-directory>` with explicit subscription, resource group, name, environment, ingress and target port. Do not substitute image-only deployment.
- **Tools/skills:** publish and govern built-in tools, remote/custom MCP connections, and agent skills through Foundry toolbox; agents consume the toolbox rather than hard-coded tool endpoints.
- **Safety:** use managed identity and least-privilege RBAC; keep credentials out of browser code and Git. Reuse resources and confirm billable changes. Surface failures; never report an unverified deployment as successful.

## Workflow

1. **Preflight.** Confirm `microsoft-foundry` is installed and enabled; if missing, install from `microsoft/azure-skills` with approval and reload skills. Follow its dependency/authentication checks and azd guidance. Resolve the intended project from the user, workspace or root `.env`; ask if absent. Validate it with `az cognitiveservices account project show --subscription <subscription> --resource-group <group> --name <account> --project-name <project>`. Record its returned ARM ID, endpoint, region and resource group; verify permissions for planned resources and role assignments. Do not create a replacement for an inaccessible project.
   Check the runtime canvas catalog for `agentic-loop`. Its source is [extensions/agentic-loop on the canvas branch](https://github.com/aiappsgbb/agentic-loop/tree/canvas/extensions/agentic-loop). If missing, follow the [installation documentation on that branch](https://github.com/aiappsgbb/agentic-loop/blob/canvas/plugins/agentic-loop/README.md): build the self-contained bundle from a `canvas` branch checkout with `npm run plugin:build`, including scenario assets, then install the canvas at user scope, reload extensions and confirm discovery. Do not install the repository-only `.github/extensions` loader by itself. If the branch is not yet pushed, use the local `canvas` checkout; ask for its path only if unknown.

2. **Architecture.** Clarify the use case and user experience. Update the root `README.md`, preserving unrelated content, with each agent's purpose, framework, model deployment, and assigned toolbox tools/skills; identify remote versus custom MCP servers, generated versus reused skills, frontend, backend, databases/APIs, data flow, identity boundaries and deployment targets. Include only required components. Resolve unknowns before implementation.

3. **Generate.** Scaffold hosted agents through quick-start, then implement the required agents, React UI, FastAPI API, FastMCP servers and custom `SKILL.md` files. Wire configuration, authentication, health checks, telemetry, tests and service startup/build settings. Preserve existing code. Keep browser-to-backend and backend-to-agent contracts consistent.

4. **Deploy MCP.** Deploy required custom MCP servers first with `az containerapp up --source <mcp-directory>`. Verify their actual reachable MCP endpoints and authentication before registering connections. Reuse remote servers without redeploying them.

5. **Configure toolbox.** Follow current `microsoft-foundry` guidance and supported `azd ai` commands to publish generated skills, register remote/custom MCP connections and built-in tools, and create/update toolboxes. Assign the required toolbox to each agent and verify authenticated tool/skill discovery.

6. **Deploy agents.** Continue the Foundry workflow using code deployment; verify remote Responses API invocations and required tool/skill execution. Return each actual agent endpoint with its authentication requirements and a minimal test example. Do not invent endpoints from names.

7. **Local acceptance gate.** Start FastAPI with reload and React's development server with hot reload. Verify both are responsive; run end-to-end tests through UI, backend, deployed agents and required MCP/tools. Fix failures before proceeding. After success, upsert these keys in root `.env`, preserve unrelated keys, and ensure `.env` is Git-ignored:
   - `FOUNDRY_PROJECT`: verified project ARM ID.
   - `RESOURCE_GROUP`: selected resource group name.
   - `LOCAL_FRONTEND`: verified local frontend URL.
   Keep local servers running and report their URLs. **Stop and ask whether to deploy the backend and frontend to Azure; wait for explicit confirmation.** Earlier approval for agents/MCP does not authorize this step.

8. **Optional app deployment.** Only after that confirmation, deploy backend then frontend with `az containerapp up --source <service-directory>`. Configure the deployed backend URL, allowed frontend origin and authenticated service access. Verify the cloud app end to end; only after success upsert `DEPLOYED_FRONTEND` in root `.env` with the actual Container Apps frontend URL. Return that URL and any sign-in requirements. If declined, leave the working local app and do not deploy.
