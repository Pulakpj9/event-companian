import { createHash } from 'node:crypto';
import type { Generated, Kysely } from 'kysely';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { Value } from 'typebox/value';
import type { PlatformDatabase } from '../../platform/database.js';
import { projectPublicDocument } from './public-search.js';

export interface DiscoveryInboxTables {
  discovery_event_inbox: {
    event_id: string;
    payload_digest: string;
    processed_at: Generated<Date>;
  };
}

const uuid = Type.String({ pattern: '^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$' });
const eventSchema = Type.Object({
  type: Type.Literal('discovery.public_document_changed.v1'),
  eventId: uuid,
  kind: Type.Enum(['event', 'listing']),
  documentId: uuid,
  revision: Type.Integer({ minimum: 1, maximum: 2147483647 }),
  document: Type.Union([Type.Null(), Type.Object({
    title: Type.String({ minLength: 1, maxLength: 300 }),
    summary: Type.String({ maxLength: 2000 }),
  }, { additionalProperties: false })]),
}, { additionalProperties: false });

export type PublicDocumentChanged = Static<typeof eventSchema>;

export async function consumePublicDocumentChange(
  db: Kysely<PlatformDatabase>,
  input: unknown,
): Promise<'applied' | 'duplicate' | 'conflict'> {
  if (!Value.Check(eventSchema, input)) throw new RangeError('Invalid public document event.');
  const { eventId, kind, documentId, revision, document } = input;
  const digest = createHash('sha256')
    .update(JSON.stringify([input.type, kind, documentId, revision, document && [document.title, document.summary]]))
    .digest('hex');

  async function apply(tx: Kysely<PlatformDatabase>) {
    const receipt = await tx.insertInto('discovery_event_inbox')
      .values({ event_id: eventId, payload_digest: digest })
      .onConflict(conflict => conflict.column('event_id').doNothing())
      .returning('event_id').executeTakeFirst();
    if (!receipt) {
      const existing = await tx.selectFrom('discovery_event_inbox').select('payload_digest')
        .where('event_id', '=', eventId).executeTakeFirstOrThrow();
      return existing.payload_digest === digest ? 'duplicate' : 'conflict';
    }
    await projectPublicDocument(tx, { kind, id: documentId, revision }, document);
    return 'applied' as const;
  }

  return db.isTransaction ? apply(db) : db.transaction().execute(apply);
}
