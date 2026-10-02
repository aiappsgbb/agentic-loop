import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, analysisSessionConfig, analysisOutputSchema, type AnalysisClient, type AnalysisSession } from '../server/analysis';
import { createWorkshopServer, localOrigins } from '../server/workshop';
import type { SessionConfig } from '@github/copilot-sdk';
import { once } from 'node:events';

const request = {
  brief: 'Schedule telescopes fairly for volunteers.',
  gaps: [{ id: 'schedule', label: 'Scheduling', evidence: 'schedule' }], coveredRequirementIds: [],
};
const output = {
  suggestions: [{ kind: 'patterns', source: 'catalog', id: 'workflow', label: 'Candidate workflow', reason: 'Scheduling needs validation', addresses: ['schedule'] }],
  guideIds: [], questions: ['Who approves scheduling rules?'], uncertainties: [], unsupported: [],
};
function runtime(options: { content?: string; auth?: boolean; sendError?: Error; wait?: boolean; stopError?: boolean } = {}) {
  const calls: string[] = [];
  let config: SessionConfig | undefined;
  let rejectSend: ((reason: Error) => void) | undefined;
  const session: AnalysisSession = {
    sessionId: 'test-only',
    sendAndWait: async () => {
      calls.push('send');
      if (options.sendError) throw options.sendError;
      if (options.wait) return new Promise((_, reject) => { rejectSend = reject; });
      return { data: { content: options.content ?? JSON.stringify(output) } };
    },
    abort: async () => { calls.push('abort'); rejectSend?.(new Error('aborted')); },
    disconnect: async () => { calls.push('disconnect'); },
  };
  const client: AnalysisClient = {
    start: async () => { calls.push('start'); },
    getAuthStatus: async () => ({ isAuthenticated: options.auth ?? true }),
    createSession: async value => { config = value; calls.push('create'); return session; },
    deleteSession: async () => { calls.push('delete'); },
    stop: async () => { calls.push('stop'); return options.stopError ? [new Error('cleanup')] : []; },
    forceStop: async () => { calls.push('forceStop'); },
  };
  return { factory: () => client, calls, getConfig: () => config };
}
test('analysis uses empty tool allowlists and deny-all permission/hooks', async () => {
  const config = analysisSessionConfig('/isolated-test');
  assert.deepEqual(config.availableTools, []);
  assert.deepEqual(config.excludedTools, ['builtin:*', 'mcp:*', 'custom:*']);
  assert.equal(config.enableConfigDiscovery, false);
  assert.equal(config.enableSkills, false);
  assert.equal(config.enableFileHooks, false);
  assert.equal(config.enableHostGitOperations, false);
  assert.equal(config.enableSessionTelemetry, false);
  assert.deepEqual(config.mcpServers, {});
  const mock = runtime();
  const result = await analyze(request, new AbortController().signal, { factory: mock.factory });
  assert.equal(result.suggestions.length, 1);
  assert.deepEqual(mock.calls, ['start', 'create', 'send', 'disconnect', 'delete', 'stop']);
});
test('structured output constrains exact requested gaps and catalog namespaces before generation', () => {
  const schema = analysisOutputSchema(request);
  for (const branch of schema.properties.suggestions.items.anyOf) {
    assert.deepEqual(branch.properties.addresses.items.enum, ['schedule']);
    assert.equal(branch.properties.addresses.minItems, 1);
    assert.equal(branch.additionalProperties, false);
    assert.equal(branch.required.length, 6);
  }
  assert.ok(schema.properties.guideIds.items.enum.includes('enterprise-knowledge-grounding'));
  assert.ok(!schema.properties.guideIds.items.enum.includes('getting-started'));
  assert.equal(schema.properties.suggestions.items.anyOf.length, 4);
});
test('missing auth, malformed JSON, invented guide IDs and runtime errors are explicit', async () => {
  for (const [options, code] of [
    [{ auth: false }, 'AUTH_REQUIRED'],
    [{ content: 'not-json' }, 'INVALID_OUTPUT'],
    [{ content: JSON.stringify({ ...output, guideIds: ['imaginary'] }) }, 'INVALID_OUTPUT'],
    [{ sendError: new Error('model unavailable') }, 'RUNTIME_UNAVAILABLE'],
  ] as const) {
    const mock = runtime(options);
    await assert.rejects(analyze(request, new AbortController().signal, { factory: mock.factory }), { code });
    assert.ok(mock.calls.includes('stop'));
    if (code !== 'AUTH_REQUIRED') assert.ok(mock.calls.includes('delete'));
  }
});
test('timeout and cancellation abort active sessions and clean up clients', async () => {
  const mock = runtime({ wait: true });
  await assert.rejects(analyze(request, new AbortController().signal, { factory: mock.factory, timeoutMs: 20 }), { code: 'TIMEOUT' });
  assert.ok(mock.calls.includes('abort'));
  assert.ok(mock.calls.includes('delete'));
  const controller = new AbortController();
  const cancelled = runtime({ wait: true });
  const pending = analyze(request, controller.signal, { factory: cancelled.factory });
  setTimeout(() => controller.abort(), 20);
  await assert.rejects(pending, { code: 'CANCELLED' });
  assert.ok(cancelled.calls.includes('stop'));
});
test('cleanup failure is not presented as successful analysis', async () => {
  const mock = runtime({ stopError: true });
  await assert.rejects(analyze(request, new AbortController().signal, { factory: mock.factory }), { code: 'CLEANUP_FAILED' });
  assert.ok(mock.calls.includes('forceStop'));
});
test('runtime construction failures are explicit and do not start a session', async () => {
  await assert.rejects(analyze(request, new AbortController().signal, {
    factory: () => { throw new Error('runtime missing'); },
  }), { code: 'RUNTIME_UNAVAILABLE' });
});
test('malformed and oversized HTTP requests never reach the SDK', async () => {
  for (const [body, status] of [['not-json', 400], ['x'.repeat(25_000), 413]] as const) {
    let invoked = false;
    const { server } = createWorkshopServer(async () => { invoked = true; throw new Error('Must not be called'); });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/workshop/analyze`, {
        method: 'POST',
        headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json', 'X-Workshop-Client': 'portal' },
        body,
      });
      assert.equal(response.status, status);
      assert.equal(invoked, false);
    } finally { server.close(); server.closeAllConnections(); }
  }
});
test('loopback service rejects public origins, malformed input and missing intentional request headers', async () => {
  assert.throws(() => localOrigins('https://public.example'), /loopback/);
  let count = 0;
  const { server } = createWorkshopServer(async () => { count++; return output as Awaited<ReturnType<typeof analyze>>; });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/workshop/analyze`;
  try {
    const denied = await fetch(url, {
      method: 'POST', headers: { Origin: 'https://public.example', 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    });
    assert.equal(denied.status, 403);
    const noHeader = await fetch(url, {
      method: 'POST', headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    });
    assert.equal(noHeader.status, 403);
    const success = await fetch(url, {
      method: 'POST', headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json', 'X-Workshop-Client': 'portal' }, body: JSON.stringify(request),
    });
    assert.equal(success.status, 200);
    assert.equal(success.headers.get('cache-control'), 'no-store');
    assert.equal(count, 1);
    const busy = await fetch(url, {
      method: 'POST', headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json', 'X-Workshop-Client': 'portal' }, body: JSON.stringify(request),
    });
    assert.equal(busy.status, 429);
  } finally { server.close(); server.closeAllConnections(); }
});
