# Companion backend

The first Foundation slice provides a Fastify API, a PostgreSQL-backed diagnostic outbox, and a separate worker. See the [architecture blueprint](./docs/architecture/README.md) and [Foundation slice plan](./docs/implementation-plans/2026-11-20-foundation-runtime.md).

## Run locally

Use Node.js 24.21.0, npm 11.19.0 and a disposable PostgreSQL database for development. Set `DATABASE_URL` in each terminal that runs a database command. `HOST` defaults to `127.0.0.1`, `PORT` to `3000` and `DB_POOL_SIZE` to `5` per process. In a container, configure `HOST=0.0.0.0` and budget the pool across all API and worker replicas.

To use a file for local configuration, copy [.env.example](./.env.example) to `.env` and fill in the placeholders. Create the database named in `DATABASE_URL` first. `npm run db:migrate` loads `.env` if it exists. Values already set in the process environment take precedence. To load `.env` for the API and worker, run `node --env-file=.env dist/api.js` and `node --env-file=.env dist/worker.js` in separate terminals after building and migrating.

```sh
npm ci
npm run build
npm run db:migrate
npm start
```

In another terminal, start `npm run start:worker`. Run `npm run smoke:enqueue` to enqueue a database-only diagnostic. It prints the probe ID. Query `foundation_probe.processed_at` for that ID to verify the worker handled it. `GET /health/live` checks the HTTP process. `GET /health/ready` checks that PostgreSQL and the outbox table are available. The OpenAPI contract is generated from the registered route schemas and checked by the contract suite.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm run test:contract
npm audit --audit-level=high
```

Set `TEST_DATABASE_URL` to a freshly created disposable PostgreSQL database and run `npm run test:integration`. The suite applies migrations and writes test records. The CI workflow provisions a PostgreSQL service for each run.

## Durable jobs and search

Stop legacy workers before deploying the durable worker. Apply migrations before starting the new API or worker. The worker backs off failed diagnostic jobs and dead-letters exhausted attempts. Use the outbox columns dead_at, attempts, and last_failure for inspection. The search migration requires PostgreSQL pg_trgm and the migration role must be able to install it if it is absent. GET /api/v1/search?q=example accepts an optional kind of event or listing and returns up to 25 public results. Migration 007 adds the Discovery consumer inbox. Migration 008 adds basic event authoring for authenticated business clients. An event remains private as a draft. Publishing adds its title and summary to public search in the same commit. Unpublishing removes them immediately. Marketplace publishers remain pending.

## Identity and organisation teams

Apply the migrations before enabling identity. Set AUTH_ISSUER and AUTH_JWKS_URL to the trusted provider HTTPS URLs, AUTH_AUDIENCE to the backend API audience, and AUTH_B2C_CLIENT_IDS and AUTH_B2B_CLIENT_IDS to distinct comma-separated client IDs. Configure the provider to issue short-lived RS256 RFC 9068 access tokens with a shared subject across app registrations. Invitation acceptance requires a verified email claim. Use a B2B client token for team routes. Without these settings, the API continues to expose health probes.

GET /api/v1/me returns the same principal ID across app sessions. The B2B client can create and list organisations, list members, issue an invitation, and change or remove access. The invite response contains a one-time token valid for 48 hours. Share it through a private channel. The service stores only its hash. Invitation delivery and the frontends are future slices.

## Commercial fixed fees

Run the private command with an individual PostgreSQL login. Use separate author and approver roles. After migration, the database administrator can grant the following privileges to existing operator group roles. Keep direct table write access with the database owner.

```sql
GRANT USAGE ON SCHEMA public TO fee_authors, fee_approvers;
GRANT SELECT ON public.commercial_fixed_fee_versions TO fee_authors, fee_approvers;
GRANT EXECUTE ON FUNCTION public.draft_fixed_fee(uuid, integer, text, text, bigint, integer, bigint, bigint) TO fee_authors;
GRANT EXECUTE ON FUNCTION public.approve_fixed_fee(uuid, integer) TO fee_approvers;
```

Run npm run commercial with the draft, preview, or approve action and one JSON argument. The draft requires id (UUID), version, transactionKind (ticket, booth, or sponsorship), currency, amountMinor (integer text), priority, effectiveFrom (epoch milliseconds), and effectiveUntil (epoch milliseconds or null). To preview, supply transactionKind, currency, and at (epoch milliseconds). An optional draft object with id and version adds that single draft to the preview. To approve, supply id and version. The rule must start in the future, and a different operator must approve it. An approved rule at the same priority cannot overlap the new rule for the same kind and currency. The proposal and approval record the database login and timestamp.

## Runtime metrics

Set API_METRICS_PORT and WORKER_METRICS_PORT independently to enable separate loopback-only GET /metrics listeners. Use distinct ports when both processes share a network namespace. A local collector or sidecar scrapes the listeners. Metrics ports do not belong in public ingress.

Use companion_http_request_duration_seconds_count for request and error rates and the matching histogram buckets for latency. Monitor companion_db_pool_waiting_clients for connection pressure. Worker attempt outcomes and loop errors are per-process counters. The worker queue gauges reflect shared PostgreSQL state. Aggregate those gauges with max across worker replicas. A worker scrape returns 503 when the database sample fails. Queue age measures time since the oldest claimable job was created, including time already spent retrying.

Set alert budgets after observing the pilot workload. OpenTelemetry tracing and deployment-level dashboards and paging are still planned.

## Razorpay sandbox webhooks

Apply migration 006 before enabling the webhook. Configure RAZORPAY_WEBHOOK_ACCOUNT_ID and RAZORPAY_WEBHOOK_SECRET for one sandbox account. RAZORPAY_WEBHOOK_PREVIOUS_SECRET is optional during key rotation. Keep the previous value only for the provider retry window. Store secrets in the deployment secret store.

Subscribe POST /api/v1/payment-webhooks/razorpay to payment.authorized, payment.captured and payment.failed. The API returns 204 after a verified event is stored or recognized as a duplicate. It returns 503 when storage is unavailable so the provider can retry. A valid unsupported event is acknowledged without recording it. The inbox records a small normalized observation, with no full payload or customer contact fields.

This endpoint is disabled by default. Keep live traffic disabled until payment reconciliation, operator replay and retention are operational.
