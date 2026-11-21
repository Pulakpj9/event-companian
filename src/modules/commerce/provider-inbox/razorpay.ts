import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Type } from 'typebox';
import { Value } from 'typebox/value';
import type { Static } from 'typebox';

const maxBodyBytes = 128 * 1024;
export const webhookBodyLimit = maxBodyBytes;
const events = ['payment.authorized', 'payment.captured', 'payment.failed'] as const;
type EventType = typeof events[number];
const eventTypes: ReadonlySet<string> = new Set(events);
const accountPattern = /^acc_[A-Za-z0-9]{1,64}$/;
export const deliveryIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

export function readRazorpayInboxConfig(env: NodeJS.ProcessEnv) {
  const accountId = env.RAZORPAY_WEBHOOK_ACCOUNT_ID;
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  const previous = env.RAZORPAY_WEBHOOK_PREVIOUS_SECRET;
  if (accountId === undefined && secret === undefined && previous === undefined) return undefined;
  if (!accountId || !accountPattern.test(accountId) || !secret?.trim() || (previous !== undefined && !previous.trim())) {
    throw new Error('Configure a valid Razorpay webhook account and secret.');
  }
  return { accountId, secrets: previous ? [secret, previous] : [secret] };
}

const envelope = Type.Object({ account_id: Type.String(), entity: Type.Literal('event'), event: Type.String() });
const schema = Type.Object({
  created_at: Type.Integer({ minimum: 0, maximum: 253402300799 }),
  payload: Type.Object({ payment: Type.Object({ entity: Type.Object({
    id: Type.String({ pattern: '^pay_[A-Za-z0-9]{1,64}$' }),
    entity: Type.Literal('payment'),
    status: Type.Enum(['authorized', 'captured', 'failed']),
    order_id: Type.Optional(Type.Union([Type.Null(), Type.String({ pattern: '^order_[A-Za-z0-9]{1,64}$' })])),
    amount: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
    currency: Type.String({ pattern: '^[A-Z]{3}$' }),
  }) }) }),
});

export interface PaymentObservation {
  accountId: string;
  eventId: string;
  digest: string;
  eventType: EventType;
  paymentId: string;
  orderId: string | null;
  amountMinor: number;
  currency: string;
  occurredAt: Date;
}

export type DecodedWebhook =
  | { status: 'unauthorized' | 'invalid' | 'ignored' }
  | { status: 'accepted'; observation: PaymentObservation };

export function decodeRazorpayWebhook(
  config: NonNullable<ReturnType<typeof readRazorpayInboxConfig>>,
  body: Buffer,
  signature: unknown,
  eventId: unknown,
): DecodedWebhook {
  if (typeof signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(signature)) return { status: 'unauthorized' };
  const supplied = Buffer.from(signature, 'hex');
  let valid = false;
  for (const secret of config.secrets) {
    const expected = createHmac('sha256', secret).update(body).digest();
    valid = timingSafeEqual(expected, supplied) || valid;
  }
  if (!valid) return { status: 'unauthorized' };

  let data: unknown;
  try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)); }
  catch { return { status: 'invalid' }; }
  if (!Value.Check(envelope, data)) return { status: 'invalid' };
  if (data.account_id !== config.accountId) return { status: 'unauthorized' };
  if (!eventTypes.has(data.event)) return { status: 'ignored' };
  if (typeof eventId !== 'string' || !deliveryIdPattern.test(eventId) || !Value.Check(schema, data)) return { status: 'invalid' };

  const payment = (data as Static<typeof schema>).payload.payment.entity;
  if (data.event !== 'payment.' + payment.status) return { status: 'invalid' };
  return { status: 'accepted', observation: {
    accountId: config.accountId, eventId, digest: createHash('sha256').update(body).digest('hex'),
    eventType: data.event as EventType, paymentId: payment.id, orderId: payment.order_id ?? null,
    amountMinor: payment.amount, currency: payment.currency, occurredAt: new Date(data.created_at * 1000),
  } };
}
