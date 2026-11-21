# Foundation public search projection

- **Status:** Implemented for this slice
- **Owning context:** Discovery
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision:** [Pilot infrastructure](../architecture/09-eventos-launch-contracts.md#pilot-infrastructure)

## Scope and design

Add a PostgreSQL projection for explicitly public event and listing documents. Visitors need discovery results that leave withdrawn or private records out. Event and Marketplace will own publishing and supply stable entity IDs and monotonically increasing revisions. Upserts ignore older and duplicate revisions. Withdrawal keeps a revision tombstone and clears indexed text. Search exposes bounded internal queries over full-text and trigram title indexes. The results contain public summaries and do not represent live availability. No HTTP endpoint is exposed until a publishing module owns the inputs.

## Trade-offs and risks

Use PostgreSQL and its pg_trgm extension to meet the proposed pilot scope with the existing database. Confirm extension availability in the production database. A dedicated index would add operational overhead. Start with PostgreSQL simple text normalization. Language-specific ranking, filters, secure private discovery, pagination and workload benchmarks belong to consuming slices. Tombstones need a retention policy aligned with the producer replay window.

## Delivery and validation

Add a migration, typed projection operations, and PostgreSQL tests for indexing, search caps, revision ordering and withdrawal. Verify the full build and tests. Apply the additive migration before consumer rollout. Roll back consumers independently and retain revision history.

## Outcome

The internal projection passed PostgreSQL 18.7 checks for full-text matching, trigram title matching, kind filtering, withdrawal, stale replay and republishing. No client endpoint or publisher integration was introduced. Confirm pg_trgm availability and benchmark the production workload before launch.

Full validation passed with lint, type-check, build, 47 unit tests, 2 HTTP contract tests and 7 PostgreSQL integration tests. The dependency audit reported zero vulnerabilities. Hosted CI and production deployment were not exercised.
