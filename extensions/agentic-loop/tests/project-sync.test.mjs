import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Model } from "../model.mjs";
import { projectIdentity } from "../azure.mjs";
import { readFrontends } from "../frontends.mjs";

const subscription = "11111111-1111-1111-1111-111111111111";
const otherSubscription = "22222222-2222-2222-2222-222222222222";
function project(name, sub = subscription) {
    const id = `/subscriptions/${sub}/resourceGroups/rg-${name}/providers/Microsoft.CognitiveServices/accounts/account/projects/${name}`;
    return { id, ...projectIdentity(id), endpoint: `https://account.services.ai.azure.com/api/projects/${name}`, location: "eastus" };
}
const first = project("first");
const second = project("second");
const third = project("third", otherSubscription);

async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), "agentic-loop-project-sync-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const calls = [];
    const available = [first, second, third];
    const options = {
        azure: {
            subscriptions: async () => [{ id: subscription, name: "First subscription" }, { id: otherSubscription, name: "Second subscription" }],
            projects: async id => {
                calls.push(id);
                return { projects: available.filter(row => row.subscriptionId === id), warnings: [] };
            },
        },
        session: { rpc: { metadata: { snapshot: async () => ({ workingDirectory: directory }) } } },
        scenarios: [],
        storage: path.join(directory, "settings.json"),
    };
    const model = new Model(options);
    const file = path.join(directory, ".env");
    return { directory, file, calls, available, model, options };
}

test("only a validated project ARM ID is exposed from env; malformed values stay private", async t => {
    const { directory, file } = await fixture(t);
    assert.deepEqual((await readFrontends(directory)).foundryProject, { id: null, error: null });
    await writeFile(file, `export FOUNDRY_PROJECT='${second.id}' # selected\nSECRET=never-expose\n`);
    const result = await readFrontends(directory);
    assert.deepEqual(result.foundryProject, { id: second.id, error: null });
    assert(!JSON.stringify(result).includes("never-expose"));
    for (const invalid of ["private-secret", second.endpoint, second.id + "?token=private-secret",
        second.id.replace(subscription, "bad"), second.id.replace("/second", "/.."), "${PROJECT_ID}"]) {
        await writeFile(file, `FOUNDRY_PROJECT='${invalid}'\n`);
        const config = await readFrontends(directory);
        assert.equal(config.foundryProject.id, null);
        assert.match(config.foundryProject.error, /full Microsoft Foundry project ARM/);
        assert(!JSON.stringify(config).includes("private-secret"));
    }
});

test("env project overrides saved selection on open and persists canonical cross-subscription discovery", async t => {
    const { file, model, options } = await fixture(t);
    await model.discover();
    await writeFile(file, `FOUNDRY_PROJECT=${third.id.toUpperCase()}\n`);
    const reloaded = new Model(options);
    await reloaded.load();
    const result = await reloaded.frontends();
    assert.equal(result.projectSync.selected.id, third.id);
    assert.equal(result.projectSync.subscriptionId, otherSubscription);
    assert.equal(result.projectSync.error, null);
    const saved = JSON.parse(await readFile(options.storage, "utf8"));
    assert.equal(saved.projectId, third.id);
    assert.equal(saved.subscriptionId, otherSubscription);
});

test("creation and atomic replacement synchronize, while unchanged values preserve manual selection", async t => {
    const { file, model, calls } = await fixture(t);
    await model.frontends();
    await model.discover();
    await writeFile(file, `FOUNDRY_PROJECT=${second.id}\n`);
    assert.equal((await model.frontends()).projectSync.selected.id, second.id);
    const reads = calls.length;
    await model.frontends();
    assert.equal(calls.length, reads);
    await model.select(first.id);
    await writeFile(file, `FOUNDRY_PROJECT=${second.id}\nOTHER_SETTING=changed\n`);
    assert.equal((await model.frontends()).projectSync.selected.id, first.id);
    assert.equal(calls.length, reads);
    await writeFile(file + ".next", `FOUNDRY_PROJECT=${third.id}\n`);
    await rename(file + ".next", file);
    assert.equal((await model.frontends()).projectSync.selected.id, third.id);
    await writeFile(file, "FOUNDRY_PROJECT=\n");
    assert.equal((await model.frontends()).projectSync.selected.id, third.id);
    await rm(file);
    assert.equal((await model.frontends()).projectSync.selected.id, third.id);
});

test("invalid, unavailable and inaccessible targets keep the selection; explicit retry finds newly created projects", async t => {
    const { file, model, calls, available } = await fixture(t);
    await model.discover();
    const missing = project("new-project", otherSubscription);
    await writeFile(file, `FOUNDRY_PROJECT=${missing.id}\n`);
    let result = await model.frontends();
    assert.match(result.projectSync.error, /could not be found or accessed/);
    assert.equal(result.projectSync.selected.id, first.id);
    assert.equal(result.projectSync.subscriptionId, subscription);
    const reads = calls.length;
    await model.frontends();
    assert.equal(calls.length, reads, "failed discovery has a retry cooldown");
    available.push(missing);
    result = await model.frontends(true);
    assert.equal(result.projectSync.error, null);
    assert.equal(result.projectSync.selected.id, missing.id);
    await writeFile(file, "FOUNDRY_PROJECT=not-an-arm-id\n");
    result = await model.frontends();
    assert.match(result.projectSync.error, /full Microsoft Foundry/);
    assert.equal(result.projectSync.selected.id, missing.id);
    const inaccessible = second.id.replace(subscription, "33333333-3333-3333-3333-333333333333");
    await writeFile(file, `FOUNDRY_PROJECT=${inaccessible}\n`);
    result = await model.frontends();
    assert.match(result.projectSync.error, /subscription is no longer accessible/);
    assert.equal(result.projectSync.selected.id, missing.id);
    await writeFile(file, `FOUNDRY_PROJECT=${second.id}\n`);
    model.azure.projects = async () => { throw new Error("Azure access denied"); };
    result = await model.frontends();
    assert.match(result.projectSync.error, /Azure access denied/);
    assert.equal(result.projectSync.selected.id, missing.id);
});

test("selection persistence failures are visible and roll back env-driven selection", async t => {
    const { file, model } = await fixture(t);
    await model.discover();
    await writeFile(file, `FOUNDRY_PROJECT=${third.id}\n`);
    model.save = async () => { throw new Error("Settings storage is unavailable"); };
    const result = await model.frontends();
    assert.match(result.projectSync.error, /Settings storage is unavailable/);
    assert.equal(result.projectSync.selected.id, first.id);
    assert.equal(result.projectSync.subscriptionId, subscription);
});

test("partial subscription discovery warnings survive successful env synchronization", async t => {
    const { file, model } = await fixture(t);
    model.azure.projects = async () => ({ projects: [second], warnings: ["Another account could not be listed"] });
    await writeFile(file, `FOUNDRY_PROJECT=${second.id}\n`);
    const result = await model.frontends();
    assert.equal(result.projectSync.selected.id, second.id);
    assert.equal(result.projectSync.error, null);
    assert.deepEqual(result.projectSync.warnings, ["Another account could not be listed"]);
});
