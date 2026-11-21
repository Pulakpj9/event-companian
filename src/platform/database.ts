import { Kysely, PostgresDialect } from 'kysely';
import type { ColumnType, Generated } from 'kysely';
import pg from 'pg';
import type { DiscoveryInboxTables } from '../modules/discovery/consumer.js';
import type { PublicSearchTables } from '../modules/discovery/public-search.js';
import type { ProviderInboxTables } from '../modules/commerce/provider-inbox/store.js';
import type { CommercialTables } from '../modules/commerce/fixed-fee-tables.js';
import type { EventTables } from '../modules/events/tables.js';
import type { IdentityTables } from '../modules/identity/tables.js';

interface FoundationProbe {
  id: string;
  created_at: ColumnType<Date, never, never>;
  processed_at: Date | null;
}

interface OutboxEvent {
  id: string;
  event_type: string;
  probe_id: string;
  attempts: Generated<number>;
  available_at: Generated<Date>;
  lease_token: string | null;
  lease_expires_at: Date | null;
  dead_at: Date | null;
  last_failure: string | null;
  created_at: ColumnType<Date, never, never>;
  processed_at: Date | null;
}

export interface PlatformDatabase extends IdentityTables, PublicSearchTables, CommercialTables, ProviderInboxTables, DiscoveryInboxTables, EventTables {
  foundation_probe: FoundationProbe;
  platform_outbox: OutboxEvent;
}

export interface PoolState { total: number; idle: number; max: number; waiting: number }

export function createDatabase(connectionString: string, max: number, onPoolReady?: (readPool: () => PoolState) => void) {
  const pool = new pg.Pool({
    connectionString,
    max,
    connectionTimeoutMillis: 3_000,
    statement_timeout: 5_000,
    idle_in_transaction_session_timeout: 10_000,
  });
  pool.on('error', (error) => {
    console.error('An idle PostgreSQL connection failed.', error.name);
  });
  onPoolReady?.(() => ({ total: pool.totalCount, idle: pool.idleCount, max, waiting: pool.waitingCount }));
  return new Kysely<PlatformDatabase>({ dialect: new PostgresDialect({ pool }) });
}
