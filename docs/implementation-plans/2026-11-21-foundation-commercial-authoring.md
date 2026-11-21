# Foundation fixed-fee authoring and approval

- **Status:** Implemented for fixed fees
- **Owning context:** Commerce
- **Parent:** [Backend plan](./2026-11-20-companion-backend-architecture.md)
- **Decision:** [Finance launch contract](../architecture/09-eventos-launch-contracts.md#finance-and-recovery)

## Recommendation

Persist fixed-fee revisions and give Finance a private operator command for drafting, previewing and approving a rule. The existing evaluator remains the authority for precedence and snapshots. Pilot evidence should track approval turnaround and overlap conflicts. Adoption and revenue impact are unverified.

## Design and boundaries

Each rule ID and positive version identifies an immutable proposal. A version binds a transaction kind, ISO currency, fee, priority and half-open time interval. Approval records a distinct database login and timestamp. Separate PostgreSQL group memberships govern authoring and approval. Use individual login roles, with no implicit organisation or B2B role mapping. A rule cannot be approved after its start time. Serialise approvals with a transaction-scoped advisory lock and reject any same-scope, same-priority interval overlap. The version and approval metadata commit together. Preview reads either an identified draft plus approved rules, or approved rules alone. Public checkout remains unwired.

The CLI is an interim operator tool on a trusted database connection. PostgreSQL grants restrict execution of separate draft and approval functions. The functions record the database session login and use a fixed search path. The operator roles require no direct table write access. The database owner remains a trusted administrative role. A future application API needs platform identity, privilege grants, MFA and database access controls. An HTTP admin route now would require inventing that platform identity model. An expression engine would add policy surface before percentage, tax and market scope rules have been approved.

## Implementation and verification

1. Add a migration and typed persistence. Reuse rule validation and the resolver.
2. Add role-checked commands with bounded JSON input. Record the proposal and approval actor atomically.
3. Exercise PostgreSQL authorization, exact values, effective dates, idempotent approval, competing approvals and rollback behavior. Run build, lint, type checks and test suites.
4. Document setup and rollout. Apply the additive migration before operator use. Keep rule history when rolling back the command.

## Limitations

Scope is global per kind and currency. Market-specific hierarchy, cancellation or supersession workflow, percentage rounding, tax, platform admin UI, retention and checkout wiring require separate designs. Use finite windows for pilot rules when later changes must use the same priority. Use database audit facilities for direct maintenance access.

## Outcome

Migration 005 and the private commercial command support draft, preview and separately authorised approval. Verified with PostgreSQL 18.7, including denied access, self-approval denial, immutable version creation, concurrent conflicts, adjacent intervals, idempotent retries and recorded actors. The review rejected an HTTP admin surface before platform administration can enforce its own identity policy.

Lint, type-check, build, 47 unit tests, 2 HTTP contract tests and 8 PostgreSQL integration tests passed. The dependency audit reported zero vulnerabilities. Production credentials, hosted CI and checkout integration were not exercised.
