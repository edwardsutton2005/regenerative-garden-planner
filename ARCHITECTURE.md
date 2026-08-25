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