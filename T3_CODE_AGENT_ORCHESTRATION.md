# T3 Code Agent Orchestration Policy

This document supplements the repository's root `AGENTS.md`. It describes the user's preferred division of responsibilities when this repository is worked on through T3 Code.

## 1. Responsibility model

| Role | Preferred model/provider | Responsibility | Must not delegate |
|---|---|---|---|
| Primary orchestrator | Codex `gpt-6.2-astra` | Requirement critique, product/business analysis, feature planning, DDD/architecture decisions, UI direction, task decomposition, delegation, integration, final review | Accountability for correctness and final acceptance |
| Coding worker 1 | OpenCode — DeepSeek V4.1 Flash | Bounded implementation tasks | Product decisions or architecture changes |
| Coding worker 2 | OpenCode — Big Pickle | Bounded implementation tasks | Product decisions or architecture changes |
| Coding worker 3 | `model:acpRegistry_devin/swe-2-flash-medium` | Suitable non-visual implementation tasks | Image generation, image interpretation, screenshot analysis, visual-asset tasks |
| Coding worker 4 | `model:acpRegistry_copilot/default` | Bounded implementation tasks | Product decisions or architecture changes |

The exact model/provider names above are the user's requested labels. Verify the exact selectable identifiers and availability in the installed T3 Code version. Do not assume a model exists merely because it appears in this document.

## 2. Planning and problem critique

The primary model must own the planning phase for every feature and every substantive problem statement. It must:

1. Inspect the repository and identify actual architecture, runtime, dependencies, constraints, and existing behavior.
2. Challenge whether the problem is real and whether the proposed feature is the correct intervention.
3. Distinguish facts, assumptions, hypotheses, and unknowns.
4. Analyze business impact, measurable outcomes, stakeholder journeys, risks, and credible revenue or cost-saving opportunities where relevant.
5. Compare build, buy, integrate, process change, validate-first, defer, and no-build options.
6. Produce and critically review `docs/implementation-plans/YYYY-MM-DD-short-feature-name.md` using `docs/FEATURE_PLAN_TEMPLATE.md`.
7. Decide architecture, domain ownership, public contracts, integration boundaries, and rollout strategy before implementation is delegated.

A weak problem statement must not be converted directly into code. The recommendation may be to validate, narrow, defer, or reject the request. Do not manufacture revenue opportunities, customer demand, market sizing, or ROI to make an idea look attractive.

## 3. Preferred coding-agent roster and substitution

Try to use the most capable available agent for the specific task, taking account of capability, context window, tool access, quota, provider health, and task risk. The user's preferred roster is:

1. OpenCode — DeepSeek V4.1 Flash.
2. OpenCode — Big Pickle.
3. Devin SWE-2 Flash Medium — `model:acpRegistry_devin/swe-2-flash-medium`.
4. Copilot default — `model:acpRegistry_copilot/default`.

If an agent reaches quota or another provider limit:

- Stop assigning new work to it.
- Capture its latest report and inspect all workspace changes/checkpoints.
- Give the remaining work to the next suitable available agent, along with the complete original task brief and a summary of completed work.
- Preserve existing changes; do not blindly restart the full task or create parallel duplicate edits.
- Record the handoff and provider substitution in the feature plan and final report.

If no suitable agent is available, the primary model should continue when capable or report the blocker. Do not silently lower the required quality bar.

## 4. Concurrency and task partitioning

**Hard workflow limit: at most two active coding subagents at any time.**

The primary model tracks active agents and must not dispatch a third while two are active. Do not ask subagents to spawn more agents. Use fewer than two when tasks are dependent or share files.

Before launching parallel work, define disjoint ownership. The same central domain model, API contract, migration, dependency manifest, or UI component must not be edited by multiple agents concurrently. If work cannot be partitioned safely, assign it sequentially.

Use a small task register in the plan or parent context:

| Slot | Agent | Task | Owned paths | Status |
|---|---|---|---|---|
| 1 | <agent> | <task> | <paths> | <queued / active / blocked / done> |
| 2 | <agent> | <task> | <paths> | <queued / active / blocked / done> |

Do not treat the concurrency limit as a target. Coordination overhead and merge risk can outweigh parallelism.

## 5. Subagent instructions and escalation

Each subagent receives a self-contained, narrow brief including:

- The problem, expected outcome, approved feature plan, and relevant repository instructions.
- Its exact task and explicit non-goals.
- Bounded context/domain invariants and architecture constraints.
- Files/modules it owns and files it must not touch.
- Public interfaces/contracts it must preserve.
- Acceptance criteria, tests, and verified commands.
- The format required for its completion report.

Subagents must execute the assigned implementation only. They must not re-scope the feature, redesign architecture, change product behavior, or make material trade-off decisions independently.

If an ambiguity or doubt arises, the subagent must ask the primary model. If the provider/T3 Code interaction does not support a direct clarification cycle, the subagent must stop and report:

```text
BLOCKED — primary-model decision required
Question:
Relevant context:
Options considered:
Impact of each option:
Recommended option (with rationale):
Files changed so far:
```

The subagent must not guess and continue through a consequential ambiguity. It should not ask the user directly for decisions that belong to the primary orchestrator.

Subagents must report:

- Summary of implementation.
- Exact changed files.
- Tests/checks actually run and their output/result.
- Assumptions and deviations from the task brief.
- Risks, incomplete work, and decisions needed.

The primary model reviews all changes and is responsible for end-to-end verification. Do not permit unreviewed delegated code to be treated as done.

## 6. UI/UX and visual capabilities

For any UI-related task, the primary model first writes a UI implementation brief. At minimum, define:

- User goal and primary action.
- Current problem and intended experience.
- Information hierarchy, layout, navigation, and content/copy direction.
- Interaction states: default, hover/focus, disabled, loading, empty, error, success, and confirmation as applicable.
- Responsive behavior and target breakpoints based on the project's conventions.
- Accessibility expectations, keyboard operation, semantic structure, and contrast.
- Design-system components/tokens to reuse and patterns to avoid.
- Visual acceptance criteria and screenshot/manual verification approach.

The coding agent implements the brief; it does not invent the experience. It must escalate any unclear or conflicting design requirement to the primary model.

In this workflow, Devin has no image capabilities. Do not assign it image generation, image understanding, screenshot interpretation, or visual asset creation. It may implement non-visual backend or other coding tasks. Verify image capability for any other provider before relying on it. If no delegated provider has the needed capability, the primary model handles the visual task or calls out the limitation.

The primary model reviews the finished UI for fidelity to the brief, responsive behavior, accessibility, and actual user journey—not merely whether it compiles.

## 7. T3 Code-specific operational caveats

- T3 Code supports its own provider integrations and ACP Registry providers. These are not necessarily represented by the same model identifiers or configuration paths. Select and authenticate them in T3 Code's provider settings.
- ACP agents bring their own runtime, models, tools, and sign-in. Availability depends on the connected environment and the selected agent's implementation.
- ACP task/child-agent presentation and lineage are agent-specific; do not assume every ACP agent exposes identical delegation details.
- `AGENTS.md` is an instruction file, not a provider configuration file or a concurrency-enforcement mechanism. The primary model must follow the two-agent limit, and the T3 Code provider configuration must separately make the requested agents available.
- Review third-party ACP agents, their permissions, source, and license before enabling them. Apply least privilege and do not expose secrets or production data in delegated prompts.

## 8. Recommended task lifecycle

```text
User request / problem statement
        |
        v
Primary model: inspect repository + challenge problem
        |
        v
Primary model: product/business + stakeholder analysis
        |
        v
Primary model: DDD design + feature plan + UI brief (if needed)
        |
        v
Primary model: split into bounded tasks with disjoint file ownership
        |
        +----> Subagent slot 1 (implementation)
        |
        +----> Subagent slot 2 (independent implementation/review)
        |
        v
Primary model: resolve questions, inspect diffs, integrate
        |
        v
Primary model: run tests, review architecture/security/performance/UI
        |
        v
Update plan + report validation, trade-offs, risks, and agent handoffs
```

## 9. Example task brief

```text
Task: Implement the persistence adapter for the approved CreateOrder use case.

Context:
- Feature plan: docs/implementation-plans/YYYY-MM-DD-create-order.md
- Bounded context: Ordering
- Approved interface: OrderRepository port in src/ordering/application/ports/...

Scope:
- Implement only the SQL/ORM adapter and its integration tests.
- Own: src/ordering/infrastructure/persistence/**
- Do not edit: domain/**, application/ports/**, API contracts, migrations, UI/**.

Constraints:
- Preserve aggregate invariants and the approved transaction boundary.
- No new dependency without asking the primary model.
- Use repository conventions and verified test commands.

Acceptance criteria:
- [concrete criteria]

Escalation:
- Ask the primary model about any unclear behavior or contract.
- If clarification is unavailable, stop and report BLOCKED; do not guess.

Completion report:
- Summary, changed files, tests and actual results, deviations, risks, and questions.
```
