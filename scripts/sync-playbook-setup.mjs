import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const shared = (await readFile(path.join(root, 'playbooks/SETUP.md'), 'utf8')).trim();
const block = /<!-- shared-playbook-setup:start -->[\s\S]*?<!-- shared-playbook-setup:end -->/g;
let updated = 0;
for (const entry of await readdir(path.join(root, 'playbooks'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'shared') continue;
  const file = path.join(root, 'playbooks', entry.name, 'README.md');
  const content = await readFile(file, 'utf8');
  if ((content.match(block) ?? []).length !== 1) {
    throw new Error(`Expected one shared setup block in ${file}`);
  }
  const next = content.replace(block, () => shared);
  if (next !== content) {
    await writeFile(file, next);
    updated += 1;
  }
}
console.log(`Updated shared setup in ${updated} playbooks.`);
