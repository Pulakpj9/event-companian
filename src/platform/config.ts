import { Type } from 'typebox';
import { Value } from 'typebox/value';

const sharedSettings = {
  DATABASE_URL: Type.String({ pattern: '^postgres(?:ql)?://' }),
  DB_POOL_SIZE: Type.Integer({ minimum: 1, maximum: 100 }),
};

function readInteger(value: string | undefined, fallback: number): number {
  return value === undefined ? fallback : /^\d+$/.test(value) ? Number(value) : NaN;
}

export function readDatabaseConfig(env: NodeJS.ProcessEnv) {
  const config = {
    DATABASE_URL: env.DATABASE_URL,
    DB_POOL_SIZE: readInteger(env.DB_POOL_SIZE, 5),
  };
  if (!Value.Check(Type.Object(sharedSettings), config)) {
    throw new Error('Set DATABASE_URL to a PostgreSQL URL and DB_POOL_SIZE to an integer from 1 to 100.');
  }
  return config;
}

export function readApiConfig(env: NodeJS.ProcessEnv) {
  const port = readInteger(env.PORT, 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || env.HOST === '') {
    throw new Error('Set PORT to an integer from 1 to 65535 and HOST to a non-empty address.');
  }
  return { host: env.HOST ?? '127.0.0.1', port };
}

export function readMetricsPort(value: string | undefined, setting: string): number | undefined {
  if (value === undefined) return undefined;
  const port = readInteger(value, NaN);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Set ' + setting + ' to an integer from 1 to 65535.');
  }
  return port;
}
