# Foundation commercial rule preview

- **Status:** Implemented for this slice
- **Owning context:** Commerce
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision:** [Finance launch contract](../architecture/09-eventos-launch-contracts.md#finance-and-recovery)

Finance needs reproducible rule previews before publication and checkout integration. Implement a pure evaluator over versions that callers provide. Match transaction kind and currency. Select rules in the half-open effective interval, ordered by explicit numeric priority. Report equal-priority ambiguity and missing coverage explicitly. Keep draft use limited to preview callers and filter approved records for runtime. Return a versioned snapshot of the selected fixed fee. Percentage calculation and rounding require a separate Finance decision. No tax, persistence, payment or admin endpoint is introduced.

Reuse the exact Money value. Typed rules are simpler than a generic expression engine and allow deterministic validation. Later persistence must serialize approval of conflicting versions and record the actor. Collect rule-preview outcomes and number of ambiguous sets in the pilot to measure usability.

Run targeted unit cases for effective boundaries, draft filtering, ambiguity, absence and exact snapshots. Roll back consumers independently. There are no migrations in this slice.

## Outcome

The fixed-fee evaluator passed 3 focused cases for effective dates, priority, draft filtering, ambiguity and exact snapshots. Persistent authoring, approval audit, percentage rounding, market-specific rules and checkout wiring remain pending.

Full validation passed with lint, type-check, build, 47 unit tests, 2 HTTP contract tests and 7 PostgreSQL integration tests. The dependency audit reported zero vulnerabilities. Hosted CI and production deployment were not exercised.
