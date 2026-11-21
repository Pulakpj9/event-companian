import { randomUUID } from 'node:crypto';
import { claimJob, completeProbe, failJob } from './jobs.js';
import type { JobOutcome } from './jobs.js';
import type { Kysely } from 'kysely';
import type { PlatformDatabase } from './database.js';

export const probeRequested = 'foundation.probe.requested.v1';

export async function enqueueProbe(db: Kysely<PlatformDatabase>, id = randomUUID()) {
  await db.transaction().execute(async (tx) => {
    await tx.insertInto('foundation_probe').values({ id, processed_at: null }).execute();
    await tx.insertInto('platform_outbox')
      .values({ id, probe_id: id, event_type: probeRequested, processed_at: null })
      .execute();
  });
  return id;
}

export async function processNextProbe(db: Kysely<PlatformDatabase>, observe?: (outcome: JobOutcome) => void) {
  const lease = await claimJob(db, probeRequested, observe);
  if (!lease) return false;

  try {
    const completed = await completeProbe(db, lease);
    observe?.(completed ? 'completed' : 'stale');
    return completed;
  } catch (error) {
    const disposition = await failJob(db, lease);
    observe?.(disposition);
    console.error(JSON.stringify({ event: 'probe_failed', disposition, attempt: lease.attempt }));
    throw error;
  }
}
