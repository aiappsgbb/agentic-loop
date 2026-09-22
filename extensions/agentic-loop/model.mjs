import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { outcome, projectIdentity } from "./azure.mjs";
import { frontendStatus } from "./frontends.mjs";

export const links = {
    devpack: "https://learn.microsoft.com/azure/foundry/how-to/develop/install-cli-sdk?tabs=macos%2Cpython%2Cazd-ai#install-foundry-devpack",
    quickstart: "https://learn.microsoft.com/azure/foundry/tutorials/quickstart-create-foundry-resources?tabs=azurecli",
    landingZone: "https://azure.github.io/AI-Landing-Zones/",
    optimizer: "https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-optimizer-overview",
    evaluations: "https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/evaluate-agent?tabs=python",
    insightsScan: "https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/agent-insights",
};

export function promptFor(kind, { project, scenario, scope = "project", text, agent } = {}) {
    if (!["project", "user"].includes(scope)) throw new Error("Skill scope must be project or user.");
    const context = project && !["quickstart", "landingZone"].includes(kind) ? `\nSelected Foundry project: ${project.id}\nEndpoint: ${project.endpoint ?? "resolve from Azure"}\nUse resource group ${project.resourceGroup} for additional solution resources.` : "";
    const prompts = {
        skills: `Help me install or enable the missing microsoft-foundry and agentic-loop skills at ${scope} scope using gh skill install microsoft/azure-skills microsoft-foundry and gh skill install aiappsgbb/agentic-loop agentic-loop with --agent github-copilot --scope ${scope}. Check gh availability first. Do not reinstall available skills. Recheck session skill discovery afterward.`,
        devpack: `Guide me through installing missing az, azd, and azd ai tools using Foundry DevPack: ${links.devpack}. Check my OS and installed tools first. DevPack may not include Azure CLI; if az is still missing, use Microsoft's Azure CLI installation instructions. Ask before installing anything.`,
        auth: "Check Azure CLI and Azure Developer CLI availability and current sign-in. Authenticate only installed CLIs that need it, using az login or azd auth login as appropriate. Confirm the intended tenant and subscription; do not expose tokens.",
        quickstart: `Guide me through creating a Microsoft Foundry project using ${links.quickstart}. Clarify subscription, region, resource group and names, check permissions, estimate cost, and ask for approval before provisioning. Configure Application Insights for the project.`,
        landingZone: `Guide me through a production-ready enterprise AI deployment using Azure AI Landing Zones: ${links.landingZone}. Clarify governance, networking, identity, subscriptions, region and cost before provisioning.`,
        insights: "Create or reuse an Azure Application Insights resource and connect it to this Foundry project. Verify the project connection, managed-identity permissions and telemetry configuration. Ask before creating billable resources.",
        guided: "Use Agentic Loop to guide me through creating a complete agentic solution: clarify the use case, one or more agents, and the user experience. Ask focused questions and obtain approval before provisioning.",
        scenario: scenario ? `Use the Agentic Loop skill to build this complete solution.\n\n${scenario.prompt}\n\nIndustry: ${scenario.industry}` : null,
        custom: text,
        foundry: "Open the existing Microsoft Foundry Canvas in its Manage view for my use. Reuse its public canvas API, then synchronize the selected project using set_canvas_selected_foundry_project with the verified project ID and endpoint below. Resolve the tenant from the selected subscription before synchronization, especially when switching directories. Do not create or deploy anything. Keep this Agentic Loop panel available.",
        inspect: agent ? `Launch Agent Inspector locally for this existing Foundry agent using microsoft-foundry. Verify the project and agent version below. Use the deployed endpoint if supported; if local source is required, locate this agent's matching source and explain any missing prerequisites. Do not substitute another workspace agent, scaffold or redeploy. Verify Inspector is responding and open it in the integrated browser. Ask before installing missing tools or sending test prompts that may incur usage charges.\nAgent name: ${JSON.stringify(agent.name)}\nAgent version: ${agent.version == null ? "Resolve the latest version; none was returned by discovery." : JSON.stringify(agent.version)}` : null,
        optimizer: `Use the microsoft-foundry skill to help me improve an existing agent with Foundry Agent Optimizer: ${links.optimizer}. Confirm the target agent and baseline version/configuration in the selected project; ask if ambiguous. Check preview availability and whether this is a prompt or hosted agent. For hosted agents, inspect optimizer readiness before proposing the required integration. Reuse representative evaluation data and available evaluator/optimization model deployments; agree on quality criteria, optimization targets and a bounded run budget. Protect against tool side effects with test endpoints or approved mocks. Ask before billable runs, new resources, or applying/promoting a candidate and redeploying. Compare candidates against the baseline and report evidence, trade-offs and available measured usage; do not silently replace the running agent.`,
        evaluations: `Use the microsoft-foundry skill to create automatic evaluations for an existing agent following ${links.evaluations}. Confirm the target agent/version in the selected project and verify installed SDK compatibility, permissions, judge-model deployment and regional support. Reuse or create a representative, privacy-reviewed dataset; generate and review an agent-specific rubric with suitable quality, safety and tool-use evaluators. Define acceptance thresholds and a repeatable evaluation workflow that records run IDs, scores and failures. Clarify whether automation should run in CI on changes or through a supported scheduled/continuous evaluation workflow before configuring its trigger, cadence, sampling and budget. Protect against tool side effects. Ask before billable runs, data uploads, new resources or enabling recurring execution. Do not substitute a one-off evaluation for the agreed automation.`,
        insightsScan: `Use the microsoft-foundry skill to run an on-demand Foundry agent Insights scan following ${links.insightsScan}. Confirm the target agent/version and analysis window in the selected project; ask if ambiguous. Check preview availability, connected Application Insights, recent representative traces, a supported judge-model deployment, and the required user/project managed-identity access to telemetry and the model. Do not enable sensitive-content capture or broaden protected-data access without approval. Agree on scope and billable analysis before starting; do not enable a recurring schedule. Follow the asynchronous run to a terminal result with bounded polling and report its run ID, status and available usage. Review supporting traces before accepting findings, summarize affected versions and recommended evaluations or optimizations, and ask before applying fixes.`,
    };
    if (typeof prompts[kind] !== "string" || !prompts[kind].trim()) throw new Error("Choose a valid prompt.");
    if (["insights", "foundry", "inspect", "optimizer", "evaluations", "insightsScan"].includes(kind) && !project) throw new Error("Select a Foundry project first.");
    return `[Agentic Loop canvas action]\n${prompts[kind]}${context}`;
}

export class Model {
    constructor({ azure, session, scenarios, storage }) {
        this.azure = azure;
        this.session = session;
        this.scenarios = scenarios;
        this.storage = storage;
        this.state = { tab: "setup", scope: "project", subscriptionId: null, projectId: null, draft: "" };
        this.projects = [];
        this.subscriptions = [];
        this.projectWarnings = [];
        this.writes = Promise.resolve();
        this.envProjectKey = undefined;
        this.envProjectError = null;
        this.envProjectRetryAt = 0;
    }

    async load() {
        try { Object.assign(this.state, JSON.parse(await readFile(this.storage, "utf8"))); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
        if (this.state.tab === "cost" || Object.hasOwn(this.state, "estimate")) {
            if (this.state.tab === "cost") this.state.tab = "optimize";
            delete this.state.estimate;
            await this.save();
        }
    }

    async save() {
        const content = JSON.stringify(this.state, null, 2);
        this.writes = this.writes.catch(() => {}).then(async () => {
            await mkdir(path.dirname(this.storage), { recursive: true });
            await writeFile(`${this.storage}.tmp`, content, { mode: 0o600 });
            await rename(`${this.storage}.tmp`, this.storage);
        });
        await this.writes;
    }

    get project() { return this.projects.find(project => project.id === this.state.projectId) ?? null; }

    async setup() {
        const result = await outcome(async () => {
            const diagnostics = await this.session.rpc.skills.reload();
            if (diagnostics.errors.length) throw new Error(diagnostics.errors.join("; "));
            return this.session.rpc.skills.list();
        });
        const setup = await this.azure.prerequisites(result.data?.skills ?? []);
        if (result.status === "error") {
            setup.ready = false;
            setup.discoveryError = result.error;
        }
        return setup;
    }

    resourceState() {
        return { projects: this.projects, subscriptions: this.subscriptions, selected: this.project, subscriptionId: this.state.subscriptionId, warnings: this.projectWarnings };
    }

    async frontends(retry = false) {
        const result = await frontendStatus(this.session);
        const target = result.foundryProject;
        const key = target.id?.toLowerCase() ?? target.error;
        if (key !== this.envProjectKey || (this.envProjectError && (retry || Date.now() >= this.envProjectRetryAt))) {
            this.envProjectKey = key;
            this.envProjectError = target.error;
            if (target.id) {
                const sync = await outcome(() => this.discover(projectIdentity(target.id).subscriptionId, target.id));
                this.envProjectError = sync.status === "error" ? sync.error : null;
            }
            this.envProjectRetryAt = Date.now() + 30_000;
        }
        return { ...result, projectSync: {
            ...this.resourceState(),
            error: this.envProjectError,
        } };
    }

    async discover(subscriptionId, requiredProjectId) {
        if (!requiredProjectId) this.projects = [];
        const subscriptions = await this.azure.subscriptions();
        const requested = subscriptionId ?? this.state.subscriptionId ?? subscriptions[0]?.id;
        const id = subscriptions.find(row => row.id.toLowerCase() === requested?.toLowerCase())?.id;
        if (!requested) throw new Error("No enabled Azure subscriptions found. Sign in and recheck access.");
        if (!id) throw new Error("The selected subscription is no longer accessible. Select another subscription.");
        const result = await this.azure.projects(id);
        const preferredId = requiredProjectId ?? this.state.projectId;
        const selected = result.projects.find(project => project.id.toLowerCase() === preferredId?.toLowerCase());
        if (requiredProjectId && !selected) throw new Error(`The FOUNDRY_PROJECT in .env could not be found or accessed.${result.warnings.length ? ` ${result.warnings.join("; ")}` : ""}`);
        const previous = { subscriptions: this.subscriptions, projects: this.projects, warnings: this.projectWarnings, state: { ...this.state } };
        this.subscriptions = subscriptions;
        this.projects = result.projects;
        this.projectWarnings = result.warnings;
        this.state.subscriptionId = id;
        this.state.projectId = selected?.id ?? this.projects[0]?.id ?? null;
        try { await this.save(); }
        catch (error) {
            this.subscriptions = previous.subscriptions;
            this.projects = previous.projects;
            this.projectWarnings = previous.warnings;
            this.state = previous.state;
            throw error;
        }
        return { ...result, ...this.resourceState() };
    }

    async select(projectId) {
        if (!this.projects.some(project => project.id === projectId)) throw new Error("Refresh resources and select an available project.");
        this.state.projectId = projectId;
        await this.save();
        return this.project;
    }

    async send(input) {
        const scenario = input.scenarioId ? this.scenarios.find(row => row.id === input.scenarioId) : undefined;
        const prompt = promptFor(input.kind, { project: this.project, scenario, scope: input.scope ?? this.state.scope, text: input.text });
        const messageId = await this.session.send({ prompt });
        return { messageId, prompt };
    }

    async inspectAgent({ projectId, agentName }) {
        const project = this.project;
        if (!project || project.id !== projectId) throw new Error("The selected project changed. Refresh Explore before inspecting this agent.");
        if (typeof agentName !== "string" || !agentName.trim()) throw new Error("Choose an agent to inspect.");
        const agents = await this.azure.agents(project);
        const agent = agents.find(row => row.name === agentName);
        if (!agent) throw new Error("This agent is no longer available in the selected project. Refresh Explore.");
        if (this.project?.id !== project.id) throw new Error("The selected project changed. Refresh Explore before inspecting this agent.");
        const prompt = promptFor("inspect", { project, agent });
        const messageId = await this.session.send({ prompt });
        return { messageId, agentName: agent.name };
    }
}
