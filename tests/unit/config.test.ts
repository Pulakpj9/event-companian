import { describe, expect, it } from 'vitest';
import { readApiConfig, readDatabaseConfig } from '../../src/platform/config.js';

describe('runtime configuration', () => {
  it('binds locally by default and accepts explicit container binding', () => {
    expect(readApiConfig({})).toEqual({ host: '127.0.0.1', port: 3000 });
    expect(readApiConfig({ HOST: '0.0.0.0', PORT: '8080' })).toEqual({ host: '0.0.0.0', port: 8080 });
  });

  it.each(['0', '65536', '-1', '1e3', '', 'abc'])('rejects invalid port %s', (PORT) => {
    expect(() => readApiConfig({ PORT })).toThrow('Set PORT');
  });

  it('requires a PostgreSQL URL and bounds the connection pool', () => {
    expect(readDatabaseConfig({ DATABASE_URL: 'postgresql://localhost/companion' }).DB_POOL_SIZE).toBe(5);
    expect(() => readDatabaseConfig({})).toThrow('Set DATABASE_URL');
    expect(() => readDatabaseConfig({ DATABASE_URL: 'postgresql://localhost/companion', DB_POOL_SIZE: '101' }))
      .toThrow('DB_POOL_SIZE');
  });
});
