import { setTimeout } from 'node:timers/promises';
import { createWorkerMetrics } from './platform/metrics.js';
import { serveMetrics } from './platform/metrics-server.js';
import { readDatabaseConfig, readMetricsPort } from './platform/config.js';
import { createDatabase } from './platform/database.js';
import { processNextProbe } from './platform/probe.js';

async function main() {
  const { DATABASE_URL, DB_POOL_SIZE } = readDatabaseConfig(process.env);
  const metricsPort = readMetricsPort(process.env.WORKER_METRICS_PORT, 'WORKER_METRICS_PORT');
  const db = createDatabase(DATABASE_URL, DB_POOL_SIZE);
  const metrics = metricsPort ? createWorkerMetrics(db) : undefined;
  let closeMetrics: (() => Promise<void>) | undefined;
  const stop = new AbortController();
  process.once('SIGINT', () => stop.abort());
  process.once('SIGTERM', () => stop.abort());

  try {
    await db.selectFrom('platform_outbox').select('attempts').limit(0).execute();
    if (metrics && metricsPort) closeMetrics = (await serveMetrics(metrics.registry, metricsPort, metrics.collect)).close;
    console.info('Foundation worker started.');
    while (!stop.signal.aborted) {
      let delay = 0;
      try {
        if (!(await processNextProbe(db, metrics?.observe))) delay = 500;
      } catch (error) {
        metrics?.observeLoopError();
        console.error('Worker transaction failed.', error instanceof Error ? error.name : 'Unknown');
        delay = 5_000;
      }
      if (delay) await setTimeout(delay, undefined, { signal: stop.signal });
    }
  } catch (error) {
    if (!(stop.signal.aborted && error instanceof Error && error.name === 'AbortError')) throw error;
  } finally {
    try { await closeMetrics?.(); } finally { await db.destroy(); }
  }
}

main().catch((error: unknown) => {
  const code = error instanceof Error && 'code' in error ? error.code : undefined;
  const hints = new Map([
    ['3D000', 'Create the PostgreSQL database named in DATABASE_URL, then apply the migrations.'],
    ['42P01', 'Apply the database migrations before starting the worker.'],
    ['42703', 'Apply the latest database migrations before starting the worker.'],
    ['28P01', 'Check the PostgreSQL credentials in DATABASE_URL.'],
    ['42501', 'Check the PostgreSQL permissions for the worker login.'],
    ['ECONNREFUSED', 'Check that PostgreSQL is running and listening at the address in DATABASE_URL.'],
    ['EADDRINUSE', 'Choose a free WORKER_METRICS_PORT or leave it unset.'],
  ]);
  console.error('Worker failed.', typeof code === 'string' && hints.has(code)
    ? `(${code}) ${hints.get(code)}`
    : 'Check the worker configuration and PostgreSQL server logs.');
  process.exitCode = 1;
});
