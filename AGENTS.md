## 3. `AGENTS.md`

```md
# Agent Instructions

This repository contains an interactive regenerative garden-planning application.

Before performing product work, read:

1. `PRODUCT.md`
2. `ARCHITECTURE.md`
3. relevant existing source files and tests

Treat these documents as the current source of truth.

If the requested task conflicts with them, surface the conflict rather than silently changing the product or architecture.

---

## Product Context

The long-term vision is an interactive, game-like tool for designing regenerative gardens.

The current product is deliberately much smaller.

V1 is a companion-planting sandbox where users place plants spatially and receive deterministic feedback about plant relationships and spacing.

Do not implement future roadmap features unless explicitly requested.

---

## Core Development Principles

### Keep It Simple

Prefer the smallest clear implementation that satisfies the requested feature.

Do not prematurely abstract.

Do not create infrastructure for hypothetical future requirements.

Do not add dependencies unless they solve a concrete current problem.

### Stay Within Scope

Work only on the requested feature.

Do not use a task as an opportunity to implement adjacent roadmap features.

For example, implementing companion planting does not justify also implementing:

- native plant recommendations
- water systems
- soil simulation
- authentication
- AI recommendations

unless explicitly requested.

### Separate Domain Logic from UI

Gardening knowledge and evaluation rules should not be scattered through React components.

Keep:

- plant data structured
- garden state explicit
- rule logic independently testable
- UI responsible primarily for interaction and presentation

### Preserve Explainability

Garden feedback should be derived from understandable rules.

Whenever practical, evaluations should contain enough information to explain why they occurred.

Do not create opaque scores or recommendations when the underlying reason can be represented explicitly.

### Treat Data Carefully

Do not invent gardening facts simply to complete a feature.

If required plant or ecological data is missing:

- identify what is missing
- use clearly marked placeholder data when appropriate for UI prototyping
- do not present fabricated information as authoritative

An LLM should not be treated as the source of truth for horticultural or ecological claims.

---

## Planning Before Implementation

For substantial changes, first inspect:

- the requested feature
- relevant product requirements
- current architecture
- relevant code
- existing tests

When asked to plan before coding:

1. do not modify files
2. explain the proposed approach
3. identify the files likely to change
4. identify any new dependencies
5. identify important assumptions or tradeoffs
6. wait for explicit approval before implementation

Do not interpret planning permission as implementation permission.

---

## Implementation

When implementing:

- make focused changes
- preserve existing working behavior
- avoid unrelated refactors
- reuse existing patterns when they are sound
- improve an existing abstraction rather than creating a competing one
- keep TypeScript types meaningful
- avoid `any` unless genuinely justified
- remove temporary debugging code
- do not leave dead code or unused imports

If the existing architecture conflicts with `ARCHITECTURE.md`, flag the issue before performing a large structural rewrite.

---

## Testing

Domain behavior should be tested independently of the UI when practical.

For deterministic garden rules, tests should cover:

- expected positive cases
- expected negative cases
- important boundary conditions
- ordering symmetry where relevant
- interaction distance where relevant
- regression of previously implemented behavior

When fixing a bug in domain logic, prefer adding a regression test demonstrating the bug.

Do not create low-value tests simply to increase test count.

---

## Dependencies

Before adding a dependency, determine whether it is necessary.

Do not introduce libraries merely because they are popular or convenient.

If a meaningful new dependency is proposed during planning, state:

- what it does
- why the existing stack is insufficient
- why the dependency is appropriate

Do not install a major dependency during a planning-only task.

---

## Completion Checklist

Before declaring an implementation complete:

1. review the diff for unintended changes
2. run the relevant tests
3. run the project's type/build checks
4. run linting if configured
5. verify no obvious debug artifacts remain
6. summarize what changed
7. report any failures or unresolved issues honestly

Do not claim something was tested if it was not actually tested.

---

## Git Safety

Do not:

- rewrite Git history
- force push
- delete branches
- discard unrelated user changes
- reset the repository destructively

unless explicitly instructed.

Do not commit changes unless the user asks you to commit them.

The user controls project checkpoints.

---

## Secrets and Security

Never place API keys, credentials, tokens, or secrets directly in source files.

Do not expose environment variables through client-side code unless they are intentionally public.

Do not weaken security settings merely to make something work.

---

## Product Experience

Remember that this is intended to become a **playful, visual garden-design experience**, not an enterprise dashboard.

When making UI decisions:

- prioritize the garden itself
- keep interactions intuitive
- provide immediate visual feedback
- avoid unnecessary forms and dialogs
- avoid overwhelming the user with metrics
- favor experimentation and discovery

Functional correctness comes first, but implementation decisions should not unnecessarily constrain the eventual game-like experience.

---

## Future Features

The roadmap may eventually include:

- native plants
- climate and location
- soil
- water
- biodiversity
- pollinator habitat
- plant guilds
- canopy/shade
- regenerative scoring
- systems-level planning
- AI-assisted recommendations

These are context for the product direction, **not instructions to implement them now**.

Do not build speculative infrastructure for them.

---

## Guiding Principle

The objective is not to produce the maximum amount of code.

The objective is to make the smallest high-quality change that moves the current product forward while keeping the codebase understandable and easy to evolve.