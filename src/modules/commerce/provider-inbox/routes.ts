import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import { decodeRazorpayWebhook, webhookBodyLimit } from './razorpay.js';
import type { PaymentObservation, readRazorpayInboxConfig } from './razorpay.js';
import type { acceptPaymentObservation } from './store.js';

export interface ProviderInboxRoutes {
  config: NonNullable<ReturnType<typeof readRazorpayInboxConfig>>;
  accept(event: PaymentObservation): ReturnType<typeof acceptPaymentObservation>;
}

export async function registerProviderInbox(app: FastifyInstance, options: ProviderInboxRoutes) {
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));
  const response = Type.Object({ message: Type.String() });
  app.post('/api/v1/payment-webhooks/razorpay', {
    bodyLimit: webhookBodyLimit,
    schema: { response: { 204: Type.Null(), 400: response, 401: response, 409: response, 415: response, 503: response } },
    onRequest: async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      const encoding = request.headers['content-encoding'];
      if (encoding && encoding !== 'identity') return reply.code(415).send({ message: 'Unsupported content encoding.' });
    },
  }, async (request, reply) => {
    if (!Buffer.isBuffer(request.body)) return reply.code(400).send({ message: 'Expected a JSON event.' });
    const event = decodeRazorpayWebhook(
      options.config, request.body, request.headers['x-razorpay-signature'], request.headers['x-razorpay-event-id'],
    );
    if (event.status === 'unauthorized') return reply.code(401).send({ message: 'Webhook authentication failed.' });
    if (event.status === 'ignored') return reply.code(204).send();
    if (event.status !== 'accepted') return reply.code(400).send({ message: 'Invalid webhook event.' });
    try {
      const result = await options.accept(event.observation);
      if (result === 'conflict') return reply.code(409).send({ message: 'Webhook delivery ID conflict.' });
      return reply.code(204).send();
    } catch {
      request.log.error('Razorpay inbox write failed.');
      return reply.code(503).send({ message: 'Webhook intake unavailable.' });
    }
  });
}
