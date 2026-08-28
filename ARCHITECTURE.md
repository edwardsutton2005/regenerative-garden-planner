# Architecture

## Current Objective

Build on the completed V1 companion-planting architecture with the simplest technically sound extensions required by the current Part 2 work described in `PRODUCT.md`.

Preserve existing V1 behavior and architecture unless a Part 2 requirement creates a concrete reason to change it.

Do not pre-build architecture for later Part 2 slices or future product phases.

---

## Current Stack

- React
- TypeScript
- Vite
- CSS
- client-side application state
- Vitest for lightweight domain and data tests

Do not add a backend until persistence, accounts, shared data, or another concrete requirement makes one necessary.

Do not add an AI API unless a later product requirement explicitly justifies one.

---

## Architectural Philosophy

### 1. Prefer Simplicity

Use the simplest implementation that satisfies the current product requirement.

Do not introduce abstractions solely because they might be useful later.

Avoid unnecessary:

- frameworks
- dependencies
- service layers
- factories
- providers
- global state libraries
- generalized rule engines
- premature optimization

The application is still a relatively small interactive product.

Treat it accordingly.

---

### 2. Separate Domain Logic from Presentation

React components should primarily be responsible for rendering the garden, handling user interaction, and presenting derived results.

Gardening knowledge should not be embedded throughout UI components.

Avoid logic such as:

```ts
if (plant.name === "Tomato" && neighbor.name === "Basil") {
  // ...
}
```

Plant data, relationship data, spacing rules, and future gardening rules should live in dedicated framework-independent modules.

UI components should call domain functions and render their results.

---

### 3. Keep Visual Representation Replaceable

The garden-state model should represent what exists in the garden, not how it is visually rendered.

A placed plant should be stored as a plant placement rather than as:

- an emoji
- an image path
- a sprite
- a CSS class
- a UI-specific component

Rendering may use temporary visual representations while the interface develops.

Later illustrated plant assets should be replaceable without changing garden-state or rule logic.

Avoid coupling plant data or garden rules to a particular visual implementation.

---

# Established V1 Architecture

## 4. Garden Dimensions and State

Grid size is chosen by the user when a garden is created.

V1 supports bounded rectangular gardens.

Bounds:

- minimum: 4 × 4
- maximum: 30 × 30
- default: 10 × 10

Dimensions remain fixed for the lifetime of a garden.

Changing dimensions means starting a new garden rather than resizing an occupied garden.

The garden lifecycle distinguishes between:

- **Clear Garden** — removes all placements while preserving dimensions
- **New Garden** — discards the current garden and returns to garden-size selection

If the garden contains plants, starting a new garden requires confirmation.

Garden state explicitly contains its dimensions and placements.

Conceptually:

```ts
type GardenState = {
  rows: number
  columns: number
  placements: Record<CellKey, PlacedPlant>
}
```

---

## 5. Placement, Movement, and Validation Policy

Placing a plant on an occupied cell replaces the existing plant.

This applies to:

- click placement
- dragging a new plant from the picker

Dragging an existing garden plant:

- to an empty cell → moves the plant
- to an occupied cell → swaps the two plants
- to the same cell → no-op
- outside the valid garden → no-op

Garden creation rejects dimensions that are:

- non-integer
- non-finite
- outside the documented bounds

Operations on an existing garden that receive invalid coordinates treat them as no-ops or return an empty result as appropriate.

This policy should remain explicit and testable.

---

## 6. Companion and Incompatible Relationships

Companion/incompatible relationships are stored in a normalized relationship dataset rather than duplicated directly on individual plant records.

Relationships are symmetric.

For V1, adjacency means the four orthogonal cells:

- up
- down
- left
- right

Diagonal cells are not adjacent for companion/incompatible evaluation.

If conflicting relationship rules somehow exist for the same pair, an incompatible rule wins regardless of authoring order.

This is a defensive runtime fallback.

Production data should be validated separately so conflicts are not intentionally authored.

---

## 7. Spacing

V1 spacing values are abstract same-species spacing tiers.

They do not represent an exact physical conversion between garden cells and real-world distance.

Spacing rules:

- apply only between placements with the same plant ID
- use Chebyshev distance
- include diagonal proximity
- treat a distance equal to the minimum spacing as valid
- do not infer cross-species spacing from same-species horticultural guidance

Spacing behavior should remain independent from companion/incompatible adjacency behavior.

---

# Current Part 2 Architectural Principles

## 8. Store Facts, Derive Current Status

Garden state should continue to store factual state such as:

- dimensions
- placements

Do not store conclusions such as:

- this placement currently has a companion
- this placement currently has a spacing problem
- this garden currently has a particular ecological role

These are derived facts.

Current status should be recomputed from the live garden state and trusted structured data.

Conceptually:

```text
stored state + structured data
            ↓
      deterministic evaluation
            ↓
         current status
```

This ensures that inspection reflects the garden as it exists now rather than feedback from an earlier action.

---
## 9. Reasoning Boundaries

The application should separate:

- structured knowledge
- deterministic reasoning
- later AI reasoning

These are conceptual boundaries, not a request to introduce framework classes, services, folders, or generalized engines for each layer.

Deterministic reasoning may only derive conclusions justified by explicitly modeled structured knowledge plus the current garden state.

Keep observation separate from judgment.

For example:

- "Nitrogen fixation is not represented" is an observation.
- "The garden should add a nitrogen-fixing plant" is a recommendation that requires additional product logic.

Do not introduce a generalized reasoning engine merely to represent these boundaries.

For Part 2C, garden composition should remain a small deterministic aggregation over current placements and plant ecological roles.

---
## 10. Inspection Is UI State

Part 2A introduces persistent inspection.

The currently inspected placement should be represented as interaction state rather than part of `GardenState`.

The simplest representation that satisfies the interaction should be preferred.

Conceptually, this may be as small as:

```ts
type InspectedCoordinate = {
  row: number
  col: number
} | null
```

This is illustrative rather than a required type definition.

Do not attach inspection state or cached inspection results to plant placements.

If the inspected placement moves, is removed, or is replaced, the interface should resolve inspection against the current garden state rather than preserving stale information.

---

## 11. Immediate Feedback and Inspection Are Separate Concerns

Immediate feedback answers:

> What just changed?

Persistent inspection answers:

> What is true here now?

These should remain conceptually separate.

Immediate feedback may remain transient.

Inspection should derive its contents from current garden state.

Where practical, both should reuse the same underlying domain logic instead of maintaining separate gardening rules.

---

## 12. Reuse Focused Domain Logic

Part 2 should extend the existing framework-independent domain functions rather than replacing them with a generalized intelligence system.

Prefer focused, testable functions for individual concerns.

Do not introduce a monolithic abstraction such as a `GardenIntelligenceEngine` unless future complexity creates a concrete need for one.

New domain logic should remain:

- deterministic
- framework-independent
- testable
- as small as the current feature allows

---

## 13. Keep Domain Results Explainable

Domain evaluators should return structured, testable information rather than only opaque scores or UI-specific strings when practical.

The architecture should preserve enough information for the interface to explain why a result exists.

Do not create a universal finding model or generalized rule-output schema before multiple implemented systems demonstrate that one is actually useful.

---

## 14. New Plant Data Must Serve an Active Feature

Part 2 is expected to add richer plant information over time.

Possible future Part 2 data includes:

- lifecycle
- mature height
- mature spread
- growth habit
- ecological roles

These fields should be designed when the corresponding product slice becomes active.

Do not expand the plant model in advance merely because the information may eventually be useful.

---

## 15. Physical Plant Data Does Not Define Grid Scale

Part 2 may eventually store real physical plant dimensions.

The garden grid remains abstract unless a later product requirement explicitly introduces physical scale.

Do not assume:

```text
N inches = M garden cells
```

Physical plant dimensions may be used for identity, inspection, visual differentiation, or other features that do not require an exact spatial conversion.

Do not introduce precise footprint, canopy, collision, or shade simulation during Part 2 unless the product scope is deliberately changed.

---

## 16. Later Part 2 Systems Should Be Architected When They Become Active

`PRODUCT.md` currently anticipates later Part 2 work involving:

- garden composition
- opportunities

Their product intent belongs in `PRODUCT.md`.

Their exact architecture should **not** be fixed yet.

When each slice becomes active:

1. define the product behavior precisely
2. identify the smallest required data and domain changes
3. update this architecture only where the implementation introduces a durable architectural decision
4. implement the slice
5. test it before generalizing further

This prevents Part 2A from carrying abstractions created for hypothetical Part 2C or Part 2D needs.

---

## 17. Ecological Roles Are Curated Plant Data, Not a Rule Engine

Ecological roles are intrinsic, curated facts stored directly on `Plant`, the same as other plant identity data.

A role represents a supported capability, not a claim that the function is occurring in the garden right now.

This does not justify building a generalized ecological-role rule engine.

---

# Testing Philosophy

Pure domain behavior and important data invariants should receive lightweight automated tests.

Examples include:

- relationship evaluation
- spacing evaluation
- garden-state behavior
- future domain rules once introduced

Do not add large UI-testing infrastructure unless interaction complexity creates a concrete need.

Manual browser verification remains acceptable for behaviors such as:

- native drag-and-drop
- visual layout
- scrolling
- contextual inspection behavior
- other primarily visual interaction details

---

## Current Non-Goals

Do not add unless a current product requirement explicitly changes:

- backend/database infrastructure
- authentication/accounts
- persistence
- AI API
- global state library
- generalized rule engine
- physical grid scale
- sunlight simulation
- water-flow simulation
- soil simulation
- canopy/shade simulation
- complex GIS or arbitrary garden polygons
- 3D graphics

---

## Architectural Decision Rule

For each proposed abstraction, ask:

> Does the current product require this abstraction now?

If the answer is no, do not add it.

For each proposed piece of plant data, ask:

> Does an active product feature use this information?

If the answer is no, do not add it yet.

The architecture should remain easy to understand while the garden intelligence becomes progressively richer.