import { Money } from '../../../shared/values/money.js';

export interface FixedFeeVersion {
  readonly id: string;
  readonly version: number;
  readonly transactionKind: 'ticket' | 'booth' | 'sponsorship';
  readonly effectiveFrom: number;
  readonly effectiveUntil: number | null;
  readonly priority: number;
  readonly status: 'draft' | 'approved';
  readonly fee: Money;
}

export function resolveFixedFee(
  rules: readonly FixedFeeVersion[],
  input: { transactionKind: FixedFeeVersion['transactionKind']; currency: string; at: number },
  mode: 'preview' | 'approved',
) {
  if (!Number.isSafeInteger(input.at)) throw new RangeError('Use an epoch millisecond instant.');
  Money.of(0n, input.currency);
  let winner: FixedFeeVersion | undefined;
  let ambiguous = false;
  for (const rule of rules) {
    if (rule.transactionKind !== input.transactionKind || rule.fee.currency !== input.currency) continue;
    if (mode === 'approved' && rule.status !== 'approved') continue;
    if (!rule.id.trim() || !Number.isSafeInteger(rule.version) || rule.version < 1 ||
      !Number.isSafeInteger(rule.priority) || !Number.isSafeInteger(rule.effectiveFrom) ||
      (rule.effectiveUntil !== null && (!Number.isSafeInteger(rule.effectiveUntil) || rule.effectiveUntil <= rule.effectiveFrom)) ||
      rule.fee.amountMinor < 0n) {
      throw new RangeError('Invalid fixed fee rule version.');
    }
    if (input.at < rule.effectiveFrom || (rule.effectiveUntil !== null && input.at >= rule.effectiveUntil)) continue;
    if (!winner || winner.priority < rule.priority) {
      winner = rule;
      ambiguous = false;
    } else if (winner.priority === rule.priority) {
      ambiguous = true;
    }
  }
  if (!winner) return { status: 'missing' } as const;
  if (ambiguous) return { status: 'ambiguous' } as const;
  return {
    status: 'resolved',
    snapshot: {
      ruleId: winner.id, version: winner.version, currency: winner.fee.currency,
      amountMinor: winner.fee.toDatabase(), evaluatedAt: input.at,
    },
  } as const;
}
