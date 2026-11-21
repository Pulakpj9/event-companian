import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { PlatformDatabase } from './database.js';

type Database = Kysely<PlatformDatabase>;
const maxAttempts = 5;

export type JobOutcome = 'completed' | 'retry' | 'dead' | 'stale';

export interface JobLease {
  id: string;
  token: string;
  attempt: number;
}

function ownedJob(db: Database, lease: JobLease) {
  return db.selectFrom('platform_outbox').select(['id', 'probe_id'])
    .where('id', '=', lease.id).where('lease_token', '=', lease.token)
    .where('processed_at', 'is', null).where('dead_at', 'is', null);
}

export async function claimJob(db: Database, eventType: string, observe?: (outcome: JobOutcome) => void): Promise<JobLease | undefined> {
  const outcome = await db.transaction().execute(async tx => {
    const job = await tx.selectFrom('platform_outbox').select(['id', 'attempts'])
      .where('event_type', '=', eventType)
      .where('processed_at', 'is', null).where('dead_at', 'is', null)
      .where('available_at', '<=', sql<Date>`clock_timestamp()`)
      .where(eb => eb.or([eb('lease_expires_at', 'is', null), eb('lease_expires_at', '<=', sql<Date>`clock_timestamp()`)]))
      .orderBy('available_at').orderBy('created_at').orderBy('id').forUpdate().skipLocked().limit(1)
      .executeTakeFirst();
    if (!job) return undefined;

    if (job.attempts >= maxAttempts) {
      await tx.updateTable('platform_outbox').set({
        dead_at: sql<Date>`clock_timestamp()`, lease_token: null, lease_expires_at: null, last_failure: 'lease_expired',
      }).where('id', '=', job.id).execute();
      return 'expired';
    }

    const token = randomUUID();
    const attempt = job.attempts + 1;
    await tx.updateTable('platform_outbox').set({
      attempts: attempt, lease_token: token, lease_expires_at: sql<Date>`clock_timestamp() + interval '30 seconds'`,
    }).where('id', '=', job.id).execute();
    return { id: job.id, token, attempt };
  });
  if (outcome === 'expired') {
    observe?.('dead');
    console.warn(JSON.stringify({ event: 'job_dead_lettered', reason: 'lease_expired' }));
    return undefined;
  }
  return outcome;
}

export async function completeProbe(db: Database, lease: JobLease): Promise<boolean> {
  return db.transaction().execute(async tx => {
    const job = await ownedJob(tx, lease).forUpdate().executeTakeFirst();
    if (!job) return false;
    const clock = sql<Date>`clock_timestamp()`;
    const result = await tx.updateTable('platform_outbox')
      .set({ processed_at: sql<Date>`transaction_timestamp()`, lease_token: null, lease_expires_at: null })
      .where('id', '=', job.id).where('lease_expires_at', '>', clock).executeTakeFirst();
    if (!result.numUpdatedRows) return false;
    await tx.updateTable('foundation_probe').set({ processed_at: sql<Date>`transaction_timestamp()` })
      .where('id', '=', job.probe_id).executeTakeFirstOrThrow();
    return true;
  });
}

export async function failJob(db: Database, lease: JobLease): Promise<'retry' | 'dead' | 'stale'> {
  return db.transaction().execute(async tx => {
    const job = await ownedJob(tx, lease).forUpdate().executeTakeFirst();
    if (!job) return 'stale';
    const delayMs = Math.min(60_000, 1000 * 2 ** (lease.attempt - 1)) + Math.floor(Math.random() * 500);
    const terminal = lease.attempt >= maxAttempts;
    const result = await tx.updateTable('platform_outbox').set({
      lease_token: null,
      lease_expires_at: null,
      last_failure: 'processing_failed',
      dead_at: terminal ? sql<Date>`clock_timestamp()` : null,
      available_at: sql<Date>`clock_timestamp() + ${delayMs} * interval '1 ms'`,
    }).where('id', '=', job.id).where('lease_expires_at', '>', sql<Date>`clock_timestamp()`).executeTakeFirst();
    return result.numUpdatedRows ? terminal ? 'dead' : 'retry' : 'stale';
  });
}
