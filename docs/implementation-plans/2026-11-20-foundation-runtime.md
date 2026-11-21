# Foundation runtime and PostgreSQL slice

- **Status:** Implemented (first Foundation slice)
- **Created:** 2026-11-20
- **Owning bounded context:** Platform infrastructure
- **Related decisions:** [Backend stack](../adr/0001-nodejs-typescript-backend.md), [Launch contracts](../architecture/09-eventos-launch-contracts.md), [Implementation sequence](./2026-11-20-companion-backend-architecture.md#9-implementation-sequence)

## 1. Executive recommendation

Start with the approved Foundation toolchain and an end-to-end PostgreSQL smoke path. This verifies that one commit writes application data and an outbox record, and that a separately running worker can consume it safely.

## 2. Problem statement and context

The workspace contains architecture and product documentation. A deployable runtime and a proven persistence boundary are prerequisites for the next domain slices. Backend engineers and operators need repeatable setup, migration, readiness and replay checks. Success means demonstrating the path on an actual PostgreSQL instance and running the same checks in CI. No revenue claim is attached to the slice.

## 3. Existing architecture and codebase findings

The blueprint selects Node.js 24, TypeScript, Fastify, TypeBox, Kysely and PostgreSQL. Local Node.js and npm are installed. The workspace has no application, CI workflows or migration history. CI can provision PostgreSQL as a service. Local integration tests use a disposable database URL.

## 4. Domain-driven design analysis

Platform infrastructure owns health checks and the diagnostic write. No customer aggregate or commercial policy depends on it. The smoke command is run by an operator with database credentials. The API exposes readiness and a schema-generated contract for probe endpoints. Confirm the workspace and participant access proposal before creating organisation and membership tables.

## 5. Proposed solution and technical design

Use one npm package and separate compiled API, worker, migration and operator commands. Bind the HTTP server locally by default and return generic readiness errors. Validate configuration, bound PostgreSQL connections and queries, and drain or cancel work on shutdown. Add a first Kysely migration with diagnostic and outbox tables. Enqueue atomically and let workers claim a diagnostic event with a row lock and record its database-only effect in the same transaction as completion. Failure rolls back the claim. External-effect jobs will require durable leases, stable effect keys and reconciliation before introduction. Log startup and worker failures without logging environment values or connection strings. Enforce import boundaries as domain modules are added.

## 6. Alternatives and critical trade-off analysis

A public diagnostic write would require a production authorization design for a temporary route. Use a private CLI instead. A broker would add a second dependency to the initial smoke path. Use PostgreSQL and measure demand before choosing additional infrastructure. Keep diagnostic work separate from future business aggregates so exercising the plumbing introduces no customer-facing contract.

## 7. Implementation sequence

1. Pin the runtime, package dependencies and scripts. Add compile, lint and CI configuration.
2. Add Fastify health, readiness and OpenAPI generation, with contract checks.
3. Add migrations, a diagnostic producer and a worker that owns its pool and shutdown.
4. Check atomicity, concurrent consumption, migration repeatability and end-to-end startup with PostgreSQL. Record results and remaining Foundation slices.

## 8. Testing strategy

Run unit tests for bounded configuration and API contract tests for liveness, readiness failure and generated schemas. Run PostgreSQL integration tests for migration repeatability, write rollback and concurrent worker attempts. Verify the readiness and diagnostic path with the compiled entry points. Run dependency audit and static checks in CI.

## 9. Rollout, migration and rollback

Apply the initial migration as an explicit step before starting the API or worker. The schema is additive. Roll back the application by stopping processes and retaining data. The development-only down migration is destructive and must never run against a shared production environment.

## 10. Risks, assumptions and decisions

OIDC, workspace membership, RBAC, business audit, localization and commercial rules are separate Foundation slices. The pilot deployment and provider accounts remain open approval gates. This slice contains no customer data or money movement.

## 11. Definition of done

The compiled API and worker start with bounded configuration, CI runs the planned checks, and the smoke path has database-backed evidence. Report any unavailable checks and execution dependencies.

## 12. Implementation outcome

The API, worker, migrations, diagnostic producer and CI workflow are implemented. A PostgreSQL CI service replaced Testcontainers after dependency audit identified transitive advisories in the Testcontainers chain. The initial migration uses a diagnostic-only outbox and a database-local effect. Future external effects still require the launch contract's leases and reconciliation.

- Local checks passed: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (8 tests), `npm run test:contract` (2 tests), and `npm audit --audit-level=high` (zero reported vulnerabilities).
- The integration suite passed 3 tests against disposable PostgreSQL 18.7, covering a fresh and repeated migration, transaction rollback and concurrent claims. The compiled migration, private enqueue, HTTP readiness and running worker were verified end to end.
- Hosted CI, a production image and graceful shutdown on the deployment platform have not been exercised. There is no prior deployed schema revision to upgrade from.
- Remaining Foundation work includes the approved workspace and identity design, RBAC, business audit and inbox, localization and money primitives, commercial rules, search and production observability.
