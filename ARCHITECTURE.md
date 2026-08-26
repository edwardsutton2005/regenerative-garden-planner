# Architecture

## Current Objective

Build the simplest technically sound architecture capable of supporting the V1 companion-planting sandbox described in `PRODUCT.md`.

The architecture should support future expansion without attempting to implement future systems today.

---

## Current Stack

- React
- TypeScript
- Vite
- CSS
- client-side application state
- Vitest or another lightweight Vite-compatible test setup when rule tests are introduced

Do not add a backend until persistence, accounts, shared data, or another concrete requirement makes one necessary.

Do not add an AI API during V1.

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
- premature optimization

The application is currently a small interactive prototype.

Treat it accordingly.

### 2. Separate Domain Logic from Presentation

React components should primarily be responsible for rendering the garden and handling user interaction.

Gardening knowledge should not be embedded throughout UI components.

For example, avoid logic such as:

```ts
if (plant.name === "Tomato" && neighbor.name === "Basil") {
  // ...
}
```

Instead, plant data and relationship rules should live in dedicated, framework-independent modules that UI components call into and render the results of.

### 3. Keep Visual Representation Replaceable

The garden-state model should represent what exists in the garden, not how it is visually rendered.

For example, a placed tomato should be stored as a tomato placement rather than as an emoji, image path, sprite, or UI-specific component.

The rendering layer may use simple placeholders during early V1 development, but those representations should be replaceable later with illustrated plant and garden assets without changing the underlying garden-state or rule logic.

Avoid coupling plant data or garden rules to a specific visual implementation.

### 4. Garden Dimensions and State

Grid size is chosen by the user when a garden is created so the plot can roughly match the shape of their own garden.

V1 supports bounded rectangular gardens.

Initial bounds:

- minimum: 4 × 4

- maximum: 30 × 30

- default: 10 × 10

Dimensions remain fixed for the lifetime of a garden. Changing dimensions means starting a new garden rather than resizing an occupied garden in place.

The garden lifecycle should distinguish between:

- **Clear Garden** — removes all placed plants while preserving the current dimensions

- **New Garden** — discards the current garden and returns the user to garden-size selection

If a garden contains plants, starting a new garden should require confirmation.

Garden state should explicitly contain both its dimensions and its plant placements.

Conceptually:

```ts

type GardenState = {

  rows: number

  columns: number

  placements: Record<CellKey, PlacedPlant>

}