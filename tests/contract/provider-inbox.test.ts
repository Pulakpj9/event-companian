import { createHmac } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createApp } from '../../src/platform/http.js';
import { readRazorpayInboxConfig } from '../../src/modules/commerce/provider-inbox/razorpay.js';
import type { PaymentObservation } from '../../src/modules/commerce/provider-inbox/razorpay.js';

const url = '/api/v1/payment-webhooks/razorpay';
const accountId = 'acc_fixture';
const config = readRazorpayInboxConfig({
  RAZORPAY_WEBHOOK_ACCOUNT_ID: accountId, RAZORPAY_WEBHOOK_SECRET: 'test-current',
  RAZORPAY_WEBHOOK_PREVIOUS_SECRET: 'test-previous',
})!;

const fixture = {
  entity: 'event', event: 'payment.captured', account_id: accountId, created_at: 1700000000,
  payload: { payment: { entity: {
    id: 'pay_fixture', entity: 'payment', status: 'captured', order_id: 'order_fixture',
    amount: 5000, currency: 'INR', email: 'fixture@example.test',
  } } },
};
const sign = (body: string, secret = 'test-current') => createHmac('sha256', secret).update(body).digest('hex');
const headers = (signature: string) => ({
  'content-type': 'application/json', 'x-razorpay-signature': signature, 'x-razorpay-event-id': 'evt_fixture',
});

it('authenticates exact bytes, accepts rotation retries, and forwards only normalized fields', async () => {
  const accept = vi.fn<(event: PaymentObservation) => Promise<"stored">>(async () => 'stored' as const);
  const app = await createApp(async () => {}, false, undefined, undefined, { config, accept });
  try {
    const body = JSON.stringify(fixture, null, 2);
    expect((await app.inject({ method: 'POST', url, payload: body, headers: headers(sign(body, 'test-previous')) })).statusCode).toBe(204);
    expect(accept).toHaveBeenCalledExactlyOnceWith({
      accountId, eventId: 'evt_fixture', digest: expect.stringMatching(/^[0-9a-f]{64}$/),
      eventType: 'payment.captured', paymentId: 'pay_fixture', orderId: 'order_fixture',
      amountMinor: 5000, currency: 'INR', occurredAt: new Date(1700000000000),
    });
    expect((await app.inject({ method: 'POST', url, payload: JSON.stringify(fixture), headers: headers(sign(body)) })).statusCode).toBe(401);
    const wrong = JSON.stringify({ ...fixture, account_id: 'acc_other' });
    expect((await app.inject({ method: 'POST', url, payload: wrong, headers: headers(sign(wrong)) })).statusCode).toBe(401);
    expect(accept).toHaveBeenCalledTimes(1);
  } finally { await app.close(); }
});

it('rejects malformed and oversized input, ignores unrelated events, and reports persistence failures', async () => {
  const accept = vi.fn<(event: PaymentObservation) => Promise<"stored">>(async () => { throw new Error('storage detail'); });
  const app = await createApp(async () => {}, false, undefined, undefined, { config, accept });
  try {
    const send = (body: string) => app.inject({ method: 'POST', url, payload: body, headers: headers(sign(body)) });
    expect((await send('{')).statusCode).toBe(400);
    expect((await send(' '.repeat(128 * 1024 + 1))).statusCode).toBe(413);
    expect((await send(JSON.stringify({ ...fixture, event: 'order.paid' }))).statusCode).toBe(204);
    expect(accept).not.toHaveBeenCalled();
    const response = await send(JSON.stringify(fixture));
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ message: 'Webhook intake unavailable.' });
  } finally { await app.close(); }
});

it('keeps provider ingress disabled by default', async () => {
  const app = await createApp(async () => {});
  try {
    expect((await app.inject({ method: 'POST', url })).statusCode).toBe(404);
    expect(readRazorpayInboxConfig({})).toBeUndefined();
    expect(() => readRazorpayInboxConfig({ RAZORPAY_WEBHOOK_ACCOUNT_ID: accountId })).toThrow();
  } finally { await app.close(); }
});
