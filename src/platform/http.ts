import { registerProviderInbox } from '../modules/commerce/provider-inbox/routes.js';
import type { ProviderInboxRoutes } from '../modules/commerce/provider-inbox/routes.js';
import { registerDiscoveryRoutes } from '../modules/discovery/routes.js';
import type { DiscoveryRoutes } from '../modules/discovery/routes.js';
import { registerEventRoutes } from '../modules/events/routes.js';
import type { EventRoutes } from '../modules/events/routes.js';
import swagger from '@fastify/swagger';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { Type } from 'typebox';
import { registerIdentityRoutes } from '../modules/identity/routes.js';
import type { IdentityRoutes } from '../modules/identity/routes.js';
import type { createApiMetrics } from './metrics.js';

const status = <T extends string>(value: T) => Type.Object({ status: Type.Literal(value) });

export async function createApp(checkDatabase: () => Promise<void>, logger = false, identity?: IdentityRoutes, metrics?: ReturnType<typeof createApiMetrics>, providerInbox?: ProviderInboxRoutes, discovery?: DiscoveryRoutes, events?: EventRoutes) {
  const app = Fastify({ logger }).withTypeProvider<TypeBoxTypeProvider>();
  if (metrics) app.addHook('onResponse', async (request, reply) => {
    metrics.observe(request.routeOptions.url, request.method, reply.statusCode, reply.elapsedTime);
  });
  await app.register(swagger, {
    openapi: { info: { title: 'Companion Backend', version: '0.1.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } },
  });

  app.get('/health/live', {
    schema: { response: { 200: status('ok') } },
  }, async () => ({ status: 'ok' as const }));

  app.get('/health/ready', {
    schema: { response: { 200: status('ready'), 503: status('unavailable') } },
  }, async (request, reply) => {
    try {
      await checkDatabase();
      return reply.code(200).send({ status: 'ready' });
    } catch (error) {
      request.log.warn({ errorType: error instanceof Error ? error.name : 'Unknown' }, 'PostgreSQL readiness check failed');
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  if (identity) await app.register(registerIdentityRoutes, identity);
  if (providerInbox) await app.register(registerProviderInbox, providerInbox);
  if (discovery) await app.register(registerDiscoveryRoutes, discovery);
  if (events) await app.register(registerEventRoutes, events);
  return app;
}
