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

### 3. Garden Dimensions and State

Grid size (rows and columns) is chosen by the user when a garden is created, so the plot can roughly match the shape of their own garden. Dimensions stay fixed for that garden; changing the size means starting a new garden rather than resizing an occupied one in place.

Represent garden state as an explicit mapping from cell coordinates to placed plants (for example, a map keyed by `"row,col"`) rather than a fixed-size 2D array. This keeps state independent of whatever dimensions a given garden happens to have, and avoids reallocation logic when different gardens use different sizes.

Rule logic (spacing, companion relationships, etc.) should operate on the coordinates of placed plants, not on the grid's dimensions, so the same rules work unchanged regardless of the size the user chose.