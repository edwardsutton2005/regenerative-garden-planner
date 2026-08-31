# Regenerative Garden Planner

An interactive garden-design application that evaluates a spatial layout using curated plant facts and deterministic rules. It helps users explore companion relationships, spacing, ecological roles, and environmental conditions without treating an LLM as the source of gardening knowledge.

**Live demo:** _Coming soon_

**Screenshot/demo GIF:** _Add a current product screenshot or short interaction recording here._

## Overview

The central product idea is: **the garden itself is the interface**.

Instead of completing a questionnaire and receiving a static recommendation, a user creates a grid, places and rearranges plants, and sees what those choices imply. Immediate feedback explains a recent action, while persistent inspection describes the current state of a placement. Garden-level summaries show which modeled ecological roles are represented and surface a deliberately small set of explainable opportunities.

The project is designed as a compact test bed for spatial interaction and transparent ecological reasoning. It favors explicit data and rules over opaque scoring or generated horticultural claims.

## Current Features

- Configurable rectangular gardens from 4×4 through 30×30 cells
- Click placement, replacement, erasing, clearing, and new-garden creation
- Native drag-and-drop from the plant picker and between garden cells, including swaps
- A 16-plant catalogue with lifecycle, same-species spacing tiers, and curated ecological roles
- Symmetric companion and incompatible relationship evaluation for orthogonally adjacent plants
- Same-species spacing evaluation using Chebyshev distance
- Immediate feedback after placement, movement, and swapping
- Persistent placement inspection that updates with the current garden state
- Garden composition summaries for represented pollinator-support and nitrogen-fixation roles
- Scoped opportunities for missing garden-wide pollinator support and local companion options
- Claim-level provenance metadata with validation against a source registry
- User-declared per-cell sunlight mapping for full sun, partial sun, and shade
- Local scrolling for large gardens without changing the abstract grid model

Sunlight mapping records the user's description of the site. Plant sunlight requirements and sunlight-fit evaluation are not implemented yet.

## How It Works

```text
React interactions
      ↓
explicit garden state + curated plant data
      ↓
pure deterministic domain functions
      ↓
structured findings and aggregates
      ↓
transient feedback, inspection, composition, and opportunities
```

`App.tsx` coordinates interaction state and garden mutations. The garden state contains dimensions, plant placements, and modeled environmental state. Framework-independent modules in `src/domain/` evaluate relationships, spacing, composition, and opportunities. Components render those structured results as user-facing explanations.

No backend, account system, persistence layer, or AI API is currently involved.

## Architecture

Gardening facts and evaluation rules are kept outside React components. Domain functions are deterministic, independently testable, and return enough structured information for the interface to explain their conclusions.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system boundaries and design decisions, and [docs/reasoning-engine.md](./docs/reasoning-engine.md) for the current facts → reasoning → explanation flow.

## Data and Research

Plant knowledge is curated from horticultural and agricultural references rather than generated dynamically. The repository distinguishes normalized application facts from evidence metadata so reasoning remains stable while provenance can become more complete over time.

Current provenance is incomplete at the individual-claim level and is documented transparently in [docs/data-sources.md](./docs/data-sources.md).

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- CSS
- Vitest 4
- Oxlint
- npm

## Running Locally

Requirements: Node.js `20.19+` or `22.12+` and npm.

```bash
npm install
npm run dev
```

Create a production build and preview it locally with:

```bash
npm run build
npm run preview
```

## Testing

Run the deterministic domain and data tests:

```bash
npm test
```

Run all repository checks:

```bash
npm test
npm run lint
npm run build
```

The test suite covers garden-state invariants, coordinate boundaries, relationship symmetry and conflicts, spacing boundaries, composition, opportunity policies, and data/provenance integrity. Native drag-and-drop and visual layout are currently verified manually.

## Roadmap

Near-term work described in [PRODUCT.md](./PRODUCT.md) includes sourced plant sunlight requirements and deterministic sunlight-fit feedback. Longer-term directions include additional environmental context and richer ecological systems, but those remain planned rather than implemented.
