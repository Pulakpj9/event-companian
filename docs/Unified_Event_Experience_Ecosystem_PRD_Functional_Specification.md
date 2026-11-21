# Unified Event & Experience Ecosystem
## Product Requirements Document (PRD) & Functional Specification

**Document status:** Baseline product definition  
**Version:** 1.0  
**Prepared:** 20 November 2026  
**Product type:** Multi-sided B2B/B2C platform, marketplace and AI-enabled experience orchestration system  
**Product/brand:** Companion  
**Market approach:** Global-ready, multi-language and multi-currency from the foundation

---

## Document purpose

This document defines the product vision, scope, users, functional requirements, workflows, business rules, non-functional requirements, data domains, integrations, release strategy and acceptance criteria for a unified platform connecting event management, exhibition commerce, marketplaces, CRM, itinerary planning and AI-powered experience orchestration.

It is intended to be a working baseline for product management, UX/UI, engineering, QA, operations, sales and implementation partners. It is not a substitute for detailed technical design, legal review, payment-provider certification or jurisdiction-specific tax advice.

## How to read this document

- **MUST** indicates a release-critical requirement.
- **SHOULD** indicates a strong requirement that may be phased.
- **MAY** indicates an optional capability.
- Requirements use stable identifiers such as `EVT-FR-001`.
- Priority: **P0** = launch blocker; **P1** = important; **P2** = later enhancement.
- Unless explicitly stated, requirements apply across web and mobile-responsive experiences. Native mobile capabilities may be phased.

---

# 1. Executive summary

The product is a unified digital ecosystem in which people discover and participate in events, businesses create commercial opportunities, suppliers sell products and services, experience providers offer bookable activities, and an AI companion helps users plan and execute journeys.

The platform has five connected product experiences:

1. **EventOS:** Event publishing, ticketing, registration, exhibitions, booth inventory, sponsorship and event operations.
2. **MarketOS:** Product, service, venue, rental and experience listings, enquiries, quotations and bookings.
3. **RelationshipOS:** CRM, lead capture, sales pipelines, communications and relationship history.
4. **JourneyOS:** Itinerary creation, schedules, maps, meetings and consolidated journey management.
5. **IntelligenceOS:** Conversational AI, discovery, recommendations, contextual pitching and workflow orchestration.

A shared platform core provides identity, organisations, permissions, search, booking, inventory, payments, notifications, files, analytics, moderation and audit.

## 1.1 Product thesis

Events are not only gatherings. They are time-bound marketplaces and relationship-building environments. An exhibition, for example, contains visitor registrations, exhibitors, booths, sponsorship inventory, product catalogues, meetings, workshops, service providers and commercial leads.

The platform should model these as connected but independently configurable offerings. A user should be able to discover an event, register, plan a visit, locate a booth, schedule a meeting, enquire about a product, book an experience and manage follow-ups without moving between disconnected systems.

## 1.2 Product goals

- Make event creation and management usable by organisers of different sizes.
- Support both ticketed and non-ticketed events.
- Turn exhibitions into bookable B2B opportunity marketplaces.
- Enable exhibitors and sponsors to manage participation and leads.
- Connect products, services and experiences to events and user intent.
- Provide a unified CRM and communication history with permission controls.
- Help users build practical, editable itineraries.
- Use AI to discover, explain, recommend and initiate permitted actions.
- Establish multiple revenue streams through subscriptions, transaction fees and enterprise services.

## 1.3 Non-goals for the initial release

- Building a full airline/hotel global distribution system.
- Replacing enterprise ERP, accounting or full marketing automation suites.
- Operating as the merchant of record for every transaction by default.
- Guaranteeing AI-generated recommendations or quotations without supplier confirmation.
- Building a full social network, livestreaming platform or video-conferencing product.
- Automating payments, contracts or irreversible actions without explicit user approval.

---

# 2. Product principles

1. **One identity, multiple roles:** A person may be an attendee, organiser, exhibitor, seller or provider, depending on context.
2. **Composable events:** An event may contain sessions, sub-events, booths, sponsor inventory, meetings and experiences.
3. **Distinct inventory rules:** Tickets, booths, services and experiences share booking infrastructure but retain their own availability, fulfilment, cancellation and pricing rules.
4. **Consent-first data:** Personal and business information is shared only under defined permissions, lawful basis and user/organisation settings.
5. **AI assists; users decide:** AI may prepare, compare and recommend. Financial commitments and consequential actions require confirmation.
6. **Transparent commerce:** Fees, taxes, sponsored placements, cancellation rules and seller identity are visible before commitment.
7. **Operational resilience:** Inventory, payment and booking states must remain consistent under retries, concurrency and provider failures.
8. **Progressive complexity:** Simple users see simple workflows; advanced organisers can access detailed controls.

---

# 3. Stakeholders and user personas

## 3.1 Platform stakeholders

- Platform owner and super-administrator
- Product and engineering teams
- Customer support and trust/safety operations
- Finance and settlement operations
- Organisers and venue operators
- Exhibitors, sponsors and partners
- Product sellers and service providers
- Experience hosts and guides
- Attendees, visitors, travellers and corporate buyers
- Integration partners

## 3.2 User personas

| Persona | Primary needs | Success outcome |
|---|---|---|
| Event organiser | Publish, monetise and operate events | Event launched, revenue and attendance tracked |
| Exhibition organiser | Sell booths, sponsorship and participation | Inventory sold and exhibitors managed |
| Exhibitor | Book space, promote products and collect leads | Qualified leads and commercial follow-up |
| Sponsor | Buy visibility and measure delivery | Benefits fulfilled and campaign outcomes visible |
| Attendee | Discover, register and navigate events | Relevant event participation with low friction |
| Product seller | Publish products and convert enquiries/orders | Qualified demand and fulfilled orders |
| Service provider | Receive enquiries, quote and manage bookings | Profitable confirmed work |
| Experience host | Publish bookable experiences and manage slots | Occupancy and customer satisfaction |
| Corporate buyer | Source event services and manage business events | Requirements fulfilled within budget |
| Traveller/visitor | Coordinate events, meetings and activities | Useful, achievable itinerary |
| Platform administrator | Govern platform quality and risk | Safe, reliable and commercially healthy ecosystem |

## 3.3 Account and role model

The system MUST support:
- Individual accounts.
- Business/organisation accounts.
- Multiple users within an organisation.
- Multiple roles per user.
- Organisation-level roles and resource-level permissions.
- Invitations, role changes, suspension and offboarding.
- Separation between personal profile data and organisation-owned data.

Suggested organisation roles: Owner, Admin, Event Manager, Sales, Finance, Operations, Marketing, Support, Read-only Analyst and Custom Role.

---

# 4. Scope and module map

| Product area | Capabilities | Release priority |
|---|---|---|
| Identity and organisations | Sign-up, login, profiles, teams, roles | P0 |
| Event management | Create, publish, schedule, manage events | P0 |
| Registration and ticketing | Paid/free registration, ticket types, QR entry | P0 |
| Exhibition commerce | Floor plans, booths, exhibitor applications/bookings | P0 |
| Sponsorship and opportunities | Packages, inventory, applications, fulfilment | P1 |
| Event operations | Check-in, attendee lists, announcements, sessions | P0/P1 |
| Product marketplace | Listings, enquiries, RFQ, orders | P1 |
| Services marketplace | Provider profiles, packages, quote and booking | P1 |
| Experiences marketplace | Experience listings, slots and reservations | P2 |
| CRM | Contacts, leads, pipelines, activities, follow-ups | P1 |
| Itinerary planner | Editable schedules, meetings, map items | P2 |
| AI companion | Chat, search, grounded recommendations, actions | P2 |
| Experience orchestration | Cross-domain recommendations and workflows | P2 |
| Payments and finance | Payments, refunds, commissions, payouts, invoices | P0 |
| Platform administration | Moderation, disputes, configuration, audit | P0 |
| Analytics | Operational and commercial dashboards | P1 |

## 4.1 MVP boundary

The recommended MVP is a coordinated web, Android and iOS event and exhibition commerce product:
- Identity, organisation and permissions
- Event creation and publishing
- Free registration and paid ticketing
- QR tickets and check-in
- Exhibition halls and booth inventory
- Booth enquiry/application and booking
- Basic sponsorship packages
- Exhibitor dashboard and lead capture
- Payment records, refunds workflow and organiser reporting
- Platform administration and audit

The product/service marketplace, advanced CRM, itinerary and AI should be introduced after the core event and booth workflows have been validated.

---

# 5. Functional requirements

## 5.1 Identity, accounts and organisation management

| ID | Requirement | Priority |
|---|---|---|
| IAM-FR-001 | Users MUST be able to register using supported email/phone authentication methods. | P0 |
| IAM-FR-002 | Users MUST be able to verify contact channels before using protected functions. | P0 |
| IAM-FR-003 | Users MUST be able to create or join an organisation. | P0 |
| IAM-FR-004 | Organisation owners/admins MUST invite, deactivate and assign roles to team members. | P0 |
| IAM-FR-005 | A user MUST be able to hold multiple roles across different organisations. | P0 |
| IAM-FR-006 | The platform MUST enforce tenant and resource-level access controls. | P0 |
| IAM-FR-007 | Users MUST be able to manage profile, preferences, communication consent and privacy settings. | P0 |
| IAM-FR-008 | Business verification status and supporting documents SHOULD be supported. | P1 |
| IAM-FR-009 | Account suspension, deletion requests and data export workflows MUST be available to authorised operations. | P1 |

### Acceptance criteria
- A user can create a personal account and an organisation without creating a second login.
- An invited user can accept an invitation and access only the assigned organisation resources.
- A user belonging to two organisations cannot view the other organisation's private events, leads or financial data unless separately authorised.
- Permission changes take effect on the next authorised request and are audit logged.

## 5.2 Event creation and publishing

### Event configuration

Event types SHOULD include exhibitions, trade shows, conferences, summits, concerts, festivals, workshops, training, sports, cultural events, community events, private events, corporate events, product launches and virtual/hybrid events.

Event fields:
- Name, slug, category, short and long description
- Cover media, gallery, branding and organiser identity
- Format: in-person, virtual or hybrid
- Venue, address, map coordinates and access information
- Start/end date and local time zone
- Multi-day schedule and recurring schedule where supported
- Audience, age restrictions and eligibility
- Public, unlisted, private or invitation-only visibility
- Capacity and registration rules
- Contact and support details
- Terms, privacy notice and cancellation policy
- SEO and sharing metadata
- Draft, review, published, paused, cancelled and completed status

| ID | Requirement | Priority |
|---|---|---|
| EVT-FR-001 | Organisers MUST create, edit, duplicate and save events as drafts. | P0 |
| EVT-FR-002 | Organisers MUST publish, unpublish, pause and cancel events according to permissions. | P0 |
| EVT-FR-003 | Events MUST support single-day and multi-day schedules. | P0 |
| EVT-FR-004 | Events MUST support physical, virtual and hybrid formats. | P1 |
| EVT-FR-005 | Organisers MUST choose public, unlisted, private or invitation-only visibility. | P0 |
| EVT-FR-006 | Events MUST support ticketed, free registration, RSVP, approval-based and invitation-based participation. | P0 |
| EVT-FR-007 | Events MUST support capacity limits and waitlists. | P1 |
| EVT-FR-008 | Organisers MUST configure event-specific terms and cancellation rules. | P0 |
| EVT-FR-009 | The platform MUST display event time in the user's locale while preserving the event's configured time zone. | P0 |
| EVT-FR-010 | Organisers SHOULD configure sessions, speakers, tracks and agenda items. | P1 |
| EVT-FR-011 | Organisers SHOULD configure sub-events linked to a parent event. | P1 |
| EVT-FR-012 | Event changes affecting existing bookings MUST trigger configured notifications and preserve an audit history. | P0 |

### Event lifecycle

`Draft → Submitted/Review (optional) → Published → Paused (optional) → Completed`

Alternative terminal states: `Cancelled`, `Rejected`, `Archived`.

The platform MUST define which changes are allowed in each state. Cancellation must trigger a controlled process for attendee communication, refund eligibility and inventory release.

## 5.3 Registration and ticketing

Ticket types:
- General admission
- VIP
- Early bird
- Student
- Group
- Corporate
- Multi-day
- Session-specific
- Complimentary
- Access-controlled categories

| ID | Requirement | Priority |
|---|---|---|
| TKT-FR-001 | Organisers MUST create multiple ticket types with price, quantity and sales window. | P0 |
| TKT-FR-002 | The system MUST support free registration without payment. | P0 |
| TKT-FR-003 | The system MUST support paid checkout through configured payment providers. | P0 |
| TKT-FR-004 | The system MUST prevent overselling through atomic inventory reservation. | P0 |
| TKT-FR-005 | The system MUST issue a unique booking reference and scannable QR credential after successful registration/payment. | P0 |
| TKT-FR-006 | Attendees MUST be able to view and retrieve their tickets. | P0 |
| TKT-FR-007 | Organisers MUST search, filter, export and check in registrants according to permissions. | P0 |
| TKT-FR-008 | Check-in MUST prevent duplicate entry unless an authorised override is recorded. | P0 |
| TKT-FR-009 | The platform MUST support cancellation, refund requests and waitlist promotion rules. | P1 |
| TKT-FR-010 | Group registration and attendee detail capture SHOULD be supported. | P1 |
| TKT-FR-011 | Ticket transfer and name changes MAY be supported under organiser policy. | P2 |
| TKT-FR-012 | The system MUST show fees, taxes and total payable before payment confirmation. | P0 |

### Ticket purchase workflow
1. Attendee selects ticket type and quantity.
2. System validates sales window, eligibility and remaining capacity.
3. System creates a time-limited inventory hold.
4. Attendee enters required participant details.
5. Checkout displays price breakdown, taxes, fees and terms.
6. Payment provider processes payment.
7. On verified success, booking becomes confirmed and tickets are issued.
8. On failure/expiry, hold is released.
9. Notifications and receipts are sent.
10. Booking and payment events are recorded for reconciliation.

Payment provider webhooks MUST be idempotent. The platform MUST NOT issue paid tickets solely on the basis of a client-side success redirect.

## 5.4 Exhibition and B2B opportunity management

An exhibition is an event with additional commercial inventory. It may contain one or more halls, zones, booths, pavilions and opportunity types.

### Floor plan and inventory

Booth attributes:
- Booth ID/number and display name
- Hall, zone and floor
- Shape/geometry and dimensions
- Booth type and visibility tier
- Price, currency, taxes and included facilities
- Availability status
- Restrictions and technical requirements
- Optional add-ons
- Map coordinates/geometry
- Booking and approval policy

Booth states: `Draft`, `Available`, `Held`, `Enquiry`, `Pending Approval`, `Booked`, `Paid`, `Reserved`, `Blocked`, `Released`, `Cancelled`.

| ID | Requirement | Priority |
|---|---|---|
| EXH-FR-001 | Organisers MUST create an exhibition linked to an event. | P0 |
| EXH-FR-002 | Organisers MUST define halls, zones and booth inventory. | P0 |
| EXH-FR-003 | Organisers MUST configure booth size, type, price and included facilities. | P0 |
| EXH-FR-004 | Exhibitors MUST browse available booths and view their details. | P0 |
| EXH-FR-005 | The system MUST support a visual floor plan with selectable booth areas. | P0 |
| EXH-FR-006 | The system MUST lock a selected booth for a configurable hold period during checkout/application. | P0 |
| EXH-FR-007 | The system MUST prevent concurrent confirmed bookings for the same booth and time/event inventory. | P0 |
| EXH-FR-008 | Organisers MUST choose instant booking, enquiry-first or approval-based booking. | P0 |
| EXH-FR-009 | Exhibitors MUST submit organisation profile, category, contact and required documents. | P0 |
| EXH-FR-010 | Organisers MUST approve, reject, request information or waitlist applications. | P0 |
| EXH-FR-011 | Confirmed exhibitors MUST access a participation dashboard. | P1 |
| EXH-FR-012 | Organisers SHOULD support pavilion and multi-booth booking. | P1 |
| EXH-FR-013 | The platform SHOULD support booth add-ons such as furniture, power, internet and branding. | P1 |
| EXH-FR-014 | Booth changes and cancellations MUST preserve booking and financial audit history. | P0 |
| EXH-FR-015 | Organisers MUST configure each booth or booth group as Direct Purchase, Bidding/Auction, or Hybrid. | P0 |
| EXH-FR-016 | Direct-purchase booths MUST support atomic inventory holds, checkout and confirmation. | P0 |
| EXH-FR-017 | Bidding booths MUST support bid windows, starting/reserve prices, minimum increments, eligibility and bid history. | P0 |
| EXH-FR-018 | The system MUST validate bids server-side and prevent bids after auction close. | P0 |
| EXH-FR-019 | Auction close and winner determination MUST be atomic, auditable and protected against concurrent purchase/bid actions. | P0 |
| EXH-FR-020 | Organisers MUST configure winner payment deadlines, deposit/full-payment rules and fallback if the winner defaults. | P0 |

### Booth booking workflow
1. Exhibitor opens exhibition details and chooses “Book a booth”.
2. Exhibitor filters by hall, size, type, price and availability.
3. Floor plan highlights selectable inventory.
4. Exhibitor selects a booth and sees full terms and inclusions.
5. System checks availability and places a temporary hold.
6. Exhibitor submits business details and documents.
7. If approval is required, organiser reviews the application.
8. Once approved, exhibitor pays deposit/full amount or receives an invoice under configured terms.
9. Payment/contract confirmation moves inventory to booked.
10. Exhibitor receives confirmation, invoice/receipt and portal access.

### Additional opportunity inventory
The system SHOULD support the following opportunity types as configurable inventory:
- Sponsorship packages and individual benefits
- Branding placements and advertising
- Speaking slots and session sponsorship
- Workshop slots
- Product launch slots
- Networking tables and meeting rooms
- Food/beverage counters
- Recruitment booths
- Partner packages
- Service-provider participation

Each opportunity type MUST have its own fields, eligibility, availability, price, approval and fulfilment rules.

## 5.5 Exhibitor and sponsor portal

| ID | Requirement | Priority |
|---|---|---|
| EXPO-FR-001 | Exhibitors MUST view booking status, event instructions and deadlines. | P1 |
| EXPO-FR-002 | Exhibitors SHOULD manage company profile, logo, description and representatives. | P1 |
| EXPO-FR-003 | Exhibitors SHOULD publish products linked to their event participation. | P1 |
| EXPO-FR-004 | Exhibitors SHOULD request meetings and manage received meeting requests. | P1 |
| EXPO-FR-005 | Exhibitors SHOULD capture leads using QR scan/manual entry, subject to consent. | P1 |
| EXPO-FR-006 | Sponsors MUST view purchased packages, benefits, deliverables and fulfilment status. | P1 |
| EXPO-FR-007 | Organisers MUST track sponsor/exhibitor deliverables and outstanding actions. | P1 |

## 5.6 Product marketplace

Listing types:
- Direct purchase
- Enquiry-only
- Request for quotation (RFQ)
- Bulk/wholesale
- Rental
- Demonstration/sample request

Product data includes seller, category, title, description, media, specifications, variants, price or “request price”, minimum order quantity, stock/lead time, shipping regions, warranty, return policy and listing status.

| ID | Requirement | Priority |
|---|---|---|
| MKT-FR-001 | Approved sellers MUST create and manage product listings. | P1 |
| MKT-FR-002 | Listings MUST support purchasable and enquiry-only modes. | P1 |
| MKT-FR-003 | Buyers MUST search, filter, compare and save products. | P1 |
| MKT-FR-004 | Buyers MUST submit enquiries and RFQs with relevant requirements. | P1 |
| MKT-FR-005 | Sellers MUST receive, respond to and manage enquiries/RFQs. | P1 |
| MKT-FR-006 | Direct orders MUST support configured payment, fulfilment and cancellation states. | P2 |
| MKT-FR-007 | Product listings MAY be associated with events, exhibitors or experiences. | P1 |
| MKT-FR-008 | Sponsored product placements MUST be labelled. | P1 |

## 5.7 Services marketplace

Service categories may include event production, AV, staging, catering, photography, videography, decoration, logistics, staffing, security, venues, transport, marketing, rentals and professional services.

Service listing fields:
- Provider profile and verification
- Service category and description
- Service area and travel radius
- Package options and inclusions
- Price model: fixed, hourly, daily, per-person or quote-based
- Availability and blackout dates
- Capacity and lead time
- Portfolio, references and reviews
- Terms, cancellation and rescheduling rules

| ID | Requirement | Priority |
|---|---|---|
| SRV-FR-001 | Providers MUST create service profiles and listings. | P1 |
| SRV-FR-002 | Providers MUST define service areas, package details and pricing models. | P1 |
| SRV-FR-003 | Buyers MUST submit structured enquiries with date, location, quantity and requirements. | P1 |
| SRV-FR-004 | Providers MUST prepare and send quotations. | P1 |
| SRV-FR-005 | Buyers MUST compare quotations and accept, reject or request revisions. | P1 |
| SRV-FR-006 | Confirmed service bookings MUST record scope, dates, price, payment terms and cancellation policy. | P1 |
| SRV-FR-007 | The platform SHOULD support milestones, deposits and completion confirmation. | P2 |

## 5.8 Experiences marketplace

Experience examples: guided tours, workshops, culinary activities, cultural activities, outdoor activities, wellness, entertainment and curated local experiences.

| ID | Requirement | Priority |
|---|---|---|
| EXP-FR-001 | Hosts MUST create experience listings with descriptions, media and location. | P2 |
| EXP-FR-002 | Hosts MUST configure sessions, capacity, price and availability. | P2 |
| EXP-FR-003 | Customers MUST see inclusions, exclusions, duration, eligibility and cancellation terms. | P2 |
| EXP-FR-004 | Customers MUST book available slots and receive confirmation. | P2 |
| EXP-FR-005 | Hosts MUST manage participants, attendance and rescheduling. | P2 |
| EXP-FR-006 | Experiences SHOULD be recommended in relevant event and itinerary contexts. | P2 |

## 5.9 CRM and relationship management

CRM must be permission-aware and support separate business workspaces. A platform-wide relationship view must not expose private lead data across organisations.

Core objects:
- Contact
- Lead
- Account/company
- Deal/opportunity
- Pipeline and stage
- Activity/task
- Note
- Campaign
- Consent record
- Communication record
- Source and attribution

| ID | Requirement | Priority |
|---|---|---|
| CRM-FR-001 | Organisations MUST manage contacts within their authorised workspace. | P1 |
| CRM-FR-002 | Users MUST create, assign, qualify and update leads. | P1 |
| CRM-FR-003 | Organisations MUST configure sales pipelines and stages. | P1 |
| CRM-FR-004 | Users MUST record calls, meetings, notes, tasks and follow-up dates. | P1 |
| CRM-FR-005 | The system MUST record lead source and relevant event/product/service context. | P1 |
| CRM-FR-006 | Exhibitors SHOULD capture leads through event QR workflows with appropriate notice/consent. | P1 |
| CRM-FR-007 | Users MUST be able to export only data they are authorised to access. | P1 |
| CRM-FR-008 | Bulk marketing MUST respect consent, opt-outs and applicable communication rules. | P1 |
| CRM-FR-009 | CRM changes and sensitive exports MUST be audit logged. | P1 |

### Example pipelines
- Organiser sales: New lead → Contacted → Qualified → Proposal → Negotiation → Won/Lost.
- Booth sales: Enquiry → Application → Under review → Approved → Payment pending → Booked.
- Service sales: New enquiry → Requirements confirmed → Quote sent → Revision → Accepted → Fulfilment → Completed.

## 5.10 Itinerary and journey planner

Itinerary items may include events, sessions, booths, meetings, experiences, restaurants, accommodation, transport and personal activities.

| ID | Requirement | Priority |
|---|---|---|
| ITN-FR-001 | Users MUST create, edit, duplicate and share itineraries. | P2 |
| ITN-FR-002 | Users MUST add events, sessions, meetings and bookable offerings to an itinerary. | P2 |
| ITN-FR-003 | Itinerary items MUST support date, start/end time, location, notes and status. | P2 |
| ITN-FR-004 | The system SHOULD show map locations and estimated travel time using a map provider. | P2 |
| ITN-FR-005 | The system SHOULD detect overlapping schedule items and warn users. | P2 |
| ITN-FR-006 | Users MUST be able to accept, edit or reject AI-suggested itinerary items. | P2 |
| ITN-FR-007 | Users SHOULD share itineraries with selected people or groups. | P2 |
| ITN-FR-008 | Notifications SHOULD alert users to schedule changes and upcoming items. | P2 |

The planner must distinguish confirmed bookings from suggestions, saved places and tentative items.

## 5.11 AI companion and experience orchestration

### AI capabilities
- Conversational event and marketplace discovery
- Natural-language search and filtering
- Event and exhibitor guide
- Product/service/experience recommendations
- Itinerary drafting and modification suggestions
- Requirements collection for vendor quotations
- Event planning assistance
- Summaries of event, booking and itinerary information
- Contextual reminders and next-best-action suggestions

| ID | Requirement | Priority |
|---|---|---|
| AI-FR-001 | The assistant MUST identify user intent and ask for missing critical details. | P2 |
| AI-FR-002 | Recommendations MUST be grounded in current platform data and disclose uncertainty or unavailable data. | P2 |
| AI-FR-003 | The assistant MUST respect user permissions and data access rules. | P2 |
| AI-FR-004 | The assistant MAY draft bookings, enquiries, RFQs and itinerary changes. | P2 |
| AI-FR-005 | The assistant MUST obtain explicit confirmation before submitting a booking, sending an enquiry, accepting a quote or making a payment. | P2 |
| AI-FR-006 | Sponsored recommendations MUST be labelled and separated from organic ranking signals. | P2 |
| AI-FR-007 | Users MUST be able to view, edit and delete conversation history subject to retention policy. | P2 |
| AI-FR-008 | The assistant MUST not claim a booking or payment succeeded until the relevant system confirms it. | P2 |
| AI-FR-009 | AI actions MUST be logged with the user, action, confirmation and result. | P2 |
| AI-FR-010 | Users MUST be able to opt out of personalisation and non-essential AI processing where applicable. | P2 |

### AI tool/action model
The assistant may call controlled platform actions such as:
- Search events
- Search products/services/experiences
- Check availability
- Draft itinerary
- Create enquiry draft
- Create RFQ draft
- Retrieve user's own booking details
- Prepare quotation comparison
- Create follow-up task

Actions with financial, legal or external consequences require explicit confirmation and server-side authorisation.

### Orchestration workflow
1. Capture intent.
2. Resolve user context and permissions.
3. Identify required constraints: dates, location, budget, party size, objectives.
4. Search relevant verticals.
5. Filter by availability, suitability and policy.
6. Rank results using transparent relevance criteria.
7. Present options with prices, fees, terms and sponsored labels.
8. Ask the user to select/confirm.
9. Execute the permitted transaction or create a draft.
10. Confirm outcome using authoritative transaction state.
11. Update itinerary/CRM only where authorised.
12. Collect feedback and improve future relevance.

## 5.12 Payments, orders, commissions and finance

The platform should support payment-provider integrations and configurable commercial models.

Financial objects:
- Checkout session
- Payment intent/transaction
- Refund
- Invoice/receipt
- Credit note
- Commission
- Seller/provider payable
- Payout
- Tax record
- Settlement/reconciliation record

| ID | Requirement | Priority |
|---|---|---|
| PAY-FR-001 | The system MUST support configured payment providers and currencies through a provider abstraction layer. | P0 |
| PAY-FR-002 | The system MUST show full price breakdown before payment. | P0 |
| PAY-FR-003 | Payment webhooks MUST be authenticated, idempotent and reconciled. | P0 |
| PAY-FR-004 | The system MUST record payment status separately from booking status. | P0 |
| PAY-FR-005 | Refunds MUST follow configured policy and authorised approval flows. | P0 |
| PAY-FR-006 | The system MUST calculate configurable platform commissions and fees. | P1 |
| PAY-FR-007 | Seller/provider payouts MUST be tracked and reconciled, with configurable payout schedules including a daily batch preference. | P1 |
| PAY-FR-008 | Invoices/receipts MUST include required seller, buyer, tax and transaction details for the applicable jurisdiction. | P0 |
| PAY-FR-009 | Finance users MUST access transaction, refund and settlement reports. | P1 |
| PAY-FR-010 | Manual financial adjustments MUST require permission and audit reason. | P0 |

### Important payment design rule
Do not assume every marketplace transaction should be split-settled or held by the platform. The commercial, tax, escrow and merchant-of-record model must be selected per country, payment provider and legal review.

## 5.13 Communication and notifications

Channels may include in-app notifications, email, SMS, WhatsApp (through approved providers) and push notifications.

Requirements:
- Transactional and marketing message categories must be separated.
- Users must manage channel preferences where legally permitted.
- Critical booking and event updates must use reliable delivery/retry handling.
- Templates must support localisation and event/organisation branding.
- Delivery status and provider errors should be visible to authorised users.
- Bulk messaging must enforce rate limits, consent and anti-abuse rules.

## 5.14 Reviews, ratings and reputation

- Only eligible users should submit verified-purchase/verified-attendance reviews.
- Reviews must support moderation, reporting and response by the relevant business.
- The platform must detect duplicate, abusive and suspicious review patterns.
- Ranking must not treat paid placement as an organic rating.
- Review visibility and moderation decisions must be auditable.

## 5.15 Platform administration and trust/safety

Admin capabilities:
- User and organisation management
- Business verification
- Event/listing moderation
- Category and taxonomy management
- Payment and refund oversight
- Dispute and complaint handling
- Fraud and abuse review
- Sponsored placement controls
- Commission and subscription configuration
- Feature flags and platform configuration
- Support tools with scoped access
- Audit logs and operational dashboards

Administrative access to personal or commercial data must be limited, justified and logged.

---

# 6. Key end-to-end user journeys

## 6.1 Organiser publishes a ticketed conference
1. Create organisation and verify required details.
2. Create event draft and choose conference format.
3. Add venue, dates, agenda and visibility.
4. Configure ticket types, pricing, sales windows and capacity.
5. Preview public listing.
6. Publish.
7. Monitor sales and registrations.
8. Send updates and check in attendees.
9. Complete event and review analytics.

## 6.2 Exhibitor books an exhibition booth
1. Discover exhibition.
2. Review exhibitor prospectus and floor plan.
3. Filter/select booth.
4. Review inclusions, price and terms.
5. Submit application and documents.
6. Organiser approves or requests clarification.
7. Exhibitor pays deposit/full amount or accepts approved credit terms.
8. Booking is confirmed.
9. Exhibitor manages profile, products, staff and add-ons.
10. After event, exhibitor reviews leads and follow-ups.

## 6.3 Attendee plans an exhibition visit
1. Discover and register for exhibition.
2. Set interests and visit objectives.
3. Explore exhibitors, sessions and products.
4. Save booths and request meetings.
5. Add confirmed items to itinerary.
6. Receive schedule and navigation guidance.
7. Attend and check in to meetings/sessions.
8. Follow up with exhibitors where permitted.

## 6.4 Corporate buyer sources event services
1. Enter event date, location, audience size and requirements.
2. Search providers or ask AI for a shortlist.
3. Compare portfolios, availability and package terms.
4. Send structured RFQs.
5. Receive and compare quotations.
6. Select provider and confirm scope.
7. Pay deposit according to terms.
8. Track fulfilment and close out the booking.

## 6.5 AI-assisted weekend itinerary
1. User states destination, dates, interests and budget.
2. Assistant asks for essential missing constraints.
3. Platform searches events and experiences.
4. Assistant drafts a time-aware itinerary.
5. User edits and confirms selected items.
6. User books offerings through their respective booking flows.
7. Confirmed bookings are distinguished from suggestions.
8. Assistant helps adjust itinerary when a booking or schedule changes.

---

# 7. Business rules and state models

## 7.1 General booking states

A reusable booking lifecycle may include:
`Draft → Pending → On Hold → Awaiting Approval → Awaiting Payment → Confirmed → In Fulfilment → Completed`

Exception states:
`Rejected`, `Expired`, `Cancelled`, `Refund Pending`, `Partially Refunded`, `Refunded`, `Disputed`, `Failed`.

Not every inventory type uses every state. The domain-specific state machine must define permitted transitions.

## 7.2 Inventory and concurrency

- Inventory holds must expire automatically after a configured period.
- A hold must be atomic and server-authoritative.
- Confirmed capacity cannot exceed sellable inventory.
- Retries must not create duplicate bookings or charges.
- Inventory release after cancellation/refund must follow the relevant policy.
- Admin overrides require reason and audit trail.

## 7.3 Pricing

Support:
- Fixed price
- Tiered price
- Quantity-based price
- Per-person price
- Time-based price
- Quote-based price
- Deposits and milestone payments
- Discounts, coupons and promo codes
- Platform fees, taxes and service charges

Price calculations must be server-side and reproducible for audit.

## 7.4 Cancellation and refunds

Each event, ticket, booth, service and experience must define:
- Cancellation window
- Refund percentage or fixed fee
- Non-refundable components
- Rescheduling rules
- Organiser/provider cancellation procedure
- Force majeure or exceptional handling where applicable

The checkout and confirmation screens must surface applicable terms before commitment.

## 7.5 Lead ownership and sharing

- Leads captured by an exhibitor belong to the authorised exhibitor workspace, subject to consent and platform terms.
- Organisers must not automatically receive private exhibitor lead notes.
- Attendee information must not be exposed to exhibitors merely because the attendee registered for the event.
- Lead sharing, marketing and export must have defined permissions and legal basis.
- Users must be able to report misuse.

---

# 8. Data model overview

This is a conceptual domain model, not a final physical schema.

| Domain | Principal entities | Key relationships |
|---|---|---|
| Identity | User, Profile, Organisation, Membership, Role, Permission | User has memberships; organisation owns resources |
| Event | Event, EventCategory, Venue, Hall, Session, Speaker, EventMedia | Event belongs to organiser; event has sessions |
| Registration | TicketType, TicketOrder, Ticket, Attendee, CheckIn | Event has ticket types and registrations |
| Exhibition | Exhibition, FloorPlan, Hall, Booth, BoothHold, BoothBooking, Exhibitor | Exhibition belongs to event; booth belongs to hall |
| Sponsorship | Opportunity, Package, Benefit, Application, Agreement | Event has opportunities; buyer purchases package |
| Marketplace | Seller, Product, Listing, Variant, Inventory, RFQ, Order | Seller owns listings; order has line items |
| Services | Provider, Service, Package, Quote, ServiceBooking | Provider owns services; quote responds to enquiry |
| Experiences | Host, Experience, SessionSlot, Reservation | Experience has slots and reservations |
| CRM | Contact, Lead, Account, Deal, Pipeline, Activity, Consent | Organisation owns CRM workspace |
| Journey | Journey, ItineraryItem, Participant, SavedPlace | User owns journey; items reference offerings |
| Commerce | Checkout, Payment, Refund, Invoice, Commission, Payout | Transaction links to a booking/order |
| AI | Conversation, Message, Recommendation, Action, Feedback | User owns conversation; action references tool result |
| Governance | AuditLog, ModerationCase, Dispute, Report | Actions/resources are auditable |

### Data design recommendations
- Use globally unique IDs and tenant-aware ownership fields.
- Store event-local time zone explicitly.
- Keep money in integer minor units plus ISO currency code; avoid floating-point currency arithmetic.
- Preserve immutable transaction snapshots for price, tax, terms and seller identity at purchase time.
- Use soft deletion only where appropriate; financial and audit records require retention controls.
- Keep PII segregated and access-controlled.
- Maintain a search index separately from the transactional source of truth.
- Use explicit foreign-key and lifecycle rules for inventory and booking relationships.

---

# 9. Search, discovery and recommendation

Search should span events, exhibitors, booths, products, services, experiences, venues and providers while preserving vertical-specific filters.

## 9.1 Search requirements
- Keyword search with typo tolerance.
- Category, date, location and price filters.
- Availability and booking status filters.
- Distance filtering where location permission is granted.
- Seller/provider verification and rating filters.
- Search suggestions and recent searches.
- Saved searches and alerts (later phase).
- Search result attribution and analytics.

## 9.2 Recommendation signals
Potential signals include explicit interests, search context, event registration, saved items, location, date, budget, prior interactions and availability. Sensitive attributes must not be inferred or used without a valid basis.

Users must be able to correct preferences and opt out of personalisation. Paid placements must be clearly labelled.

---

# 10. UX and screen inventory

## 10.1 Public/B2C experience
- Home/discovery
- Global search and results
- Event detail
- Event agenda and speakers
- Ticket selection and checkout
- My tickets and bookings
- Exhibitor directory
- Interactive exhibition floor plan
- Booth detail and meeting request
- Product/service/experience detail
- Seller/provider profile
- Itinerary planner
- AI companion
- Notifications and preferences
- Profile, privacy and support

## 10.2 Organiser portal
- Dashboard
- Event list and event builder
- Event settings and publishing checklist
- Ticket types and orders
- Attendee list and check-in
- Sessions and speakers
- Exhibition setup
- Floor-plan editor
- Booth inventory and bookings
- Sponsorship/opportunity manager
- Exhibitor directory and applications
- Communications
- Analytics and finance
- Team and permissions

## 10.3 Exhibitor/sponsor portal
- Overview
- Company profile
- Event participation and booth
- Documents and payments
- Products and catalogue
- Meeting requests
- Lead capture and CRM
- Sponsor benefits/deliverables
- Analytics and follow-up

## 10.4 Seller/provider portal
- Business profile and verification
- Listings and packages
- Availability and service areas
- Enquiries and RFQs
- Quotations
- Orders and bookings
- Calendar
- Reviews
- Payouts and performance

## 10.5 Platform admin
- Platform overview
- Users and organisations
- Event/listing moderation
- Verification queue
- Categories and taxonomy
- Payments/refunds/payouts
- Disputes and reports
- Subscriptions and commissions
- Sponsored content
- Integrations and configuration
- Audit and security logs

---

# 11. Non-functional requirements

| ID | Area | Requirement / target |
|---|---|---|
| NFR-001 | Availability | Target 99.9% monthly availability for core production services after launch, excluding agreed maintenance. |
| NFR-002 | Performance | Typical public pages should achieve a server response target under 500 ms at the 95th percentile where practical; page experience targets must be measured separately. |
| NFR-003 | Scalability | Architecture must support horizontal scaling for traffic spikes during ticket launches and event check-in. |
| NFR-004 | Security | Encrypt data in transit and at rest; apply least privilege, secure secrets and regular vulnerability testing. |
| NFR-005 | Privacy | Provide privacy notices, consent controls, retention rules and data-subject request workflows appropriate to launch jurisdictions. |
| NFR-006 | Reliability | Payment and booking operations must be idempotent and recoverable after retries or provider timeouts. |
| NFR-007 | Accessibility | Target WCAG 2.2 AA for key user journeys. |
| NFR-008 | Compatibility | Support current major browsers and responsive layouts; deliver Android and iOS apps alongside web. |
| NFR-009 | Observability | Centralised logs, metrics, traces, alerting and business transaction monitoring. |
| NFR-010 | Backup/DR | Define RPO/RTO, encrypted backups and tested restoration procedures before production launch. |
| NFR-011 | Localisation | Support multi-language content, locale-aware formatting, time zones, currencies and translation fallbacks. |
| NFR-012 | Auditability | Log sensitive administrative, financial, permission and AI-triggered actions. |

Targets are initial planning targets and must be validated against budget, architecture and expected load.

---

# 12. Security, privacy, compliance and trust

The implementation team must obtain jurisdiction-specific legal and security review. For an India-first launch, assess applicable Indian data protection, consumer protection, e-commerce, payment, tax, messaging and accessibility obligations. Do not assume a single compliance checklist covers all business models.

Minimum controls:
- Secure authentication and session management.
- Multi-factor authentication for privileged accounts.
- Tenant isolation and object-level authorisation.
- Encryption in transit and at rest.
- Secure file upload, malware scanning and access expiry.
- Rate limiting, bot protection and abuse detection.
- Payment tokenisation through certified providers; do not store raw card data.
- Consent records and opt-out handling.
- Data minimisation and retention schedules.
- Data export and deletion request processes.
- Incident response and breach notification process.
- Vendor due diligence and data-processing agreements.
- AI prompt-injection and data-exfiltration controls.
- Human review and escalation for disputes and high-risk actions.

---

# 13. Integrations

| Integration category | Purpose | Implementation note |
|---|---|---|
| Payment gateway | Collect payments and process refunds | Select providers and settlement model per market |
| Email/SMS/WhatsApp | Transactional and approved marketing communication | Use approved providers, templates and consent controls |
| Maps/geocoding | Venue maps, directions and travel-time estimates | Obtain location permission; cache only per provider terms |
| Calendar | Add sessions, meetings and itinerary items | User-authorised calendar connection |
| Video meeting | Virtual event links and meetings | Integrate rather than build initially |
| Analytics | Product and business measurement | Respect consent and data governance |
| Identity/KYC | Business verification where required | Select provider and workflow per jurisdiction |
| Accounting/invoicing | Export financial records | Define supported formats and reconciliation |
| CRM/marketing | Optional enterprise integrations | Use scoped OAuth/API permissions |
| AI/LLM | Conversational and recommendation capabilities | Use retrieval, tool allowlists and output validation |

---

# 14. Analytics and success metrics

## 14.1 North-star metric

**Successful ecosystem transactions and meaningful interactions per active organiser/business and active consumer**, measured with quality and retention guardrails. A transaction is not considered successful merely because a checkout was initiated; fulfilment, cancellation and dispute outcomes should be tracked.

## 14.2 Product metrics

| Area | Metrics |
|---|---|
| Acquisition | Visitor-to-signup conversion, organiser activation |
| Event supply | Published events, active organisers, event completeness |
| Ticketing | Listing-to-registration conversion, paid conversion, attendance rate |
| Exhibition | Booth inventory utilisation, enquiry-to-booking conversion, time to sell |
| Marketplace | Listing activation, enquiry response time, quote acceptance, GMV |
| CRM | Leads captured, follow-up completion, pipeline conversion |
| Journey | Itineraries created, items confirmed, itinerary completion |
| AI | Helpful response rate, recommendation click-through, action completion, correction rate |
| Trust | Refund rate, dispute rate, fraud reports, moderation response time |
| Retention | Repeat organiser rate, repeat attendee rate, supplier retention |
| Revenue | Net revenue, take rate, subscription MRR/ARR, payout accuracy |

## 14.3 Launch hypotheses to validate
- Organisers will pay for event publishing and operational tools.
- Exhibitors will book booths online if inventory, floor plan and terms are transparent.
- Organisers value a combined ticketing and booth-sales workflow.
- Exhibitors value lead capture and post-event CRM.
- Attendees value exhibitor discovery and visit planning.
- Service providers respond to qualified, structured enquiries.
- AI improves discovery and reduces planning effort without reducing trust.

---

# 15. Release roadmap

## Phase 0 — Discovery and validation
- Interview organisers, exhibitors, attendees and providers.
- Validate event and booth sales workflows.
- Select initial event categories and geography.
- Confirm legal/payment model.
- Prototype organiser event builder and booth floor plan.
- Define pricing and pilot partners.

## Phase 1 — EventOS MVP
- Identity and organisation management
- Event creation and publishing
- Free registration and paid tickets
- QR tickets and check-in
- Exhibition halls and booth inventory
- Floor plan browsing and booth booking
- Basic sponsorship inventory
- Organiser/exhibitor dashboards
- Payment and admin operations

## Phase 2 — RelationshipOS and MarketOS
- Exhibitor CRM and lead capture
- Product listings and RFQ
- Service listings and quotations
- Seller/provider dashboards
- Reviews and verification
- Basic campaign and notification tools

## Phase 3 — JourneyOS
- Experience marketplace
- Editable itinerary
- Maps and calendar
- Meeting scheduling
- Group sharing and reminders

## Phase 4 — IntelligenceOS
- AI discovery assistant
- Event guide
- Cross-vertical recommendations
- AI itinerary drafting
- RFQ and enquiry drafting
- Confirmed action execution with approval

## Phase 5 — Enterprise ecosystem
- Advanced analytics
- White-label and enterprise controls
- Integrations and APIs
- Advanced sponsorship/advertising
- Multi-region, multi-currency and localisation
- Advanced automation and partner network

Roadmap timing should be set only after team capacity, technical discovery, integrations and pilot scope are confirmed.

---

# 16. MVP acceptance checklist

The MVP is ready for controlled pilot when:

### Identity and access
- [ ] User registration, verification and login work.
- [ ] Organisation creation and team invitations work.
- [ ] Role and tenant isolation tests pass.

### Event publishing
- [ ] Organiser can create, preview, publish, pause and cancel an event.
- [ ] Event page displays correct schedule, time zone, venue and terms.
- [ ] Public/private/unlisted access rules work.

### Ticketing
- [ ] Free and paid registration work.
- [ ] Capacity and inventory holds prevent overselling.
- [ ] Payment webhooks are verified and idempotent.
- [ ] Tickets and QR codes are issued only after authoritative confirmation.
- [ ] Check-in and duplicate-entry controls work.

### Exhibition
- [ ] Organiser can configure halls, floor plan and booth inventory.
- [ ] Exhibitor can browse and select an available booth.
- [ ] Concurrent booking tests prevent double booking.
- [ ] Approval, payment and confirmation states work.
- [ ] Organiser can manage booth applications and bookings.

### Operations
- [ ] Email/in-app transactional notifications are delivered or retried.
- [ ] Admin can review users, events, reports and transactions.
- [ ] Audit logs capture sensitive changes.
- [ ] Refund and cancellation procedures are tested.
- [ ] Backup restoration and incident runbooks are tested.

### Quality
- [ ] Critical flows pass functional and regression tests.
- [ ] Accessibility and responsive checks are completed.
- [ ] Load testing covers expected launch and check-in peaks.
- [ ] Privacy notice, terms and relevant legal reviews are complete.

---

# 17. QA strategy and test scenarios

Minimum test categories:
- Unit tests for pricing, permissions, state transitions and commission calculations.
- API integration tests for booking, inventory, payment and notification flows.
- End-to-end tests for organiser, exhibitor and attendee journeys.
- Concurrency tests for ticket and booth inventory.
- Payment webhook replay, timeout and duplicate-event tests.
- Security tests for tenant isolation, IDOR, file access and privilege escalation.
- Accessibility tests for keyboard navigation, contrast, labels and screen readers.
- Load tests for ticket launch, search and check-in.
- Disaster recovery and backup restoration tests.

Critical negative scenarios:
1. Two exhibitors attempt to book the same booth simultaneously.
2. Payment succeeds but the browser closes before redirect.
3. Payment webhook is delivered more than once.
4. Payment provider times out with unknown final state.
5. Event is cancelled after tickets are sold.
6. Booth booking is approved but deposit is not paid before expiry.
7. Organiser staff member loses permission during an active session.
8. Exhibitor attempts to access another exhibitor's leads.
9. AI attempts to submit a booking without user confirmation.
10. Seller changes listing price after buyer starts checkout.

---

# 18. Open decisions requiring stakeholder confirmation

These decisions should be closed before detailed solution design:

1. Product/brand name and target positioning.
2. Initial launch geography and languages.
3. Initial customer segment: exhibitions, conferences, corporate events or broader events.
4. Web-first versus simultaneous native mobile launch.
5. Ticketing and booth booking merchant-of-record model.
6. Payment provider(s), settlement and payout model.
7. Commission and subscription pricing.
8. Whether booth booking is instant, enquiry-first or organiser-approved by default.
9. Whether floor plans are uploaded images, vector layouts or a visual editor in MVP.
10. Initial CRM depth and lead-sharing policy.
11. Which marketplace vertical launches first.
12. AI provider, data retention and model governance.
13. Map, messaging, calendar and identity verification providers.
14. Support and dispute operating model.
15. Expected peak traffic, data residency and disaster recovery targets.

---

# 19. Recommended delivery approach

1. Conduct discovery interviews and map current organiser/exhibitor workflows.
2. Create clickable prototypes for event creation, ticket purchase and booth booking.
3. Validate prototypes with at least a small set of real organisers and exhibitors.
4. Finalise MVP requirements and acceptance criteria.
5. Produce UX flows, wireframes and design system.
6. Produce technical architecture, API contracts and physical database schema.
7. Build vertical slices that include UI, API, data, payment and audit—not isolated screens.
8. Run a controlled pilot with real events.
9. Measure conversion, operational effort, support burden and transaction reliability.
10. Expand only after the core workflow demonstrates repeatable value.

## Final product definition

The product is a **unified B2B and B2C Event, Commerce and Experience Ecosystem**. It combines event operations, exhibition opportunity sales, ticketing, product and service marketplaces, CRM, itinerary planning and AI-powered experience orchestration on a shared identity, booking, payment, search and governance foundation.

The recommended entry point is EventOS—especially event publishing, ticketing, exhibition floor plans, booth booking and exhibitor management. This creates the supply and transaction foundation from which the marketplace, CRM, journey and AI layers can grow.


---

# 20. Companion — agreed decisions and implementation recommendations (Version 1.1)

This addendum records stakeholder decisions and recommended defaults. Provider eligibility, legal arrangements and market-specific requirements must be validated before launch.

## 20.1 Confirmed direction

| Area | Decision |
|---|---|
| Brand | Companion |
| Geography | Global-ready; launch countries to be selected later |
| Languages/currencies | Multi-language and multi-currency architecture |
| Event categories | Exhibitions, conferences, corporate events, concerts, festivals and similar |
| Platforms | Web, Android and iOS launched as coordinated channels |
| Payments | Razorpay initially, subject to country/currency eligibility |
| Payout preference | Daily/day-end payout batch where provider settlement rules and funds permit |
| Commercial model | Super Admin-configurable commissions, fees and subscriptions |
| Booth sales | Organiser-configured direct purchase, bidding/auction or hybrid |
| CRM | Inquiry capture, leads, multi-stage pipelines and multi-channel communication |
| AI | Gemini initially, accessed through a provider-independent adapter |
| Load assumption | 10,000 API requests/day; peak concurrency to be load-tested |

## 20.2 Merchant of Record (MoR): what it means

The Merchant of Record is the legal business selling to the customer and carrying the primary customer-facing sale responsibilities. Depending on the jurisdiction and contract, this can include payment collection, tax treatment, invoicing, refunds, chargebacks, consumer complaints and payment compliance.

**Seller/organiser as MoR:** The event organiser sells its tickets and booth space; a marketplace seller/provider sells its own products/services. Companion provides marketplace and transaction software and charges a disclosed commission/platform fee. This is the recommended starting model because it avoids Companion automatically becoming the seller for every transaction.

**Companion as MoR:** The customer buys from Companion. Companion assumes materially greater responsibility for customer sale obligations, tax/invoicing, refunds, chargebacks, support and settlement to suppliers. This is operationally and legally more complex across countries.

**Recommendation:** Use an organiser/seller-as-MoR marketplace model initially. Define the seller of record separately for tickets, booth inventory, products, services and experiences. Have legal/accounting advisers confirm contracts, invoices and tax treatment for each country; the label “marketplace” alone does not decide MoR status.

## 20.3 Razorpay and daily payouts

For a marketplace with multiple organisers and vendors, evaluate **Razorpay Route** for linked accounts, transfers and settlement controls rather than using only a basic single-merchant checkout. Razorpay describes linked accounts, transfers, default/scheduled settlements and settlement holds in its [Route overview](https://razorpay.com/route/). Confirm Route eligibility, onboarding, supported currencies and settlement timelines directly with Razorpay. Its Route API documentation currently surfaced for this PRD specifies INR for Route transfers, so multi-currency payout support must not be assumed.

Implement “day-end payout” as a **daily payout batch preference**: calculate available seller balances; deduct configured fees/commission/taxes; exclude refunds, disputes and risk holds; create the daily batch at a configured cut-off/time zone; submit eligible transfers; reconcile provider webhooks; and expose Scheduled, Processing, Paid, Failed, On Hold and Reversed states. A daily batch is not a guarantee of same-day bank credit. Actual settlement depends on provider/bank cycles, holidays, risk checks, account eligibility and settled funds. Add regional payment providers behind a common payment adapter for other currencies/countries.

## 20.4 Super Admin commercial rules engine

Commissions and subscriptions must not be hard-coded. Super Admin should configure:
- Percentage/fixed commissions by vertical, category, country, organiser/seller tier and transaction type.
- Minimum/maximum fees, platform charges and applicable tax configuration.
- Subscription plans, entitlements, billing cycle, trials, grace periods and add-ons.
- Promotional pricing, coupons, auction listing fees, bid deposits and success fees if used.
- Effective dates, expiry dates, rule priority and preview/simulation.
- Versioned rule snapshots attached to each transaction so later changes do not silently alter historical sales.
- Privileged permissions, maker-checker approval for sensitive changes and audit reasons.

Use deterministic rule precedence, for example: signed contract override → plan/tier → vertical/category → global default. Reject ambiguous conflicting rules.

## 20.5 Booth sales: direct purchase, bidding and hybrid

Each booth/booth group can be configured as:
1. **Direct purchase:** fixed price; first valid transaction to secure the atomic inventory hold and complete checkout wins.
2. **Bidding/auction:** eligible exhibitors bid during a defined window; winner is determined by published auction rules.
3. **Hybrid:** organiser assigns different booths to different modes, or defines a disclosed transition between modes. Do not permit ambiguous live switching that could create competing claims.

Auction configuration should include auction type (start with English ascending auction), starting bid, optional reserve, minimum increment/increment bands, open/close timestamps, bidder eligibility, optional refundable deposit, visibility of current high bid, bidder identity masking, tie-break rule, optional anti-sniping extension, winner payment deadline, deposit/full-payment requirement, no-sale outcome and default-winner fallback.

**Auction workflow:** organiser publishes inventory and rules → exhibitor verifies eligibility/deposit → server validates each bid and records immutable history → auction closes using server time → one atomic close operation determines winner → winner receives payment deadline → confirmed payment books the booth → default handling follows disclosed terms. All bid, award, payment and admin override events are audited.

Critical controls: database transaction/locking for booth allocation; unique active allocation per booth; idempotency keys; server-side bid validation; no accepted-bid deletion/editing; auditable admin override; clear reserve/tie-break/default rules; dispute process. Direct purchase and auction close must share the same inventory lock so they cannot both win.

## 20.6 Floor plan recommendation

**Recommended canonical format: interactive vector geometry (SVG or equivalent), with image/PDF upload as an import/background aid.** Do not use a static image as the source of truth: it cannot reliably represent selectable booth inventory, live availability, zoom, accessible alternatives or mobile interaction.

- **MVP:** organiser uploads JPG/PNG/PDF; it becomes a background. Organiser draws rectangles/polygons over it and links each shape to a booth record. Provide zoom/pan, labels, status indicators and a searchable booth list for accessibility.
- **Next:** native drag-and-drop editor for halls, zones, shapes, dimensions, numbering, duplication, alignment and bulk status/pricing.
- **Later:** CAD/BIM import/export if enterprise demand warrants it.

Store geometry in normalised canvas coordinates so it scales responsively. Keep floor-plan files separate from booth inventory. Server-side booth state is authoritative; map colours are only a visual representation.

## 20.7 Marketplace launch order

Build a generic marketplace foundation, but launch categories in this order:
1. Event/exhibition inventory: tickets, booths, sponsorship and event add-ons.
2. Event services: venues, AV, staging, catering, production, photography, staffing, logistics and rentals. These directly solve organiser needs.
3. Exhibitor product catalogue and RFQ/wholesale enquiries.
4. Experiences for attendees and itinerary users.

This gives Companion a differentiated event-led supply network without spreading early sales and operations across too many unrelated categories.

## 20.8 Gemini AI integration and governance

Use Gemini initially, but put it behind a provider-independent AI gateway so model/version, prompts, safety controls and fallback can change centrally. Free tier is suitable for development and prototypes, not a production reliability or privacy guarantee. Google's current [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) describes limited model access/rate limits on the free tier and indicates free-tier content may be used to improve Google products, while paid-tier content is not used for that purpose under the listed terms. Recheck terms before launch.

Do not send payment credentials, identity documents or unnecessary CRM/attendee personal data to the model. Retrieve only records the user is authorised to access. Require confirmation before bookings, bids, payments, accepting quotes or sending external messages. Log provider/model/version, prompt version, tool/action, user confirmation and result. Add prompt-injection controls, output validation, rate limits, abuse monitoring, human escalation and an AI-off path for core workflows.

## 20.9 Maps, messaging, calendar and identity verification

**Maps:** used for venue search, geocoding, distance, directions and itinerary travel times. Use a provider adapter. Google Maps is a strong global default, but is usage-priced and requires billing; review [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing). Consider a commercial OpenStreetMap-based provider where cost/control is preferable; do not assume public community tiles/geocoding are unrestricted production services.

**WhatsApp:** integrate through the official [WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview/) or approved provider. Business onboarding, templates, opt-in, conversation-window rules, webhooks and charges apply. This is not automation of employees' personal WhatsApp accounts.

**Instagram:** integrate through the official [Instagram Messaging API](https://developers.facebook.com/documentation/business-messaging/instagram-messaging) for eligible professional accounts. Permissions, account setup, app review and platform limits apply; it is not a general API for arbitrary personal accounts. Never scrape messages or use unofficial browser automation.

**CRM inbox recommendation:** first build a unified conversation timeline with channel, contact, owner, delivery status, consent, internal notes, assignment and follow-up. Then connect WhatsApp and Instagram through official APIs. Add email/SMS/web chat through adapters. Preserve channel-specific messaging policies and opt-outs.

**Calendar:** start with downloadable ICS plus Google Calendar; add Microsoft Outlook/Graph later. Use OAuth and narrow scopes so users choose whether to add events or share availability. See [Google Calendar API](https://developers.google.com/workspace/calendar/api/guides/overview) and [OAuth scopes](https://developers.google.com/workspace/calendar/api/auth).

**Identity/business verification:** verify email/phone for all users. Apply business verification to organisers, exhibitors, sellers and providers based on risk/transaction thresholds; use payment provider onboarding for payout-account KYC. Select a country-appropriate verification vendor after legal/privacy review. Avoid collecting raw identity documents unless necessary. Do not require full KYC from every attendee unless the use case requires it.

## 20.10 CRM multi-channel requirements

- Connect authorised organisation WhatsApp Business and Instagram professional accounts; allow multiple connected accounts where provider terms permit.
- Link inbound messages to contacts/leads using safe identifier matching; create leads from inbound conversations when configured.
- Display channel, owner, last interaction, delivery state and consent/opt-out status.
- Support assignment, tags, priority, notes, pipeline stage and follow-up tasks.
- Support approved templates and channel-specific outbound rules.
- Record opt-in, opt-out, purpose and timestamps; block prohibited bulk messaging.
- Store provider message references and audit history without bypassing provider retention rules.

## 20.11 Support and disputes: recommended operating model

Start with a central support/case module and a small human operations team. Categories: ticket/registration; booth/auction; event cancellation/change; payment/refund/payout; seller fulfilment; fraud/impersonation; privacy request; technical issue; messaging abuse.

Suggested initial targets, subject to staffing: immediate automated acknowledgement; event-day access/payment emergency first human response within 1 business hour during published support hours; ordinary booking/seller dispute within 1 business day; general enquiry within 2 business days. Provide urgent escalation for safety/fraud/legal issues.

Case states: `New → Categorised → Assigned → Awaiting User/Partner → Under Review → Resolution Proposed → Resolved → Closed`. Collect evidence and relevant booking/payment references. Keep financial refund/chargeback decisions distinct from ordinary case closure. Provide appeal/reopen path and audit every decision.

## 20.12 Capacity, hosting, residency and disaster recovery

10,000 requests/day averages approximately 0.12 requests/second over 24 hours, but ticket drops, auction close and check-in create bursts. Confirm whether “10K” means API requests, sessions, unique users or transactions.

Initial engineering targets (planning assumptions, not guarantees):
- 10,000 API requests/day baseline.
- Design for 20 requests/second sustained burst at launch.
- Load-test to 50 requests/second before public launch, with a horizontal-scaling path to 100 requests/second.
- Separately load-test ticket release, auction close, payment webhooks, search and QR check-in.
- Monitor latency, error rates, queue depth, DB connections and payment reconciliation lag.

Use a major cloud provider with managed database, object storage, CDN, queues, monitoring and secrets management. Keep deployment regions configurable. Classify public, business-confidential, personal, financial and identity data. Select data region based on law, contracts, customer requirements and provider capabilities; global readiness does not mean unrestricted cross-border transfer. For India, assess the DPDP Act 2023 and DPDP Rules 2025, alongside sector-specific obligations. The Government of India announced the Rules in November 2025: [PIB notice](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655).

Recommended initial reliability targets: 99.9% monthly availability for core services; RPO 15 minutes or better for transactional data; RTO 4 hours or better for core booking services; encrypted automated backups; point-in-time recovery; periodic restore tests; multi-zone deployment where supported; documented incident/rollback/DR runbooks. Retain financial/audit records per applicable law.

## 20.13 Multi-language and multi-currency requirements

- Use translation keys for UI; never hard-code user-facing strings.
- Support translated event/listing content with explicit fallback language.
- Machine translation may create editable drafts, not silently overwrite source content.
- Store locale and time zone separately.
- Store money as integer minor units plus ISO currency code.
- Keep listing currency and transaction currency distinct.
- When showing conversion, store rate source, timestamp and quoted amount.
- Freeze accepted price, currency, tax and fee breakdown at checkout.
- Never silently change payable currency during checkout.
- Treat gateway-supported charge and settlement currencies as provider capabilities, not as a property of the display layer.

## 20.14 Remaining decisions

1. First launch country/countries and initial language set.
2. Legal seller/MoR and invoice model per vertical/country.
3. Razorpay account type, Route eligibility, linked-account onboarding and actual settlement schedule.
4. Additional payment providers for non-INR markets.
5. Auction terms, deposit/refund policy, tie-break and default-winner rule.
6. Exact floor-plan editor scope and import formats.
7. Meta app review and WhatsApp/Instagram onboarding.
8. Maps provider and cost budget.
9. Business verification vendor by country.
10. Cloud/region, residency, RPO/RTO and load-test results.
11. Support staffing/hours and final SLAs.
12. Gemini model/version and production data-use terms.

## 20.15 Updated release order

- **Foundation:** tenant-aware identity, localisation, currency, payment-provider abstraction, audit and configurable commercial rules.
- **Release 1:** Companion EventOS — events, tickets, exhibition floor plans, direct booth purchase, bidding, sponsorship and organiser/exhibitor portals.
- **Release 2:** event services marketplace and CRM inbox/lead pipeline.
- **Release 3:** exhibitor product catalogue and RFQ.
- **Release 4:** experiences, itinerary, maps and calendar.
- **Release 5:** Gemini assistant and cross-module orchestration.

Design for the complete ecosystem from the start, but release it in controlled, testable increments.
