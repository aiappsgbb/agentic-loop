import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseEnv } from "node:util";

const fields = [
    { key: "local", variable: "LOCAL_FRONTEND", label: "Local app" },
    { key: "deployed", variable: "DEPLOYED_FRONTEND", label: "Deployed app" },
];

export async function readFrontends(directory) {
    if (typeof directory !== "string" || !path.isAbsolute(directory)) throw new Error("The session workspace directory is unavailable.");
    let source = "";
    try { source = await readFile(path.join(directory, ".env"), "utf8"); }
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
    return { configured: frontends.some(row => row.configured), frontends };
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
