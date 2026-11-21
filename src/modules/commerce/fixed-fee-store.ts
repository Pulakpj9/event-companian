import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import { Money } from '../../shared/values/money.js';
import { resolveFixedFee } from './domain/fixed-fee.js';
import type { FixedFeeVersion } from './domain/fixed-fee.js';
import type { PlatformDatabase } from '../../platform/database.js';

type Database = Kysely<PlatformDatabase>;
type VersionKey = Pick<FixedFeeVersion, 'id' | 'version'>;
type PreviewInput = Parameters<typeof resolveFixedFee>[1];

export async function draftFixedFee(db: Database, rule: Omit<FixedFeeVersion, 'status'>) {
  resolveFixedFee([{ ...rule, status: 'draft' }], {
    transactionKind: rule.transactionKind, currency: rule.fee.currency, at: rule.effectiveFrom,
  }, 'preview');
  await sql`select public.draft_fixed_fee(
    ${rule.id}::uuid, ${rule.version}::integer, ${rule.transactionKind}::text,
    ${rule.fee.currency}::text, ${rule.fee.toDatabase()}::bigint, ${rule.priority}::integer,
    ${rule.effectiveFrom}::bigint, ${rule.effectiveUntil}::bigint
  )`.execute(db);
}

export async function approveFixedFee(db: Database, key: VersionKey) {
  const result = await sql<{ approved: boolean }>`
    select public.approve_fixed_fee(${key.id}::uuid, ${key.version}::integer) as approved
  `.execute(db);
  return result.rows[0]!.approved;
}

export async function previewFixedFee(db: Database, input: PreviewInput, draft?: VersionKey) {
  if (!Number.isSafeInteger(input.at)) throw new RangeError('Use an epoch millisecond instant.');
  const at = String(input.at);
  const query = db.withSchema('public').selectFrom('commercial_fixed_fee_versions').selectAll()
    .where('transaction_kind', '=', input.transactionKind).where('currency', '=', input.currency)
    .where(eb => {
      const approved = eb.and([
        eb('approved_at', 'is not', null),
        eb('effective_from', '<=', at),
        eb.or([eb('effective_until', 'is', null), eb('effective_until', '>', at)]),
      ]);
      return draft
        ? eb.or([approved, eb.and([eb('rule_id', '=', draft.id), eb('version', '=', draft.version)])])
        : approved;
    });
  const rows = await query.limit(1001).execute();
  if (rows.length > 1000) throw new RangeError('Fee scope has too many matching rules.');
  if (draft && !rows.some(row => row.rule_id === draft.id && row.version === draft.version && !row.approved_at)) {
    throw new RangeError('Requested draft is unavailable for this preview.');
  }
  return resolveFixedFee(rows.map(row => ({
    id: row.rule_id, version: row.version, transactionKind: row.transaction_kind,
    fee: Money.fromDatabase(row.amount_minor, row.currency), priority: row.priority,
    effectiveFrom: Number(row.effective_from),
    effectiveUntil: row.effective_until === null ? null : Number(row.effective_until),
    status: row.approved_at ? 'approved' : 'draft',
  })), input, draft ? 'preview' : 'approved');
}
