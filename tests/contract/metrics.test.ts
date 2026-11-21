import { createConnection } from 'node:net';
import { expect, it } from 'vitest';
import { createApp } from '../../src/platform/http.js';
import { createApiMetrics } from '../../src/platform/metrics.js';
import { serveMetrics } from '../../src/platform/metrics-server.js';

it('records matched templates and bounds labels without exposing metrics on the API', async () => {
  const metrics = createApiMetrics();
  const app = await createApp(async () => {}, false, undefined, metrics);
  app.get('/fixture/:id', async () => ({}));
  try {
    await app.inject('/fixture/private-id?token=private-value');
    expect((await app.inject('/metrics')).statusCode).toBe(404);
    const output = await metrics.registry.metrics();
    expect(output).toContain('companion_http_request_duration_seconds_count{route="/fixture/:id",method="GET",status="200"} 1');
    expect(output).toContain('route="unmatched"');
    expect(output).not.toMatch(/private-id|private-value/);
  } finally { await app.close(); }
});

it('returns 503 when metric sampling fails and releases the loopback listener', async () => {
  const metrics = createApiMetrics();
  const listener = await serveMetrics(metrics.registry, 0, async () => { throw new Error('database detail'); });
  try {
    const result = await fetch('http://127.0.0.1:' + listener.port + '/metrics');
    expect(result.status).toBe(503);
    expect(await result.text()).toBe('Metrics unavailable.\n');
  } finally { await listener.close(); }
  await expect(new Promise<void>((resolve, reject) => {
    const socket = createConnection({ port: listener.port, host: '127.0.0.1' });
    socket.once('error', reject);
    socket.once('connect', () => { socket.destroy(); resolve(); });
  })).rejects.toMatchObject({ code: 'ECONNREFUSED' });
});
