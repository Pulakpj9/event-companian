import { readDatabaseConfig } from './platform/config.js';
import { createDatabase } from './platform/database.js';
import { migrateDatabase } from './platform/migrations.js';

async function main() {
  const { DATABASE_URL, DB_POOL_SIZE } = readDatabaseConfig(process.env);
  const db = createDatabase(DATABASE_URL, DB_POOL_SIZE);
  try {
    const migrations = await migrateDatabase(db);
    console.info(migrations.length ? migrations : 'Database is up to date.');
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  const cause = error instanceof Error ? error.cause : undefined;
  const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
  console.error('Migration failed.', typeof code === 'string' ? code : 'Check database settings and permissions.');
  process.exitCode = 1;
});
