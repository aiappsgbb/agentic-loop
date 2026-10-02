import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { analyze, AnalysisError } from './analysis';
import { validateAnalysisRequest } from '../src/data/workshop';

const MAX_BODY = 24_000;
export function localOrigins(value = 'http://localhost:5173,http://127.0.0.1:5173'): Set<string> {
  const origins = value.split(',').map(origin => {
    const url = new URL(origin);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:' || url.origin !== origin) {
      throw new Error('Workshop origins must be exact HTTP loopback origins.');
    }
    return origin;
  });
  return new Set(origins);
}

export function createWorkshopServer(
  analysis = analyze,
  origins = localOrigins(process.env.WORKSHOP_ORIGINS),
) {
  let busy = false;
  let lastRequest = 0;
  const active = new Set<AbortController>();
  const send = (res: ServerResponse, status: number, body: unknown) => {
    if (!res.destroyed) {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    }
  };
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? '')) {
      send(res, 403, { code: 'HOST_DENIED', message: 'Loopback host required.' }); return;
    }
    const origin = req.headers.origin;
    if (origin && !origins.has(origin)) {
      send(res, 403, { code: 'ORIGIN_DENIED', message: 'Only the configured local portal may use this service.' }); return;
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'GET' && req.url === '/api/workshop/health') {
      send(res, 200, { status: 'local-service', authentication: 'checked-per-analysis', busy }); return;
    }
    if (req.method === 'OPTIONS' && origin) {
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Workshop-Client');
      res.writeHead(204); res.end(); return;
    }
    if (req.method !== 'POST' || req.url !== '/api/workshop/analyze') {
      send(res, 404, { code: 'NOT_FOUND', message: 'Unknown endpoint.' }); return;
    }
    if (!origin || req.headers['x-workshop-client'] !== 'portal' || req.headers['content-type'] !== 'application/json') {
      send(res, 403, { code: 'REQUEST_DENIED', message: 'An intentional local JSON request is required.' }); return;
    }
    if (busy || Date.now() - lastRequest < 1000) {
      send(res, 429, { code: 'BUSY', message: 'One bounded analysis is allowed at a time. Retry shortly.' }); return;
    }
    busy = true; lastRequest = Date.now();
    const controller = new AbortController();
    active.add(controller);
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', cancel);
    const readTimer = setTimeout(() => { controller.abort(); req.destroy(); }, 10_000);
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > MAX_BODY) throw new AnalysisError('TOO_LARGE', 'Brief exceeds the request limit.', 413);
        chunks.push(buffer);
      }
      const body = Buffer.concat(chunks).toString('utf8');
      clearTimeout(readTimer);
      let request;
      try { request = validateAnalysisRequest(JSON.parse(body)); } catch {
        throw new AnalysisError('INVALID_REQUEST', 'Provide a valid brief and explicit uncovered requirements.', 400);
      }
      const proposal = await analysis(request, controller.signal);
      send(res, 200, proposal);
    } catch (error) {
      const failure = error instanceof AnalysisError ? error : new AnalysisError('SERVICE_ERROR', 'Local analysis failed. No suggestions were applied.');
      console.error(`workshop: ${failure.code}`);
      send(res, failure.status, { code: failure.code, message: failure.message });
    } finally {
      clearTimeout(readTimer);
      res.removeListener('close', cancel);
      active.delete(controller);
      busy = false;
    }
  });
  server.on('close', () => active.forEach(controller => controller.abort()));
  return { server, cancelAll: () => active.forEach(controller => controller.abort()) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.WORKSHOP_PORT ?? 4318);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid workshop port.');
  const { server, cancelAll } = createWorkshopServer();
  server.listen(port, '127.0.0.1', () => console.log(`Workshop SDK service: http://127.0.0.1:${port} (loopback only)`));
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => { cancelAll(); server.close(); server.closeIdleConnections(); });
  }
}
