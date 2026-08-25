# Agent Instructions

Read PRODUCT.md before implementing product changes.

Read ARCHITECTURE.md before making structural changes.

## Development principles

- Prefer simple implementations.
- Do not prematurely abstract.
- Do not add dependencies unless clearly necessary.
- Keep UI logic separate from garden-domain logic.
- Keep plant data structured and centralized.
- Keep rule logic independently testable.
- Avoid large refactors unless explicitly requested.
- Work on only the requested feature.

## Workflow

Before making a substantial change:

1. Inspect the relevant existing code.
2. Explain the intended implementation.
3. Identify files that will change.
4. Wait for approval if explicitly asked to plan only.

Before saying implementation is complete:

- run the TypeScript/build checks
- run existing tests
- report any failures
- summarize files changed

Do not begin unrelated future features.
