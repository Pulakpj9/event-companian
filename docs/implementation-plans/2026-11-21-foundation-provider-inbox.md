# Foundation Razorpay provider inbox

- **Status:** Implemented for Razorpay intake
- **Owner:** Commerce payment integration
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision:** [Payment and inventory](../architecture/09-eventos-launch-contracts.md#payment-and-inventory)

## Design and trade-offs

Accept opt-in Razorpay webhook traffic for one configured account. Verify the HMAC over bounded original bytes before parsing, then check the signed account ID. Store only allowlisted payment observation fields and a body digest. Deduplicate concurrent deliveries by account and both delivery ID and digest, since the delivery header is outside the signed bytes. A reused delivery ID with a different digest is a conflict. Acknowledge only after the database write commits. A valid unsupported event is acknowledged without storing its contents. The ingest path has no financial side effects.

An inline booking update would tie provider retries to business processing. Persisting complete provider bodies would retain unnecessary customer data. The later payment slice will link observations to known attempts and verify state, amount and currency before applying any effect. That slice owns business idempotency, settlement, refund events and replay. Operational owners should track acknowledgement latency, rejected signatures and oldest unprocessed observation before pilot traffic.

## Delivery and validation

Add an additive migration and a route-scoped raw parser. Wire explicit account and secret configuration, including an optional previous key for retries after rotation. Verify real PostgreSQL deduplication, bounded parsing, normalized fields and unavailable database responses. Run normal CI checks and dependency audit.

## Rollout and rollback

Apply the migration before enabling the sandbox endpoint. Configure only handled event types. Keep credentials in secret management. Leave the endpoint disabled until an approved consumer, retention policy and reconciliation process are in place for live traffic. Rollback disables intake and retains received observations. Provider retries and reconciliation must cover the gap.

## Outcome

Migration 006 is additive. Production API composition registers the sandbox route only when account and webhook secrets are configured. Validation used signed synthetic payloads, exact request bytes, a previous-secret retry, mismatched account, oversize input, ignored events, unavailable storage and concurrent delivery against PostgreSQL 18.7. Tests passed with 47 unit, 7 HTTP contract and 10 PostgreSQL integration cases. Lint, type-check, build and dependency audit passed. No hosted CI, real Razorpay account or reconciliation worker was exercised.
