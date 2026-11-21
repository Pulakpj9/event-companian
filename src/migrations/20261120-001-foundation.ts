import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await db.schema.createTable('foundation_probe')
    .addColumn('id', 'uuid', (column) => column.primaryKey())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn('processed_at', 'timestamptz')
    .execute();

  await db.schema.createTable('platform_outbox')
    .addColumn('id', 'uuid', (column) => column.primaryKey())
    .addColumn('event_type', 'text', (column) => column.notNull())
    .addColumn('probe_id', 'uuid', (column) => column.notNull().references('foundation_probe.id').unique())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull().defaultTo(sql`now()`))
    .addColumn('processed_at', 'timestamptz')
    .execute();

  await sql`CREATE INDEX platform_outbox_pending_idx ON platform_outbox (created_at, id)
    WHERE processed_at IS NULL`.execute(db);
}

export async function down(db: Kysely<unknown>) {
  await db.schema.dropTable('platform_outbox').execute();
  await db.schema.dropTable('foundation_probe').execute();
}
