# Requirements Traceability and Open Decisions

## 1. Functional traceability

| PRD area | P0/P1/P2 scope | Architecture treatment | Primary implementation gate |
|---|---|---|---|
| Identity and organisations | Registration, verification, invitations, memberships, roles, suspension, data export/deletion | Identity context, organisation root, policy evaluator, audit and privacy workflows | Cross-tenant and privilege suite |
| Events | Draft/publish/pause/cancel/archive, visibility, recurrence, sessions, sub-events, locales and timezone | Event aggregate, state machine, translations and scheduled operations | State-transition and timezone tests |
| Registration/ticketing | Free/paid tickets, capacity, holds, QR, check-in, waits, transfers and refunds | Ticket inventory aggregate, checkout, payment inbox and audit | Oversell, replay and duplicate-check-in tests |
| Exhibitions | Halls, zones, booths, floor plan, application, direct, bid and hybrid booking | Exhibition and auction aggregates, allocation invariant | Same-booth and close-time races |
| Sponsorship/opportunities | Packages, benefits, applications, fulfilment | Configurable opportunity records and workflow/outcome states | Payment, approval and fulfilment test slice |
| Marketplace | Product/service/experience listings, variants, stock, enquiries, RFQ and orders | Generic listing foundation, vertical-specific fulfilment modules | Category launch and consent tests |
| CRM | Contact, lead, pipeline, activity, consent, communication, export | Organisation-owned CRM aggregate and communication timeline | Lead privacy/export suite |
| Journey | Itinerary, share, overlap, bookings and AI suggestions | Journey aggregate with typed external item references | Permission and change-notification tests |
| AI | Discovery, grounded recommendation, tool drafts, confirmation and audit | Provider-independent AI gateway and tool registry | Confirmation, prompt-injection and PII tests |
| Commerce/finance | Checkout, payments, refunds, invoice, commission, payout and reconciliation | Commerce aggregate, ledger and provider adapters | Webhook, refund and payout replay tests |
| Communication | Email/SMS/WhatsApp/push, templates, consent and bulk limits | Queue and channel adapters | Opt-out, template and retry tests |
| Reviews/reputation | Eligibility, moderation, reporting and ranking | Verified interaction reference and moderation case | Moderation/audit tests |
| Administration | Moderation, verification, support, disputes, fraud, configuration and audit | Governance context and privileged policy | Privileged IDOR and maker-checker tests |
| Search/discovery | Cross-domain keyword/filter/geospatial search | Search projection and PostgreSQL authority | Stale-index and availability recheck tests |
| Analytics | Operational/commercial dashboards and success metrics | Event streams and derived read models | Metric reconciliation |

## 2. P0 acceptance by requirement ID

R1 means Release 1. These are planned acceptance cases. The linked contracts define the design or the entry point for the slice. Any pilot deferral requires Product sign-off against the requirement ID. Payout, sponsorship, coordinated channels and lead capture also have scope gates in the [implementation plan](../implementation-plans/2026-11-20-companion-backend-architecture.md#decisions-and-approval-timing).

| PRD ID | Target | Owner and contract | Acceptance evidence |
|---|---|---|---|
| IAM-FR-001 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | Email/phone sign-up creates or reuses the appropriate principal |
| IAM-FR-002 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | An unverified channel cannot unlock protected functions |
| IAM-FR-003 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | One login creates a workspace and accepts an invitation to another |
| IAM-FR-004 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | Staff cannot self-escalate or retain a revoked role |
| IAM-FR-005 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | Different roles apply to the same user in two workspaces |
| IAM-FR-006 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | Buyer and seller can access only their authorized transaction fields |
| IAM-FR-007 | Foundation | Identity ? [contract](./03-api-contract.md#identity-and-organisations) | Profile and consent changes persist and opt-out blocks applicable sends |
| EVT-FR-001 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Duplicate an event into a draft without bookings or credentials |
| EVT-FR-002 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Authorized publish, unpublish, pause and cancel preserve obligations |
| EVT-FR-003 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Single- and multi-day schedules round-trip |
| EVT-FR-005 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Public, unlisted, private and invited visibility remain isolated in direct reads and search |
| EVT-FR-006 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Each ticketed, free, RSVP, approval and invitation path enforces prerequisites |
| EVT-FR-008 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Checkout snapshots terms and cancellation rules |
| EVT-FR-009 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | Event timezone survives display conversion and DST ambiguity is handled |
| EVT-FR-012 | R1 | Events ? [contract](./03-api-contract.md#events-and-ticketing) | An affected booking receives an update and event revision is audited |
| TKT-FR-001 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Configure ticket types with independent sale windows, prices and capacity |
| TKT-FR-002 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Free registration issues a credential without a provider session |
| TKT-FR-003 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Provider-confirmed capture completes a paid checkout |
| TKT-FR-004 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Concurrent last-unit holds cannot oversell |
| TKT-FR-005 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Successful registrations produce unique references and QR credentials |
| TKT-FR-006 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Buyer retrieves own ticket without selecting the seller workspace |
| TKT-FR-007 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Staff can search, filter, export and scan only within assigned grants |
| TKT-FR-008 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Concurrent scans permit one first entry and require an audited override |
| TKT-FR-012 | R1 | Ticketing ? [contract](./04-workflows-and-events.md#2-ticket-purchase) | Payable total and breakdown match the committed checkout snapshot |
| EXH-FR-001 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Organiser creates an exhibition for an event they manage |
| EXH-FR-002 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Author halls, zones and booth inventory |
| EXH-FR-003 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Persist and render dimensions, price and facilities |
| EXH-FR-004 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Browse and filter published booth details |
| EXH-FR-005 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Select inventory using linked vector geometry or the accessible booth list |
| EXH-FR-006 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | A configured direct or application hold expires and releases capacity |
| EXH-FR-007 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Concurrent direct and auction paths cannot both confirm the booth |
| EXH-FR-008 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Exercise instant, enquiry-first and approval sale policies |
| EXH-FR-009 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Submit a scoped company profile, contact, category and required files |
| EXH-FR-010 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Exercise approve, reject, information request and waitlist transitions |
| EXH-FR-014 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Booth change and cancellation preserve prior booking and financial history |
| EXH-FR-015 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Configure direct, auction and disclosed hybrid transitions |
| EXH-FR-016 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Verify atomic hold and captured payment confirmation |
| EXH-FR-017 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Validate eligibility, starting bid, reserve, increments and immutable bid history |
| EXH-FR-018 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Reject bids at or after the cutoff after acquiring the lock |
| EXH-FR-019 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Close and award exactly once under the shared booth lock, with audit |
| EXH-FR-020 | R1 | Exhibition ? [contract](./03-api-contract.md#exhibition) | Exercise deadline, deposit or full payment, and configured winner default |
| PAY-FR-001 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Select an eligible provider and reject an unsupported currency before commitment |
| PAY-FR-002 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Show the complete price snapshot before payment |
| PAY-FR-003 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Reject invalid signatures and reconcile duplicate or missing provider events |
| PAY-FR-004 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Capture after expiry remains a payment with an unfulfilled booking |
| PAY-FR-005 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Concurrent approved refunds cannot exceed refundable value |
| PAY-FR-008 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Invoice or receipt matches approved seller, buyer, tax and transaction data |
| PAY-FR-010 | R1 | Commerce ? [contract](./09-eventos-launch-contracts.md#finance-and-recovery) | Reject unauthorized adjustment and audit the approved actor and reason |

## 3. API, security and NFR traceability

| Requirement | Architecture decision |
|---|---|
| 99.9% core availability | Multi-replica stateless API, managed database, zones, queues and DR runbooks |
| Public API p95 under 500 ms where practical | Caching, indexes, bounded data, read replicas and workload tests |
| Horizontal scaling | Stateless application, externalized state and worker queue isolation |
| Encrypt in transit/at rest | TLS, managed encrypted database/storage/secrets |
| WCAG 2.2 AA | API and content semantics support accessible clients; UI work requires client-specific test plan |
| Localisation | Locale and timezone separated; translation keys and localized content tables |
| Auditability | Append-only audit stream and sensitive-action policy |
| Idempotency/recovery | Idempotency key, provider event inbox, outbox, reconciliation |
| Data residency | Configurable deployment region and explicit transfer controls before implementation |

## 4. PRD workflows covered

- Organiser publishes ticketed conference
- Exhibitor discovers and books/applications
- Attendee explores exhibition and creates itinerary
- Corporate buyer sends RFQ and compares quotes
- AI-assisted itinerary with confirmation
- Ticket purchase and payment reconciliation
- Booth direct purchase, auction and hybrid
- Event cancellation and refund
- Lead capture and export
- Payout batch and settlement reconciliation
- Support dispute and privacy request

## 5. Explicit assumptions

| Topic | Baseline assumption | Validation owner | Consequence if false |
|---|---|---|---|
| Runtime and language | Node.js and TypeScript selected, Node.js 24 LTS proposed as the initial line | Engineering platform | Pin a supported Node.js LTS patch after compatibility verification |
| Backend tooling | Fastify, TypeBox, Kysely, `pg`, npm and Vitest proposed for Foundation | Backend engineering | Update the stack decision record if compatibility or integration checks require a substitution |
| Architecture | Modular monolith | Engineering leadership | Extract workers/services later |
| Tenancy | One pilot workspace per organisation, with deployment-wide identity and explicit transaction participation | Engineering and Security | Approve before ownership migrations |
| Database | PostgreSQL | Engineering platform | Persistence adapters may change but not transaction design |
| Jobs | PostgreSQL outbox-backed work | Operations | Consider a dedicated broker when capacity or isolation evidence supports it |
| MoR | Seller/organiser initially | Legal/finance | Checkout, tax, invoice and payout redesign |
| Payment | Razorpay initially | Product/finance/legal | Add adapter and settlement rules |
| AI | Gemini behind provider gateway | Product/security/privacy | Swap adapter; core unaffected |
| Geography | Launch countries unresolved | Product/legal | Residency, tax and provider models change |
| Languages | Architecture supports but list unresolved | Product/localization | Translation and fallback scope |
| Currency | ISO currency + minor unit | Finance/legal | Settlement and exchange validation |
| Peak load | 20 RPS sustained/50 RPS test | Product/operations | Capacity and scaling plan changes |
| Auction | English ascending | Product/legal | Increment/tie-break implementation changes |
| Floor plan | Uploaded image/PDF background plus vector records | Product/design | Editor scope and geometry migration |
| CRM depth | Inquiry, lead, pipeline and inbox | Product | Integration scope |
| Marketplace order | Events, services, catalogues, experiences | Product/sales | Module sequencing |

## 6. Slice approval gates

Use the accountable roles, deadlines and evidence in the [implementation plan](../implementation-plans/2026-11-20-companion-backend-architecture.md#decisions-and-approval-timing). Later provider decisions gate their respective slices.

1. Cloud account and deployment target. Verify and pin the selected Node.js/TypeScript toolchain and proposed libraries during Foundation.
2. First launch country/countries and language set.
3. Seller/MoR and invoice model per vertical/country.
4. Razorpay/Route account, eligibility and settlement behavior.
5. Additional providers for regional payment and payout.
6. Booth direct/auction/hybrid default and auction policy.
7. Floor-plan MVP scope and data format.
8. Data residency and provider data transfer terms.
9. RPO/RTO and support staffing/SLAs.
10. Gemini production terms and model/region availability.
11. Map and WhatsApp/Instagram account eligibility.
12. Verified data export and deletion retention rules.

## 7. Architecture anti-goals

- Do not store dynamic AI output as the source of truth.
- Do not treat search availability or provider redirect as authoritative.
- Do not expose CRM or attendee PII to other organisations by default.
- Do not create one microservice per PRD module.
- Do not use floating-point money.
- Do not use static floor-plan images as inventory authority.
- Do not allow unaudited payment/refund/payout adjustment.
- Do not silently switch currency or charge currency.
