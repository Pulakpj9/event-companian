import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from 'typebox';
import { EventError } from './service.js';
import type { createEventsService } from './service.js';
import { IdentityError } from '../identity/service.js';

export interface EventRoutes {
  service: ReturnType<typeof createEventsService>;
  businessActor(request: FastifyRequest, reply: FastifyReply): Promise<string>;
}

const uuid = Type.String({ format: 'uuid' });
const fields = {
  title: Type.String({ minLength: 1, maxLength: 300 }),
  summary: Type.String({ maxLength: 2000 }),
  startsAt: Type.String({ maxLength: 32 }),
  endsAt: Type.String({ maxLength: 32 }),
  timeZone: Type.String({ maxLength: 100 }),
};
const event = Type.Object({
  id: uuid, organisationId: uuid, ...fields,
  status: Type.Enum(['draft', 'published']), revision: Type.Integer(),
});
const path = Type.Object({ id: uuid });
const secure = { security: [{ bearerAuth: [] }] };

export async function registerEventRoutes(instance: FastifyInstance, { service, businessActor }: EventRoutes) {
  const app = instance.withTypeProvider<TypeBoxTypeProvider>();
  app.addHook('onRequest', async (_request, reply) => { reply.header('Cache-Control', 'no-store'); });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof EventError || error instanceof IdentityError) return reply.code(error.status).send({ message: error.message });
    if (error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number' &&
        [400, 401, 403, 413, 415, 503].includes(error.statusCode)) {
      return reply.code(error.statusCode).send({ message: error instanceof Error ? error.message : 'Request failed.' });
    }
    request.log.error({ errorType: error instanceof Error ? error.name : 'Unknown' }, 'Event request failed');
    return reply.code(500).send({ message: 'An internal error occurred.' });
  });

  app.post('/api/v1/organisations/:orgId/events', { schema: {
    ...secure, params: Type.Object({ orgId: uuid }), body: Type.Object(fields), response: { 201: event },
  } }, async (request, reply) => {
    const actor = await businessActor(request, reply);
    return reply.code(201).send(await service.create(request.params.orgId, actor, request.body));
  });

  app.get('/api/v1/events/:id', { schema: { ...secure, params: path, response: { 200: event } } }, async (request, reply) =>
    service.get(request.params.id, await businessActor(request, reply)));

  app.patch('/api/v1/events/:id', { schema: {
    ...secure, params: path, body: Type.Intersect([
      Type.Partial(Type.Object(fields)),
      Type.Object({ revision: Type.Integer({ minimum: 1, maximum: 2147483647 }) }),
    ]), response: { 200: event },
  } }, async (request, reply) => {
    const actor = await businessActor(request, reply);
    const { revision, ...draft } = request.body;
    return service.edit(request.params.id, actor, revision, draft);
  });

  for (const [action, status] of [['publish', 'published'], ['unpublish', 'draft']] as const) {
    app.post('/api/v1/events/:id/' + action, { schema: { ...secure, params: path, response: { 200: event } } },
      async (request, reply) => service.publish(request.params.id, await businessActor(request, reply), status));
  }
}
