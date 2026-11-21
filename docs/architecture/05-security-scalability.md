# Security, Scalability and Observability

## 1. Security architecture

### Authentication

- OIDC identity provider
- MFA for organiser admin, finance and super-admin roles
- Secure refresh rotation and session revocation
- Step-up authentication for sensitive actions
- Lockout/rate limiting and suspicious login detection

### Authorization

Every protected operation authorizes:

1. Authentication
2. Membership and tenant
3. Organisation role
4. Resource-level permission
5. Purpose/consent where required
6. Sensitive-action policy

Centralize policy evaluation but keep domain state rules in the owning aggregate/use case.

### Tenant isolation

- All tenant-owned tables include tenant ID.
- Every repository query includes tenant/organisation scope.
- API request context contains no user-spoofable tenant authority.
- Background jobs receive tenant/organisation scope explicitly.
- Cross-tenant exports, support access and admin tools require a justification record.

Preferred isolation test: create a second tenant and attempt the same object IDs, list/search/filter endpoints and object downloads.

### OWASP priorities

- Parameterized SQL and ORM; no executable SQL string concatenation
- Strong output encoding
- CSRF protection for cookie sessions
- Secure CORS allowlist
- Upload validation, malware scanning and private object URLs
- SSRF controls for provider callbacks and URL ingestion
- Dependency scanning and license review
- Secret management and short-lived credentials
- Rate limits on auth, booking, bid, message and AI endpoints
- Prompt-injection controls and tool allowlists

## 2. Sensitive data

Data classes:

- Public
- Business confidential
- Personal
- Financial
- Identity document
- Audit/consent evidence

Controls:

- Encrypt at rest and in transit
- Field-level access for attendee/lead information
- Private object storage for documents
- Signed download URLs with short expiry
- Masked logs and provider webhook payload minimization
- Data export/deletion state machine
- Region-aware retention
- No raw card data

Payment, identity and document providers must receive only necessary data.

## 3. Audit

Audit every:

- Login privilege change
- Role/membership change
- Event publication/cancellation
- Ticket/booth inventory override
- Payment/refund/payout adjustment
- Lead export/share
- Consent change
- AI consequential tool confirmation
- Support/dispute decision
- Moderation and admin action

Audit record fields:

- Actor
- On behalf of
- Tenant/organisation
- Action
- Resource
- Before/after state or state reference
- Reason
- Correlation/trace ID
- IP/device risk metadata where appropriate
- UTC timestamp

Audit records are append-only and cannot be changed by normal application APIs.

## 4. Privacy and consent

- Separate marketing and transactional messaging
- Store purpose, channel, timestamp and evidence
- Block sends after opt-out
- Support export and deletion requests
- Apply retention and anonymization rather than deleting ledger/audit integrity references
- Do not infer sensitive attributes for AI ranking
- Paid placement separate from organic rank

## 5. Performance targets

PRD planning assumptions:

- 10,000 API requests/day
- 20 requests/second sustained burst
- 50 requests/second launch test
- 100 requests/second scaling path

Public API p95:

- `GET` event/listing pages: below 500 ms where practical
- inventory hold: below 1 second
- webhook acknowledgement: below 5 seconds
- notification enqueue: below 1 second

Targets must be measured and reconciled with provider latency. Availability target: 99.9% monthly for core services.

## 6. Hot paths

1. Event discovery
2. Ticket/booth availability
3. Inventory hold and checkout
4. Payment webhook
5. Check-in
6. Auction close
7. Search
8. Notification fan-out

Hot path protections:

- Read-through cache for public projections
- PostgreSQL indexes matching actual filters
- PostgreSQL locks and bounded job claims for bursts
- Perform provider network calls outside confirmation transactions
- Limited batch size for notifications and payouts
- Separate worker queues and priorities

## 7. Scalability

Deploy at least two API replicas across zones.

- Stateless API sessions
- Externalized secrets and configuration
- Managed PostgreSQL with replicas
- Optional cache after measuring the workload
- CDN for public media
- Object storage for files
- PostgreSQL-backed workers
- Horizontal container instance scaling

Database scaling sequence:

1. Query/index tuning
2. Read replica for appropriate reads
3. Partition high-volume audit/outbox/inbox/event tables
4. Separate read model/search
5. Shard only after a tenant/responsibility boundary and migration cost is justified

Sharding is not an MVP requirement.

## 8. Search scaling

- Search documents are eventually consistent
- Availability is rechecked in PostgreSQL/application service
- Pagination is bounded
- Filters use indexed fields
- Distance search uses geospatial index
- Reindexing is throttled and monitored

## 9. Queue scaling

Queues:

| Queue | Purpose | Retry |
|---|---|---|
| `notifications.critical` | Payment/booking/event updates | 3-5 bounded retries |
| `notifications.marketing` | Approved bulk sends | Rate limited |
| `search.projections` | Search document updates | Replayable |
| `payout.reconciliation` | Settlement and payout checks | Scheduled bounded retry |
| `auction.close` | Server-time close operations | Scheduler idempotency |
| `privacy.exports` | Data export jobs | Retry with expiry |
| `ai.telemetry` | AI action audit/metrics | Non-blocking |

Poison messages go to dead-letter storage with operator tooling.

## 10. Observability

[Runtime metrics](../implementation-plans/2026-11-21-foundation-observability.md) cover HTTP latency and status, API connection pool, worker outcomes and queue state via optional loopback listeners. Deployment collection and alert thresholds are separate launch work.

Emit OpenTelemetry traces with:

- Correlation ID
- Tenant and organisation ID
- Resource type and ID
- Operation
- Provider
- Booking/payment state
- Queue attempt

Redact PII and secrets.

Core metrics:

- API request rate, p50/p95/p99, 4xx/5xx
- Database connections, query latency, locks
- Hold/booking success and failure
- Auction close latency
- Payment webhook lag and unknown state
- Refund/payout reconciliation lag
- Queue depth, age and dead-letter count
- Search indexing lag
- Notification provider success/delivery
- AI confirmation and tool failure

Business metrics:

- Successful registrations/bookings
- Booth inquiry-to-booking conversion
- Payout reconciliation accuracy
- Refund/dispute rate
- Duplicate-payment and oversell incidents
- Tenant/API request anomalies

Alerts should trigger on SLO/error-budget burn, not every transient provider retry.

## 11. High availability and DR

- Multi-zone application and database deployment
- Managed backup/PITR
- RPO: 15 minutes or better
- RTO: 4 hours or better for core booking
- Quarterly restore and provider-outage test
- Region switch procedure and DNS/traffic controls
- Retain outbox replay and reconcile provider activity before restarting commerce. See the [launch recovery procedure](./09-eventos-launch-contracts.md#finance-and-recovery).

Provider outage behavior:

- Payment: show unknown/reconciliation status; never fail open
- Notification: enqueue and retry
- Search: continue database-backed reads; mark search stale
- AI: expose AI-off mode
- Maps/calendar: degrade gracefully
