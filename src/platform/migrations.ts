import type { Kysely } from 'kysely';
import type { PlatformDatabase } from './database.js';
import { Migrator } from 'kysely/migration';
import * as foundation from '../migrations/20261120-001-foundation.js';
import * as identity from '../migrations/20261120-002-identity.js';
import * as durableJobs from '../migrations/20261120-003-durable-jobs.js';
import * as search from '../migrations/20261120-004-search.js';
import * as providerInbox from '../migrations/20261121-006-provider-inbox.js';
import * as discoveryInbox from '../migrations/20261121-007-discovery-inbox.js';
import * as events from '../migrations/20261121-008-events.js';
import * as fixedFees from '../migrations/20261121-005-commercial-fixed-fees.js';

export async function migrateDatabase(db: Kysely<PlatformDatabase>) {
  const migrator = new Migrator({
    db,
    provider: { async getMigrations() { return { '20261120-001-foundation': foundation, '20261120-002-identity': identity, '20261120-003-durable-jobs': durableJobs, '20261120-004-search': search, '20261121-005-commercial-fixed-fees': fixedFees, '20261121-006-provider-inbox': providerInbox, '20261121-007-discovery-inbox': discoveryInbox, '20261121-008-events': events }; } },
  });
  const result = await migrator.migrateToLatest();
  if (result.error) throw new Error('PostgreSQL migration failed.', { cause: result.error });
  return result.results ?? [];
}
