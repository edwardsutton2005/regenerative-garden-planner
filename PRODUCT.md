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

# V1 — Companion Planting Sandbox

## Goal

The first version should answer one simple question:

> Is it fun and useful to lay out a garden and have the application understand relationships between the plants?

V1 should prove the core interaction before adding more sophisticated ecological systems.

---

## Core User Loop

1. View an empty garden plot.
2. Browse available plants.
3. Select a plant.
4. Place it spatially in the garden.
5. Immediately see relevant feedback.
6. Rearrange the garden in response.
7. Gradually create a better garden.

Feedback should feel responsive and encouraging rather than interrupting the user with constant dialogs or forms.

---

## V1 Features

### Garden Canvas

- Interactive top-down garden grid
- User-configurable grid size chosen when a garden is created
- Grid dimensions stay fixed for the lifetime of that garden
- Place plants
- Replace plants
- Remove plants
- Move and rearrange plants
- Clear the current garden
- Start a new garden
- Clear visual distinction between plants
- Rendering that can later support illustrated visual assets
- Garden state maintained while using the application

The V1 grid is a bounded rectangular abstraction rather than a physically precise landscape editor.

Grid cells are abstract row/column units and do not represent an exact real-world measurement.

### Plant Library

V1 contains approximately 15–20 familiar garden plants across useful categories such as:

- vegetables
- herbs
- flowers

Each plant is represented by structured data rather than behavior hardcoded into UI components.

### Plant Information

V1 plant data supports properties needed by current features, including:

- unique identifier
- display name
- category
- same-species spacing requirement

Companion and incompatible relationships are stored separately in a normalized relationship dataset rather than duplicated directly on each plant.

Additional properties should only be added when the application actually uses them.

### Companion Planting

The application understands positive and negative plant relationships.

Examples:

- compatible plants placed within the defined interaction distance can produce positive feedback
- known poor pairings can produce warnings
- relationships work regardless of which plant was placed first

For V1, companion/incompatible interaction distance means immediate orthogonal adjacency:

- up
- down
- left
- right

Diagonal neighbors are not considered adjacent for companion/incompatible evaluation.

### Spacing

Plants have basic same-species spacing requirements.

Spacing values are expressed as abstract grid-cell tiers rather than physical units.

V1 spacing rules:

- apply only between plants with the same plant ID
- use Chebyshev distance
- treat diagonal proximity as physically relevant
- do not infer unsupported cross-species spacing requirements

The application identifies same-species plants that are too close together and communicates the problem clearly.

V1 does not attempt physically perfect horticultural simulation.

### Feedback

The interface explains why a placement is beneficial or problematic.

Examples:

> Great pairing: Tomato + Basil

> Tomato and Potato may not grow well together.

> Two Tomato plants are too close together.

Feedback should help teach the user rather than simply displaying a score.

### Garden Score

A Garden Score is optional.

If introduced, it should summarize underlying rules rather than becoming the product itself.

Users should be able to understand why any score changes.

---

## V1 Intelligence Model

V1 does **not use an LLM to determine gardening facts or plant compatibility**.

The intelligence comes from:

**structured plant data + deterministic rules**

For example:

**plant data → spatial relationship → rule evaluation → feedback**

This makes recommendations:

- consistent
- explainable
- testable
- debuggable

The application should know *why* it is making a recommendation.

---

# Part 2 — Plant Roles & Structure

## Goal

Part 2 should answer:

> Can richer plant identity and ecological roles make garden design more strategic and understandable?

V1 taught the application primarily about relationships between placements.

Part 2 begins teaching it:

- what kind of organism each plant is
- how plants differ structurally
- what ecological roles plants contribute
- what roles are represented across the garden as a whole

Part 2 should expand the intelligence of the garden without turning the product into a plant database, questionnaire, or generalized recommendation engine.

---

## Part 2 Product Principle: Immediate Feedback vs. Persistent Status

Immediate feedback and persistent inspection serve different purposes.

### Immediate Feedback

Immediate feedback explains:

> What just changed?

Examples:

> Great pairing: Tomato + Basil

> These Tomato plants are too close together.

This feedback should remain lightweight and responsive.

### Persistent Inspection

Persistent inspection explains:

> What is true about this placement or garden right now?

Persistent status should reflect the current garden rather than preserve historical feedback from earlier actions.

If the user rearranges the garden, the inspected status should update accordingly.

This creates a consistent and transparent way to understand the garden without removing the satisfying immediate feedback of V1.

---

# Part 2A — Persistent Inspection

## Goal

Allow the user to revisit a placed plant and understand its current state at any time.

The first version of inspection should use intelligence already available from V1, including:

- current companion relationships
- current incompatible relationships
- current spacing status

The inspected subject should represent a particular placement in the garden, not merely the plant species in the abstract.

Inspection should be contextual and support the garden rather than dominate it.

It should not become a large encyclopedia-style interface.

Part 2A should establish a consistent place for future plant and garden intelligence to appear.

---

# Part 2B — Plant Identity & Ecological Roles

## Goal

Teach the planner a small amount of meaningful intrinsic information about each plant: its lifecycle, and the ecological roles it can contribute beyond pairwise companion relationships.

Physical structure (mature height, mature spread, growth habit) is intentionally deferred — see "Future Part 2 Direction — Plant Physical Structure" below.

### Lifecycle

Every plant has exactly one of:

- **annual** — completes its normal life cycle within one growing season/year.
- **biennial** — normally completes its life cycle across two growing seasons; some garden vegetables are normally harvested during the first year.
- **perennial** — can persist for multiple years under its ordinary intended growing context.
- **tender-perennial** — biologically capable of persisting for multiple years but frost-sensitive and commonly grown as an annual where winters are too cold.

Tender perennials should not automatically be treated as durable "perennial structure" in later garden composition without climate context.

### Ecological Roles

For this slice, the taxonomy is fixed to exactly:

- **pollinator-support** — credible horticultural guidance recognizes the plant as a meaningful floral/resource component for pollinators. This does not mean every plant whose flowers may be visited by bees receives the role — it represents curated strategic usefulness, not simple pollinator visitation.
- **nitrogen-fixation** — the plant can participate in symbiotic biological nitrogen fixation with appropriate rhizobia. This must not be described as the plant actively giving nitrogen to its neighbors right now.

Both roles represent a plant's supported capability, not a claim that the function is actively occurring at this exact moment. For example, Basil provides pollinator resources when allowed to flower; the app does not currently model flowering stage.

No other ecological roles are introduced in this slice. A larger taxonomy (beneficial-insect support, ground cover, habitat, biomass/soil-building, food production, etc.) remains a future possibility, to be added only when a slice actively needs it.

The product should distinguish between:

- **intrinsic plant roles**
- **pairwise plant relationships**

For example:

> Bush Bean contributes nitrogen-fixing function.

is conceptually different from:

> Basil is a companion of Tomato.

Do not create new relationship types when the concept is more accurately represented as an intrinsic ecological role.

### User-Visible Behavior

The existing persistent Garden Inspector (Part 2A) should expose this identity without becoming an encyclopedia:

- show lifecycle for every inspected plant
- show ecological roles when the plant has one or more, using clean display labels (e.g. "Tender perennial", "Pollinator support")
- for a plant with no currently modeled ecological roles, omit the roles list/section rather than implying the plant has no ecological value

---

# Part 2C — Garden Composition

## Goal

Begin understanding the garden as a collection rather than only a set of independent placements and pairs.

The application should be able to describe which ecological roles or relevant structural characteristics are represented in the current garden.

For example:

> Nitrogen fixation — Pea, Bush Bean

> Pollinator support — Marigold, Sunflower

Initial composition feedback should be primarily descriptive rather than judgmental.

The absence of a particular role should not automatically mean that a garden is bad or incomplete.

Part 2C should first answer:

> What is represented in this garden?

before attempting to answer:

> What should this garden add?

---

# Part 2D — Opportunities

## Goal

Once garden composition can be described reliably, the planner may begin surfacing strategies the user could explore.

Examples:

> Opportunity: Add pollinator support.

> Consider introducing a nitrogen-fixing plant.

Opportunities should be framed as possibilities rather than failures unless there is a genuine rule violation.

Where several plants could serve the same purpose, the product should generally recommend the function or strategy before implying that one specific plant is required.

Part 2 should therefore use a mix of:

- positive reinforcement for beneficial choices
- warnings for genuine problems
- optional opportunities for further improvement

The application should not assume that every garden requires every ecological role.

---

## Future Part 2 Direction — Plant Physical Structure

Part 2B deliberately defers mature height, mature spread, and growth habit.

Likely useful plant traits if this becomes active include lifecycle (already implemented), mature height, mature spread, and growth habit. The exact field structure, units, and growth-habit taxonomy should be finalized before implementation.

Real mature dimensions may be stored using real-world units when supported by reliable horticultural sources. However:

> Real plant dimensions must not be silently converted into garden-cell dimensions while the grid remains physically abstract.

For example, knowing that a plant may mature to 60 inches tall is valid plant information. Concluding that 60 inches equals a particular number of garden cells is not valid until the application has an explicit physical scale.

Physical structure may eventually support plant identity, inspection, qualitative structural understanding, and later visual differentiation — it does not require exact geometric plant simulation.

This is **not currently a required Part 2 feature**.

---

## Optional Future Part 2 Direction — Garden Areas / Beds

Whole-garden composition may eventually prove too coarse.

If testing demonstrates a real need, the application may later allow the user to inspect or reason about smaller garden areas or beds.

This is **not currently a required Part 2 feature**.

Do not build garden sections simply because they may be useful later.

---

## Explicitly Not Part 2

Do not implement these during Part 2 unless the product scope is deliberately updated:

- sunlight compatibility
- spatial sunlight modeling
- water compatibility
- water-flow simulation
- irrigation planning
- soil-condition evaluation
- soil simulation
- planting-season evaluation
- ZIP/location input
- hardiness zones
- climate compatibility
- real-time weather
- native plant recommendations
- regional native alternatives
- invasive-species regional logic
- geographic/ecoregion matching
- physical cell-to-feet conversion
- exact mature-footprint collision simulation
- canopy/shade simulation
- complex garden-boundary or GIS editing
- plant guild generation
- AI-generated garden recommendations
- opaque garden scoring
- user accounts
- authentication
- backend/database infrastructure
- multiplayer/social functionality
- mobile-native application
- 3D graphics

These remain future opportunities.

---

## Part 2 Development Sequence

The current intended sequence is:

**2A — Persistent Inspection**  
What is true about this placement now?

**2B — Plant Identity & Ecological Roles**  
What kind of organism is this, and what does it contribute?

**2C — Garden Composition**  
What functions are represented across this garden?

**2D — Opportunities**  
What additional strategies could the user explore?

This sequence should guide development without forcing later Part 2 systems to be fully specified before earlier systems are validated.

---

# Part 3 — Garden Conditions & Local Ecology

## Goal

Part 3 begins answering:

> What plants and strategies actually make sense in this garden and this place?

Potential capabilities include:

- sunlight requirements and spatial sunlight conditions
- water requirements and garden water conditions
- soil preferences and compatibility
- ZIP/location input
- hardiness zone
- climate compatibility
- frost dates
- planting-season guidance
- native plant identification
- regional native alternatives
- invasive-species warnings
- local pollinator support

Environmental conditions should remain spatial where doing so materially improves the garden-planning experience.

The goal should not merely be to label plants "native" or "non-native," but eventually to help users choose plants appropriate for the ecosystem they are designing within.

---

# Part 4 — Regenerative Systems

The planner can expand beyond individual plants and local conditions toward interactions between ecological systems.

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
- nitrogen cycling
- ecological-function diversity
- food productivity

At this stage the product begins moving from a companion-planting and composition tool toward a genuine regenerative garden planner.

---

# Part 5 — Systems-Level Planning

The long-term product should be capable of reasoning about the garden as a whole.

Instead of only saying:

> Basil is a good companion for tomatoes.

the system could eventually recognize:

> This sunny, dry section of the garden could support a drought-tolerant pollinator guild that improves habitat while reducing irrigation demand.

This is the direction in which AI may become useful.

---

## Product Feel

The garden should feel like a **beautiful illustrated space that users want to spend time designing**, not a traditional software interface with a garden grid placed inside it.

The visual direction should combine the warmth, charm, and spatial readability of a garden-building game with the simplicity and clarity of a modern application.

Games such as Stardew Valley are useful inspiration for the feeling of interacting with a garden:

- plants should be recognizable
- the garden should feel alive
- placing or rearranging something should feel satisfying

The product should not attempt to imitate Stardew Valley's specific pixel-art style or interface.

Over time, plants and garden elements should be represented through cohesive illustrations rather than relying on generic icons, emoji, or text labels as the primary visual representation.

The experience should feel:

- playful
- beautiful
- illustrated
- warm
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
- a generic SaaS application
- a long gardening questionnaire
- a generic AI chatbot

The garden should remain the visual focus.

Traditional interface elements such as panels, inspectors, controls, and metrics should support the garden rather than compete with it.

---

## Role of AI

AI is **not required to make the product intelligent**.

When AI is eventually introduced, its best role is likely to be:

- reasoning across multiple garden systems
- synthesizing structured garden information
- explaining recommendations
- helping users understand tradeoffs
- proposing alternative designs
- translating ecological rules into understandable guidance

AI should reason **over structured garden state and trusted underlying data** rather than inventing horticultural facts.

A useful long-term principle is:

> **Data and rules provide the facts. AI helps reason about and explain the system.**

---

## Product Development Principles

### Build the Smallest Useful System

Do not implement complexity merely because gardening itself is complex.

Add complexity only when it enables a user-visible gardening decision.

For every new feature or plant property, ask:

1. What new fact does the system know?
2. What new decision can the user make because of it?
3. How does the garden interface communicate that knowledge?

If those questions cannot be answered clearly, the feature should probably wait.

### Store Facts, Derive Meaning

Garden state and plant data should store what is actually true.

Current interpretations such as:

- relationship status
- spacing status
- ecological composition
- opportunities

should be derived from current state and structured data rather than stored as stale conclusions.

### Do Not Imply Unsupported Precision

If the model is abstract, feedback must remain appropriately abstract.

Do not silently translate real-world horticultural values into precise spatial claims the current model cannot support.

### Expand Intelligence Gradually

Prefer:

**local → garden-wide → proactive**

First understand an individual placement.

Then understand garden composition.

Then consider recommendations or opportunities.

Do not sacrifice the core spatial interaction in order to build future infrastructure prematurely.