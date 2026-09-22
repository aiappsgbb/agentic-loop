import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { joinSession, createCanvas, CanvasError } from "@github/copilot-sdk/extension";
import { Azure } from "./azure.mjs";
import { Model } from "./model.mjs";
import { startServer } from "./server.mjs";
import { openFrontend } from "./frontends.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
let dataRoot = path.join(root, "assets");
try { await access(path.join(dataRoot, "scenarios.json")); }
catch (error) {
    if (error.code !== "ENOENT") throw error;
    dataRoot = path.resolve(root, "../../src/data");
}
const scenarios = JSON.parse(await readFile(path.join(dataRoot, "scenarios.json"), "utf8"));
const images = dataRoot === path.join(root, "assets") ? path.join(dataRoot, "images") : path.resolve(root, "../../public/images");
const servers = new Map();
const tabs = ["setup", "resources", "build", "explore", "optimize"];
let model;
let resolveReady;
let rejectReady;
const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
let mutation = Promise.resolve();

const objectSchema = properties => ({ type: "object", properties, additionalProperties: false });
const schemas = {
    setup: objectSchema({}),
    discover: objectSchema({ subscriptionId: { type: "string" } }),
    select: { ...objectSchema({ projectId: { type: "string" } }), required: ["projectId"] },
    monitoring: objectSchema({}),
    explore: objectSchema({}),
    inspect_agent: { ...objectSchema({ projectId: { type: "string" }, agentName: { type: "string", maxLength: 256 } }), required: ["projectId", "agentName"] },
    frontends: objectSchema({ retry: { type: "boolean" } }),
    open_frontend: { ...objectSchema({ frontend: { enum: ["local", "deployed"] } }), required: ["frontend"] },
    usage: objectSchema({}),
    cost: objectSchema({}),
    preferences: objectSchema({ tab: { enum: tabs }, scope: { enum: ["project", "user"] }, draft: { type: "string", maxLength: 16000 } }),
    refresh_foundry: objectSchema({}),
    prompt: { ...objectSchema({
        kind: { enum: ["skills", "devpack", "auth", "quickstart", "landingZone", "insights", "guided", "scenario", "custom", "foundry", "optimizer", "evaluations", "insightsScan"] },
        scenarioId: { type: "string" }, scope: { enum: ["project", "user"] }, text: { type: "string", maxLength: 16000 },
    }), required: ["kind"] },
};

export function validate(action, input) {
    const schema = schemas[action];
    if (!schema || !input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid canvas action.");
    for (const key of schema.required ?? []) if (!(key in input)) throw new Error(`${key} is required.`);
    for (const [key, value] of Object.entries(input)) {
        const rule = schema.properties[key];
        if (!rule || (rule.type && typeof value !== rule.type) || (rule.enum && !rule.enum.includes(value)) ||
            (rule.maxLength && value.length > rule.maxLength)) throw new Error(`Invalid ${key}.`);
    }
}

async function perform(action, input) {
    await ready;
    validate(action, input);
    const project = model.project;
    switch (action) {
        case "setup": return model.setup();
        case "discover": return model.discover(input.subscriptionId);
        case "select": return model.select(input.projectId);
        case "usage": return model.session.rpc.usage.getMetrics();
        case "frontends": return model.frontends(input.retry);
        case "open_frontend": return openFrontend(model.session, input.frontend);
        case "inspect_agent": return model.inspectAgent(input);
        case "refresh_foundry": {
            const open = await model.session.rpc.canvas.listOpen();
            const panel = open.openCanvases.find(row => row.canvasId === "agent-builder");
            if (!panel) throw new Error("Open Microsoft Foundry Canvas first using the button above.");
            const result = await model.session.rpc.canvas.action.invoke({
                instanceId: panel.instanceId, actionName: "refreshWorkspaceState",
            });
            return result;
        }
        case "preferences": Object.assign(model.state, input); await model.save(); return model.state;
        case "prompt": return model.send(input);
        default:
            if (!project) throw new Error("Select a Foundry project on Resources first.");
            if (action === "monitoring") return model.azure.monitoring(project);
            if (action === "explore") return model.azure.explore(project);
            if (action === "cost") return model.azure.cost(project);
            throw new Error("Unknown action.");
    }
}

function dispatch(action, input = {}) {
    // Serialize state changes; a slow subscription discovery cannot overwrite a later selection.
    if (["discover", "select", "frontends", "preferences", "prompt", "inspect_agent"].includes(action)) {
        const result = mutation.then(() => perform(action, input));
        mutation = result.catch(() => {});
        return result;
    }
    return perform(action, input);
}

const session = await joinSession({
    canvases: [createCanvas({
        id: "agentic-loop",
        displayName: "Agentic Loop",
        description: "Build and improve agentic solutions with setup, Foundry resources, scenarios, exploration, optimization and evaluation prompts, and session and Azure costs.",
        inputSchema: objectSchema({ tab: { enum: tabs } }),
        actions: Object.entries(schemas).map(([name, inputSchema]) => ({
            name, inputSchema,
            description: {
                setup: "Check enabled skills, CLI tools and Azure authentication.",
                discover: "Discover accessible Foundry projects and default to the first available.",
                select: "Select a discovered project and persist it for this session.",
                monitoring: "Check the selected project's Application Insights connections.",
                explore: "List agents, model deployments, toolboxes and resource-group resources.",
                inspect_agent: "Ask Copilot in Chat to launch local Agent Inspector for a verified agent in the selected project; starts a Copilot turn.",
                frontends: "Read frontend URLs and synchronize changed FOUNDRY_PROJECT from workspace .env; retry failed project discovery on request.",
                open_frontend: "Open a configured frontend in the integrated browser, rereading its URL from .env.",
                usage: "Get actual accumulated current-session usage by model.",
                cost: "Query resource-group month-to-date actual Azure spend.",
                preferences: "Save the active tab and preferred skill installation scope.",
                refresh_foundry: "Reuse the existing Foundry canvas public refreshWorkspaceState action.",
                prompt: "Send a user-reviewed canvas prompt to Chat; this starts a Copilot turn.",
            }[name],
            handler: async ctx => {
                try { return await dispatch(name, ctx.input ?? {}); }
                catch (error) { throw new CanvasError("agentic_loop_error", error.message); }
            },
        })),
        open: async ctx => {
            await ready;
            if (ctx.input?.tab) await dispatch("preferences", { tab: ctx.input.tab });
            let entry = servers.get(ctx.instanceId);
            if (!entry) {
                entry = await startServer({
                    assets: path.join(root, "public"), images, scenarios, dispatch,
                    snapshot: async () => ({
                        state: model.state, scenarios, project: model.project,
                        sessionId: session.sessionId,
                    }),
                });
                servers.set(ctx.instanceId, entry);
            }
            return { title: "Agentic Loop", url: entry.url };
        },
        onClose: async ctx => {
            const entry = servers.get(ctx.instanceId);
            if (entry) { servers.delete(ctx.instanceId); await entry.close(); }
        },
    })],
});

try {
    if (!session.workspacePath) throw new Error("The runtime did not provide session storage. Upgrade Copilot before opening Agentic Loop.");
    model = new Model({
        azure: new Azure(), session, scenarios,
        storage: path.join(session.workspacePath, "agentic-loop", "settings.json"),
    });
    await model.load();
    resolveReady();
} catch (error) { rejectReady(error); }
await ready;
