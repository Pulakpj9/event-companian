# Foundation money and localization

- **Status:** Implemented
- **Created:** 2026-11-20
- **Owning bounded contexts:** Commerce and Event applications consume framework-free platform primitives
- **Related decisions:** [Persistence and money snapshots](../architecture/02-data-and-persistence.md#5-money-and-snapshots), [Backend stack](../adr/0001-nodejs-typescript-backend.md), [Foundation roadmap](../architecture/07-testing-roadmap.md#foundation)

## 1. Executive recommendation

Build dependency-free money, translated content and zoned event time primitives now. Event and checkout slices will consume their explicit interfaces. Workspace approval gates identity persistence and privileged application behavior.

## 2. Problem statement and context

The PRD requires reproducible exact money, independent locale and event time zone and controlled translation fallback. Attendees need reliable schedules and total payable. Organisers need published details in the intended languages. Finance needs exact arithmetic. Measure success through lossless persistence round trips, stable fallback and acceptance cases around daylight-saving transitions. Checkout conversion impact is unmeasured.

## 3. Existing architecture and codebase findings

The runtime slice established strict TypeScript and CI checks. The only current API routes are health probes. PostgreSQL currently stores diagnostic records. The API design already uses JSON numbers for safe minor units and a separate currency code. The architecture uses UTC instants and IANA event zones.

## 4. Domain-driven design analysis

Money is an immutable signed value object. Arithmetic requires the same currency. Commerce owns provider restrictions, tax, exchange and rounding rules. Localized content uses canonical locale keys. Event scheduling owns the source zone, schedule semantics and permitted edits.

## 5. Proposed solution and technical design

Use a `bigint` amount and a validated currency accepted by the pinned Node ICU data. Accept canonical signed PostgreSQL `bigint` text only within signed 64-bit bounds. Convert API numbers only when safe and integral, and reject mixed currency arithmetic. Validate checkout eligibility separately in the future adapter. Normalize language tags with Intl and strip formatting extensions for content lookup. Prefer exact requested locale, then progressively broader requested locales, then the explicitly declared source translation. Reject duplicate canonical keys and missing source content. Event input supplies an ISO calendar timestamp with explicit offset and an IANA zone. Round-trip the instant through that zone to detect invalid local times and offset mismatches. Persist the instant separately from the event zone.

## 6. Alternatives and critical trade-off analysis

Floating-point major-unit arithmetic cannot represent all minor-unit values exactly. A currency package or Temporal polyfill adds dependency maintenance before a specific gap has been shown. The selected Intl-based approach means runtime ICU and time-zone updates require regression checks. Explicit offsets let clients distinguish the two occurrences of a repeated wall time.

## 7. Delegation

Implementation and verification are handled in the active workspace.

## 8. Implementation sequence

Add pure modules and their tests. Cover safe JSON and database boundaries, locale fallback, time-zone interpretation and invalid input. Link the primitives into the architecture documentation. Consumer integration belongs to the corresponding event and checkout slices.

## 9. Testing strategy

Exercise signed limits, fractional and unsafe input, mixed currency, locale canonicalization, missing translations, DST gaps and both offsets in a repeated hour. Run lint, type-check, build, unit and HTTP contract checks. No database or API contract migrations are introduced by this slice.

## 10. Rollout, migration and rollback

The primitives are internal. Activate event and commerce use through their later vertical slices. Rollback is a source revert before consumers adopt the modules.

## 11. Risks, assumptions, decisions, and open questions

Runtime-recognized currency is distinct from launch-market provider acceptance. No defaults are inferred for missing source translations. The event timestamp contract accepts whole seconds and explicit offsets. Identity, RBAC, authenticated audit and commercial rule persistence depend on the access and finance approvals recorded in the broader implementation plan. Search and production telemetry depend on their read models and deployment requirements.

## 12. Definition of done

Primitives compile, their boundary behavior is covered and architecture references match the implementation.

## 13. Implementation outcome

The three primitives are available under `src/shared/values/`. The event-time implementation preserves the validated zone identifier supplied by the caller, since ICU may return a different alias for the same zone. The tests cover that behavior and both occurrences of a repeated hour.

- Targeted Vitest check passed with 34 tests. Lint, type-check, build, the 42-test unit suite and the 2-test HTTP contract suite passed.
- There were no database changes. Database integration and hosted CI were outside this slice?s validation. Event and Commerce will wire these primitives into their own API and repository adapters.
- Workspace/participant-access approval remains the prerequisite for implementing identity tables and their authorisation policies.
