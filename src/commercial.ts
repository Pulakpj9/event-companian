import { Type } from 'typebox';
import { Value } from 'typebox/value';
import { readDatabaseConfig } from './platform/config.js';
import { createDatabase } from './platform/database.js';
import { approveFixedFee, draftFixedFee, previewFixedFee } from './modules/commerce/fixed-fee-store.js';
import { Money } from './shared/values/money.js';

const integer = Type.Integer({ minimum: -2147483648, maximum: 2147483647 });
const instant = Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER });
const kind = Type.Enum(['ticket', 'booth', 'sponsorship']);
const currency = Type.String({ pattern: '^[A-Z]{3}$' });
const key = Type.Object({
  id: Type.String({ pattern: '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' }),
  version: Type.Integer({ minimum: 1, maximum: 2147483647 }),
}, { additionalProperties: false });
const draft = Type.Object({
  ...key.properties, transactionKind: kind, currency,
  amountMinor: Type.String({ maxLength: 19 }), priority: integer,
  effectiveFrom: instant, effectiveUntil: Type.Union([instant, Type.Null()]),
}, { additionalProperties: false });
const preview = Type.Object({
  transactionKind: kind, currency, at: instant, draft: Type.Optional(key),
}, { additionalProperties: false });

async function main() {
  const [, , action, json] = process.argv;
  if (!json || json.length > 4096 || process.argv.length !== 4) {
    throw new Error('Supply a command and one JSON argument.');
  }
  const input: unknown = JSON.parse(json);
  const config = readDatabaseConfig(process.env);
  const db = createDatabase(config.DATABASE_URL, config.DB_POOL_SIZE);
  try {
    if (action === 'draft' && Value.Check(draft, input)) {
      const { amountMinor, currency, ...rule } = input;
      await draftFixedFee(db, { ...rule, fee: Money.fromDatabase(amountMinor, currency) });
      console.log(JSON.stringify({ status: 'drafted', id: rule.id, version: rule.version }));
    } else if (action === 'approve' && Value.Check(key, input)) {
      const changed = await approveFixedFee(db, input);
      console.log(JSON.stringify({ status: changed ? 'approved' : 'already_approved' }));
    } else if (action === 'preview' && Value.Check(preview, input)) {
      console.log(JSON.stringify(await previewFixedFee(db, input, input.draft)));
    } else {
      throw new Error('Invalid commercial command or JSON fields.');
    }
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  const code = error instanceof Error && 'code' in error ? error.code : undefined;
  const reasons = new Map([
    ['42501', 'Permission denied or the draft requires a different approver.'],
    ['23P01', 'An approved fee overlaps at the same priority.'],
    ['P0002', 'Fee draft does not exist.'],
    ['22023', 'The fee effective start must be in the future.'],
    ['23505', 'That rule version already exists.'],
  ]);
  console.error(typeof code === 'string'
    ? reasons.get(code) ?? 'Commercial operation failed with database code ' + code + '.'
    : error instanceof RangeError ? error.message : 'Invalid commercial command, input or database configuration.');
  process.exitCode = 1;
});
