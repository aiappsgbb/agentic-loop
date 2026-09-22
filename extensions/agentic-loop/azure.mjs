import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const arm = "https://management.azure.com";
const version = "2025-06-01";

export async function command(file, args, { json = true } = {}) {
    try {
        const { stdout } = await exec(file, args, {
            timeout: 60_000, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
            env: { ...process.env, AZURE_CORE_COLLECT_TELEMETRY: "no" },
        });
        return json ? JSON.parse(stdout) : stdout.trim();
    } catch (error) {
        if (error.code === "ENOENT") throw new Error(`${file} is not installed or is not on PATH.`);
        if (error.killed) throw new Error(`${file} timed out. Check Azure connectivity and try again.`);
        throw new Error(`${file}: ${(error.stderr || error.message).trim().slice(0, 1400)}`);
    }
}

export async function outcome(work) {
    try { return { status: "ready", data: await work() }; }
    catch (error) { return { status: "error", error: error.message }; }
}

export function projectIdentity(id) {
    const match = /^\/subscriptions\/([a-f0-9-]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.CognitiveServices\/accounts\/([^/]+)\/projects\/([^/]+)$/i.exec(id);
    if (!match) throw new Error("Not a Microsoft Foundry project resource ID.");
    return { subscriptionId: match[1], resourceGroup: match[2], account: match[3], name: match[4], accountId: id.slice(0, id.lastIndexOf("/projects/")) };
}

export function trustedEndpoint(endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".services.ai.azure.com") ||
        url.username || url.password || url.port || url.search || url.hash ||
        !/^\/api\/projects\/[^/]+\/?$/.test(url.pathname)) {
        throw new Error("Unsupported project endpoint. This canvas currently supports Azure public-cloud Foundry projects.");
    }
    return url.href.replace(/\/$/, "");
}

export function foundryPortalUrl(projectId, kind, name, agentVersion) {
    const project = projectIdentity(projectId);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(project.subscriptionId)) {
        throw new Error("Cannot link to Foundry: invalid subscription ID.");
    }
    if (typeof name !== "string" || !name.trim() || name === "." || name === "..") {
        throw new Error("Cannot link to Foundry: missing or invalid resource name.");
    }
    const subscription = Buffer.from(project.subscriptionId.replaceAll("-", ""), "hex").toString("base64url");
    const scope = [subscription, project.resourceGroup, "", project.account, project.name].map(encodeURIComponent).join(",");
    const base = `https://ai.azure.com/nextgen/r/${scope}/build`;
    if (kind === "model") return `${base}/models/deployments/${encodeURIComponent(name)}/playground`;
    if (kind === "toolbox") return `${base}/toolboxes/${encodeURIComponent(name)}`;
    if (kind !== "agent") throw new Error("Unsupported Foundry portal resource type.");
    const url = new URL(`${base}/agents/${encodeURIComponent(name)}/build`);
    if (agentVersion != null) url.searchParams.set("version", agentVersion);
    return url.href;
}

export function azurePortalUrl(resourceId) {
    if (typeof resourceId !== "string" ||
        !/^\/subscriptions\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\/resourceGroups\/[^/]+\/providers\/[^/]+(?:\/[^/]+\/[^/]+)+$/i.test(resourceId) ||
        resourceId.split("/").some(segment => segment === "." || segment === "..")) {
        throw new Error("Cannot link to Azure Portal: missing or invalid resource ID.");
    }
    return `https://portal.azure.com/#resource${resourceId.split("/").map(encodeURIComponent).join("/")}/overview`;
}

export class Azure {
    constructor(run = command) { this.run = run; }

    async rest(url, { resource, body } = {}) {
        const args = ["rest", "--method", body ? "post" : "get", "--url", url, "--only-show-errors", "-o", "json"];
        if (resource) args.push("--resource", resource);
        if (body) args.push("--body", JSON.stringify(body));
        return this.run("az", args);
    }

    async pages(url, resource) {
        const original = new URL(url);
        const rows = [];
        const seen = new Set();
        while (url) {
            const next = new URL(url, original);
            if (next.origin !== original.origin || next.pathname !== original.pathname || seen.has(next.href) || seen.size >= 100) {
                throw new Error("Azure returned an unsafe or excessive pagination link.");
            }
            seen.add(next.href);
            const data = await this.rest(next.href, { resource });
            const page = data.value ?? data.data;
            if (!Array.isArray(page)) throw new Error("Azure returned an unexpected list response.");
            rows.push(...page);
            url = data.nextLink ?? data.next_link;
            if (!url && data.has_more) throw new Error("Azure returned additional results without a continuation link.");
        }
        return rows;
    }

    async prerequisites(skills) {
        const checks = await Promise.all([
            ...["microsoft-foundry", "agentic-loop"].map(async name => ({
                id: name, label: `${name} skill`, ...await outcome(async () => {
                    const skill = skills.find(item => item.name === name && item.enabled);
                    if (!skill) throw new Error("Not available to this session. Install or enable it, then recheck.");
                    return `Enabled (${skill.source})`;
                }),
            })),
            ...[
                ["az", "Azure CLI", "az", ["version"], true],
                ["azd", "Azure Developer CLI", "azd", ["version"], false],
                ["azd-ai", "Foundry CLI extension", "azd", ["ai", "project", "version"], false],
                ["az-auth", "Azure CLI authentication", "az", ["account", "get-access-token", "--query", "{expiresOn:expiresOn}", "-o", "json"], true],
                ["azd-auth", "Azure Developer CLI authentication", "azd", ["auth", "login", "--check-status"], false],
            ].map(async ([id, label, file, args, json]) => ({
                id, label, ...await outcome(async () => {
                    const result = await this.run(file, args, { json });
                    return id === "az" ? result["azure-cli"] : id === "az-auth" ? `Token valid until ${result.expiresOn}` : result;
                }),
            })),
        ]);
        return { checks, ready: checks.every(check => check.status === "ready"), checkedAt: new Date().toISOString() };
    }

    async subscriptions() {
        return (await this.run("az", ["account", "list", "--only-show-errors", "-o", "json"]))
            .filter(row => row.state === "Enabled")
            .map(({ id, name, tenantId, isDefault }) => ({ id, name, tenantId, isDefault }))
            .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
    }

    async projects(subscriptionId) {
        const accounts = await this.run("az", ["cognitiveservices", "account", "list", "--subscription", subscriptionId, "--only-show-errors", "-o", "json"]);
        const results = await Promise.all(accounts.filter(account => account.kind === "AIServices" && account.properties?.allowProjectManagement)
            .map(account => outcome(async () => {
                const projects = await this.pages(`${arm}${account.id}/projects?api-version=${version}`);
                return projects.map(project => ({
                    id: project.id, ...projectIdentity(project.id), location: project.location,
                    endpoint: project.properties?.endpoints?.["AI Foundry API"] ?? null,
                }));
            })));
        return {
            projects: results.flatMap(result => result.data ?? []).sort((a, b) => a.name.localeCompare(b.name)),
            warnings: results.filter(result => result.status === "error").map(result => result.error),
        };
    }

    async monitoring(project) {
        const connections = await this.pages(`${arm}${project.id}/connections?api-version=${version}`);
        const insights = connections.filter(row => /app(?:lication)?insights/i.test(row.properties?.category ?? ""));
        return { connected: insights.length > 0, names: insights.map(row => row.name) };
    }

    async agents(project) {
        const rows = await this.pages(`${trustedEndpoint(project.endpoint)}/agents?api-version=v1`, "https://ai.azure.com");
        return rows.map(row => ({
            name: row.name ?? row.id,
            version: row.versions?.latest?.version ?? null,
            detail: row.versions?.latest?.definition?.kind ?? row.object ?? "Agent",
            metadata: row.versions?.latest?.definition?.kind ? [{ label: "Type", value: row.versions.latest.definition.kind }] : [],
            playgroundUrl: foundryPortalUrl(project.id, "agent", row.name ?? row.id, row.versions?.latest?.version),
        }));
    }

    async explore(project) {
        const dataList = path => {
            const endpoint = trustedEndpoint(project.endpoint);
            return this.pages(`${endpoint}/${path}?api-version=v1`, "https://ai.azure.com");
        };
        const [agents, models, tools, resources] = await Promise.all([
            outcome(() => this.agents(project)),
            outcome(async () => (await this.pages(`${arm}${project.accountId}/deployments?api-version=${version}`)).map(row => ({
                name: row.name, detail: [row.properties?.model?.name, row.properties?.model?.version, row.sku?.name].filter(Boolean).join(" / "),
                metadata: [
                    { label: "Model", value: row.properties?.model?.name },
                    { label: "Version", value: row.properties?.model?.version },
                    { label: "SKU", value: row.sku?.name },
                ].filter(item => item.value),
                playgroundUrl: foundryPortalUrl(project.id, "model", row.name),
            }))),
            outcome(async () => (await dataList("toolboxes")).map(row => ({
                name: row.name, detail: row.description ?? "Governed toolbox",
                portalUrl: foundryPortalUrl(project.id, "toolbox", row.name),
            }))),
            outcome(async () => (await this.run("az", ["resource", "list", "--subscription", project.subscriptionId,
                "--resource-group", project.resourceGroup, "--only-show-errors", "-o", "json"])).map(row => ({
                id: row.id, name: row.name, detail: row.type, portalUrl: azurePortalUrl(row.id),
            }))),
        ]);
        return { agents, models, tools, resources, checkedAt: new Date().toISOString() };
    }

    async cost(project) {
        const scope = `/subscriptions/${project.subscriptionId}/resourceGroups/${project.resourceGroup}`;
        const data = await this.rest(`${arm}${scope}/providers/Microsoft.CostManagement/query?api-version=2023-03-01`, {
            body: {
                type: "ActualCost", timeframe: "MonthToDate",
                dataset: { granularity: "None", aggregation: { totalCost: { name: "PreTaxCost", function: "Sum" } },
                    grouping: [{ type: "Dimension", name: "ServiceName" }] },
            },
        });
        if (data.properties?.nextLink) throw new Error("Cost results were paginated; open Azure Cost Management for a complete total.");
        const columns = data.properties?.columns?.map(column => column.name);
        if (!columns?.includes("PreTaxCost") || !columns.includes("Currency")) throw new Error("Unexpected Azure cost response.");
        return {
            rows: (data.properties.rows ?? []).map(row => ({
                service: row[columns.indexOf("ServiceName")], amount: row[columns.indexOf("PreTaxCost")], currency: row[columns.indexOf("Currency")],
            })),
            scope, checkedAt: new Date().toISOString(),
        };
    }
}
