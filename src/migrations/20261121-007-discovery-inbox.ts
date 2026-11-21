import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    CREATE TABLE discovery_event_inbox (
      event_id uuid PRIMARY KEY,
      payload_digest text NOT NULL CHECK (length(payload_digest) = 64),
      processed_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
  `.execute(db);
}
