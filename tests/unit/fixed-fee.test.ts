import { expect, it } from 'vitest';
import { Money } from '../../src/shared/values/money.js';
import { resolveFixedFee } from '../../src/modules/commerce/domain/fixed-fee.js';
import type { FixedFeeVersion } from '../../src/modules/commerce/domain/fixed-fee.js';

const ticket = { transactionKind: 'ticket', currency: 'INR', at: 100 } as const;
const approved: FixedFeeVersion = {
  id: 'pilot', version: 1, transactionKind: 'ticket', status: 'approved',
  effectiveFrom: 100, effectiveUntil: 200, priority: 1, fee: Money.of(12n, 'INR'),
};

it('honors half-open effective dates and snapshots the exact selected fee', () => {
  expect(resolveFixedFee([approved], { ...ticket, at: 99 }, 'approved')).toEqual({ status: 'missing' });
  expect(resolveFixedFee([approved], ticket, 'approved')).toEqual({
    status: 'resolved', snapshot: { ruleId: 'pilot', version: 1, currency: 'INR', amountMinor: '12', evaluatedAt: 100 },
  });
  expect(resolveFixedFee([approved], { ...ticket, at: 200 }, 'approved')).toEqual({ status: 'missing' });
});

it('only considers a higher-priority draft during preview', () => {
  const draft = { ...approved, id: 'new', priority: 2, status: 'draft' } as const;
  expect(resolveFixedFee([approved, draft], ticket, 'preview')).toMatchObject({ snapshot: { ruleId: 'new' } });
  expect(resolveFixedFee([draft, approved], ticket, 'approved')).toMatchObject({ snapshot: { ruleId: 'pilot' } });
});

it('fails closed on equal highest priority and ignores unrelated coverage', () => {
  expect(resolveFixedFee([approved, { ...approved, version: 2 }], ticket, 'approved')).toEqual({ status: 'ambiguous' });
  expect(resolveFixedFee([approved], { ...ticket, currency: 'USD' }, 'approved')).toEqual({ status: 'missing' });
  expect(() => resolveFixedFee([{ ...approved, effectiveUntil: 100 }], ticket, 'approved')).toThrow(RangeError);
});
