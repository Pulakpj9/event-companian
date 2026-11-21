import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    CREATE TABLE identity_users (
      id uuid PRIMARY KEY, issuer text NOT NULL, subject text NOT NULL,
      UNIQUE (issuer, subject)
    );
    CREATE TABLE organisations (
      id uuid PRIMARY KEY, name text NOT NULL,
      owner_id uuid NOT NULL REFERENCES identity_users(id)
    );
    CREATE TABLE organisation_members (
      organisation_id uuid NOT NULL REFERENCES organisations(id),
      user_id uuid NOT NULL REFERENCES identity_users(id),
      roles text[] NOT NULL, permissions text[] NOT NULL, active boolean NOT NULL, revoked_at timestamptz,
      PRIMARY KEY (organisation_id, user_id)
    );
    CREATE INDEX organisation_members_user_idx ON organisation_members(user_id, organisation_id);
    CREATE TABLE organisation_invitations (
      token_hash text PRIMARY KEY,
      organisation_id uuid NOT NULL REFERENCES organisations(id),
      inviter_id uuid NOT NULL,
      email text NOT NULL, roles text[] NOT NULL, permissions text[] NOT NULL,
      issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      expires_at timestamptz NOT NULL, accepted_at timestamptz,
      FOREIGN KEY (organisation_id, inviter_id) REFERENCES organisation_members(organisation_id, user_id)
    );
    CREATE TABLE organisation_access_audit (
      id uuid PRIMARY KEY, organisation_id uuid NOT NULL REFERENCES organisations(id),
      actor_id uuid NOT NULL REFERENCES identity_users(id),
      target_user_id uuid REFERENCES identity_users(id),
      action text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now()
    );
  `.execute(db);
}
