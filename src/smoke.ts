import { readDatabaseConfig } from './platform/config.js';
import { createDatabase } from './platform/database.js';
import { enqueueProbe } from './platform/probe.js';

async function main() {
  const { DATABASE_URL, DB_POOL_SIZE } = readDatabaseConfig(process.env);
  const db = createDatabase(DATABASE_URL, DB_POOL_SIZE);
  try {
    console.info(await enqueueProbe(db));
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Probe could not be queued.', error instanceof Error ? error.name : 'Unknown');
  process.exitCode = 1;
});
