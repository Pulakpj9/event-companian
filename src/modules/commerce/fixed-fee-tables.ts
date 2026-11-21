import type { Generated } from 'kysely';
import type { FixedFeeVersion } from './domain/fixed-fee.js';

export interface CommercialTables {
  commercial_fixed_fee_versions: {
    rule_id: string;
    version: number;
    transaction_kind: FixedFeeVersion['transactionKind'];
    currency: string;
    amount_minor: string;
    priority: number;
    effective_from: string;
    effective_until: string | null;
    drafted_by: string;
    drafted_at: Generated<Date>;
    approved_by: string | null;
    approved_at: Date | null;
  };
}
