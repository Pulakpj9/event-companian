import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    CREATE TABLE events (
      id uuid PRIMARY KEY,
      organisation_id uuid NOT NULL REFERENCES organisations(id),
      title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
      summary text NOT NULL CHECK (char_length(summary) <= 2000),
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
      time_zone text NOT NULL,
      status text NOT NULL CHECK (status IN ('draft', 'published')),
      revision integer NOT NULL CHECK (revision > 0),
      UNIQUE (organisation_id, id)
    );
    CREATE TABLE event_revisions (
      organisation_id uuid NOT NULL,
      event_id uuid NOT NULL,
      revision integer NOT NULL,
      actor_id uuid NOT NULL REFERENCES identity_users(id),
      action text NOT NULL CHECK (action IN ('created', 'edited', 'published', 'unpublished')),
      recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (event_id, revision),
      FOREIGN KEY (organisation_id, event_id) REFERENCES events(organisation_id, id)
    );
  `.execute(db);
}
