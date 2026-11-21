# Feature Implementation Plan: Companion Backend Architecture

- **Status:** Draft
- **Author:** Principal architecture review
- **Created:** 2026-11-20
- **Last updated:** 2026-11-20
- **Related issue / request:** User architecture and implementation blueprint request
- **Owning bounded context:** Platform-wide foundation
- **Related ADRs:** [Node.js and TypeScript backend](../adr/0001-nodejs-typescript-backend.md) and [EventOS launch contracts and pilot gates](../architecture/09-eventos-launch-contracts.md)

## 1. Executive recommendation

- **Recommendation:** modular monolith for Release 1 and the MVP, with separate workers for search, notifications and reconciliation.
- **Why this approach:** It preserves strong transaction boundaries for tickets, booths and finance while avoiding premature distributed ownership.
- **Main trade-offs:** One deployable unit creates a shared release cadence and a shared runtime resource pool; extraction boundaries must remain explicit.
- **Largest risks:** A weak module boundary will recreate a legacy monolith, and under-specified commercial/settlement rules can create financial defects.
- **Runtime:** Node.js and TypeScript. Use Node.js 24 LTS, strict TypeScript, Fastify and Kysely/`pg` as the initial baseline, subject to Foundation verification of exact versions and compatibility.
- **Confidence:** High for architecture direction. Deployment details depend on the launch country and cloud selection.

## 2. Problem statement and context

### 2.1 Current behavior

The repository contains only architecture requirements and no existing application code or infrastructure. The PRD spans event operations, ticketing, exhibitions, auctions, marketplaces, CRM, journeys, AI, payments and governance.

### 2.2 Problem to solve

Build a multi-tenant, global-ready SaaS platform that combines event-led transactions with a reusable commerce and relationship foundation, without replacing the core booking invariants with disconnected modules.

### 2.3 Goals

- Prevent duplicate tickets and booth allocations.
- Preserve authoritative payment and booking states.
- Support organiser, exhibitor, attendee, provider and admin journeys.
- Provide tenant, organisation and object-level isolation.
- Support later global expansion without a rewrite.

### 2.4 Non-goals

- A day-one microservice topology
- Full ERP/marketing automation replacement
- A global airline/hotel GDS
- Companion-as-MoR before legal review
- Generative AI as a source of truth or financial authority

### 2.5 Requirements and acceptance criteria

| ID | Requirement / scenario | Acceptance criterion | Priority |
|---|---|---|---|
| R1 | Private data stays within its workspace and shared transactions grant participant access | Cross-workspace buyer, seller, staff, export and file policy tests pass | Must |
| R2 | Ticket/booth inventory cannot oversell | Concurrent tests and database invariants pass | Must |
| R3 | Duplicate webhooks and retries are safe | Exactly one payment/booking side effect | Must |
| R4 | Booth direct/auction/hybrid rules are explicit | One active allocation and auditable close | Must |
| R5 | Payout is reconciled | Batch, settlement and retry ledger agree | Must |
| R6 | Sensitive operations are audited | Actor/action/resource/reason retained | Must |
| R7 | Recover unknown and late provider outcomes | Timeout reconciles and late capture creates one compensation without issuing inventory | Must |
| R8 | Data supports locale/currency/timezone | Stored independently and frozen at checkout | Must |

## 3. Product, business and stakeholder critique

### Stakeholder experience

| Stakeholder | Need | Proposed experience | Failure/recovery |
|---|---|---|---|
| Organiser | Publish, sell and operate events | Guided setup, inventory, financial reporting | Cancelled event/refund console |
| Exhibitor | Secure and operate participation | Application/direct/bid flows and dashboard | Approval expiry/payment default handling |
| Attendee | Discover/register/check in | Simple checkout, tickets and QR | Payment unknown/refund/reissue |
| Seller/provider | Convert qualified demand | Listing, RFQ, quotation, fulfilment | Dispute, reschedule and fulfilment case |
| Admin/support | Govern safely | Scoped role, moderation and case tools | Audit, reason capture and appeal |

### Business value

The core value hypothesis is that an event-led workflow is a stronger entry point than a disconnected marketplace. Revenue can come from subscriptions, transaction fees and paid placement. These are hypotheses until pilot evidence is collected. No-build means existing event tools remain fragmented and the unified CRM/itinerary opportunity is not realized.

## 4. Existing architecture and codebase findings

- The repository contains no application source, database schema or infrastructure code.
- It contains the PRD, a feature-plan template and orchestration guidance.
- The PRD defines P0 MVP workflows: identity, events, ticketing, exhibitions, payment, admin and audit.
- The PRD later broadens to marketplace, CRM, journeys, AI and enterprise integrations.
- The 10,000 daily request baseline is low in volume but ticket/auction/check-in peaks require burst testing.

## 5. DDD and transaction design

The major bounded contexts and aggregates are detailed in `docs/architecture/01-architecture-and-domain.md`. The key transaction decisions are PostgreSQL atomicity for booking, auction and payment inbox state, plus outbox/inbox for cross-context consequences.

Unresolved requirements such as country, MoR, payout eligibility, auction tie-break and exact floor-plan MVP scope must be resolved before implementation of their domain rules.

## 6. Data and API contracts

- PostgreSQL source of truth, with Kysely and `pg` for typed queries and explicit transaction boundaries, plus versioned migrations
- PostgreSQL locks and constraints for authoritative inventory. Redis is an optional later cache.
- REST/v1 on Fastify with TypeBox runtime schemas and generated OpenAPI
- Idempotency for bookings, payments and refunds
- Integer minor-unit money
- Immutable checkout snapshots
- Cursor pagination

## 7. Event and integration design

- Transactional outbox
- Consumer inbox
- PostgreSQL-backed outbox jobs for MVP. Introduce a separate broker only after a documented workload or isolation need.
- Provider-independent payment/notification/map/calendar/AI ports
- Search projection rather than source-of-truth index

## 8. Security and scalability

- OIDC, MFA for privileged users
- Tenant/organisation/object authorization
- RLS only as defense in depth
- Encryption, private files, data export/deletion
- 99.9% planning availability, RPO 15 minutes, RTO 4 hours
- Horizontal API/worker scaling

See the [attendee and business client design](../architecture/10-attendee-business-clients.md) and [identity and teams implementation slice](./2026-11-20-foundation-identity-teams.md).

## 9. Implementation sequence

| Step | Change | Dependencies | Exit criteria |
|---|---|---|---|
| 1 | Confirm pilot country, scope and eligible providers | Product, legal and finance discovery | Record named decision owners and approve the scope and applicable market prerequisites |
| 2 | Establish the Node.js and TypeScript toolchain, API and worker, migrations, CI and PostgreSQL jobs | Compatible versions and deployment account | Schema-backed route produces OpenAPI and an integration test proves atomic write and outbox |
| 3 | Shared identity and business team access, then participant access and commercial-rule authoring | Workspace design adopted for implementation. Provider, participant and commercial policies have their own gates | Team isolation and revocation checks, followed by shared-transaction and commercial approval checks |
| 4 | Event publishing, participation modes, ticket inventory, registrant export and QR check-in | Steps 2–3 and approved pilot scope | PRD P0 event and free-registration scenarios pass |
| 5 | Paid checkout, invoice/receipt, cancellation, refund and reconciliation | Steps 3–4 and approved finance and hold cutoff | Capture/expiry races, unknown outcomes, concurrent refunds and receipts pass |
| 6 | Exhibition floor plan, booth direct/apply and sponsorship basics | Steps 3–5 and approved geometry and scope | Concurrent booking, role-scoped portal and accessible floor plan checks pass |
| 7 | Auction and hybrid, including winner payment and default | Step 6 and approved auction rules | Same-booth, cutoff, deposit, fallback and late-payment cases pass |
| 8 | Seller balances, settlement and payouts | Step 5 and approved market/provider setup | Concurrent batches, unknown transfers, reversals and payout reconciliation pass. Any pilot payout automation deferral has a documented settlement path and sign-off |
| 9 | Pilot operations, notifications, discovery and commercial recovery | Steps 3–8 as applicable | Admin and support rehearse the pilot. Load targets and post-restore reconciliation pass before paid sales |


## 10. Testing and validation

Unit, application, integration, API, security, concurrency, resilience, load and accessibility testing are specified in `docs/architecture/07-testing-roadmap.md`.

Foundation will add `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run test:contract` and `npm run test:integration` to the CI workflow. The [first Foundation slice](./2026-11-20-foundation-runtime.md) adds these scripts and records local validation.

## 11. Rollout

- Feature flags for auction, hybrid, sponsorship and later markets
- Staging with provider sandboxes
- Canary launch
- Database migration compatibility test
- Rollback migration plan or forward-fix procedure
- Controlled pilot with real support and reconciliation owners

## 12. Risks and open decisions

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Market boundaries are premature | Medium | High | Defer physical services and extract only measured modules |
| Financial rules vary by country | High | High | Seller/MoR/rule review before commercial implementation |
| Payment provider settlement differs | High | High | Provider adapter and reconciliation-first design |
| Inventory concurrency defects | Medium | High | PostgreSQL locks, partial unique constraints and load tests |
| Cross-context module leakage | Medium | Medium | Architecture tests and integration contracts |
| AI misuse or PII exposure | Medium | High | Tool allowlist, confirmation, filtering and audit |
| Search stale availability | Medium | Medium | Recheck source of truth before commitment |
| Workload assumptions are wrong | High | Medium | Validate and load test before pilot |

### Decisions and approval timing

The roles below are accountable for obtaining approval. Assign a named owner and calendar date at kickoff. Each deadline is tied to the work it gates.

| Decision | Accountable roles | Deadline | Required evidence |
|---|---|---|---|
| Launch market, languages, event type, web/Android/iOS and pilot scope, including sponsorship and exhibitor lead capture | Product lead | Before committing Foundation scope | Signed PRD v1.1 release matrix with explicit pilot deferrals and a named pilot organiser |
| Tenant definition, participant grants, support access and residency | Engineering and Security leads | Before creating identity and ownership migrations | Approved permission matrix and launch-region/provider data map |
| Merchant of record, invoice/tax model, provider eligibility, refunds and settlement | Finance and Legal leads | Before paid checkout and payout implementation | Approved market rules and actual provider account/capability evidence |
| Hold cutoff and compensation | Product and Finance leads | Before paid booking implementation | Approved customer wording, exception ownership and race outcomes |
| Auction terms and floor-plan editing | Product lead, with Finance/Legal for deposits | Before the affected exhibition slice | Published-rule sample and prototype |
| Peak mix, budget, recovery and support coverage | Operations lead | Before pilot load and restore drills | Signed workload and incident runbooks, finance restart procedure and support roster |
| Later provider approvals, Gemini terms and regional expansion | Product and Security leads | Before each affected release | Provider approval, budget and data-use evidence |

### Review disposition

The [launch contracts](../architecture/09-eventos-launch-contracts.md) specify proposed access, late payment, auctions, ledger, recovery and infrastructure behavior. The [roadmap](../architecture/07-testing-roadmap.md) follows PRD v1.1 and the [traceability matrix](../architecture/08-requirements-traceability.md) tracks P0 by ID. These decisions remain drafts until the accountable roles approve the applicable slices. Documentation validation for this revision checks relative links, exact P0 ID coverage and stack/roadmap consistency. Provider eligibility and runtime behavior require the planned slice checks.


## 13. Definition of done

- [ ] Requirements and acceptance criteria are met.
- [ ] The architecture documents are complete and implementation-ready.
- [ ] Open decisions are explicitly owned and time-bound.
- [ ] Domain boundaries and aggregate rules are clear.
- [ ] API, database and event contracts have compatibility strategies.
- [ ] Security, privacy, payouts and audit are addressed.
- [ ] Testing, rollout and disaster recovery are specified.
- [ ] No application code or migrations were introduced in this planning task.
