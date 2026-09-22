import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readBody(req) {
    let body = "";
    for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 32_768) throw new Error("Request body exceeds 32 KB.");
    }
    return JSON.parse(body || "{}");
}

export async function startServer({ assets, images, scenarios, dispatch, snapshot }) {
    const token = randomBytes(32).toString("hex");
    const imagePaths = new Set(scenarios.map(row => `/${row.image}`));
    const staticFiles = new Map([
        ["/", ["index.html", "text/html; charset=utf-8"]],
        ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
        ["/app.css", ["app.css", "text/css; charset=utf-8"]],
    ]);
    let origin;
    const server = createServer(async (req, res) => {
        const json = (status, value) => {
            res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
            res.end(JSON.stringify(value));
        };
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'");
        try {
            if (req.headers.host !== new URL(origin).host) return json(403, { error: "Untrusted host." });
            const url = new URL(req.url, origin);
            const file = staticFiles.get(url.pathname);
            if (file && req.method === "GET") {
                let content = await readFile(path.join(assets, file[0]));
                if (url.pathname === "/") {
                    if (url.searchParams.get("key") !== token) return json(403, { error: "Open this panel through Copilot." });
                    content = content.toString().replace("__CANVAS_TOKEN__", token);
                }
                res.writeHead(200, { "Content-Type": file[1] });
                return res.end(content);
            }
            if (imagePaths.has(url.pathname) && req.method === "GET") {
                const name = path.basename(url.pathname);
                if (url.pathname !== `/images/${name}`) return json(404, { error: "Unknown image." });
                const content = await readFile(path.join(images, name));
                res.writeHead(200, { "Content-Type": name.endsWith(".png") ? "image/png" : "image/jpeg" });
                return res.end(content);
            }
            if (req.headers["x-canvas-token"] !== token || (req.headers.origin && req.headers.origin !== origin)) {
                return json(403, { error: "Untrusted canvas request." });
            }
            if (url.pathname === "/api/state" && req.method === "GET") return json(200, await snapshot());
            if (url.pathname === "/api/action" && req.method === "POST") {
                if (!req.headers["content-type"]?.startsWith("application/json")) return json(415, { error: "JSON required." });
                const { action, input } = await readBody(req);
                return json(200, await dispatch(action, input ?? {}));
            }
            json(404, { error: "Not found." });
        } catch (error) { json(400, { error: error.message }); }
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    return {
        server, url: `${origin}/?key=${token}`,
        close: () => new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
            server.closeIdleConnections();
        }),
    };
}
