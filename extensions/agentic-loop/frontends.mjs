import { open } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseEnv } from "node:util";
import { projectIdentity } from "./azure.mjs";

const fields = [
    { key: "local", variable: "LOCAL_FRONTEND", label: "Local app" },
    { key: "deployed", variable: "DEPLOYED_FRONTEND", label: "Deployed app" },
];

export async function readFrontends(directory) {
    if (typeof directory !== "string" || !path.isAbsolute(directory)) throw new Error("The session workspace directory is unavailable.");
    let source = "";
    let revision = null;
    try {
        const file = await open(path.join(directory, ".env"), "r");
        try {
            const stat = await file.stat({ bigint: true });
            source = await file.readFile("utf8");
            revision = createHash("sha256").update([directory, stat.dev, stat.ino, stat.mtimeNs, stat.ctimeNs, stat.size].join(":")).digest("hex");
        } finally { await file.close(); }
    }
    catch (error) {
        if (error.code !== "ENOENT") throw new Error(`Cannot read workspace .env (${error.code ?? "read failed"}).`);
    }
    let env;
    try { env = parseEnv(source); }
    catch { throw new Error("Cannot parse workspace .env. Check its dotenv syntax."); }
    const frontends = fields.map(field => {
        const value = env[field.variable]?.trim() ?? "";
        const result = { ...field, configured: Boolean(value), url: null, error: null };
        if (!value) return result;
        try {
            const url = new URL(value);
            if (!/^https?:\/\//i.test(value) || /[\s\\]/.test(value) || /\$\{/.test(value) || url.username || url.password) throw new Error("Invalid frontend URL.");
            result.url = url.href;
        } catch {
            result.error = `${field.variable} must be an absolute HTTP(S) URL without credentials, whitespace or variable substitutions.`;
        }
        return result;
    });
    const value = env.FOUNDRY_PROJECT?.trim() ?? "";
    const foundryProject = { id: null, error: null };
    if (value) {
        try {
            const { subscriptionId } = projectIdentity(value);
            if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(subscriptionId) ||
                /[\s\\?#]/.test(value) || value.includes("${") ||
                value.split("/").some(segment => segment === "." || segment === "..")) throw new Error("Invalid project ID.");
            foundryProject.id = value;
        } catch {
            foundryProject.error = "FOUNDRY_PROJECT must be a full Microsoft Foundry project ARM resource ID.";
        }
    }
    return { configured: frontends.some(row => row.configured), frontends, revision, foundryProject };
}

export async function frontendStatus(session) {
    const { workingDirectory } = await session.rpc.metadata.snapshot();
    return readFrontends(workingDirectory);
}

export async function openFrontend(session, key) {
    if (!fields.some(field => field.key === key)) throw new Error("Choose the local or deployed frontend.");
    const { frontends } = await frontendStatus(session);
    const frontend = frontends.find(row => row.key === key);
    if (!frontend.url) throw new Error(frontend.error ?? `${frontend.variable} is not configured in workspace .env.`);
    // Reopening an existing canvas focuses it without replacing its URL.
    const suffix = createHash("sha256").update(frontend.url).digest("hex").slice(0, 16);
    return session.rpc.canvas.open({
        canvasId: "browser",
        instanceId: `agentic-loop-${key}-${suffix}`,
        input: { url: frontend.url, title: `Agentic Loop · ${frontend.label}` },
    });
}
