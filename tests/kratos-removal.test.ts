import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('portal source has no retired reference integration or persona import relay', () => {
  for (const entry of readdirSync('src', { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    if (!/\.(tsx?|css)$/.test(path)) continue;
    assert.doesNotMatch(readFileSync(path, 'utf8'), /kratos|persona-builder/i, path);
  }
  for (const path of [
    'src/pages/Kratos.tsx',
    'src/components/KratosLauncher.tsx',
    'src/components/PersonaBuilder.tsx',
    'src/data/kratos.ts',
    'src/data/manifest.ts',
    'src/lib/kratosHandoff.ts',
  ]) {
    assert.equal(existsSync(path), false, path);
  }
  assert.doesNotMatch(readFileSync('.env.example', 'utf8'), /kratos/i);
});

test('new Front Door deployments require only the portal origin', () => {
  for (const path of ['infra/frontdoor.bicep', 'infra/frontdoor.parameters.json', 'infra/deploy-frontdoor.ps1']) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), /kratos/i, path);
  }
  const template = readFileSync('infra/frontdoor.bicep', 'utf8');
  assert.match(template, /name: 'route-site'/);
  assert.match(template, /patternsToMatch:\s*\[\s*'\/\*'\s*\]/);
  const parameters = JSON.parse(readFileSync('infra/frontdoor.parameters.json', 'utf8'));
  assert.deepEqual(Object.keys(parameters.parameters).sort(), ['endpointName', 'profileName', 'siteHostName', 'sku']);
});

const workflow = readFileSync('.github/workflows/deploy-afd.yml', 'utf8');
const retirement = workflow.match(/ {6}- name: Retire Kratos Front Door routes\n {8}run: \|\n([\s\S]*?)\n {6}- name:/)?.[1];
assert.ok(retirement, 'Production workflow must explicitly retire existing routes');
const retirementScript = retirement.replace(/^ {10}/gm, '');

for (const scenario of [
  { name: 'removes both legacy routes', routes: 'route-kratos\nroute-kratos-api', listExit: 0, deleteExit: 0, deletions: 2 },
  { name: 'is safe on subsequent releases', routes: '', listExit: 0, deleteExit: 0, deletions: 0 },
  { name: 'fails when discovery fails', routes: '', listExit: 1, deleteExit: 0, deletions: 0 },
  { name: 'fails when a deletion fails', routes: 'route-kratos\nroute-kratos-api', listExit: 0, deleteExit: 1, deletions: 1 },
]) {
  test(`Front Door retirement ${scenario.name}`, t => {
    const directory = mkdtempSync(join(tmpdir(), 'portal-route-retirement-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const log = join(directory, 'az.log');
    writeFileSync(log, '');
    writeFileSync(join(directory, 'az'), `#!/bin/bash
printf '%s\\n' "$*" >> "$AZ_TEST_LOG"
case "$1 $2 $3" in
  "afd route list")
    printf '%s\\n' "$AZ_TEST_ROUTES"
    exit "$AZ_TEST_LIST_EXIT"
    ;;
  "afd route delete")
    exit "$AZ_TEST_DELETE_EXIT"
    ;;
  *) exit 99 ;;
esac
`, { mode: 0o755 });
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', retirementScript], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        AFD_RESOURCE_GROUP: 'test-resource-group',
        AFD_PROFILE: 'test-profile',
        AFD_ENDPOINT: 'test-endpoint',
        AZ_TEST_LOG: log,
        AZ_TEST_ROUTES: scenario.routes,
        AZ_TEST_LIST_EXIT: String(scenario.listExit),
        AZ_TEST_DELETE_EXIT: String(scenario.deleteExit),
      },
    });
    assert.ifError(result.error);
    assert.equal(result.status, scenario.listExit || scenario.deleteExit, result.stderr);
    const calls = readFileSync(log, 'utf8');
    assert.match(calls, /--query \[\?name=='route-kratos' \|\| name=='route-kratos-api'\]\.name/);
    const deletions = calls.split('\n').filter(line => line.startsWith('afd route delete '));
    assert.equal(deletions.length, scenario.deletions);
    for (const call of deletions) {
      assert.match(call, /--route-name route-kratos(?:-api)? --yes$/);
      assert.match(call, /--resource-group test-resource-group --profile-name test-profile --endpoint-name test-endpoint/);
    }
    assert.doesNotMatch(calls, /origin-group delete|containerapp delete|staticwebapp delete|route-site/);
  });
}
