import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { outcome } from "./azure.mjs";

export const links = {
    devpack: "https://learn.microsoft.com/azure/foundry/how-to/develop/install-cli-sdk?tabs=macos%2Cpython%2Cazd-ai#install-foundry-devpack",
    quickstart: "https://learn.microsoft.com/azure/foundry/tutorials/quickstart-create-foundry-resources?tabs=azurecli",
    landingZone: "https://azure.github.io/AI-Landing-Zones/",
    pricing: "https://azure.microsoft.com/pricing/calculator/",
};

export const workloadFields = ["inputMillions", "outputMillions", "agentHours"];

export function validateWorkload(values) {
    for (const key of workloadFields) {
        if (typeof values[key] !== "number" || !Number.isFinite(values[key]) || values[key] < 0 || values[key] > 1e9) {
            throw new Error(`Enter a nonnegative, finite ${key} (at most 1 billion).`);
        }
    }
    return Object.fromEntries(workloadFields.map(key => [key, values[key]]));
}

export function promptFor(kind, { project, scenario, scope = "project", text, workload, agent } = {}) {
    if (!["project", "user"].includes(scope)) throw new Error("Skill scope must be project or user.");
    const context = project && !["quickstart", "landingZone"].includes(kind) ? `\nSelected Foundry project: ${project.id}\nEndpoint: ${project.endpoint ?? "resolve from Azure"}\nUse resource group ${project.resourceGroup} for additional solution resources; confirm any billable changes first.` : "";
    const prompts = {
        skills: `Help me install or enable the missing microsoft-foundry and agentic-loop skills at ${scope} scope using gh skill install microsoft/azure-skills microsoft-foundry and gh skill install aiappsgbb/agentic-loop agentic-loop with --agent github-copilot --scope ${scope}. Check gh availability first. Do not reinstall available skills. Recheck session skill discovery afterward.`,
        devpack: `Guide me through installing missing az, azd, and azd ai tools using Foundry DevPack: ${links.devpack}. Check my OS and installed tools first. DevPack may not include Azure CLI; if az is still missing, use Microsoft's Azure CLI installation instructions. Ask before installing anything.`,
        auth: "Help me authenticate Azure CLI and Azure Developer CLI with az login and azd auth login. Confirm the intended tenant and subscription; do not expose tokens.",
        quickstart: `Guide me through creating a Microsoft Foundry project using ${links.quickstart}. Clarify subscription, region, resource group and names, check permissions, estimate cost, and ask for approval before provisioning. Configure Application Insights for the project.`,
        landingZone: `Guide me through a production-ready enterprise AI deployment using Azure AI Landing Zones: ${links.landingZone}. Clarify governance, networking, identity, subscriptions, region and cost before provisioning.`,
        insights: "Create or reuse an Azure Application Insights resource and connect it to this Foundry project. Verify the project connection, managed-identity permissions and telemetry configuration. Ask before creating billable resources.",
        guided: "Use Agentic Loop to guide me through creating a complete agentic solution: clarify the use case, one or more agents, and the user experience. Ask focused questions and obtain approval before provisioning.",
        scenario: scenario ? `Use the Agentic Loop skill to build this complete solution.\n\n${scenario.prompt}\n\nIndustry: ${scenario.industry}` : null,
        custom: text,
        foundry: "Open the existing Microsoft Foundry Canvas in its Manage view for my use. Reuse its public canvas API, then synchronize the selected project using set_canvas_selected_foundry_project with the verified project ID and endpoint below. Resolve the tenant from the selected subscription before synchronization, especially when switching directories. Do not create or deploy anything. Keep this Agentic Loop panel available.",
        inspect: agent ? `Launch Agent Inspector locally for this existing Foundry agent using microsoft-foundry. Verify the project and agent version below. Use the deployed endpoint if supported; if local source is required, locate this agent's matching source and explain any missing prerequisites. Do not substitute another workspace agent, scaffold or redeploy. Verify Inspector is responding and open it in the integrated browser. Ask before installing missing tools or sending test prompts that may incur usage charges.\nAgent name: ${JSON.stringify(agent.name)}\nAgent version: ${agent.version == null ? "Resolve the latest version; none was returned by discovery." : JSON.stringify(agent.version)}` : null,
        cost: "Calculate the monthly cost estimate for this solution using the Azure Retail Prices API at https://prices.azure.com/api/retail/prices. Retrieve current retail prices matching the selected region, service, model, SKU and consumption meter; follow NextPageLink pagination and normalize unitOfMeasure before multiplying by workload. Use USD unless I request another currency. Break down model input/output tokens, hosted-agent compute, Application Insights, Container Apps, storage, networking and other deployed services. Clarify missing model, SKU, region and usage assumptions. Cite the API query URLs, meter identifiers, unit prices, currency and retrieval date. If an applicable price is unavailable, state that explicitly rather than inventing a rate or treating it as zero. Distinguish the estimate from actual billed spend, and state exclusions such as taxes, negotiated discounts and reserved pricing.",
    };
    if (typeof prompts[kind] !== "string" || !prompts[kind].trim()) throw new Error("Choose a valid prompt.");
    if (["insights", "foundry", "inspect"].includes(kind) && !project) throw new Error("Select a Foundry project first.");
    const usage = kind === "cost" && workload
        ? `\nMonthly workload: ${validateWorkload(workload).inputMillions} million input tokens, ${workload.outputMillions} million output tokens, and ${workload.agentHours} hosted-agent instance-hours (including replicas).`
        : "";
    return `[Agentic Loop canvas action]\n${prompts[kind]}${usage}${context}`;
}

export class Model {
    constructor({ azure, session, scenarios, storage }) {
        this.azure = azure;
        this.session = session;
        this.scenarios = scenarios;
        this.storage = storage;
        this.state = { tab: "setup", scope: "project", subscriptionId: null, projectId: null, estimate: null, draft: "" };
        this.projects = [];
        this.subscriptions = [];
        this.writes = Promise.resolve();
    }

    async load() {
        try { Object.assign(this.state, JSON.parse(await readFile(this.storage, "utf8"))); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
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

    async discover(subscriptionId) {
        this.projects = [];
        this.subscriptions = await this.azure.subscriptions();
        const id = subscriptionId ?? this.state.subscriptionId ?? this.subscriptions[0]?.id;
        if (!id) throw new Error("No enabled Azure subscriptions found. Sign in and recheck access.");
        if (!this.subscriptions.some(row => row.id === id)) throw new Error("The selected subscription is no longer accessible. Select another subscription.");
        const result = await this.azure.projects(id);
        this.projects = result.projects;
        this.state.subscriptionId = id;
        this.state.projectId = this.projects.find(project => project.id === this.state.projectId)?.id ?? this.projects[0]?.id ?? null;
        await this.save();
        return { ...result, subscriptions: this.subscriptions, selected: this.project };
    }

    async select(projectId) {
        if (!this.projects.some(project => project.id === projectId)) throw new Error("Refresh resources and select an available project.");
        this.state.projectId = projectId;
        await this.save();
        return this.project;
    }

    async send(input) {
        const scenario = input.scenarioId ? this.scenarios.find(row => row.id === input.scenarioId) : undefined;
        const prompt = promptFor(input.kind, { project: this.project, scenario, scope: input.scope ?? this.state.scope, text: input.text, workload: input.workload });
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
