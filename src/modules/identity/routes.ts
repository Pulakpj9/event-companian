import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from 'typebox';
import { permissions, roles } from './access.js';
import { IdentityError } from './service.js';
import type { createIdentityService } from './service.js';
import type { IdentityClaims } from './tokens.js';

export interface IdentityRoutes {
  service: ReturnType<typeof createIdentityService>;
  verifyToken(token: string): Promise<IdentityClaims>;
  b2b: ReadonlySet<string>;
}

export function createRequestActor({ service, verifyToken, b2b }: IdentityRoutes) {
  return async function actor(request: FastifyRequest, reply: FastifyReply, business: boolean) {
    const token = /^Bearer ([A-Za-z0-9._-]{1,8192})$/i.exec(request.headers.authorization ?? '')?.[1];
    let claims;
    if (token) {
      try { claims = await verifyToken(token); } catch (error) {
        const code = error instanceof Error && 'code' in error ? error.code : undefined;
        if (error instanceof TypeError || code === 'ERR_JWKS_TIMEOUT' || code === 'ERR_JOSE_GENERIC') {
          throw Object.assign(new Error('Identity provider unavailable.'), { statusCode: 503 });
        }
      }
    }
    if (!claims) {
      reply.header('WWW-Authenticate', 'Bearer');
      throw Object.assign(new Error('Valid access token required.'), { statusCode: 401 });
    }
    if (business && !b2b.has(claims.clientId)) throw new IdentityError(403, 'Business client required.');
    return { userId: await service.principal(claims), claims };
  };
}

const uuid = Type.String({ format: 'uuid' });
const organisation = Type.Object({ id: uuid, name: Type.String() });
const role = Type.Enum(roles);
const permission = Type.Enum(permissions);
const accessFields = {
  roles: Type.Array(role, { uniqueItems: true, maxItems: roles.length }),
  permissions: Type.Array(permission, { uniqueItems: true, maxItems: permissions.length }),
};
const access = Type.Object(accessFields, { additionalProperties: false });
const invite = Type.Object({ ...accessFields, email: Type.String({ maxLength: 254, pattern: '^[^\\s@]+@[^\\s@]+$' }) },
  { additionalProperties: false });
const cursor = Type.Object({ after: Type.Optional(uuid) });
const orgParams = Type.Object({ orgId: uuid });
const memberParams = Type.Object({ orgId: uuid, userId: uuid });
const page = <T extends ReturnType<typeof Type.Object>>(item: T) => Type.Object({
  items: Type.Array(item), nextCursor: Type.Union([uuid, Type.Null()]),
});

export async function registerIdentityRoutes(instance: FastifyInstance, { service, verifyToken, b2b }: IdentityRoutes) {
  const app = instance.withTypeProvider<TypeBoxTypeProvider>();
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof IdentityError) return reply.code(error.status).send({ message: error.message });
    if (typeof error === 'object' && error !== null && 'statusCode' in error &&
      typeof error.statusCode === 'number' && [400, 401, 403, 413, 415, 503].includes(error.statusCode)) {
      return reply.code(error.statusCode).send({ message: error instanceof Error ? error.message : 'Request failed.' });
    }
    request.log.error({ errorType: error instanceof Error ? error.name : 'Unknown' }, 'Identity request failed');
    return reply.code(500).send({ message: 'An internal error occurred.' });
  });
  app.addHook('onRequest', async (_request, reply) => { reply.header('Cache-Control', 'no-store'); });

  const actor = createRequestActor({ service, verifyToken, b2b });
  const secure = { security: [{ bearerAuth: [] }] };
  app.get('/api/v1/me', { schema: { ...secure, response: { 200: Type.Object({ userId: uuid }) } } }, async (request, reply) => {
    const { userId } = await actor(request, reply, false);
    return { userId };
  });
  app.get('/api/v1/organisations', { schema: { ...secure, querystring: cursor, response: { 200: page(Type.Object({
    ...organisation.properties, owner: Type.Boolean(), permissions: Type.Array(permission),
  })) } } }, async (request, reply) => {
    const { userId } = await actor(request, reply, true);
    return service.organisations(userId, request.query.after);
  });
  app.post('/api/v1/organisations', { schema: { ...secure, body: Type.Object({
    name: Type.String({ minLength: 1, maxLength: 120, pattern: '\\S' }),
  }, { additionalProperties: false }), response: { 201: organisation } } }, async (request, reply) => {
    const { userId } = await actor(request, reply, true);
    return reply.code(201).send(await service.createOrganisation(userId, request.body.name.trim()));
  });
  app.get('/api/v1/organisations/:orgId/members', { schema: { ...secure, params: orgParams, querystring: cursor,
    response: { 200: page(Type.Object({ userId: uuid, ...accessFields, owner: Type.Boolean(), active: Type.Boolean(),
      effectivePermissions: Type.Array(permission) })) },
  } }, async (request, reply) => {
    const { userId } = await actor(request, reply, true);
    return service.listTeam(request.params.orgId, userId, request.query.after);
  });
  app.post('/api/v1/organisations/:orgId/invitations', { schema: { ...secure, params: orgParams, body: invite,
    response: { 201: Type.Object({ token: Type.String(), expiresAt: Type.String({ format: 'date-time' }) }) },
  } }, async (request, reply) => {
    const { userId } = await actor(request, reply, true);
    const { email, ...grants } = request.body;
    return reply.code(201).send(await service.invite(request.params.orgId, userId, email.toLowerCase(), grants));
  });
  app.post('/api/v1/invitations/accept', { schema: { ...secure, body: Type.Object({
    token: Type.String({ pattern: '^[A-Za-z0-9_-]{43}$' }),
  }, { additionalProperties: false }), response: { 200: Type.Object({ id: uuid }) } } }, async (request, reply) => {
    const { userId, claims } = await actor(request, reply, true);
    return service.accept(userId, claims.verifiedEmail, request.body.token);
  });
  app.put('/api/v1/organisations/:orgId/members/:userId/access', { schema: { ...secure, params: memberParams, body: access } },
    async (request, reply) => {
      const { userId } = await actor(request, reply, true);
      await service.changeAccess(request.params.orgId, userId, request.params.userId, request.body);
      return reply.code(204).send();
    });
  app.delete('/api/v1/organisations/:orgId/members/:userId', { schema: { ...secure, params: memberParams } },
    async (request, reply) => {
      const { userId } = await actor(request, reply, true);
      await service.changeAccess(request.params.orgId, userId, request.params.userId, null);
      return reply.code(204).send();
    });
}
