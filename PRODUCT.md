# Regenerative Garden Planner

## Product Vision

Build an interactive garden-planning tool that makes designing a regenerative garden feel like a strategy game.

The user should be able to experiment spatially with a garden and receive immediate feedback about how their decisions affect the system.

The long-term goal is not simply to recommend individual plants. It is to help users understand and design gardens as interconnected ecological systems involving plant relationships, biodiversity, native habitat, water, soil, climate, and other regenerative principles.

The product should make these ideas approachable, visual, interactive, and fun rather than presenting them as a technical gardening database.

---

## Core Product Principle

**The garden itself is the interface.**

Users should learn primarily by placing things, rearranging them, experimenting, and seeing the consequences of their decisions.

The experience should favor:

**place → observe → understand → improve**

over:

**fill out form → receive recommendation**

The user should feel like they are designing and improving a living system rather than configuring software.

---

## V1: Companion Planting Sandbox

### Goal

The first version should answer one simple question:

> Is it fun and useful to lay out a garden and have the application understand relationships between the plants?

V1 should prove the core interaction before adding more sophisticated ecological systems.

---

### Core User Loop

1. View an empty garden plot.
2. Browse available plants.
3. Select a plant.
4. Place it spatially in the garden.
5. Immediately see relevant feedback.
6. Rearrange the garden in response.
7. Gradually create a better garden.

Feedback should feel responsive and encouraging rather than interrupting the user with constant dialogs or forms.

---

### V1 Features

#### Garden Canvas

- Interactive top-down garden grid
- User-configurable grid size (rows and columns), chosen when a garden is created, so the plot can roughly match the shape of the user's own garden
- Grid dimensions stay fixed for that garden once set; changing the size starts a new garden rather than resizing an occupied one
- Place plants onto the garden
- Remove plants
- Move or rearrange plants
- Clear visual distinction between plants
- Garden state maintained while using the application

The first implementation may use a simple rectangular grid rather than a physically precise landscape editor. Grid size is an abstract row/column count, not a real-world unit of measurement.

#### Plant Library

Start with approximately 15–20 familiar garden plants across useful categories such as:

- vegetables
- herbs
- flowers

Each plant should be represented by structured data rather than behavior hardcoded into UI components.

#### Plant Information

V1 plant data should support properties needed for current features, including:

- unique identifier
- display name
- category
- spacing requirement
- companion relationships
- incompatible relationships

Additional properties should only be added when the application actually uses them.

#### Companion Planting

The application should understand positive and negative plant relationships.

Examples:

- compatible plants placed within an appropriate interaction distance can produce positive feedback
- known poor pairings can produce warnings
- the relationship should work regardless of which plant was placed first

The exact interaction-distance model should be explicitly defined and testable rather than inferred inconsistently by UI components.

#### Spacing

Plants should have basic spacing requirements.

The application should identify plants that have been placed too close together and communicate the problem clearly.

V1 does not need physically perfect horticultural simulation.

#### Feedback

The interface should explain why a placement is beneficial or problematic.

Examples:

> Great pairing: Tomato + Basil

> These plants may compete when grown this close together.

> This tomato needs more space.

Feedback should help teach the user rather than simply displaying a score.

#### Garden Score

V1 may include a simple compatibility/health score that responds to the current layout.

The score should summarize underlying rules rather than becoming the product itself.

Users should be able to understand why their score changed.

---

## V1 Intelligence Model

V1 should **not use an LLM to determine gardening facts or plant compatibility**.

The initial intelligence should come from:

**structured plant data + deterministic rules**

For example:

plant data → spatial relationship → rule evaluation → feedback

This makes recommendations:

- consistent
- explainable
- testable
- debuggable

The application should know *why* it is making a recommendation.

---

## Product Feel

Even though V1 is simple, it should begin establishing the eventual character of the product.

The experience should feel:

- playful
- visual
- calm
- ecological
- intuitive
- exploratory
- satisfying to interact with

Avoid making the application feel like:

- a spreadsheet
- a database browser
- an enterprise dashboard
- a long gardening questionnaire
- a generic AI chatbot

Visual polish should follow a working core interaction, but the interaction itself should be designed with the eventual game-like experience in mind.

---

## Explicitly Not V1

Do not implement these during the initial prototype unless the product scope is deliberately updated:

- AI-generated garden recommendations
- user accounts
- authentication
- backend/database infrastructure
- real-time weather
- detailed climate modeling
- native plant recommendations
- geographic/ecoregion matching
- soil simulation
- water-flow simulation
- irrigation planning
- plant guild generation
- canopy/shade simulation
- 3D graphics
- multiplayer/social functionality
- mobile-native application
- complex GIS functionality

These are future opportunities, not current requirements.

---

## Long-Term Direction

If the core sandbox proves compelling, the product can progressively understand more of the garden as an ecological system.

### Phase 2 — Better Plant Intelligence

Potential additions:

- sunlight requirements
- water requirements
- planting seasons
- soil preferences
- mature plant size
- pollinator value
- ecological functions
- perennial vs. annual
- nitrogen fixation
- additional relationship types

### Phase 3 — Local Ecology

Location can begin affecting recommendations.

Potential capabilities:

- ZIP/location input
- hardiness zone
- climate compatibility
- native plant identification
- regional native alternatives
- invasive-species warnings
- local pollinator support
- planting-season guidance

The goal should not merely be to label plants "native" or "non-native," but eventually to help users choose plants appropriate for the ecosystem they are designing within.

### Phase 4 — Regenerative Systems

The planner can expand beyond individual plant relationships toward interactions between systems.

Potential systems include:

- biodiversity
- soil health
- water use
- hydrozones
- rain capture
- pollinator habitat
- canopy and shade
- plant guilds
- perennial systems
- nitrogen fixation
- ecological function
- food productivity

At this stage the product begins moving from a companion-planting tool toward a genuine regenerative garden planner.

### Phase 5 — Systems-Level Planning

The long-term product should be capable of reasoning about the garden as a whole.

Instead of only saying:

> Basil is a good companion for tomatoes.

the system could eventually recognize:

> This sunny, dry section of the garden could support a drought-tolerant pollinator guild that improves habitat while reducing irrigation demand.

This is the direction in which AI may become useful.

---

## Role of AI

AI is **not required to make the initial product intelligent**.

When AI is eventually introduced, its best role is likely to be:

- reasoning across multiple garden systems
- synthesizing structured garden information
- explaining recommendations
- helping users understand tradeoffs
- proposing alternative designs
- translating ecological rules into understandable guidance

AI should reason **over structured garden state and trusted underlying data** rather than inventing the underlying horticultural facts.

A useful long-term principle is:

> **Data and rules provide the facts. AI helps reason about and explain the system.**

---

## Product Development Principle

Build the smallest version that tests whether the core interaction is compelling.

The initial success criterion is not:

> Can we build a comprehensive permaculture planning platform?

It is:

> Is placing plants, discovering relationships, and improving a garden layout useful and fun?

Do not sacrifice that core experience in order to build future infrastructure prematurely.