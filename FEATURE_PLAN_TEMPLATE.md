# Feature Implementation Plan: <Feature Name>

- **Status:** Draft | Reviewed | Approved | In Progress | Implemented | Superseded
- **Author:** <name/agent>
- **Created:** YYYY-MM-DD
- **Last updated:** YYYY-MM-DD
- **Related issue / request:** <link or identifier>
- **Owning bounded context:** <context>
- **Related ADRs:** <links, or None>

> This is an engineering decision document, not a task checklist. Replace every prompt with codebase-specific findings. Mark unknowns explicitly; do not invent answers. The plan must be reviewed critically before feature implementation begins.

## 1. Executive recommendation

State the recommended approach in direct language.

- **Recommendation:** <recommended / acceptable with conditions / not recommended>
- **Why this approach:** <business and technical rationale>
- **Main trade-offs:** <what is gained and what is sacrificed>
- **Largest risks:** <top risks>
- **Confidence:** <high / medium / low, with evidence and uncertainty>

## 2. Problem statement and context

### 2.1 Current behavior

Describe the current behavior and trace the relevant request/event/data flow through the actual codebase. Include key modules, entry points, persistence, external dependencies, and known constraints.

### 2.2 Problem to solve

Describe the user/business problem. Avoid prescribing the implementation here.

### 2.3 Goals

- <Measurable outcome>

### 2.4 Non-goals

- <Explicitly excluded behavior>

### 2.5 Requirements and acceptance criteria

| ID | Requirement / scenario | Acceptance criteria | Priority |
|---|---|---|---|
| R1 | <requirement> | <observable, testable result> | Must |

### 2.6 Product, business, and stakeholder critique

Do not assume the requested feature is the correct solution. Challenge the problem statement and include evidence, assumptions, and unresolved questions.

- **Problem evidence:** <user research, support trends, analytics, workflow evidence, or unknown>
- **Root cause vs symptom:** <analysis>
- **Who has the problem:** <stakeholder segments and frequency/severity>
- **Jobs-to-be-done:** <what each stakeholder is trying to accomplish>
- **Current alternatives / workaround:** <how the problem is handled today>
- **Why now:** <urgency, strategic fit, dependency, or no compelling reason>
- **No-build / process-change option:** <what happens if we do not build software>

#### Stakeholder experience map

| Stakeholder | Need / job | Current friction | Proposed experience | Failure / recovery needs | Success measure |
|---|---|---|---|---|---|
| End user | <need> | <friction> | <experience> | <failure handling> | <metric> |
| Buyer / account owner | <need or N/A> | <friction or N/A> | <experience> | <failure handling> | <metric> |
| Admin / operator | <need or N/A> | <friction or N/A> | <experience> | <failure handling> | <metric> |
| Support / compliance / partner | <need or N/A> | <friction or N/A> | <experience> | <failure handling> | <metric> |

Remove rows that are genuinely irrelevant and add the stakeholders that matter to this domain. Do not fill the table with generic personas.

#### Business value and revenue hypotheses

| Opportunity | Type (direct revenue / indirect revenue / cost saving / risk reduction) | Mechanism | Evidence | Confidence | Validation experiment | Risks / downside |
|---|---|---|---|---|---|---|
| <opportunity or explicitly no credible direct monetization> | <type> | <how value is created> | <evidence or unknown> | <low/medium/high> | <smallest useful test> | <trust, churn, cannibalization, compliance, support cost> |

Consider relevant options such as conversion improvement, retention, expansion, subscription tiers, usage-based pricing, transaction or marketplace fees, paid add-ons, partnerships, referrals, advertising/sponsorship, and operating-cost reduction. Do not force a revenue mechanism onto a feature that does not support one. Do not invent TAM, willingness to pay, uplift, or ROI.

#### Product recommendation

- **Product verdict:** <build / validate first / buy or integrate / process change / defer / reject>
- **Why this is the right problem to solve:** <evidence and strategic fit>
- **What would make this a bad idea:** <disconfirming evidence / failure conditions>
- **Smallest useful validation:** <experiment, owner, metric, stop/go threshold>
- **Scope guardrail:** <what must stay out of this release>

### 2.7 Workload and quality attributes

Record known facts and explicit assumptions.

| Attribute | Current / expected | Target or constraint | Evidence / assumption |
|---|---|---|---|
| Request volume / concurrency | <value or unknown> | <target> | <source> |
| Data volume and growth | <value or unknown> | <target> | <source> |
| Latency | <p50/p95/p99 or unknown> | <target> | <source> |
| Availability / durability | <current or unknown> | <target> | <source> |
| Consistency | <required semantics> | <target> | <source> |
| Security / privacy | <classification and constraints> | <target> | <source> |

Do not invent capacity targets. If workload data is unavailable, state the assumptions and identify how they will be validated.

## 3. Existing architecture and codebase findings

- **Relevant bounded context(s):** <names and responsibilities>
- **Current entry points:** <controllers, handlers, consumers, jobs, CLI>
- **Current domain model:** <entities, value objects, aggregates, domain services>
- **Application use cases:** <services/commands/queries>
- **Persistence and schema:** <tables/collections, repositories, constraints, indexes>
- **External integrations:** <APIs, brokers, providers>
- **Existing conventions / patterns:** <patterns to follow>
- **Relevant tests and gaps:** <test suites and missing coverage>
- **Constraints / technical debt:** <verified findings>

Cite actual paths/symbols where possible. Distinguish repository facts from assumptions.

## 4. Domain-Driven Design analysis

### 4.1 Domain and ubiquitous language

Define the business concepts and terms used by this feature. Identify ambiguous terms and resolve them.

### 4.2 Bounded context ownership

Explain which context owns each rule and data set. Identify any cross-context interactions and why they are necessary.

### 4.3 Domain model

| Concept | Type (entity / value object / aggregate / service / event) | Identity / invariants / behavior | Owner |
|---|---|---|---|
| <concept> | <type> | <details> | <context> |

### 4.4 Aggregate and transaction boundaries

- Aggregate roots and invariants:
- Transaction boundary:
- Concurrency / optimistic locking strategy:
- Cross-aggregate consistency requirements:

### 4.5 Context integration

Describe APIs, application ports, domain events, integration events, anti-corruption layers, or other contracts. State why direct data access is not being used across contexts.

## 5. Proposed solution and technical design

### 5.1 High-level design

Explain the design, major components, responsibilities, and dependency direction. Include a Mermaid diagram when it clarifies component or sequence relationships.

### 5.2 End-to-end flows

Describe the main success flow and important alternate/failure flows from entry point to persistence or external side effect.

### 5.3 Component-level design

| Component / module | Responsibility | Depends on | Must not depend on |
|---|---|---|---|
| <component> | <responsibility> | <allowed dependencies> | <forbidden dependencies> |

### 5.4 UI / stakeholder experience changes

For UI-facing work, include the primary-model-approved UI brief: user goal, information hierarchy, navigation/entry points, layout, interaction states, responsive behavior, accessibility, copy/content, design-system constraints, and visual verification approach. For backend-only work, state why no UI change is needed.

### 5.5 API / interface changes

For each endpoint, command, query, or interface, specify method/name, request, response, validation, authorization, error semantics, compatibility, and versioning.

### 5.6 Data model and migrations

- Schema changes:
- Constraints and indexes (with query rationale):
- Backfill / data transformation:
- Data retention and deletion:
- Migration order and backward compatibility:
- Locking, table size, and deployment-time risk:
- Rollback or forward-fix strategy:

### 5.7 Events and asynchronous processing

- Event schema and version:
- Delivery and ordering semantics:
- Idempotency / deduplication:
- Transactional outbox / inbox decision:
- Retry, backoff, dead-letter, replay, and poison-message handling:
- Consumer ownership and operational alerts:

### 5.8 Security and privacy

Cover authentication, authorization, tenancy/isolation, input validation, secrets, sensitive data, audit requirements, abuse controls, and relevant threat scenarios.

### 5.9 Performance and scalability

- Expected workload and evidence:
- Hot paths and query patterns:
- Complexity and resource bounds:
- Pagination, indexing, caching, batching, or async decisions:
- Backpressure, rate limits, quotas, and concurrency:
- Bottlenecks and likely saturation points:
- Benchmark / load-test approach and pass criteria:

Explain why each scaling mechanism is necessary. Do not add infrastructure as a precaution without a demonstrated requirement.

### 5.10 Reliability and failure handling

| Failure scenario | Expected behavior | Detection | Recovery / mitigation |
|---|---|---|---|
| Timeout / dependency outage | <behavior> | <signal> | <action> |
| Duplicate request / event | <behavior> | <signal> | <action> |
| Partial failure | <behavior> | <signal> | <action> |
| Concurrent update | <behavior> | <signal> | <action> |

### 5.11 Observability and operations

Specify structured logs, metrics, traces, dashboards, alerts, SLI/SLO impact, runbooks, and operational ownership.

## 6. Alternatives and critical trade-off analysis

Evaluate at least the recommended design and the simplest credible alternative. Add other meaningful alternatives where appropriate.

| Option | Benefits | Costs / risks | Operational complexity | Why chosen / rejected |
|---|---|---|---|---|
| A. Recommended | <benefits> | <costs> | <level> | <reason> |
| B. Simplest viable alternative | <benefits> | <costs> | <level> | <reason> |
| C. Other option (if relevant) | <benefits> | <costs> | <level> | <reason> |

Explicitly challenge the recommendation:

- What is overengineered?
- What could fail at scale or under partial failure?
- What new coupling or long-term maintenance burden is introduced?
- Which assumption, if false, would make this design wrong?
- What evidence would change the recommendation?

Do not use vague claims such as “more scalable” or “best practice” without explaining the mechanism and cost.

## 7. T3 Code delegation plan (when using T3 Code)

The primary model owns planning and architecture decisions. Delegate only bounded implementation tasks after this plan is reviewed.

| Task ID | Agent/provider and model | Scope / deliverable | Owned files/modules | Dependencies | Concurrency slot | Fallback if unavailable |
|---|---|---|---|---|---|---|
| D1 | <agent/model> | <bounded task> | <exclusive paths> | <prerequisite> | 1 or 2 | <next suitable roster agent> |
| D2 | <agent/model> | <bounded task> | <exclusive paths> | <prerequisite> | 1 or 2 | <next suitable roster agent> |

- **Maximum concurrent subagents:** 2.
- **Shared contract/interface owner:** <primary model / named task>
- **UI brief owner:** primary model.
- **Integration and final reviewer:** primary model.
- **Quota/provider fallback:** <agent substitution and context-transfer approach>
- **Potential file conflicts:** <paths and prevention>

Each task brief must state the objective, context, allowed/forbidden files, acceptance criteria, tests, questions-to-escalate rule, and completion report format. Do not delegate product decisions or unresolved architectural choices.

## 8. Implementation sequence

Break the work into reviewable, dependency-aware steps. Include tests and documentation in the steps where they belong.

| Step | Change | Main files / modules | Dependencies | Validation / exit criteria |
|---|---|---|---|---|
| 1 | <step> | <paths> | <prerequisites> | <criteria> |

Include deployment sequencing when application code, schema, events, or consumers must be rolled out in a specific order.

## 9. Testing strategy

| Test level | Scenarios | Test data / environment | Pass criteria |
|---|---|---|---|
| Domain unit | <invariants and edge cases> | <fixtures> | <criteria> |
| Application | <use-case and authorization paths> | <setup> | <criteria> |
| Infrastructure integration | <DB/broker/provider behavior> | <environment> | <criteria> |
| Contract / E2E | <compatibility and user journeys> | <environment> | <criteria> |
| Concurrency / resilience | <races, retry, outage> | <environment> | <criteria> |
| Performance / load | <representative workload> | <environment> | <thresholds> |

List commands that were verified from the repository. Do not invent commands.

## 10. Rollout, migration, and rollback

- **Release strategy:** <feature flag / canary / phased rollout / standard deploy>
- **Pre-deployment checks:** <checks>
- **Deployment order:** <sequence>
- **Data migration / backfill:** <steps, batching, pause/resume, validation>
- **Monitoring during rollout:** <metrics and thresholds>
- **Rollback trigger:** <conditions>
- **Rollback procedure:** <steps>
- **Irreversible operations / forward-fix:** <details>

## 11. Risks, assumptions, decisions, and open questions

### Risks

| Risk | Likelihood | Impact | Mitigation / owner |
|---|---|---|---|
| <risk> | <low/medium/high> | <low/medium/high> | <mitigation> |

### Assumptions

| Assumption | Why needed | How / when validated | Consequence if false |
|---|---|---|---|
| <assumption> | <reason> | <validation> | <impact> |

### Decisions and open questions

- **Decision:** <decision and rationale>
- **Open question:** <question, owner, deadline/blocking status>

## 12. Definition of done

- [ ] Acceptance criteria are met.
- [ ] The problem statement, root cause, product verdict, stakeholder experience, success metrics, and relevant revenue/cost hypotheses have been critically assessed without inventing evidence.
- [ ] Domain behavior and invariants are implemented in the owning context.
- [ ] Dependency direction and bounded-context boundaries are preserved.
- [ ] API, event, and persistence compatibility is verified.
- [ ] Security, authorization, validation, idempotency, and failure handling are covered.
- [ ] Unit, integration, contract, end-to-end, and performance tests are completed where applicable.
- [ ] Required lint, format, type-check, build, and test commands pass.
- [ ] Observability and operational documentation are complete.
- [ ] Rollout and rollback steps are tested or explicitly documented.
- [ ] The implementation plan is updated with actual file changes, test results, deviations, and remaining risks.

## 13. Implementation outcome (complete after coding)

- **Implemented commit / PR:** <link or identifier>
- **Delegated agents/models:** <agents used, task ownership, substitutions, or None>
- **Integration review:** <primary-model review findings and conflict resolution>
- **Actual changes:** <summary and paths>
- **Plan deviations:** <what changed and why>
- **Validation executed:** <exact commands and results>
- **Validation not executed:** <checks and reasons>
- **Known limitations / follow-ups:** <details>
- **Final design assessment:** <direct assessment of whether the delivered solution meets the stated requirements>
