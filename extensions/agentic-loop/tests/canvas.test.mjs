import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Azure, projectIdentity, trustedEndpoint, foundryPortalUrl, azurePortalUrl } from "../azure.mjs";
import { Model, links, promptFor } from "../model.mjs";
import { startServer } from "../server.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const id = "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-demo/providers/Microsoft.CognitiveServices/accounts/demo/projects/demo-project";
const project = { id, ...projectIdentity(id), endpoint: "https://demo.services.ai.azure.com/api/projects/demo-project" };

test("project parsing and endpoint allowlist reject arbitrary hosts and credentials", () => {
    assert.equal(project.resourceGroup, "rg-demo");
    assert.equal(trustedEndpoint(project.endpoint), project.endpoint);
    for (const endpoint of ["http://localhost/api/projects/test", "https://evil.com/api/projects/test",
        "https://a.services.ai.azure.com.evil.com/api/projects/test", "https://user@demo.services.ai.azure.com/api/projects/test",
        `${project.endpoint}?api-key=secret`]) assert.throws(() => trustedEndpoint(endpoint));
    assert.throws(() => projectIdentity("/subscriptions/x"));
});

test("setup checks all tools and requires enabled skills and valid authentication", async () => {
    const calls = [];
    const azure = new Azure(async (file, args) => {
        calls.push([file, args]);
        if (args[0] === "version" && file === "az") return { "azure-cli": "2.88" };
        if (args.includes("get-access-token")) return { expiresOn: "later" };
        return "Available";
    });
    const skills = ["agentic-loop", "microsoft-foundry"].map(name => ({ name, enabled: true, source: "project" }));
    assert.equal((await azure.prerequisites(skills)).ready, true);
    assert(calls.some(([, args]) => args.includes("--check-status")));
    assert(calls.some(([, args]) => args.includes("get-access-token") && args.includes("--query")));
    skills[0].enabled = false;
    assert.equal((await azure.prerequisites(skills)).ready, false);
    const failed = await new Azure(async () => { throw new Error("Not authenticated"); }).prerequisites(skills);
    assert.equal(failed.ready, false);
    assert.match(failed.checks.find(row => row.id === "az-auth").error, /Not authenticated/);
});

test("Azure pagination is complete and refuses cross-origin continuations", async () => {
    const url = "https://management.azure.com/test?api-version=1";
    let count = 0;
    const azure = new Azure(async () => ++count === 1 ? { value: [1], nextLink: `${url}&page=2` } : { value: [2] });
    assert.deepEqual(await azure.pages(url), [1, 2]);
    const evil = new Azure(async () => ({ value: [], nextLink: "https://evil.com/test" }));
    await assert.rejects(evil.pages(url), /unsafe/);
});

test("monitoring does not mistake a same-resource-group resource for a project connection", async () => {
    const empty = new Azure(async () => ({ value: [] }));
    assert.equal((await empty.monitoring(project)).connected, false);
    const connected = new Azure(async () => ({ value: [{ name: "telemetry", properties: { category: "AppInsights" } }] }));
    assert.deepEqual(await connected.monitoring(project), { connected: true, names: ["telemetry"] });
    await assert.rejects(new Azure(async () => { throw new Error("Forbidden"); }).monitoring(project), /Forbidden/);
});

test("Foundry portal links encode project scope, resource names and agent versions", () => {
    const prefix = "https://ai.azure.com/nextgen/r/EREREREREREREREREREREQ,rg-demo,,demo,demo-project/build";
    assert.equal(foundryPortalUrl(id, "agent", "support-agent", "4"),
        `${prefix}/agents/support-agent/build?version=4`);
    assert.equal(foundryPortalUrl(id, "agent", "support-agent"),
        `${prefix}/agents/support-agent/build`);
    assert.equal(foundryPortalUrl(id, "model", "gpt-4o"),
        `${prefix}/models/deployments/gpt-4o/playground`);
    assert.equal(foundryPortalUrl(id, "toolbox", "support-tools"),
        `${prefix}/toolboxes/support-tools`);
    assert.equal(foundryPortalUrl(id, "toolbox", "tools /?&#"),
        `${prefix}/toolboxes/tools%20%2F%3F%26%23`);
    const escaped = new URL(foundryPortalUrl(id, "agent", "name /?&#", "1&other=value"));
    assert(escaped.pathname.endsWith("/agents/name%20%2F%3F%26%23/build"));
    assert.deepEqual([...escaped.searchParams], [["version", "1&other=value"]]);
    const scoped = foundryPortalUrl(id.replace("rg-demo", "rg, special").replace("demo-project", "project#one"), "model", "a/b");
    assert(scoped.includes(",rg%2C%20special,,demo,project%23one/"));
    assert(scoped.endsWith("/models/deployments/a%2Fb/playground"));
    assert.throws(() => foundryPortalUrl(id, "agent", ""));
    assert.throws(() => foundryPortalUrl(id, "agent", ".."));
    assert.throws(() => foundryPortalUrl(id, "unsupported", "tools"));
    assert.throws(() => foundryPortalUrl(id.replace(project.subscriptionId, "bad"), "model", "model"));
});

test("Azure portal links use the full resource ID and encode fragment delimiters", () => {
    const resourceId = `/subscriptions/${project.subscriptionId}/resourceGroups/rg-demo/providers/Microsoft.Insights/components/monitoring`;
    assert.equal(azurePortalUrl(resourceId), `https://portal.azure.com/#resource${resourceId}/overview`);
    const nested = `${resourceId}/providers/Microsoft.Insights/diagnosticSettings/logs`;
    assert.equal(azurePortalUrl(nested), `https://portal.azure.com/#resource${nested}/overview`);
    assert.equal(azurePortalUrl(resourceId.replace("monitoring", "name #?&%")),
        `https://portal.azure.com/#resource${resourceId.replace("monitoring", "name%20%23%3F%26%25")}/overview`);
    for (const invalid of [undefined, "", "https://evil.example", "/subscriptions/bad", `${resourceId}/..`]) {
        assert.throws(() => azurePortalUrl(invalid), /invalid resource ID/);
    }
});

test("inventory exposes structured metadata and per-resource testing links while preserving partial errors", async () => {
    const azure = new Azure(async (_file, args) => {
        const url = args[args.indexOf("--url") + 1] ?? "";
        if (url.includes("/agents?")) return { data: [
            { name: "support", versions: { latest: { version: "7", definition: { kind: "hosted" } } } },
            { name: "prompt-agent", versions: { latest: { definition: { kind: "prompt" } } } },
        ] };
        if (url.includes("/deployments?")) return { value: [
            { name: "chat-production", properties: { model: { name: "gpt-4o", version: "2024-08-06" } }, sku: { name: "GlobalStandard" } },
            { name: "embedding-production" },
        ] };
        if (url.includes("/toolboxes?")) throw new Error("Toolbox access denied");
        return [{ id: `${project.accountId}/deployments/chat-production`, name: "chat-production", type: "Microsoft.CognitiveServices/accounts/deployments" }];
    });
    const result = await azure.explore(project);
    assert.equal(result.agents.status, "ready");
    assert.equal(result.agents.data[0].version, "7");
    assert.equal(result.agents.data[1].version, null);
    assert.deepEqual(result.agents.data[0].metadata, [{ label: "Type", value: "hosted" }]);
    assert.equal(new URL(result.agents.data[0].playgroundUrl).searchParams.get("version"), "7");
    assert(result.agents.data[1].playgroundUrl.endsWith("/agents/prompt-agent/build"));
    assert.deepEqual(result.models.data[0].metadata, [
        { label: "Model", value: "gpt-4o" }, { label: "Version", value: "2024-08-06" }, { label: "SKU", value: "GlobalStandard" },
    ]);
    assert(result.models.data[0].playgroundUrl.endsWith("/models/deployments/chat-production/playground"));
    assert.deepEqual(result.models.data[1].metadata, []);
    assert.equal(result.tools.status, "error");
    assert.equal(result.tools.error, "Toolbox access denied");
    assert.equal(result.resources.data[0].playgroundUrl, undefined);
    assert.equal(result.resources.data[0].portalUrl, azurePortalUrl(`${project.accountId}/deployments/chat-production`));
});

test("toolbox inventory links to the named toolbox in the selected project", async () => {
    const azure = new Azure(async (_file, args) => {
        const url = args[args.indexOf("--url") + 1] ?? "";
        if (url.includes("/toolboxes?")) return { value: [{ name: "support-tools", description: "Customer tools" }] };
        return args[0] === "resource" ? [] : { value: [] };
    });
    const result = await azure.explore(project);
    assert.equal(result.tools.status, "ready");
    assert.deepEqual(result.tools.data, [{
        name: "support-tools", detail: "Customer tools",
        portalUrl: foundryPortalUrl(project.id, "toolbox", "support-tools"),
    }]);
});

test("Optimize prompts include official guidance, selected project and operation-specific safeguards", () => {
    for (const kind of ["optimizer", "evaluations", "insightsScan"]) {
        const prompt = promptFor(kind, { project });
        assert(prompt.startsWith("[Agentic Loop canvas action]"));
        assert(prompt.includes("microsoft-foundry"));
        assert(prompt.includes(links[kind]));
        assert(prompt.includes(id));
        assert(prompt.includes(project.endpoint));
        assert(prompt.endsWith("Use resource group rg-demo for additional solution resources."));
        assert.throws(() => promptFor(kind), /Select a Foundry project/);
    }
    const optimizer = promptFor("optimizer", { project });
    assert(optimizer.includes("prompt or hosted agent"));
    assert(optimizer.includes("optimizer readiness"));
    assert(optimizer.includes("tool side effects"));
    assert(optimizer.includes("Ask before billable runs"));
    assert(optimizer.includes("do not silently replace the running agent"));
    const evaluations = promptFor("evaluations", { project });
    assert(evaluations.includes("CI on changes"));
    assert(evaluations.includes("scheduled/continuous"));
    assert(evaluations.includes("acceptance thresholds"));
    assert(evaluations.includes("enabling recurring execution"));
    const scan = promptFor("insightsScan", { project });
    assert(scan.includes("on-demand"));
    assert(scan.includes("required user/project managed-identity access"));
    assert(scan.includes("Do not enable sensitive-content capture"));
    assert(scan.includes("do not enable a recurring schedule"));
    assert(scan.includes("bounded polling"));
    assert.throws(() => promptFor("cost", { project }), /valid prompt/);
    assert(promptFor("insights", { project }).includes("connect it to this Foundry project"));
});

test("Optimize sends one Chat prompt per action and surfaces missing context or delivery errors", async () => {
    const sent = [];
    const model = new Model({ scenarios: [], session: { send: async input => { sent.push(input); return "message-1"; } } });
    for (const kind of ["optimizer", "evaluations", "insightsScan"]) {
        await assert.rejects(model.send({ kind }), /Select a Foundry project/);
    }
    assert.equal(sent.length, 0);
    model.projects = [project];
    model.state.projectId = project.id;
    for (const kind of ["optimizer", "evaluations", "insightsScan"]) {
        assert.equal((await model.send({ kind })).messageId, "message-1");
        assert.equal(sent.at(-1).prompt, promptFor(kind, { project }));
    }
    assert.equal(sent.length, 3);
    model.session.send = async () => { throw new Error("Chat unavailable"); };
    await assert.rejects(model.send({ kind: "optimizer" }), /Chat unavailable/);
});

test("saved Cost tab migrates to Optimize and removed estimator state stays removed", async t => {
    const directory = await mkdtemp(path.join(tmpdir(), "agentic-loop-migration-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const storage = path.join(directory, "settings.json");
    for (const tab of ["cost", "explore"]) {
        await writeFile(storage, JSON.stringify({ tab, scope: "user", projectId: id, draft: "Keep my draft", estimate: { inputMillions: 5 } }));
        const model = new Model({ storage });
        await model.load();
        assert.equal(model.state.tab, tab === "cost" ? "optimize" : tab);
        assert.equal(model.state.scope, "user");
        assert.equal(model.state.projectId, id);
        assert.equal(model.state.draft, "Keep my draft");
        assert(!Object.hasOwn(model.state, "estimate"));
        assert.deepEqual(JSON.parse(await readFile(storage, "utf8")), model.state);
        const restored = new Model({ storage });
        await restored.load();
        assert.deepEqual(restored.state, model.state);
    }
});

test("prompts preserve scenario content and selected resource context", () => {
    const scenario = { prompt: "Build a manufacturing assistant.", industry: "Manufacturing" };
    const prompt = promptFor("scenario", { scenario, project });
    assert(prompt.includes("Use the Agentic Loop skill to build this complete solution."));
    assert(prompt.includes(scenario.prompt));
    assert(prompt.includes(id));
    assert(prompt.includes("rg-demo"));
    assert(prompt.endsWith("Use resource group rg-demo for additional solution resources."));
    assert(!prompt.includes("confirm any billable changes first"));
    assert.equal(promptFor("scenario", { scenario }),
        `[Agentic Loop canvas action]\nUse the Agentic Loop skill to build this complete solution.\n\n${scenario.prompt}\n\nIndustry: Manufacturing`);
    assert(promptFor("skills").includes("--scope project"));
    assert(promptFor("skills", { scope: "user" }).includes("--scope user"));
    assert.throws(() => promptFor("skills", { scope: "all" }));
    assert.throws(() => promptFor("scenario"));
    assert.throws(() => promptFor("foundry"));
});

test("guided prompts omit lifecycle and platform instructions while retaining project context", () => {
    assert.equal(promptFor("guided"),
        "[Agentic Loop canvas action]\nUse Agentic Loop to guide me through creating a complete agentic solution: clarify the use case, one or more agents, and the user experience. Ask focused questions and obtain approval before provisioning.");
    assert(promptFor("guided", { project }).includes(id));
});

test("local inspection requests verify the selected agent and include its project and latest version", async () => {
    const sent = [];
    const model = new Model({
        azure: { agents: async selected => {
            assert.equal(selected.id, id);
            return [{ name: "support-agent", version: "7" }];
        } },
        session: { send: async input => { sent.push(input); return "inspection-message"; } },
    });
    model.projects = [project];
    model.state.projectId = id;
    assert.deepEqual(await model.inspectAgent({ projectId: id, agentName: "support-agent" }),
        { messageId: "inspection-message", agentName: "support-agent" });
    const prompt = sent[0].prompt;
    assert(prompt.includes("Launch Agent Inspector locally"));
    assert(prompt.includes('Agent name: "support-agent"'));
    assert(prompt.includes('Agent version: "7"'));
    assert(prompt.includes(project.id));
    assert(prompt.includes(project.endpoint));
    assert(prompt.includes("Do not substitute another workspace agent, scaffold or redeploy."));
    assert(prompt.includes("Ask before installing missing tools or sending test prompts"));
    await assert.rejects(model.inspectAgent({ projectId: `${id}-stale`, agentName: "support-agent" }), /project changed/);
    await assert.rejects(model.inspectAgent({ projectId: id, agentName: "deleted-agent" }), /no longer available/);
    await assert.rejects(model.inspectAgent({ projectId: id, agentName: "" }), /Choose an agent/);
    assert.equal(sent.length, 1);
    assert.throws(() => promptFor("inspect", { agent: { name: "support-agent" } }), /Select a Foundry project/);
    assert.throws(() => promptFor("inspect", { project }), /valid prompt/);
    assert(promptFor("inspect", { project, agent: { name: "support-agent", version: null } }).includes("Resolve the latest version"));
});

test("local inspection does not send requests after discovery failure or a project switch", async () => {
    let sends = 0;
    const model = new Model({
        azure: { agents: async () => { throw new Error("Agent access denied"); } },
        session: { send: async () => { sends++; } },
    });
    model.projects = [project];
    model.state.projectId = id;
    const input = { projectId: id, agentName: "support-agent" };
    await assert.rejects(model.inspectAgent(input), /Agent access denied/);
    model.azure.agents = async () => {
        model.state.projectId = null;
        return [{ name: "support-agent" }];
    };
    await assert.rejects(model.inspectAgent(input), /project changed/);
    assert.equal(sends, 0);
    model.state.projectId = id;
    model.azure.agents = async () => [{ name: "support-agent" }];
    model.session.send = async () => { throw new Error("Chat unavailable"); };
    await assert.rejects(model.inspectAgent(input), /Chat unavailable/);
});

test("quickstart prompts end after Application Insights without selected project context", () => {
    const prompt = promptFor("quickstart", { project });
    assert(prompt.endsWith("Configure Application Insights for the project."));
    assert.equal(prompt, promptFor("quickstart"));
    assert(!prompt.includes(id));
});

test("landing zone prompts end before selected project context", () => {
    const prompt = promptFor("landingZone", { project });
    assert(prompt.endsWith("Clarify governance, networking, identity, subscriptions, region and cost before provisioning."));
    assert.equal(prompt, promptFor("landingZone"));
    assert(!prompt.includes(id));
});

test("project choice persists across panel instances and reloads; prompts use session.send", async t => {
    const directory = await mkdtemp(path.join(tmpdir(), "agentic-loop-test-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const second = { ...project, id: `${id}-two`, name: "second" };
    const sent = [];
    const options = {
        azure: { subscriptions: async () => [{ id: project.subscriptionId }], projects: async () => ({ projects: [project, second], warnings: [] }) },
        session: { send: async input => { sent.push(input); return "message-1"; } },
        scenarios: [], storage: path.join(directory, "settings.json"),
    };
    const first = new Model(options);
    await first.load();
    assert.equal((await first.discover()).selected.id, id);
    await first.select(second.id);
    const reloaded = new Model(options);
    await reloaded.load();
    assert.equal((await reloaded.discover()).selected.id, second.id);
    await reloaded.send({ kind: "guided" });
    assert(sent[0].prompt.includes(second.id));
    await reloaded.send({ kind: "optimizer" });
    assert(sent[1].prompt.includes(links.optimizer));
    assert(sent[1].prompt.includes(second.id));
    await assert.rejects(reloaded.select("not-discovered"), /available/);
    await assert.rejects(reloaded.discover("not-accessible"), /accessible/);
    assert.equal(reloaded.project, null);
});

test("rechecking setup reloads newly installed skills and surfaces discovery failures", async () => {
    let reloaded = false;
    const model = new Model({
        azure: { prerequisites: async skills => ({ ready: skills.length === 2 }) },
        session: { rpc: { skills: {
            reload: async () => { reloaded = true; return { errors: [], warnings: [] }; },
            list: async () => { assert(reloaded); return { skills: [{ name: "agentic-loop" }, { name: "microsoft-foundry" }] }; },
        } } },
    });
    assert.equal((await model.setup()).ready, true);
    model.session.rpc.skills.reload = async () => ({ errors: ["Skill definition is invalid"], warnings: [] });
    const failed = await model.setup();
    assert.equal(failed.ready, false);
    assert.match(failed.discoveryError, /invalid/);
});

test("cost queries are scoped to the selected resource group and preserve currency", async () => {
    let args;
    const azure = new Azure(async (_file, input) => {
        args = input;
        return { properties: { columns: [{ name: "Currency" }, { name: "PreTaxCost" }, { name: "ServiceName" }], rows: [["EUR", 12.5, "Azure AI"]] } };
    });
    const cost = await azure.cost(project);
    assert.deepEqual(cost.rows, [{ service: "Azure AI", amount: 12.5, currency: "EUR" }]);
    assert(args.includes("post"));
    assert(args.some(value => value.includes("/resourceGroups/rg-demo/providers/Microsoft.CostManagement/query")));
    assert.equal(JSON.parse(args[args.indexOf("--body") + 1]).timeframe, "MonthToDate");
});

test("server protects actions and state while serving only allowlisted scenario images", async t => {
    const scenarios = JSON.parse(await readFile(path.join(root, "../src/data/scenarios.json"), "utf8"));
    const entry = await startServer({
        assets: path.join(root, "agentic-loop/public"), images: path.join(root, "../public/images"), scenarios,
        snapshot: async () => ({ marker: "private" }), dispatch: async (action, input) => ({ action, input }),
    });
    t.after(() => entry.close());
    const url = new URL(entry.url);
    assert.equal(url.hostname, "127.0.0.1");
    const html = await (await fetch(entry.url)).text();
    assert(!html.includes("__CANVAS_TOKEN__"));
    assert.equal((await fetch(url.origin)).status, 403);
    assert.equal((await fetch(`${url.origin}/api/state`)).status, 403);
    const headers = { "X-Canvas-Token": url.searchParams.get("key"), "Content-Type": "application/json" };
    assert.equal((await fetch(`${url.origin}/api/state`, { headers })).status, 200);
    assert.equal((await fetch(`${url.origin}/api/action`, { method: "POST", headers: { ...headers, Origin: "https://evil.com" }, body: "{}" })).status, 403);
    const response = await fetch(`${url.origin}/api/action`, { method: "POST", headers, body: JSON.stringify({ action: "setup", input: {} }) });
    assert.deepEqual(await response.json(), { action: "setup", input: {} });
    assert.equal((await fetch(`${url.origin}/${scenarios[0].image}`)).status, 200);
    assert.equal((await fetch(`${url.origin}/images/not-allowed.jpg`)).status, 403);
});
