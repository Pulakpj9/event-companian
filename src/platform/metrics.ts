import metricsClient from '@prometheus-io/client';
import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { PlatformDatabase, PoolState } from './database.js';
import { probeRequested } from './probe.js';
import type { JobOutcome } from './jobs.js';

const { Registry, Gauge, Histogram, Counter } = metricsClient;
const methods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

export function createApiMetrics() {
  const registry = new Registry();
  const requestDuration = new Histogram({
    name: 'companion_http_request_duration_seconds',
    help: 'HTTP response duration by route template, method and status.',
    labelNames: ['route', 'method', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });
  return {
    registry,
    observe(route: string | undefined, method: string, status: number, durationMs: number) {
      requestDuration.observe({ route: route ?? 'unmatched', method: methods.has(method) ? method : 'OTHER', status }, durationMs / 1000);
    },
  };
}

export function registerPoolMetrics(registry: InstanceType<typeof Registry>, readPool: () => PoolState) {
  new Gauge({
    name: 'companion_db_pool_connections', help: 'PostgreSQL connections held by this process.',
    labelNames: ['state'], registers: [registry],
    collect() {
      const { total, idle, max } = readPool();
      this.set({ state: 'idle' }, idle);
      this.set({ state: 'busy' }, total - idle);
      this.set({ state: 'limit' }, max);
    },
  });
  new Gauge({
    name: 'companion_db_pool_waiting_clients', help: 'Clients waiting for a PostgreSQL connection.',
    registers: [registry], collect() { this.set(readPool().waiting); },
  });
}

export function createWorkerMetrics(db: Kysely<PlatformDatabase>) {
  const registry = new Registry();
  const attempts = new Counter({
    name: 'companion_worker_jobs_total', help: 'Diagnostic job attempt outcomes in this process.',
    labelNames: ['outcome'], registers: [registry],
  });
  const errors = new Counter({
    name: 'companion_worker_loop_errors_total', help: 'Worker loop failures in this process.', registers: [registry],
  });
  const states = new Gauge({
    name: 'companion_worker_queue_jobs', help: 'Current number of diagnostic jobs by queue state.',
    labelNames: ['state'], registers: [registry],
  });
  const oldest = new Gauge({
    name: 'companion_worker_queue_oldest_ready_age_seconds',
    help: 'Seconds since the oldest currently claimable diagnostic job was enqueued.',
    registers: [registry],
  });
  return {
    registry,
    async collect() {
      const result = await sql<{ state: string; count: string; oldest: number }>`
        WITH sample AS (SELECT statement_timestamp() AS at),
        queue AS (
          SELECT CASE WHEN dead_at IS NOT NULL THEN 'dead'
            WHEN lease_expires_at > sample.at THEN 'leased'
            WHEN available_at > sample.at THEN 'delayed'
            ELSE 'ready' END AS state, created_at, sample.at
          FROM platform_outbox CROSS JOIN sample
          WHERE event_type = ${probeRequested} AND processed_at IS NULL
        )
        SELECT state, count(*) AS count,
          greatest(0, extract(epoch FROM max(at) - min(created_at)))::float8 AS oldest
        FROM queue GROUP BY state
      `.execute(db);
      for (const state of ['ready', 'leased', 'delayed', 'dead']) {
        states.set({ state }, Number(result.rows.find(row => row.state === state)?.count ?? 0));
      }
      oldest.set(result.rows.find(row => row.state === 'ready')?.oldest ?? 0);
    },
    observe(outcome: JobOutcome) { attempts.inc({ outcome }); },
    observeLoopError() { errors.inc(); },
  };
}
