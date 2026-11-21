# Foundation runtime observability

- **Status:** Implemented for runtime metrics
- **Owning context:** Platform infrastructure
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision:** [Observability baseline](../architecture/05-security-scalability.md#10-observability)

## Purpose and boundaries

Operators need to identify slow API requests, failed worker attempts and stalled delivery. Add process-local Prometheus metrics and bounded metric labels. The API owns request duration and PostgreSQL pool utilization. The worker owns attempt outcomes and live PostgreSQL backlog measurements. These are infrastructure signals. Booking and provider metrics belong to the slices that own those actions.

## Approach and trade-offs

Use the maintained @prometheus-io/client package for exposition and histograms. Serve metrics on optional separate loopback listeners. The public API router has no metrics route. Scrape via a local collector or sidecar. This baseline provides metrics independently of the later OpenTelemetry tracing and deployment alert configuration. A log-only approach cannot expose queue age reliably or support histogram aggregation. A hosted monitoring service would require deployment and credentials that have yet to be selected.

Use matched route templates and known HTTP methods. Use a fixed fallback for unmatched requests. Record worker dispositions only after the attempt outcome is known. Scope the queue gauges to the diagnostic consumer, with database time for age and readiness. Return 503 when queue sampling fails. Use single-flight scrape collection per listener to bound concurrent database work, and leave the existing database query timeouts in force.

## Implementation and acceptance

1. Add opt-in listener configuration and process-local metric registries.
2. Instrument API requests and pool state, and record diagnostic worker outcomes and queue state.
3. Test HTTP exposition, bounded labels, database outage behavior and accurate queue counts against PostgreSQL.
4. Start the compiled API and worker with local listeners and verify a processed probe yields metrics.

## Rollout and rollback

No migration. Opt in separately for API and worker. Keep listener traffic on loopback and have a local collector scrape both. Roll back by unsetting metrics ports or reverting the binaries. Queue state is replicated across worker scrapes, so use max across replicas for gauges. Aggregate per-process counters and histograms across replicas. Set alert thresholds after recording a pilot baseline.

## Outcome

API and worker expose separate opt-in loopback Prometheus endpoints. HTTP measurements use fixed route templates and bounded labels. API pool pressure and database-derived queue depth, age, dead letters and worker outcomes are available to local scrapers. The review selected the maintained @prometheus-io/client package after its former distribution reported a deprecation.

Lint, type-check, build, 47 unit tests, 4 HTTP contract tests and 9 PostgreSQL integration tests passed. The dependency audit reported zero vulnerabilities. Compiled API, worker, probe enqueue and both metric scrapes were verified together against disposable PostgreSQL 18.7. No schema migration is required. Hosted collection, alert thresholds, tracing and production deployment were not exercised.
