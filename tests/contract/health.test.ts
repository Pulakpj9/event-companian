import { expect, it, vi } from 'vitest';
import { createApp } from '../../src/platform/http.js';

it('serves both health probes and documents their response schemas', async () => {
  const check = vi.fn(async () => {});
  const app = await createApp(check);
  try {
    const live = await app.inject('/health/live');
    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({ status: 'ok' });
    expect(check).not.toHaveBeenCalled();
    const ready = await app.inject('/health/ready');
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: 'ready' });
    expect(app.swagger()).toMatchObject({ paths: {
      '/health/live': { get: { responses: { 200: expect.anything() } } },
      '/health/ready': { get: { responses: { 200: expect.anything(), 503: expect.anything() } } },
    } });
  } finally {
    await app.close();
  }
});

it('returns a generic unavailable response without exposing database details', async () => {
  const app = await createApp(async () => { throw new Error('internal database detail'); });
  try {
    const ready = await app.inject('/health/ready');
    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toEqual({ status: 'unavailable' });
  } finally {
    await app.close();
  }
});
