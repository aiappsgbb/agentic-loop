import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { playbooks } from '../src/data/catalog';

test('all playbooks and the template embed the same independently runnable setup', () => {
  const shared = readFileSync('playbooks/SETUP.md', 'utf8').trim();
  for (const slug of [...playbooks.map(p => p.slug), '.template']) {
    const file = `playbooks/${slug}/README.md`;
    const text = readFileSync(file, 'utf8');
    const matches = text.match(/<!-- shared-playbook-setup:start -->[\s\S]*?<!-- shared-playbook-setup:end -->/g);
    assert.deepEqual(matches, [shared], `${slug}: run node scripts/sync-playbook-setup.mjs after changing shared setup`);
    assert.ok(text.includes('### Setup\n'));
    for (const [, image] of text.matchAll(/!\[[^\]]*]\((\.\.\/shared\/images\/[^)]+)\)/g)) {
      assert.ok(existsSync(path.resolve(path.dirname(file), image)), `${slug}: missing ${image}`);
    }
  }
  assert.match(shared, /gh skill install microsoft\/azure-skills microsoft-foundry --agent github-copilot --scope project/);
  assert.match(shared, /Run the install command only when the companion is missing/);
  assert.match(shared, /including when using a sandbox/);
  assert.match(readFileSync('playbooks/threadlight-pipeline/README.md', 'utf8'), /shared Foundry Agentic Loop setup does not replace them/);
  assert.match(readFileSync('playbooks/voice-first-agent-blueprint/README.md', 'utf8'), /microphone and speaker\/headset/);
});
