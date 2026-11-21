import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    ALTER TABLE platform_outbox
      ADD COLUMN attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
      ADD COLUMN available_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      ADD COLUMN lease_token uuid,
      ADD COLUMN lease_expires_at timestamptz,
      ADD COLUMN dead_at timestamptz,
      ADD COLUMN last_failure text,
      ADD CONSTRAINT platform_outbox_lease_pair CHECK ((lease_token IS NULL) = (lease_expires_at IS NULL)),
      ADD CONSTRAINT platform_outbox_terminal_state CHECK (
        (processed_at IS NULL OR dead_at IS NULL)
        AND ((processed_at IS NULL AND dead_at IS NULL) OR lease_token IS NULL)
      );
    CREATE INDEX platform_outbox_dispatch_idx
      ON platform_outbox (event_type, available_at, created_at, id)
      WHERE processed_at IS NULL AND dead_at IS NULL;
  `.execute(db);
}
