# Architecture

## Purpose

The Regenerative Garden Planner is a client-side React application for experimenting with spatial garden layouts. Its architecture is intentionally small: explicit state, curated data, pure TypeScript domain functions, and React presentation components.

The main constraint is explainability. A conclusion shown to a user should be traceable to current garden state, structured plant knowledge, and a deterministic rule.

## Technology

- React and TypeScript
- Vite for development and production builds
- CSS for layout and presentation
- Vitest for domain and data tests
- Oxlint for static analysis
- Client-side state only

There is no backend, database, authentication system, global state library, persistence layer, or AI API.

## Repository Structure

```text
src/
├── components/   React interaction and presentation
├── data/         Curated plants, relationship rules, and source registry
├── domain/       Framework-independent state operations and evaluation rules
├── App.tsx       Application orchestration and interaction state
└── main.tsx      Browser entry point
```

The repository keeps gardening knowledge out of React components. Components may choose wording and visual treatment, but they do not define which plants are companions, what spacing rule applies, or which ecological role a plant has.

## State Model

`GardenState` represents facts about one garden:

```ts
type GardenState = {
  rows: number
  columns: number
  placements: Record<CellKey, PlacedPlant>
  environment: GardenEnvironment
}
```

The grid is a bounded rectangle from 4×4 through 30×30 cells. Coordinates are zero-based integers. Mutation functions validate dimensions and coordinates, return new state, and treat invalid operations on an existing garden as no-ops.

Placements are stored sparsely by coordinate rather than in a fixed two-dimensional array. One cell contains at most one plant. Moving onto an occupied cell swaps the two placements; placing from the catalogue replaces the destination.

Environmental state is separate from plant placement state. The current environment contains user-declared sunlight categories by cell. A missing key means sunlight has not been modeled for that cell. Clearing plants preserves environmental state; starting a new garden discards both.

## Interaction State

UI concerns are not stored in `GardenState`. `App.tsx` separately tracks:

- the active tool
- transient feedback focus coordinates
- the inspected coordinate
- setup-screen dimensions

Inspection is resolved against live garden state. Cached relationship, spacing, composition, or opportunity results are not stored in placements.

## Structured Knowledge

`src/data/` contains the normalized knowledge consumed by the application:

- plant identity, lifecycle, spacing tier, and ecological roles
- symmetric companion/incompatible relationship pairs
- a registry of attributable sources
- optional claim-level evidence references

Visual details such as colors, icons, or component names are not stored as domain facts. Evidence metadata is also kept separate from reasoning: it records provenance but does not alter a rule result.

See [docs/data-sources.md](./docs/data-sources.md) for the current sourcing policy and known provenance gaps.

## Deterministic Domain Logic

Each concern has a focused module instead of a generalized rule-engine abstraction:

- `garden.ts` — state construction, validation, placement operations, environment operations, and coordinate helpers
- `relationships.ts` — symmetric companion/incompatible lookup and adjacent evaluation
- `spacing.ts` — same-species spacing evaluation
- `composition.ts` — garden-wide aggregation of represented ecological roles
- `opportunities.ts` — explicitly scoped opportunity policies
- `plant.ts` and `source.ts` — domain types

The processing model is:

```text
garden state + structured knowledge
                ↓
       deterministic evaluation
                ↓
      structured current findings
                ↓
          React explanation
```

This boundary is discussed in more detail in [docs/reasoning-engine.md](./docs/reasoning-engine.md).

## Implemented Spatial Rules

### Relationships

Companion and incompatible relationships are symmetric. They apply only to immediate orthogonal neighbors: up, down, left, and right. Diagonals are not adjacent for this rule. If conflicting rules exist for a pair, incompatibility wins defensively; data tests are intended to prevent such conflicts from being authored.

### Spacing

Spacing applies only between placements with the same plant ID. It uses Chebyshev distance, so diagonal proximity matters. A distance equal to the plant's minimum tier is valid.

Spacing tiers are relative abstract grid values, not a conversion from inches or feet. Cross-species spacing is not inferred from same-species horticultural guidance.

### Composition

Composition reports whether a modeled ecological role is represented by at least one placed plant type. It does not assign magnitude, coverage, or quality, and duplicate placements do not increase a role's strength.

### Opportunities

Opportunities are explicit product policies rather than deductions from every missing property:

- a garden-wide suggestion when pollinator support is absent
- local companion candidates for an inspected placement that currently lacks an adjacent modeled companion

The spatial scope of a conclusion cannot be more precise than its underlying data. A garden-wide observation cannot justify a cell-specific recommendation.

### Sunlight Mapping

Sunlight is currently a user-declared cell category: full sun, partial sun, or shade. It is not measured irradiance, a simulation, or a plant-fit conclusion. Plant sunlight requirements and fit evaluation are planned separately.

## Explanation Boundary

Domain evaluators return structured objects containing plant identities, coordinates, rule types, roles, or required distances. React components turn those results into concise messages for immediate feedback, persistent inspection, composition summaries, and opportunities.

This keeps user-facing language replaceable without duplicating gardening rules in JSX. The application deliberately avoids an opaque score or a universal finding schema.

## Testing Strategy

Pure domain behavior and data invariants are tested with Vitest. Coverage focuses on:

- valid and invalid garden dimensions and coordinates
- immutable state transitions
- replacement, movement, swapping, clearing, and environment lifecycle
- relationship symmetry, adjacency, and conflict handling
- spacing boundaries and deduplication
- composition and opportunity policy behavior
- unique data identifiers and valid provenance references

Native drag-and-drop, responsive layout, local grid scrolling, and other primarily visual interactions are verified manually. A browser-testing dependency has not been added because the current domain behavior can be tested without one.

## Deliberate Limitations

The grid has no physical scale. Real-world measurements are not converted into cells. The application also does not currently provide persistence, accounts, climate/location reasoning, soil or water simulation, canopy/shade simulation, arbitrary garden boundaries, 3D rendering, or AI-generated recommendations.

If an LLM is introduced later, deterministic data and domain rules should remain the source of horticultural facts and conclusions. An LLM may assist with explanation, comparison, or interaction, but should not invent the underlying gardening rules.
