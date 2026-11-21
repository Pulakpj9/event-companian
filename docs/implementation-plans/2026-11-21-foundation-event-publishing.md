# Foundation event publishing and discovery

- **Status:** Implemented for basic event publishing
- **Created:** 2026-11-21
- **Owner:** Events
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Related decision:** [Discovery consumer](./2026-11-21-foundation-discovery-consumer.md)

## Recommendation and product value

Deliver the first live source of public search results. An organiser can save, read and edit a draft, publish it and withdraw it. An attendee can find its title and summary after publication. Pilot evidence should measure time to first publication and discovery success. This slice has no ticket allocation or payment behavior.

## Boundaries and contracts

Events owns the organisation-scoped event, schedule, lifecycle and revision audit. Identity supplies business client authentication and current workspace permissions. Discovery owns its public projection through the existing versioned consumer. Draft editing requires events.edit. Publishing and withdrawal require events.manage. Use live membership checks under the same organisation lock as access changes. Cross-organisation requests are hidden. Validate zoned timestamps and the end-after-start rule. Reject stale edits by revision and edits of published events. Publication explicitly makes this slice's title and summary public. A repeat publication or withdrawal is a no-op. Record actor and revision for each actual change.

## Alternatives and decision

For this single PostgreSQL deployment, commit the revision, audit, Discovery receipt and search projection in one transaction through the existing Discovery interface. This gives immediate withdrawal visibility. The trade-off is that projection failure blocks the write and must roll back all changes. Async delivery is a future alternative after authoritative read filtering or a measured scaling need. Events accesses only its own tables and uses Identity and Discovery interfaces for cross-context operations.

## Sequence and verification

1. Add the Events migration and audit table.
2. Reuse identity authentication and live permission checks. Add authoring and lifecycle routes.
3. Verify access, optimistic revision conflict, timezone handling, repeat requests, immediate discovery changes and rollback against real PostgreSQL. Run CI checks and report production verification separately.

## Rollout and rollback

Apply migration 008 before the new API. Stop publication before rolling back and preserve event and receipt history. Older API versions can still read the existing public search projection. Operational access and release scope remain dependent on the configured identity provider. Advanced visibility, tickets, cancellations, booking-impacting edits and Marketplace publication remain separate work.

## Outcome

Implemented the actor-scoped draft, edit, publish and withdraw API. The event and Discovery write run in one transaction. Integration checks verified immediate visibility, workspace isolation, stale revision rejection, concurrent publication, withdrawal and rollback after an injected projection failure.

Validated using lint, TypeScript type-check, build, 47 unit tests, 9 HTTP contract tests and 12 PostgreSQL integration tests on a fresh disposable database. The dependency audit reported zero vulnerabilities. Migration 008 has not been applied to the configured development database. Live identity provider and hosted deployment were not exercised.
