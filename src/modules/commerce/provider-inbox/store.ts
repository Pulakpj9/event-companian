import type { Generated, Kysely } from 'kysely';
import type { PlatformDatabase } from '../../../platform/database.js';
import type { PaymentObservation } from './razorpay.js';

export interface ProviderInboxTables {
  razorpay_payment_inbox: {
    account_id: string;
    event_id: string;
    body_digest: string;
    event_type: PaymentObservation['eventType'];
    payment_id: string;
    order_id: string | null;
    amount_minor: string;
    currency: string;
    occurred_at: Date;
    received_at: Generated<Date>;
  };
}

export async function acceptPaymentObservation(db: Kysely<PlatformDatabase>, event: PaymentObservation) {
  const inserted = await db.insertInto('razorpay_payment_inbox').values({
    account_id: event.accountId, event_id: event.eventId, body_digest: event.digest,
    event_type: event.eventType, payment_id: event.paymentId, order_id: event.orderId,
    amount_minor: String(event.amountMinor), currency: event.currency, occurred_at: event.occurredAt,
  }).onConflict(conflict => conflict.doNothing()).returning('event_id').executeTakeFirst();
  if (inserted) return 'stored';

  const existingId = await db.selectFrom('razorpay_payment_inbox').select('body_digest')
    .where('account_id', '=', event.accountId).where('event_id', '=', event.eventId).executeTakeFirst();
  return existingId && existingId.body_digest !== event.digest ? 'conflict' : 'duplicate';
}
