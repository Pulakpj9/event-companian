import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await sql`
    CREATE TABLE public.commercial_fixed_fee_versions (
      rule_id uuid NOT NULL,
      version integer NOT NULL CHECK (version > 0),
      transaction_kind text NOT NULL CHECK (transaction_kind IN ('ticket', 'booth', 'sponsorship')),
      currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
      amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
      priority integer NOT NULL,
      effective_from bigint NOT NULL CHECK (effective_from BETWEEN 0 AND 9007199254740991),
      effective_until bigint CHECK (effective_until > effective_from AND effective_until <= 9007199254740991),
      drafted_by text NOT NULL,
      drafted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      approved_by text,
      approved_at timestamptz,
      PRIMARY KEY (rule_id, version),
      CHECK ((approved_at IS NULL) = (approved_by IS NULL)),
      CHECK (approved_by IS NULL OR approved_by <> drafted_by)
    );
    CREATE INDEX commercial_fixed_fee_approved_scope
      ON commercial_fixed_fee_versions (transaction_kind, currency, priority, effective_from)
      WHERE approved_at IS NOT NULL;

    CREATE FUNCTION public.draft_fixed_fee(
      uuid, integer, text, text, bigint, integer, bigint, bigint
    ) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $fee$
      INSERT INTO public.commercial_fixed_fee_versions (
        rule_id, version, transaction_kind, currency, amount_minor, priority,
        effective_from, effective_until, drafted_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, session_user);
    $fee$;

    CREATE FUNCTION public.approve_fixed_fee(uuid, integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $fee$
    DECLARE
      candidate public.commercial_fixed_fee_versions%ROWTYPE;
    BEGIN
      IF current_setting('transaction_isolation') <> 'read committed' THEN
        RAISE EXCEPTION 'Use read committed isolation for fee approval' USING ERRCODE = '25001';
      END IF;
      PERFORM pg_advisory_xact_lock(21560, 1);
      SELECT * INTO candidate FROM public.commercial_fixed_fee_versions
        WHERE rule_id = $1 AND version = $2;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Fee draft does not exist' USING ERRCODE = 'P0002';
      END IF;
      IF candidate.drafted_by = session_user THEN
        RAISE EXCEPTION 'A different operator must approve the fee' USING ERRCODE = '42501';
      END IF;
      IF candidate.approved_at IS NOT NULL THEN RETURN false; END IF;
      IF candidate.effective_from <= extract(epoch FROM clock_timestamp()) * 1000 THEN
        RAISE EXCEPTION 'The fee effective start must be in the future' USING ERRCODE = '22023';
      END IF;
      IF EXISTS (
        SELECT 1 FROM public.commercial_fixed_fee_versions AS fee
        WHERE fee.approved_at IS NOT NULL
          AND fee.transaction_kind = candidate.transaction_kind AND fee.currency = candidate.currency
          AND fee.priority = candidate.priority
          AND int8range(fee.effective_from, fee.effective_until, '[)')
            && int8range(candidate.effective_from, candidate.effective_until, '[)')
      ) THEN
        RAISE EXCEPTION 'An approved fee overlaps at the same priority' USING ERRCODE = '23P01';
      END IF;
      UPDATE public.commercial_fixed_fee_versions
        SET approved_by = session_user, approved_at = clock_timestamp()
        WHERE rule_id = $1 AND version = $2;
      RETURN true;
    END;
    $fee$;

    REVOKE ALL ON FUNCTION public.draft_fixed_fee(uuid, integer, text, text, bigint, integer, bigint, bigint) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.approve_fixed_fee(uuid, integer) FROM PUBLIC;
  `.execute(db);
}
