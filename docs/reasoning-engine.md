# Deterministic Reasoning Architecture

The application has enough implemented analysis to describe a small reasoning pipeline, but it is not a generalized inference engine. It is a collection of focused, pure domain functions that derive explainable results from current garden state and curated data.

## Layer 1 — Domain Facts

This layer answers: **What is true about the garden?**

Facts come from two places:

1. Current garden state:
   - dimensions
   - plant IDs at coordinates
   - user-declared sunlight categories by cell
2. Curated knowledge:
   - plant category and lifecycle
   - same-species spacing tier
   - ecological roles
   - companion and incompatible pairs

Source metadata records evidence for curated claims where it has been attributed. It does not change the normalized facts passed to evaluators.

## Layer 2 — Deterministic Reasoning

This layer answers: **What do those facts imply under the implemented rules?**

Current evaluators include:

- adjacent companion/incompatible classification
- same-species spacing violations
- garden-wide ecological-role composition
- absence of garden-wide pollinator support
- local companion candidates for an inspected placement

Each evaluator is deliberately narrow. For example, relationship evaluation uses orthogonal adjacency, while spacing uses Chebyshev distance. Composition reports representation, not quantity or quality. Opportunity logic is limited to explicitly approved policies rather than treating every absent fact as a deficiency.

The functions return structured results with the coordinates, plant identities, relationship type, role, or required distance needed to explain a conclusion. Results are recomputed from current state instead of cached in the garden.

Sunlight mapping currently contributes a domain fact only. Plant sunlight requirements and sunlight-fit reasoning are planned but not implemented.

## Layer 3 — Explanation

This layer answers: **How are those conclusions communicated?**

React components currently provide deterministic, template-based explanations:

- `PlacementFeedback` explains the latest placement or movement
- `GardenInspector` explains the current inspected placement
- `GardenComposition` lists represented ecological roles and contributing plant types
- `GardenOpportunities` presents scoped strategies to consider

Immediate feedback and persistent inspection reuse the same domain evaluators but answer different questions:

- Immediate feedback: what just changed?
- Inspection: what is true here now?

There is no natural-language model in this layer today.

## Future LLM Boundary

An LLM could eventually help phrase explanations, compare deterministic alternatives, or guide a user through tradeoffs. It should not become the source of truth for plant compatibility, spacing, ecological roles, or environmental fit.

The intended boundary is:

```text
curated facts + deterministic rules → supported conclusions
supported conclusions + context    → optional natural-language assistance
```

Any future model output should be grounded in the structured conclusions produced by the deterministic layer. Planned features should not be described as part of the reasoning engine until their facts, rules, and tests exist in the repository.
