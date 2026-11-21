import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    CREATE TABLE razorpay_payment_inbox (
      account_id text NOT NULL,
      event_id text NOT NULL,
      body_digest text NOT NULL,
      event_type text NOT NULL CHECK (event_type IN ('payment.authorized', 'payment.captured', 'payment.failed')),
      payment_id text NOT NULL,
      order_id text,
      amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
      currency text NOT NULL,
      occurred_at timestamptz NOT NULL,
      received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (account_id, event_id),
      UNIQUE (account_id, body_digest)
    );
  `.execute(db);
}
