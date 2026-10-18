# Deterministic Reasoning Architecture

The application has enough implemented analysis to describe a small reasoning pipeline, but it is not a generalized inference engine. It is a collection of focused, pure domain functions that derive explainable results from current garden state and curated data.

## Layer 1 — Domain Facts

This layer answers: **What is true about the garden?**

Facts come from two places:

1. Current garden state:
   - physical dimensions in inches
   - placements: placement id, plant ID, and continuous physical position
   - planting beds: named rectangles in physical coordinates (layout only; no evaluator reads them yet)
   - user-declared sunlight categories by environmental cell
2. Curated knowledge:
   - plant category and lifecycle
   - same-species spacing in inches (sourced)
   - ecological roles
   - companion and incompatible pairs
   - accepted sunlight categories (a set, not an ordered scale)

Source metadata records evidence for curated claims where it has been attributed. It does not change the normalized facts passed to evaluators.

## Layer 2 — Deterministic Reasoning

This layer answers: **What do those facts imply under the implemented rules?**

Current evaluators include:

- companion/incompatible classification within the interaction distance
- same-species spacing violations
- garden-wide ecological-role composition
- absence of garden-wide pollinator support
- local companion candidates for an inspected placement
- sunlight fit for an inspected placement

Each evaluator is deliberately narrow and decides for itself whether distance matters. The garden supplies spatial facts (positions and Euclidean distance); each rule interprets them. Relationship evaluation uses a 12-inch gap between plant footprints, a product rule rather than a sourced horticultural distance. Spacing compares Euclidean distance against a plant's sourced minimum spacing in inches; crowding estimates the same for mixed pairs from each plant's footprint. Sunlight fit reads the environmental cell containing a placement's position. Composition reports representation, not quantity or quality. Opportunity logic is limited to explicitly approved policies; garden-wide role suggestions are shown only when the person asks for them, so an absent role is never presented as a deficiency. Sunlight fit is a categorical set-membership test, not an ordered scale — it reports `fit`, `mismatch`, or one of two distinct "not modeled" outcomes (unmodeled cell sunlight, unmodeled plant requirement), and the two "not modeled" outcomes are never presented as a mismatch.

The functions return structured results with the placement ids, plant identities, distances, relationship type, role, sunlight-fit status, or required distance needed to explain a conclusion. Results, including which plants are near each other, are recomputed from current state instead of cached in the garden.

## Layer 3 — Explanation

This layer answers: **How are those conclusions communicated?**

React components currently provide deterministic, template-based explanations:

- `PlacementFeedback` explains the latest placement or movement
- `GardenInspector` explains the current inspected placement
- `GardenComposition` lists represented ecological roles and contributing plant types, plus the garden's diversity
- `GardenSuggestions` offers opt-in role suggestions with example plants
- relationship findings show the rule's sourced reason, and `SourceLinks` cites it

`GardenInspector` also reports the inspected placement's sunlight fit (all four statuses); `PlacementFeedback` surfaces only a sunlight mismatch, mirroring how it already surfaces only notable relationship/spacing findings rather than every possible status.

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
