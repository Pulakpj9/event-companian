# Companion Backend Architecture Blueprint

**Status:** Proposed implementation baseline  
**Source of requirements:** `docs/Unified_Event_Experience_Ecosystem_PRD_Functional_Specification.md`

## Executive decision

**Recommended architecture:** a modular monolith with independently replaceable modules, a shared infrastructure layer, and asynchronous integration through a PostgreSQL transactional outbox and durable jobs.

This is the least complex architecture that satisfies the MVP's cross-domain consistency requirements. Event booking, ticket inventory, booth inventory, payments, refunds and audit records are materially coupled. Starting with microservices would add distributed-transaction and operational failure modes before independent scaling or team-ownership boundaries are proven.

### Rejected-by-default alternatives

- **Independent microservices:** rejected for the MVP. They add latency, distributed transactions, deployment coordination and replay complexity without a measured independent-scaling need.
- **Pure shared-table monolith:** rejected. It is deployable but weakens bounded-context ownership and would allow CRM, AI or billing to reach transaction tables directly.
- **Hybrid with pre-created services:** acceptable only after concrete triggers. The search and notification jobs may be separate worker processes from the start because they require independent scaling and isolation, while remaining in the same solution.

## Architecture package

| Document | Purpose |
|---|---|
| [01-architecture-and-domain.md](./01-architecture-and-domain.md) | System shape, bounded contexts, aggregates, dependencies and diagrams |
| [02-data-and-persistence.md](./02-data-and-persistence.md) | PostgreSQL schemas, tenancy, constraints, indexes, caching and lifecycle |
| [03-api-contract.md](./03-api-contract.md) | API conventions, endpoints, auth, validation and error contracts |
| [04-workflows-and-events.md](./04-workflows-and-events.md) | State machines, concurrency, workflows and asynchronous event design |
| [05-security-scalability.md](./05-security-scalability.md) | Security controls, performance, scaling and observability |
| [06-integrations-infrastructure.md](./06-integrations-infrastructure.md) | Provider adapters, infrastructure, CI/CD, DR and operations |
| [07-testing-roadmap.md](./07-testing-roadmap.md) | Test strategy, release phases, deliverables and acceptance gates |
| [08-requirements-traceability.md](./08-requirements-traceability.md) | PRD capability, requirement and unresolved-decision traceability |

See [EventOS launch contracts and pilot gates](./09-eventos-launch-contracts.md) for the proposed access, commerce and recovery contracts.

See [attendee and business clients](./10-attendee-business-clients.md) for the separate client experiences and shared identity model.

## Operating principles

1. PostgreSQL is the system of record. Redis caches data but never owns authoritative state.
2. Inventory and payment state transitions use database transactions and idempotency keys.
3. Cross-module calls start inside application use cases and use domain/integration events for consequences.
4. Tenant and resource authorization occur in application services and policy evaluators, not only in UI/API code.
5. Money uses integer minor units and ISO 4217 currency codes. Prices, taxes, fees and terms are snapshotted at commitment.
6. Public APIs expose stable contracts; internal modules do not share database tables or persistence models.
7. Search, AI, notifications and analytics are derived views or asynchronous consumers, never the source of truth.
8. Core workflows remain usable when optional providers are unavailable, subject to explicit degraded behavior.

## Recommended technology baseline

| Concern | Baseline |
|---|---|
| Runtime/API | Node.js 24 LTS baseline, strict TypeScript, Fastify with TypeBox route schemas and generated OpenAPI |
| Build and verification | npm with a committed lockfile, `tsc`, ESLint, Vitest and a disposable real PostgreSQL database for integration tests |
| Data | PostgreSQL with Kysely, `pg` and versioned Kysely migrations |
| Cache | CDN for public media. Redis only after a measured need. |
| Jobs | PostgreSQL-backed outbox jobs. Add a broker only with workload or isolation evidence. |
| Search | PostgreSQL full-text and trigram projections, with a dedicated index gated by evidence |
| Object storage | S3-compatible object storage with private buckets |
| Observability | OpenTelemetry, managed Prometheus/Grafana or vendor equivalent, structured JSON logs |
| Deployment | Managed containers |
| Delivery | GitHub Actions or existing enterprise CI, signed artifacts, staged environments |

Node.js and TypeScript are the selected runtime and language. The framework, database tooling and exact dependency versions are proposed defaults to verify during Foundation. The [backend stack decision record](../adr/0001-nodejs-typescript-backend.md) explains the trade-offs and verification criteria.
