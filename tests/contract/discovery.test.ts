import { expect, it, vi } from 'vitest';
import { createApp } from '../../src/platform/http.js';
import type { DiscoveryRoutes } from '../../src/modules/discovery/routes.js';

it('returns public search fields and rejects blank or unsupported filters', async () => {
  const id = '248dcb44-4906-44e0-ae52-fe887685197b';
  const search = vi.fn<DiscoveryRoutes['search']>(async () => [
    { id, kind: 'event', title: 'Public event', summary: null, privateNotes: 'excluded' },
  ]);
  const app = await createApp(async () => {}, false, undefined, undefined, undefined, { search });
  try {
    expect((await app.inject('/api/v1/search?q=%20')).statusCode).toBe(400);
    expect((await app.inject('/api/v1/search?q=event&kind=private')).statusCode).toBe(400);
    expect((await app.inject('/api/v1/search?q=' + 'a'.repeat(121))).statusCode).toBe(400);
    const response = await app.inject('/api/v1/search?q=event&kind=event');
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.json()).toEqual({ items: [{ id, kind: 'event', title: 'Public event', summary: null }] });
    expect(search).toHaveBeenCalledExactlyOnceWith('event', 'event');
  } finally { await app.close(); }
});

it('returns a generic dependency error when search is unavailable', async () => {
  const app = await createApp(async () => {}, false, undefined, undefined, undefined, {
    async search() { throw new Error('database details'); },
  });
  try {
    const response = await app.inject('/api/v1/search?q=event');
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ message: 'Search unavailable.' });
  } finally { await app.close(); }
});
