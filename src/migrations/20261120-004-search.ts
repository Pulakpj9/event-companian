import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE TABLE public_search_documents (
      kind text NOT NULL CHECK (kind IN ('event', 'listing')),
      entity_id uuid NOT NULL,
      revision integer NOT NULL CHECK (revision > 0),
      title text,
      summary text,
      PRIMARY KEY (kind, entity_id),
      CHECK (title IS NOT NULL OR summary IS NULL)
    );
    CREATE INDEX public_search_text_idx ON public_search_documents
      USING gin (to_tsvector('simple', title || ' ' || coalesce(summary, '')))
      WHERE title IS NOT NULL;
    CREATE INDEX public_search_title_idx ON public_search_documents USING gin (title gin_trgm_ops)
      WHERE title IS NOT NULL;
  `.execute(db);
}
