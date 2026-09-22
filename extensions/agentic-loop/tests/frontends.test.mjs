import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFrontends, frontendStatus, openFrontend } from "../frontends.mjs";

async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), "agentic-loop-frontends-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
}

test("Build is unchecked for missing, empty or whitespace-only frontend values", async t => {
    const directory = await fixture(t);
    assert.equal((await readFrontends(directory)).configured, false);
    await writeFile(path.join(directory, ".env"), 'LOCAL_FRONTEND=""\nDEPLOYED_FRONTEND="   "\nOTHER_SECRET=private');
    const result = await readFrontends(directory);
    assert.equal(result.configured, false);
    assert(result.frontends.every(row => !row.configured && row.url === null));
    assert(!JSON.stringify(result).includes("private"));
});

test("each frontend independently checks Build and only the two allowed URLs are returned", async t => {
    const directory = await fixture(t);
    for (const variable of ["LOCAL_FRONTEND", "DEPLOYED_FRONTEND"]) {
        await writeFile(path.join(directory, ".env"), `export ${variable} = 'https://example.com/app#route' # frontend\nSECRET=never-expose\n`);
        const result = await readFrontends(directory);
        assert.equal(result.configured, true);
        assert.equal(result.frontends.filter(row => row.url).length, 1);
        assert.equal(result.frontends.find(row => row.variable === variable).url, "https://example.com/app#route");
        assert(!JSON.stringify(result).includes("never-expose"));
    }
    await writeFile(path.join(directory, ".env"), 'LOCAL_FRONTEND="http://localhost:5173"\nDEPLOYED_FRONTEND=https://app.example.com\n');
    assert.deepEqual((await readFrontends(directory)).frontends.map(row => row.url), [
        "http://localhost:5173/", "https://app.example.com/",
    ]);
});

test("unsafe URLs remain configured but cannot be opened or leak credential text", async t => {
    const directory = await fixture(t);
    for (const value of ["javascript:alert(1)", "file:///etc/passwd", "/relative", "//example.com",
        "https://user:private@example.com", "https://${HOST}/", "http://localhost:bad", "https://exa mple.com", "https:\\\\example.com"]) {
        await writeFile(path.join(directory, ".env"), `LOCAL_FRONTEND='${value}'\n`);
        const result = await readFrontends(directory);
        assert.equal(result.configured, true);
        assert.equal(result.frontends[0].url, null);
        assert.match(result.frontends[0].error, /absolute HTTP\(S\) URL/);
        assert(!JSON.stringify(result).includes("private"));
    }
});

test("file read failures are explicit rather than treated as absent configuration", async t => {
    const directory = await fixture(t);
    await mkdir(path.join(directory, ".env"));
    await assert.rejects(readFrontends(directory), /Cannot read workspace .env/);
    await assert.rejects(readFrontends(undefined), /workspace directory is unavailable/);
});

test("integrated browser rereads the current session workspace and uses URL-specific panel IDs", async t => {
    const first = await fixture(t);
    const second = await fixture(t);
    await writeFile(path.join(first, ".env"), "LOCAL_FRONTEND=http://localhost:5173\nDEPLOYED_FRONTEND=https://app.example.com\n");
    await writeFile(path.join(second, ".env"), "LOCAL_FRONTEND=http://localhost:5174\n");
    let workingDirectory = first;
    const opened = [];
    const session = { rpc: {
        metadata: { snapshot: async () => ({ workingDirectory }) },
        canvas: { open: async input => { opened.push(input); return { instanceId: input.instanceId }; } },
    } };
    assert.equal((await frontendStatus(session)).configured, true);
    await openFrontend(session, "local");
    await openFrontend(session, "local");
    assert.equal(opened[0].canvasId, "browser");
    assert.equal(opened[0].input.url, "http://localhost:5173/");
    assert.equal(opened[0].instanceId, opened[1].instanceId);
    await openFrontend(session, "deployed");
    assert.equal(opened[2].input.url, "https://app.example.com/");
    workingDirectory = second;
    await openFrontend(session, "local");
    assert.equal(opened[3].input.url, "http://localhost:5174/");
    assert.notEqual(opened[0].instanceId, opened[3].instanceId);
    await writeFile(path.join(second, ".env"), "LOCAL_FRONTEND=\n");
    await assert.rejects(openFrontend(session, "local"), /not configured/);
    await assert.rejects(openFrontend(session, "unexpected"), /Choose the local or deployed/);
    assert.equal(opened.length, 4);
});

test("integrated browser rejects invalid URLs and propagates host failures", async t => {
    const directory = await fixture(t);
    const session = { rpc: {
        metadata: { snapshot: async () => ({ workingDirectory: directory }) },
        canvas: { open: async () => { throw new Error("Browser canvas is unavailable"); } },
    } };
    await writeFile(path.join(directory, ".env"), "LOCAL_FRONTEND=javascript:alert(1)\n");
    await assert.rejects(openFrontend(session, "local"), /absolute HTTP\(S\) URL/);
    await writeFile(path.join(directory, ".env"), "LOCAL_FRONTEND=http://localhost:5173\n");
    await assert.rejects(openFrontend(session, "local"), /Browser canvas is unavailable/);
});
