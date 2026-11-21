# Foundation discovery API and consumer inbox

- **Status:** Implemented
- **Created:** 2026-11-21
- **Owning context:** Discovery
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision:** [Pilot infrastructure](../architecture/09-eventos-launch-contracts.md#pilot-infrastructure)

## Problem and recommendation

Clients have no search endpoint. The internal projection accepts ordered updates but has no transactionally coupled delivery ledger. Expose bounded public keyword search and commit the event receipt and projection together. This lets attendees find published documents and lets operators safely retry projection updates. Track search latency, empty-result rate and duplicate-event conflicts when pilot publishers exist. Revenue impact is unverified.

## Contracts and boundaries

Discovery owns its projection and consumer inbox. Event and Marketplace own visibility and must publish complete public snapshots or withdrawals with stable document and event IDs and increasing revisions. The consumer is internal and accepts a parsed version-one event with only the allowed fields. PostgreSQL uniqueness makes receipt concurrent-safe. Compare a deterministic digest on replay and surface conflicting event IDs. Roll back the receipt when projection fails. Tombstones prevent older deliveries from restoring withdrawn content. Retain inbox and tombstones through the producer replay window.

GET /api/v1/search accepts q and an optional event or listing kind. The response has at most 25 items with kind, ID, title and summary. Invalid input returns 400 and database failure returns 503. Public queries use no private data or filters. Keep caches disabled initially so withdrawal is reflected on the next read from the projection.

## Review and alternatives

A dedicated search cluster adds no demonstrated value at this stage. An HTTP endpoint for publishing would cross a trust boundary before producer authorization exists. Reuse the PostgreSQL projection and expose reads only. A stale projection can still expose recently withdrawn records until its withdrawal arrives. Producer delivery and production ingress limits must be verified before enabling public production traffic.

## Implementation and validation

Add the inbox migration, an internal consumer and the HTTP read adapter. Verify duplicate and concurrent receipts, rollback, withdrawals, public response shaping, validation and dependency failure. Run standard CI commands. Apply the additive migration before deploying. Roll back binaries while retaining receipts and tombstones. No changes to existing public API contracts.

## Outcome

The API exposes public search and Discovery accepts version-one projection events through the internal consumer. The consumer records receipt and projection in one transaction. It reports successful receipt of a stale revision even when the projection correctly stays unchanged.

Validation passed with lint, type-check, build, 47 unit tests, 9 HTTP contract tests and 11 PostgreSQL integration tests on a fresh disposable database. The dependency audit reported zero vulnerabilities. Hosted deployment and producer wiring were outside this slice. The test migration ran on a disposable database. The configured development database was left for the normal migration command.
