# Foundation durable PostgreSQL jobs

- **Status:** Implemented for this slice
- **Owning context:** Platform infrastructure
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision record:** [EventOS pilot infrastructure](../architecture/09-eventos-launch-contracts.md#pilot-infrastructure)

## Recommendation and context

Upgrade the current diagnostic outbox to prove PostgreSQL-backed leasing, retry and dead-letter behavior. The API and worker are already deployed as separate processes. Operators need an actionable signal when work stalls. The pilot can measure queue age and recovery time once workloads and SLOs are known.

## Design and trade-offs

Keep the existing producer transaction. Add attempt count, an availability timestamp, a lease token and expiry, and dead-letter metadata through an additive migration. A worker claims one ready event with a row lock and SKIP LOCKED. It commits the claim before attempting work. A database-clock lease and unique token fence stale workers. The diagnostic consumer commits its effect and completion together. On failure, retry with capped exponential backoff and jitter. Expired attempts count against the limit. An expired final attempt goes to dead letter. Restrict this worker to its owned event type. Log bounded lifecycle events without event payloads.

The database-local effect can guarantee atomic completion. The transport still permits repeat attempts after a crash. External calls require stable effect keys and reconciliation by the owning module. A separate broker adds operational cost before workload evidence supports it. An in-memory scheduler cannot recover after process loss.

## Implementation and validation

1. Add migration and typed columns.
2. Route the existing worker and probe through leasing and recovery.
3. Test concurrent claims, stale completion, retry scheduling, expiry and dead letters against PostgreSQL.
4. Run lint, type-check, build, unit, HTTP contract and integration suites. Document the worker and operator diagnostics.

## Rollout and rollback

Apply the additive migration before new worker deployment. Stop legacy workers first because they claim directly from the same outbox. A rollback to the legacy worker requires stopping new workers and reviewing pending, leased and dead-lettered rows. Keep schema and history. Restore exercises must preserve event identity and use the commercial recovery procedure before restarting future money-moving workers.

## Scope and remaining risks

This slice owns diagnostic delivery only. Provider inboxes, replay authorization, event-specific external effects, dashboards and production SLOs require their own slices. Commercial policies and production identity remain subject to their existing decisions.

## Outcome

The running worker now uses the durable path for diagnostic probes. PostgreSQL 18.7 integration verified concurrent claims, rollback, expired lease recovery, stale completion and failure, backoff and both dead-letter paths. Apply the additive migration and drain legacy workers before rollout. External effects, provider inboxes, configured alerting and authorised replay remain pending.

Full validation passed with lint, type-check, build, 47 unit tests, 2 HTTP contract tests and 7 PostgreSQL integration tests. The dependency audit reported zero vulnerabilities. Hosted CI and production deployment were not exercised.
