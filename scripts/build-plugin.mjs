import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist/plugin/agentic-loop");
const manifest = JSON.parse(await readFile(path.join(root, "plugins/agentic-loop/plugin.json"), "utf8"));
const composition = manifest.extensions["com.github.awesome-copilot"];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const source of composition.skills) {
    await cp(path.join(root, source), path.join(output, "skills", path.basename(source)), { recursive: true });
}
for (const source of composition.extensions) {
    await cp(path.join(root, source), path.join(output, "com.github.copilot/extensions", path.basename(source)), {
        recursive: true, filter: sourcePath => path.basename(sourcePath) !== "tests",
    });
}
const assets = path.join(output, "com.github.copilot/extensions/agentic-loop/assets");
await mkdir(path.join(assets, "images"), { recursive: true });
await cp(path.join(root, "src/data/scenarios.json"), path.join(assets, "scenarios.json"));
const scenarios = JSON.parse(await readFile(path.join(root, "src/data/scenarios.json"), "utf8"));
for (const { image } of scenarios) {
    if (!/^images\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png)$/.test(image)) throw new Error(`Unexpected scenario image: ${image}`);
    await cp(path.join(root, "public", image), path.join(assets, image));
}
delete manifest.extensions["com.github.awesome-copilot"];
await writeFile(path.join(output, "plugin.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await cp(path.join(root, "plugins/agentic-loop/README.md"), path.join(output, "README.md"));
await cp(path.join(root, "LICENSE"), path.join(output, "LICENSE"));
await mkdir(path.join(output, "assets"), { recursive: true });
await cp(path.join(root, "extensions/agentic-loop/assets/preview.png"), path.join(output, "assets/preview.png"));
console.log(`Materialized agentic-loop plugin at ${path.relative(root, output)}`);
