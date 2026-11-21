# Foundation identity and business team access

- **Status:** Implemented for the identity and teams slice
- **Owning context:** Identity and Organisations
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)

## 1. Recommendation and value

Use one identity provider and one backend for separate B2C and B2B mobile and web clients. A person keeps their personal bookings when a business membership ends. Teams can give check-in, event, marketplace and finance access independently. Measure invitation completion, time to grant the correct access, and next-request revocation in the pilot. Adoption and revenue impact are unverified.

## 2. Boundaries and alternatives

An organisation owns its workspace and business records. One person can belong to multiple workspaces and act personally in B2C. Client identity and current membership are separate checks. Reject shared credentials and separate identity stores because both complicate revocation and actor attribution. Use presets and explicit custom permissions from a finite catalogue. The first slice does not require a reusable custom-role editor.

## 3. Implementation contracts

Verify RS256 RFC 9068 JWT access tokens against configured HTTPS JWKS, exact issuer and API audience. Require an allowed client ID and a subject. Use verified email only to redeem invitations. Never use it to merge accounts. Provision the same principal by issuer and subject across all clients. B2B routes require an allowed B2B client. Provision organisation and owner together. Scope access by organisation ID and active membership. Owner grants are fixed in this slice. Owners can delegate Admin. Admins manage ordinary team members and cannot manage owners, admins or themselves.

Store invitations as random token hashes with an expiry and verified-email binding. Owners or authorised admins share the token privately during the pilot. Accept under an organisation lock. Recheck inviter authority and prevent token replay, role override on an existing membership, and self-elevation. Lock team mutations per organisation and commit audit with the access change. Use bounded keyset lists. Disabled access takes effect on the next request.

## 4. Delivery and validation

Update plan and launch contract, add an additive migration, implement the module and HTTP routes, then exercise signed tokens, tenant boundaries, invitation races, audit, and role revocation. Use the existing CI commands and real PostgreSQL. The HTTP layer exposes an OpenAPI contract. UI brief and integration follow in the launch contract.

## 5. Release and rollback

Apply the additive migration before activating routes. Configure trusted issuer, JWKS, audience and separate client allowlists. Roll back service binaries while retaining access and audit records. Deployments without a configured provider expose health probes only.

## 6. Pending decisions and follow-up

Provider onboarding, MFA settings, client registration, iOS release scope, invitation delivery, owner recovery/transfer, consent/profile workflows, resource-specific participant grants, platform audit retention, search and commercial rules remain separate deliverables. Pilot permissions describe future feature access and do not create domain endpoints.

## 7. Outcome

Implemented shared principal provisioning, organisation creation, scoped workspace and team lists, presets and custom member grants, invitations, role updates, revocation and transactional access audit. Revocation blocks invitations issued before removal. The current design makes the owner the only person who can grant privileged permissions. Production readiness still requires IdP onboarding, privileged MFA policy and invitation delivery.

Local type-check, lint and build passed. Vitest passed 44 unit tests, 2 HTTP contract tests and 4 PostgreSQL 18.7 integration tests. Dependency audit reported zero vulnerabilities. Integration tests used a local PostgreSQL instance and injected identities at the verification boundary. Separate unit tests exercised signed tokens and JWKS verification. Production IdP, hosted CI and real B2B or B2C clients were not exercised.
