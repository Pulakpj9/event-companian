import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import type { searchPublicDocuments } from './public-search.js';

export interface DiscoveryRoutes {
  search: (query: string, kind?: 'event' | 'listing') => ReturnType<typeof searchPublicDocuments>;
}

const kind = Type.Enum(['event', 'listing']);
const error = Type.Object({ message: Type.String() });

export async function registerDiscoveryRoutes(app: FastifyInstance, options: DiscoveryRoutes) {
  app.withTypeProvider<TypeBoxTypeProvider>().get('/api/v1/search', {
    schema: {
      querystring: Type.Object({
        q: Type.String({ minLength: 1, maxLength: 120, pattern: '\\S' }),
        kind: Type.Optional(kind),
      }),
      response: {
        200: Type.Object({ items: Type.Array(Type.Object({
          id: Type.String({ format: 'uuid' }), kind,
          title: Type.String(), summary: Type.Union([Type.String(), Type.Null()]),
        }), { maxItems: 25 }) }),
        400: error,
        503: error,
      },
    },
    onRequest: async (_request, reply) => { reply.header('Cache-Control', 'no-store'); },
  }, async (request, reply) => {
    try {
      return reply.code(200).send({ items: await options.search(request.query.q, request.query.kind) });
    } catch {
      request.log.error('Public search query failed.');
      return reply.code(503).send({ message: 'Search unavailable.' });
    }
  });
}
