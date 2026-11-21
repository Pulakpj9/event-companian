# Node.js and TypeScript backend

**Status** — Node.js and TypeScript selected. Supporting tools proposed for Foundation verification.

Companion will use Node.js and strict TypeScript for its modular monolith. Use Node.js 24 LTS as the planning baseline. Pin the supported patch version and npm version across development, CI and production during Foundation. Compile with `tsc` and run the emitted JavaScript in the API and worker processes.

## Proposed defaults

- **Fastify and TypeBox.** Fastify plugins give each bounded context a place to register its routes. TypeBox supplies runtime schemas and TypeScript inference, and `@fastify/swagger` generates OpenAPI. Express would require the team to assemble validation, schema-to-type tooling and documentation. NestJS offers stronger framework conventions at the cost of having to keep its dependency injection and decorators out of domain and application code. Revisit it if the team has an established NestJS delivery standard.
- **PostgreSQL via Kysely and `pg`.** The booking and finance design needs explicit transactions, locks, conditional updates and constrained writes. Kysely provides typed queries while retaining direct access to SQL. Raw `pg` would leave result typing and migration coordination to the project. A full ORM would provide more convenience for simple CRUD, while the highest-risk writes would still need explicit SQL and constraint tests.
- **npm, ESLint, Vitest and a PostgreSQL CI service.** Use one lockfile and one backend package. Run HTTP contract tests against the Fastify app in process and prove migration and concurrency behavior against real PostgreSQL. The first slice uses the CI service and a local database URL after dependency audit identified advisories in the proposed Testcontainers dependency chain.

## Foundation verification

Pin compatible versions after checking runtime support, package maintenance and licenses. Validate one narrow path that registers a schema-backed route, generates OpenAPI, applies migrations, and commits a PostgreSQL write with an outbox record. Exercise raw-body webhook signature verification and concurrent inventory updates in integration tests. Run the API and worker with separate bounded database pools, and verify graceful shutdown so workers stop taking new jobs before their connections close.

The stack choice leaves the launch-market finance, tenant access, and auction policies as separate decisions in the [implementation plan](../implementation-plans/2026-11-20-companion-backend-architecture.md).
