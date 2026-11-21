import { createServer } from 'node:http';
import type { Registry } from '@prometheus-io/client';

export async function serveMetrics(registry: Registry, port: number, collect?: () => Promise<void>) {
  let inFlight: Promise<string> | undefined;
  const server = createServer({ requestTimeout: 10_000, headersTimeout: 5_000, keepAliveTimeout: 1000 }, async (request, reply) => {
    if (request.method !== 'GET' || request.url !== '/metrics') {
      reply.writeHead(404).end();
      return;
    }
    reply.setHeader('Cache-Control', 'no-store');
    try {
      inFlight ??= Promise.resolve().then(collect).then(() => registry.metrics()).finally(() => { inFlight = undefined; });
      const metrics = await inFlight;
      reply.writeHead(200, { 'Content-Type': registry.contentType }).end(metrics);
    } catch {
      reply.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Metrics unavailable.\n');
    }
  });
  server.maxConnections = 16;
  server.setTimeout(12_000, socket => socket.destroy());
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Metrics listener has no TCP address.');
  return {
    port: address.port,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
}
