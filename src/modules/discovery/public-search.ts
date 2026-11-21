import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { PlatformDatabase } from '../../platform/database.js';

export type PublicDocumentKind = 'event' | 'listing';

export interface PublicSearchTables {
  public_search_documents: {
    kind: PublicDocumentKind;
    entity_id: string;
    revision: number;
    title: string | null;
    summary: string | null;
  };
}

export async function projectPublicDocument(
  db: Kysely<PlatformDatabase>,
  key: { kind: PublicDocumentKind; id: string; revision: number },
  document: { title: string; summary: string } | null,
) {
  if (!Number.isInteger(key.revision) || key.revision < 1 || key.revision > 2_147_483_647) {
    throw new RangeError('Use a positive PostgreSQL integer revision.');
  }
  if (document && (!document.title.trim() || document.title.length > 300 || document.summary.length > 2000)) {
    throw new RangeError('Search documents require a bounded public title and summary.');
  }

  await db.insertInto('public_search_documents').values({
    kind: key.kind, entity_id: key.id, revision: key.revision,
    title: document?.title ?? null, summary: document?.summary ?? null,
  }).onConflict(conflict => conflict.columns(['kind', 'entity_id']).doUpdateSet(eb => ({
    revision: eb.ref('excluded.revision'), title: eb.ref('excluded.title'), summary: eb.ref('excluded.summary'),
  })).whereRef('public_search_documents.revision', '<', 'excluded.revision')).execute();
}

export async function searchPublicDocuments(db: Kysely<PlatformDatabase>, query: string, kind?: PublicDocumentKind) {
  const term = query.trim();
  if (!term || term.length > 120) throw new RangeError('Search text must contain 1 to 120 characters.');
  const text = sql`to_tsvector('simple', title || ' ' || coalesce(summary, ''))`;
  const tokens = sql`plainto_tsquery('simple', ${term})`;
  let results = db.selectFrom('public_search_documents')
    .select(['kind', 'entity_id as id', 'title', 'summary']).$narrowType<{ title: string }>()
    .where('title', 'is not', null)
    .where(sql<boolean>`(${text} @@ ${tokens} OR title % ${term})`);
  if (kind) results = results.where('kind', '=', kind);
  return results.orderBy(sql`ts_rank(${text}, ${tokens}) + similarity(title, ${term})`, 'desc')
    .orderBy('kind').orderBy('id').limit(25).execute();
}
