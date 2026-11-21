# API Contract and Application Interfaces

## 1. API model

Expose REST/JSON through Fastify route plugins on Node.js. Define TypeBox schemas for request validation and response serialization, infer TypeScript types from those schemas, and generate OpenAPI from the registered routes with `@fastify/swagger`. Verify response conformance in contract tests.

- Base path: `/api/v1`
- Business resources use plural nouns
- Stable UUID IDs
- UTC timestamps in RFC 3339
- Cursor pagination for large collections
- Idempotency required for all state-changing booking, payment and refund requests
- `If-Match` or version field for optimistic concurrency
- Adapt Fastify validation errors to the shared error contract. Map domain outcomes to HTTP responses in the route layer.

GraphQL is not required for MVP. Mobile and web can share the REST contract unless a measured fan-out problem proves another delivery interface.

## 2. Authentication

- OIDC/OAuth-compatible identity provider
- Short-lived access tokens
- Secure refresh-token rotation
- MFA for privileged accounts
- Device/session management
- Invitation and organization switching
- Re-authentication for refund, role change and sensitive export

Every request includes:

- User identity
- Organisation context
- Correlation ID
- Optional traceparent
- Optional idempotency key for mutations

The server derives scope from the resource owner and checks membership or the participant grant for the action. Personal tickets and bookings need no organisation selection. See the [participant access matrix](./09-eventos-launch-contracts.md#identity-and-participant-access).

## 3. Authorization

Use a policy service with:

- Action
- Resource type
- Tenant
- Organisation
- Resource owner
- Membership roles
- Resource-level grant
- Delegated context

Example:

```text
can(User, "booth.application.approve", BoothApplication)
can(User, "lead.export", Lead)
can(User, "refund.approve", Payment)
```

Reject or filter private fields before serialization. API 403 vs 404 policy:

- 403 for an authenticated user who is denied by known policy
- 404 for a resource hidden by tenancy or privacy
- 401 for missing/invalid authentication

## 4. Error contract

```json
{
  "type": "https://errors.companion.example/inventory-unavailable",
  "title": "Inventory unavailable",
  "status": 409,
  "code": "INVENTORY_UNAVAILABLE",
  "detail": "The booth is no longer available.",
  "correlationId": "01...",
  "traceId": "00...",
  "errors": [
    {
      "field": "boothId",
      "code": "NOT_AVAILABLE",
      "message": "Choose another booth."
    }
  ]
}
```

No stack traces, SQL, provider tokens or personal data in client errors.

## 5. Endpoint families

### Identity and organisations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register/verify account |
| POST | `/auth/sessions` | Create login session |
| POST | `/organisations` | Create organisation |
| POST | `/organisations/{id}/invitations` | Invite member |
| POST | `/invitations/{id}/accept` | Accept invitation |
| PUT | `/organisations/{id}/members/{membershipId}/roles` | Change roles |
| DELETE | `/organisations/{id}/members/{membershipId}` | Deactivate member |
| GET | `/users/me/privacy` | Read preferences |

Foundation identity routes use provider-issued bearer access tokens. GET /me resolves one principal across both app types. B2B clients can GET and POST /organisations, GET /organisations/{id}/members, POST /organisations/{id}/invitations, POST /invitations/accept, PUT /organisations/{id}/members/{userId}/access, and DELETE /organisations/{id}/members/{userId}. Member roles and custom permission assignments are evaluated against current membership. Provider-owned sign-in and the planned profile and privacy operations are separate from these routes.

### Events and ticketing

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/organisations/{orgId}/events` | Create draft |
| GET | `/events/{id}` | Read an event in the authorised business workspace |
| PATCH | `/events/{id}` | Edit draft fields with the expected revision |
| POST | `/events/{id}/publish` | Publish |
| POST | `/events/{id}/duplicate` | Create a draft without bookings or credentials |
| POST | `/events/{id}/unpublish` | Withdraw discovery and preserve obligations |
| POST | `/events/{id}/pause` | Pause |
| POST | `/events/{id}/cancel` | Controlled cancellation |
| POST | `/events/{id}/ticket-types` | Create ticket type |
| POST | `/events/{id}/ticket-holds` | Create inventory hold |
| POST | `/events/{id}/registrations` | Submit free, RSVP, approval or invitation registration |
| POST | `/events/{id}/invitations` | Issue a scoped participation invitation |
| POST | `/registrations/{id}/decision` | Approve or reject an application |
| GET | `/events/{id}/registrants` | Search and filter a scoped list |
| POST | `/events/{id}/registrant-exports` | Request a scoped, audited export |
| POST | `/checkouts` | Create checkout |
| POST | `/ticket-orders/{id}/confirm` | Confirm only after provider state |
| GET | `/users/me/tickets` | Attendee tickets |
| POST | `/check-ins` | Record check-in |

Approval is pending until capacity and invitation or payment prerequisites are met. Free and RSVP confirmations use atomic capacity controls. Invitation redemption binds the intended identity and checks expiry and permitted uses. Booking-impacting edits persist a versioned audit record and notify affected participants through the outbox. Return explicit errors for illegal transitions.

### Exhibition

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/events/{id}/exhibition` | Create exhibition |
| POST | `/exhibitions/{id}/halls` | Create hall |
| POST | `/exhibitions/{id}/booths:bulk` | Create/update inventory |
| GET | `/exhibitions/{id}/floor-plan` | Public floor plan projection |
| POST | `/booths/{id}/hold` | Hold direct booth |
| POST | `/booths/{id}/applications` | Submit application |
| POST | `/booth-applications/{id}:approve` | Approve |
| POST | `/booth-applications/{id}:reject` | Reject/request details |
| POST | `/auctions/{id}/bids` | Submit bid |
| POST | `/auctions/{id}:close` | Operate only through scheduler/system |

Never accept a bid or close an auction through a client-calculated winner.

### Marketplace and CRM

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/organisations/{orgId}/listings` | Create listing |
| PATCH | `/listings/{id}` | Update allowed fields |
| POST | `/listings/{id}/enquiries` | Create enquiry/RFQ |
| POST | `/enquiries/{id}/quotes` | Submit quotation |
| POST | `/quotes/{id}:accept` | Buyer accepts |
| POST | `/organisations/{orgId}/leads` | Create lead |
| PATCH | `/leads/{id}` | Update lead |
| POST | `/leads/{id}/activities` | Record activity |
| POST | `/leads:export` | Create authorized export |
| POST | `/conversations/{id}/messages` | Send channel message |

### Finance

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/checkouts` | Create server-calculated checkout |
| POST | `/checkouts/{id}/provider-session` | Initialize provider |
| POST | `/payment-webhooks/razorpay` | Receive signed, supported Razorpay payment observations into the opt-in inbox |
| POST | `/payments/{id}/refunds` | Request refund |
| POST | `/refunds/{id}:approve` | Approve refund |
| POST | `/payout-batches:run` | Authorized or scheduled batch |
| GET | `/finance/settlements` | Reconciliation report |

For payment webhooks, configure route-scoped access to the original, size-limited request bytes. Verify the provider signature against those bytes before parsing and processing the event. Exercise the actual Fastify route with a provider fixture so JSON reserialization or body-parser changes cannot invalidate verification.

## 6. Pagination

Use:

```text
GET /events?cursor=...&limit=50

{
  "items": [],
  "nextCursor": "...",
  "count": 50
}
```

No unbounded exports: exports are asynchronous jobs with a token and notification.

## 7. Versioning

- Major REST contract version in path only for incompatible changes.
- Add fields without a new version.
- Deprecate fields only after consumers receive a date and migration path.
- Integration events carry `schemaVersion`.
- Payment, booking and AI action contracts require explicit compatibility tests.

## 8. Validation

Validate:

- Required fields and length
- Organisation/resource ownership
- Currency and minor unit
- Date/time and timezone
- State transition eligibility
- Sales window and inventory
- Business-rule price calculation
- File type/size and malware scan status

Server code, not API DTO validation, owns financial and state invariants.
