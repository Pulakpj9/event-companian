import type { EventRoutes } from './modules/events/routes.js';
import { createEventsService } from './modules/events/service.js';
import { createRequestActor } from './modules/identity/routes.js';
import { searchPublicDocuments } from './modules/discovery/public-search.js';
import { readRazorpayInboxConfig } from './modules/commerce/provider-inbox/razorpay.js';
import { acceptPaymentObservation } from './modules/commerce/provider-inbox/store.js';
import { createApiMetrics, registerPoolMetrics } from './platform/metrics.js';
import { serveMetrics } from './platform/metrics-server.js';
import { readApiConfig, readDatabaseConfig, readMetricsPort } from './platform/config.js';
import { createDatabase } from './platform/database.js';
import { createApp } from './platform/http.js';
import { createIdentityService } from './modules/identity/service.js';
import { createTokenVerifier, readIdentityConfig } from './modules/identity/tokens.js';

async function main() {
  const { host, port } = readApiConfig(process.env);
  const { DATABASE_URL, DB_POOL_SIZE } = readDatabaseConfig(process.env);
  const razorpay = readRazorpayInboxConfig(process.env);
  const auth = readIdentityConfig(process.env);
  const metricsPort = readMetricsPort(process.env.API_METRICS_PORT, 'API_METRICS_PORT');
  const metrics = metricsPort ? createApiMetrics() : undefined;
  const db = createDatabase(DATABASE_URL, DB_POOL_SIZE, metrics && (readPool => registerPoolMetrics(metrics.registry, readPool)));
  let closeMetrics: (() => Promise<void>) | undefined;

  try {
    const identity = auth && { service: createIdentityService(db), verifyToken: createTokenVerifier(auth), b2b: auth.b2b };
    const actor = identity && createRequestActor(identity);
    const events: EventRoutes | undefined = identity && actor && {
      service: createEventsService(db, identity.service),
      businessActor: async (request, reply) => (await actor(request, reply, true)).userId,
    };
    const app = await createApp(async () => {
      await db.selectFrom('platform_outbox').select('id').limit(0).execute();
      await db.selectFrom('public_search_documents').select('entity_id').limit(0).execute();
      if (identity) await db.selectFrom('identity_users').select('id').limit(0).execute();
      if (events) await db.selectFrom('events').select('id').limit(0).execute();
      if (razorpay) await db.selectFrom('razorpay_payment_inbox').select('event_id').limit(0).execute();
    }, true, identity, metrics, razorpay && { config: razorpay, accept: event => acceptPaymentObservation(db, event) }, {
      search: (query, kind) => searchPublicDocuments(db, query, kind),
    }, events);
    const stop = () => {
      void app.close().catch(() => {
        console.error('API shutdown failed.');
        process.exitCode = 1;
      });
    };
    app.addHook('onClose', async () => {
      try { await closeMetrics?.(); } finally { await db.destroy(); }
    });
    if (metrics && metricsPort) closeMetrics = (await serveMetrics(metrics.registry, metricsPort)).close;
    await app.listen({ host, port });
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    try { await closeMetrics?.(); } finally { await db.destroy(); }
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error('API startup failed.', error instanceof Error ? error.name : 'Unknown');
  process.exitCode = 1;
});
