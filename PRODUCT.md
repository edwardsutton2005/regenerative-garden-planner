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
2. Find plants worth trying (with the workspace redesign: in the plant catalog, or the garden's inventory bar of recently used plants).
3. Select a plant.
4. Place it spatially in the garden.
5. Immediately see relevant feedback.
6. Rearrange the garden in response.
7. Gradually create a better garden.

Feedback should feel responsive and encouraging rather than interrupting the user with constant dialogs or forms.

---

## V1 Features

### Garden Canvas

- Interactive top-down garden canvas with a visual measurement grid
- User-configurable garden size chosen when a garden is created
- Garden dimensions stay fixed for the lifetime of that garden
- Place plants
- Remove plants
- Move and rearrange plants
- Clear the current garden
- Start a new garden
- Clear visual distinction between plants
- Rendering that can later support illustrated visual assets
- Garden state maintained while using the application

The garden is a bounded rectangle measured in real physical units (inches). Plants are placed at physical positions within it. It is not a GIS or landscape-surveying tool: boundaries are a simple rectangle, and positions are design intent rather than surveyed measurements.

V1 originally modeled the garden as abstract grid cells. That model is superseded by the physical coordinate model — see [Spatial Foundation — Physical Garden Coordinates](#spatial-foundation--physical-garden-coordinates). The grid remains as a visual measurement reference and as the resolution of cell-level environmental data such as sunlight. Plants are placed freely; they do not snap to it.

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
- same-species spacing guidance, in inches

Companion and incompatible relationships are stored separately in a normalized relationship dataset rather than duplicated directly on each plant.

Additional properties should only be added when the application actually uses them.

### Companion Planting

The application understands positive and negative plant relationships.

Examples:

- compatible plants placed within the defined interaction distance can produce positive feedback
- known poor pairings can produce warnings
- relationships work regardless of which plant was placed first

Two placements are within interaction distance when the Euclidean distance between their positions is **12 inches or less**.

The 12-inch distance is a **product rule that preserves V1 behavior**, not a horticulturally sourced interaction distance. V1 originally defined interaction as immediate orthogonal adjacency (up, down, left, right, not diagonal) on its grid. On the original grid (plants at the centers of 12-inch cells), orthogonal neighbors were 12 inches apart and diagonal neighbors about 17 inches apart, so the 12-inch rule reproduces that behavior exactly for plants laid out on the grid. Plants can now be placed freely, and the rule applies to their actual distances.

Per-pair or per-plant companion interaction distances are not modeled. They should be introduced only with sourced evidence and a deliberate product decision.

### Spacing

Plants have basic same-species spacing guidance expressed in real physical units (inches).

Spacing rules:

- apply only between plants with the same plant ID
- compare the Euclidean distance between the two placements against the plant's minimum spacing; a distance exactly equal to the minimum is acceptable
- do not infer unsupported cross-species spacing requirements

Spacing guidance must be sourced. The curated value is the source's plant-to-plant spacing, not the between-row spacing. It may be stored as a range (minimum and maximum) when a source gives one, even though the current rule only uses the minimum.

The application identifies same-species plants that are too close together and communicates the problem clearly.

V1 does not attempt physically perfect horticultural simulation.

### Feedback

The interface explains why a placement is beneficial or problematic.

Examples:

> Great pairing: Tomato + Basil

> Tomato and Potato may not grow well together.

> Two Tomato plants are too close together.

Feedback should help teach the user rather than simply displaying a score.

### No Garden Score

The product deliberately has no garden score, and no XP, health percentages, levels, or similar game mechanics. Feedback explains specific, rule-based facts instead of collapsing them into a number. (This replaces an earlier note that a score was optional.)

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

It should not become a large encyclopedia-style interface. (The workspace redesign gives inspection a persistent, collapsible side panel; the same restraint applies.)

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

Representation is binary, not a magnitude: a role is either represented by at least one plant type or it is not. Composition does not report counts, strength, percentage, coverage, or quality — one Basil and ten Basil both simply mean pollinator support is represented.

As with the ecological roles introduced in Part 2B, a represented role means a plant with that curated capability is currently placed — it does not claim the function is biologically active in the garden at this exact moment.

Initial composition feedback should be primarily descriptive rather than judgmental.

The absence of a particular role should not automatically mean that a garden is bad or incomplete.

Part 2C should first answer:

> What is represented in this garden?

before attempting to answer:

> What should this garden add?

---

# Part 2D — Opportunities

## Goal

Part 2C observes what is currently represented in the garden. Part 2D is the first slice that may recommend a change worth considering, while remaining deterministic, explainable, and grounded only in explicitly modeled knowledge plus current garden state.

Absence is not deficiency by default. A recommendation requires an explicit, deliberately scoped opportunity policy — not a generic rule that surfaces every absent role or condition.

### Opportunity Scope

The precision of a recommendation cannot exceed the precision of its underlying modeled knowledge. Each opportunity family is reasoned at the narrowest spatial scope its underlying rule actually supports:

- **Garden-wide** — supported when the underlying knowledge only tells us whether something is represented anywhere in the garden, not where.
- **Placement-local** — supported when the underlying knowledge is itself local (e.g. companion/incompatible interaction, which is defined only for placements within the interaction distance of one placement).

V1 does not model spatial coverage, zones, beds, or areas, so no opportunity may claim that a specific area of the garden needs something.

### V1 Opportunity Families

Exactly two families exist for now:

1. **Garden-wide pollinator-support opportunity** — if pollinator-support is not represented anywhere in the current garden, surface a garden-wide opportunity to consider adding a pollinator-support plant. This is a specific, deliberate policy, not a generalization: nitrogen-fixation absence is explicitly **not** currently sufficient for a recommendation, and there is no generic "recommend any absent role" rule.

2. **Local companion opportunity** — for the currently inspected placement, if none of the plants within its interaction distance have a modeled companion relationship with it, surface the catalogue's other companion options for that plant. Presence of at least one nearby modeled companion suppresses this opportunity — this is presence-based, not a quantity or quality judgment.

Both families are framed as possibilities ("consider...") rather than as a claim that the current garden is deficient, that a suggested plant is required or best, or that it guarantees improved growth.

Future opportunity families require their own deliberate product decision, not an extension of these two policies.

---

# Part 2E — Knowledge Provenance

## Goal

Establish structured, claim-level provenance for curated horticultural knowledge so future plant and environmental facts remain traceable to supporting sources.

## Boundary

Provenance is internal metadata. It does not affect deterministic reasoning and does not add citation or source UI to the current interaction model. Whether plant sources should eventually appear in the inspector is an open question (see [Canvas-First Workspace](#canvas-first-workspace)). A curated fact without recorded evidence remains a valid, usable fact — absence of evidence means no source has been attributed yet, not that the fact is unsupported.

Facts researched from this point forward should record their supporting source(s) when they're added, rather than provenance being reconstructed after the fact.

---

## Future Part 2 Direction — Plant Physical Structure

Part 2B deliberately defers mature height, mature spread, and growth habit.

Likely useful plant traits if this becomes active include lifecycle (already implemented), mature height, mature spread, and growth habit. The exact field structure, units, and growth-habit taxonomy should be finalized before implementation.

Real mature dimensions may be stored using real-world units when supported by reliable horticultural sources. However:

> Real plant dimensions must be stored as the physical values a source states, never converted into abstract units.

The garden now has an explicit physical scale (see [Spatial Foundation — Physical Garden Coordinates](#spatial-foundation--physical-garden-coordinates)), so a sourced dimension such as a mature spread in inches can be compared directly with real garden distances. A simple future model could approximate a mature footprint as a circle centered on a placement's position, where `clearance = centerDistance − r₁ − r₂`. The spatial model must not prevent this, but footprint reasoning is not implemented.

Physical structure may eventually support plant identity, inspection, qualitative structural understanding, and later visual differentiation — it does not require exact geometric plant simulation.

This is **not currently a required Part 2 feature**.

---

## Garden Areas / Beds

Planting beds are implemented as spatial layout objects — see [Planting Beds](#planting-beds). Reasoning about beds (for example, per-bed composition) is still not a feature. Add it only if whole-garden reasoning proves too coarse in practice.

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
- converting abstract units into physical measurements (all physical values must come from a source or from the user)
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

**2E — Knowledge Provenance**  
Where did this curated fact come from?

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

Environmental knowledge should be represented at the narrowest spatial or contextual scope the underlying condition actually has — sunlight is per-cell, climate/location is site-wide, native/invasive suitability is plant × location. Do not assume every future condition is per-cell just because the first one is.

---

## Part 3A — Garden Environment & Sunlight Mapping

Sunlight is the first modeled environmental dimension, and establishes the garden/site environmental state that later dimensions will reuse.

The garden now carries its own environmental state, separate from what's planted. Sunlight conditions are user-declared per environmental cell (12 × 12 inches; see [Spatial Foundation](#spatial-foundation--physical-garden-coordinates)) — the person planning this garden marks a cell as full sun, partial sun, or shade — modeled as such, not measured irradiance, exact direct-sun hours, or simulated year-round exposure.

A cell with no marked sunlight is unmodeled, not a negative or default condition.

**Clear Garden** resets the planting design but preserves the garden's modeled sunlight. **New Garden** begins a new site and resets both.

This slice adds no plant sunlight requirements and no fit reasoning — it establishes the state and the editing/visualization interaction only. That's Part 3B.

## Part 3B — Plant Sunlight Knowledge & Fit

Each plant now curates the categorical sunlight levels it's commonly grown in (a set, e.g. full sun and partial sun — not an ordered scale, so there is no "too much" or "too little," only accepted or not accepted). A deterministic evaluator compares an inspected placement's plant against its cell's modeled sunlight and reports one of four outcomes: fit, mismatch, unmodeled cell sunlight, or unmodeled plant requirement. The two "unmodeled" outcomes are always distinct from a mismatch — insufficient information is never presented as a known incompatibility.

This evaluation is placement-local only, matching the Part 2D opportunity-scope discipline: no garden-wide sunlight-fit summary, score, or recommended alternative exists yet. A mismatch is surfaced immediately after placement, alongside the existing companion/spacing feedback; the full four-state result (including the unmodeled cases) is shown in persistent inspection.

---

# Spatial Foundation — Physical Garden Coordinates

**Status:** implemented.

## Goal

Make the garden a physical two-dimensional space, rather than a grid of cells, as the foundation for later freeform placement, planting beds, plant footprints, and the illustrated visual redesign.

> The domain model describes the physical garden; the UI visualizes that model.

This slice changes the spatial foundation only. It deliberately preserves current user-visible behavior wherever the new model allows.

## Model

- **Unit:** inches, for garden dimensions, plant positions, distances, and plant spacing.
- **Garden:** a bounded rectangle with a physical width and height.
- **Placement:** a placed plant has its own identity and a continuous physical position `(x, y)`. Any position inside the garden is valid domain state, including non-grid positions such as `(31.4, 67.8)`. A plant exists independently of any cell, bed, or grid.
- **Distance:** the basic spatial primitive is Euclidean distance between two placement positions. Each rule decides whether distance matters and how to interpret it.
- **Derived, not stored:** proximity, neighbors, spacing status, cell membership, and (later) bed membership are calculated from current positions when needed. Neighbor lists are never stored.

## Three Separate Concepts

These are deliberately independent:

1. **Physical garden coordinates** — the continuous domain positions of placements.
2. **Environmental-cell resolution** — the size of the cells that hold cell-level environmental data such as sunlight (currently 12 inches). This belongs to the garden's environment, not to plant placement.
3. **Rendering and input** — how the interface draws the garden at whatever size the screen allows, and how pointer and keyboard input become positions. This is UI behavior, not domain state.

Plants are placed and moved freely on a continuous canvas. User input is rounded to the nearest whole inch. That is input precision, not a grid: the model stays continuous, and positions don't snap to the environmental cells.

## Rules Under the New Model

- **Companion/incompatible:** placements within 12 inches (inclusive) of each other, as a product rule preserving V1 behavior (see [Companion Planting](#companion-planting)).
- **Spacing:** Euclidean distance compared against sourced same-species minimum spacing in inches (see [Spacing](#spacing)).
- **Sunlight:** a placement's position maps to the environmental cell containing it, and existing sunlight-fit reasoning applies unchanged.
- **Composition and garden-wide opportunities:** unchanged. They do not use distance.

## Behavior Changes Users Will Notice

Replacing abstract spacing tiers with sourced physical spacing changes which spacing warnings appear: warnings now follow each plant's sourced minimum at actual distances. This is a deliberate move toward truthful data, not a regression.

## Out of Scope for This Slice

- plant footprints, mature spread, and clearance reasoning
- the illustrated visual redesign
- persistence
- spatial indexes such as quadtrees, R-trees, or spatial hashes; pairwise comparison is sufficient at expected garden sizes

---

# Planting Beds

**Status:** implemented.

## Goal

Move toward a visual garden-design tool where users lay out planting boxes and beds, then place plants within and around them.

## Model

- A bed is a rectangle in physical garden coordinates (inches). It has its own id, a name, a top-left position, a width, and a height.
- A garden can have many beds. Beds must lie entirely inside the garden and may not overlap each other; touching edges is allowed.
- Beds are not tied to the 12-inch environmental grid. Any position and size is valid domain state, even though the current UI snaps bed edges to 6 inches.
- Plants remain independent positioned objects. A plant never stores which bed it belongs to: it is "in" a bed when its position lies inside the bed's rectangle, and otherwise it is in open ground. Plants can be placed anywhere, inside or outside beds.
- New beds are auto-named "Bed 1", "Bed 2", and so on (the lowest unused number), and can be renamed.

## Behavior

- **Moving a bed moves the plants inside it** by the same distance, so a planted bed behaves as one unit. Plants remain independent objects; this is an operation on positions, not stored ownership.
- **Resizing a bed never moves plants.** A plant that ends up outside the resized bed is simply in open ground.
- **Deleting a bed leaves its plants in place**, in open ground.
- **Clear Garden** removes plants and keeps beds and sunlight, which describe the site layout. **New Garden** resets everything.
- Sunlight belongs to the ground, not to beds. It is drawn as a translucent wash over beds, and painting sunlight passes straight through them.

## Interaction

Beds can be selected and edited without a special tool:

- with no tool selected, click empty ground inside a bed to select it; click a plant to inspect it instead, or open ground (or press Escape) to deselect
- a selected bed shows a name tab and corner handles above the plants: drag the tab to move the bed, or a corner to resize it, so plants inside stay clickable
- delete with the bed panel's Delete button or the Delete/Backspace key
- a change that would leave the garden or overlap another bed previews in red and does not apply

The **Beds** tool is for drawing: drag on open ground to draw a bed, with a live size readout. With the Beds tool active, a bed can also be dragged by its body. Plant and sunlight tools hide bed selection, so their clicks and keys never edit a bed. Every existing plant interaction works the same inside and outside beds. Persistent inspection shows whether a plant is in a bed (and which one) or in open ground. The bed panel shows the bed's size and the plants currently inside it.

## Not in This Slice

- bed types (raised bed, in-ground, container), rotation, or non-rectangular shapes
- reasoning about beds (per-bed composition, bed-aware feedback)
- multi-select, duplicating beds

---

# Free Placement Canvas

**Status:** implemented.

## Goal

Make the garden a true 2D physical canvas: plants sit at their actual positions, and spacing and relationship feedback follows actual distances.

## Placement and Movement

- Drag a plant from the picker to any point in the garden, or select a plant in the picker and click anywhere to place it. Clicking an existing plant inspects it instead of placing on top of it.
- Drag an existing plant to move it. The point you grabbed stays under the pointer, and the plant keeps its identity, so inspection follows it.
- Plants can be placed inside or outside beds and moved between them. There is no "one plant per square" rule: plants may sit close together or overlap.
- Removal is through the eraser or the Delete key, never by clicking a plant again.
- Positions are rounded to the nearest whole inch and kept inside the garden.

## Spacing Envelopes

The sourced same-species minimum spacing is shown as a dashed circle (an *envelope*) of radius `spacingInches.min`. It means: **another plant of the same species whose center lies inside this circle breaks the sourced minimum spacing.** It is not the plant's size or mature footprint, and the UI says so.

- While dragging a plant, envelopes appear around the other plants of its species, showing the zones its center should stay out of. Any the candidate position breaks turn red. The dragged plant shows its own dashed envelope.
- While inspecting a plant, only its own envelope is shown, red if another same-species plant is inside it.
- Different species never get envelopes and can overlap freely. No cross-species spacing rule exists, and envelopes don't need to fit inside beds.

While dragging, plants within the 12-inch interaction distance are outlined green (companion) or red (incompatible). Text feedback stays authoritative and appears on drop. Nothing blocks a drop: imperfect layouts are allowed.

## Keyboard

- Plants are focusable, in top-to-bottom, left-to-right order. Enter/Space inspects; Arrow keys move by 1 inch; Shift+Arrow moves by 12 inches; Delete removes.
- With a plant selected in the picker, focus the garden and press Enter to place it at the physical center of the garden, then use the arrow keys to position it.
- A selected bed's name tab is focusable; Arrow keys move the bed by 6 inches.

## Undo and Redo

An **Undo** button, plus Cmd+Z (Mac) or Ctrl+Z (Windows), undoes the last change to the garden: placing, moving or removing a plant, a sunlight stroke, a bed change, or Clear Garden. While typing in a text field, the shortcut undoes the text instead. Starting a New Garden clears the undo history. **Redo** (button, Shift+Cmd/Ctrl+Z, or Ctrl+Y) reapplies an undone change; any new change clears the redo history.

## Not in This Slice

- mature plant footprints, spread, height, or growth habit
- cross-species spacing rules or new companion rules
- illustrated plant assets
- a temporary snapping modifier or a free keyboard placement cursor

---

# Canvas-First Workspace

**Status:** approved direction, delivered in slices. **Slice 1 is implemented:** the workspace layout, toolbar with sunlight brush, status line, collapsible inspector (current panels, plus the temporary feedback list), inventory bar, catalog popup, Escape and Delete behavior, and undo/redo. Since then, [Garden Art](#garden-art) (sprites, icons, ground textures, wooden bed frames) and [Canvas Navigation](#canvas-navigation) (zoom, fit, drag-to-pan, scale bar) are also implemented. The Strengths / Issues / Opportunities inspector, Find plants / Show me, and short-lived canvas feedback are still to come. Where earlier sections describe the old picker or "no tool" mode, this section takes precedence.

## Goal

Turn the planner from a scrolling web page into a full-screen, canvas-centered garden design workspace. The garden dominates the screen. Tools, plants, and reasoning sit around it in compact panels.

This is a presentation and interaction redesign. It does not change the domain model, the reasoning rules, or what the product claims to know. It applies existing principles rather than replacing them: [the garden is the interface](#core-product-principle), [immediate feedback vs. persistent status](#part-2-product-principle-immediate-feedback-vs-persistent-status), and [Product Feel](#product-feel).

## Layout

- **Top bar:** garden name and size; Undo and Redo; a menu holding New Garden and the secondary, destructive Clear Garden.
- **Left toolbar:** compact mode buttons: Select/Move, Beds, Sunlight (with a Full / Partial / Shade / Clear brush), Eraser. There is no separate Plant button: choosing a plant is what arms the plant tool.
- **Canvas:** fills the remaining space and remains the visual focus.
- **Right inspector:** persistent and collapsible (see [Inspector](#inspector)).
- **Bottom inventory bar:** quick access to the plants in use in this garden, plus **Add plants**, which opens the catalog.
- **Status line:** always states the active tool and setting and what a click will do (for example "Planting Tomato — click to place · Esc to stop").

Desktop-first. Small screens and touch are not a goal of this redesign.

It replaces today's plant picker column, sunlight picker, and the feedback list below the garden.

## Catalog, Inventory, Canvas, Inspector

| Surface | Role |
|---|---|
| **Catalog** | Everything available, for fast discovery and choosing, like a creative-mode inventory |
| **Inventory bar** | Quick access to the plants I'm actively working with |
| **Canvas** | Where I build the garden |
| **Inspector** | Where I understand plants and garden reasoning |

**Catalog.** A centered popup over the garden, opened from **Add plants**. The garden stays visible but dimmed behind it. It is a temporary choosing state, not another workspace panel.

- A dense, scrolling grid of plant tiles. Each tile shows a plant visual (placeholder for now) and the plant's name, and nothing else: no category, lifecycle, roles, sunlight, or spacing on tiles. Details belong in the inspector.
- Prominent search, plus lightweight category filters drawn from the plant data (for example All / Vegetables / Herbs / Flowers, growing as the dataset does). Richer data can drive filters without being displayed on tiles.
- Plants already in the inventory have a subtle indicator.
- Tiles say *choose this plant*, not *add this plant*. **Choosing a plant** makes it the active plant brush, adds its type to the inventory if it isn't there (incidentally, not as a separate step), closes the catalog, and returns to the canvas ready to place.
- Escape or clicking outside closes the catalog without changing anything.

**Inventory bar.** A persistent palette of the plant types in use in this garden, not a gate: a plant never has to be in the inventory before it can be placed.

- Types are reusable, not quantities: placing a plant never uses it up.
- A new garden starts with an **empty inventory**, whose empty state guides the first action ("Add plants to start designing").
- Choosing an inventory plant arms the plant brush with it. Inventory plants can also be dragged onto the canvas.
- No fixed slot count. The bar shows what fits and scrolls horizontally for more.
- Removing a type from the inventory never removes plants already placed.
- Clear Garden keeps the inventory: it removes plants, not the plan. New Garden starts with an empty inventory.

**Boundaries.** The inventory is part of the garden plan and is saved with it. It is **not** a garden fact and does not feed the reasoning engine. Rules and opportunities use the full plant data and the placed plants, never the inventory. The UI may mark which suggested plants are already in the inventory, as a presentation aid only. Inventory changes are not undoable in the first implementation; undo and redo cover garden changes.

## Interaction Principles

The user should always understand: **what tool is active**, **what plant or setting is active**, **what will happen on click**, and **what is selected**.

Committed:

- **Tools are persistent brushes.** Choosing Tomato places Tomatoes on every click until another plant or tool is chosen, or Escape returns to Select. Beds and sunlight work the same way; sunlight keeps its Full / Partial / Shade / Clear setting.
- **Selection is lightweight.** In Select mode: click to inspect, drag to move, Delete/Backspace to remove, Escape to deselect. Moving existing plants happens in Select mode; with a plant brush active, clicking a plant inspects it and never places on top of it. The eraser remains for repeated deletion.
- **Escape steps back:** first out of the active tool to Select, then clears the selection.
- **Click is enough.** Catalog and inventory work by clicking; dragging is an optional shortcut.
- **Undo and redo are first-class**, with standard shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y), covering placement, movement, deletion, beds, and sunlight painting.
- **Empty states guide the first action.**

Direction (not yet committed):

- **Preview before commitment:** with a plant brush active, a ghost plant and its sourced spacing ring follow the pointer before placing; placement then gives short-lived feedback while the inspector updates.
- **Show me** pans and zooms to the relevant plants and briefly highlights them.
- Lightweight hover labels identify plants and beds; detailed reasoning stays in the inspector.
- **Physical scale:** subtle rulers or measurements, and distances shown while placing or moving.
- **Fit to garden** as a prominent recovery action alongside zoom and pan.

## Inspector

The inspector is the home of persistent "what is true now?" reasoning. It has two parts.

**Selected:** the inspected plant or selected bed, as today: identity, location, nearby relationships, same-species spacing, sunlight fit, local opportunities; or a bed's name, size, and contents.

**Garden:** garden-wide reasoning, kept in the existing mixed form, not an error checker:

- **Strengths:** positive facts that are currently true, such as represented ecological roles (composition) and companion pairings within the interaction distance. Descriptive, as composition already is: an absent strength is never shown as a weakness.
- **Issues:** existing rule violations anywhere in the garden: same-species spacing violations, incompatible pairs within the interaction distance, and sunlight mismatches. Unmodeled sunlight (cell or plant requirement) is missing information, not an issue.
- **Opportunities:** the existing, deliberately scoped opportunity policies ([Part 2D](#part-2d--opportunities)), unchanged.

Every item explains *why* and may offer an action that leads somewhere useful:

- **Find plants:** open the catalog showing the plants the finding is about, for example pollinator-support plants, or the inspected plant's modeled companions.
- **Show me:** select and reveal the plants involved.

Actions navigate and filter; they never change the garden on their own. Listing issues garden-wide uses the existing evaluators across all placements. It adds no new rule.

## Immediate Feedback on the Canvas

"What just happened?" feedback appears as short-lived messages on the canvas, near the plant that changed (for example "Great pairing: Tomato + Basil"), then fades. There is no permanent feedback log. Anything that remains true is shown in the inspector. Live drag feedback (spacing envelopes, companion/incompatible outlines) is unchanged.

## Canvas Navigation

A full-screen canvas needs fit-to-screen, zoom, and pan. These change only the view: positions remain physical inches, and the current conversion between screen and garden space already supports it.

Implemented:

- **Zoom** from fit-to-screen (the minimum) up to 8×: the − / + buttons at the bottom right, Cmd/Ctrl + = / − / 0, or trackpad pinch / Ctrl+scroll. Pinch and scroll zoom keep the point under the pointer still; buttons and keys keep the view's center still.
- **Fit:** the middle button shows the zoom level and returns to fit. A new garden starts at fit.
- **Pan:** while zoomed in, scroll (trackpad, wheel, or scrollbars) or drag. With the Select tool, drag open ground, a bed's body, or the grass (plants, bed tabs, and handles keep their own drags). With any tool, hold Space and drag, or drag with the middle mouse button. A press that barely moves is still a click, and the click after a drag never selects or deselects.
- **Scale bar** at the bottom left, like a map: a ruler of a round length (1 in up to 100 ft) that stays under 120 px at the current zoom.
- Plant sprites stay a fixed screen size at every zoom; beds, soil tiles, and spacing rings scale with the garden.

Not yet: Safari pinch gestures, and Show me (which pans and zooms to plants).

## Visual Direction

- **App shell:** warm and game-like, "Stardew Valley but a little more realistic and polished": crafted parchment-and-wood panels, a rounded friendly typeface, and drawn icons. It feels finished, not low-res: pixel art is an accent, never the whole interface. The chrome stays quieter than the garden.
- **Canvas:** tactile: ground texture, bed frames with soft depth, sunlight drawn as warm light and cool shade rather than flat tints.
- **Plants:** warm, whimsical, consistent top-down illustrations replace the dot markers. Until mature size is modeled, plant art stays a fixed display size and never suggests a footprint.
- **Motion:** small, satisfying responses (placement, hover, drop) that never imply facts the product doesn't model, such as growth or seasons.
- **No game mechanics:** see [No Garden Score](#no-garden-score).

### Garden Art

The canvas uses the approved plant art (see `art/STYLE.md`) plus ground and bed textures in the same chunky pixel style. What each surface means:

| Surface | Where | Represents |
|---|---|---|
| Grass | around the garden, outside its rectangle | the yard the plot sits in; frames the garden's boundary |
| Garden soil | the garden rectangle | the cultivated plot; plants outside beds are in open ground |
| Bed | each bed rectangle | a raised wooden planting box with richer soil |

There is no grass inside the garden, so a plant in open ground never looks planted in a lawn. There is one bed type, a raised wooden box; other types stay deferred.

- **Scale:** soil and bed-soil textures repeat once per 12 inches, matching the environmental grid, so the texture itself conveys physical scale. Bed boards are drawn 2 inches wide, like real lumber, with a minimum on-screen width.
- **Grid lines** are faint by default and stronger while painting sunlight.
- **Sunlight** is drawn as a warm glow (full and partial sun) or a cool tint (shade), blended so the ground stays visible. Only the presentation changes.
- **Plants** are drawn as their approved sprites at a fixed on-screen size (about 44 pixels), with a soft shadow. Selection, drag, and companion/incompatible highlights apply to the sprite. A plant's name appears on hover, keyboard focus, and while dragging.
- **Icons** replace the placeholder discs in the inventory bar and catalog, and appear beside the plant name in the inspector.
- A plant without approved art falls back to the placeholder disc.
- **Ground textures are generated in code** (deterministic, seamless by construction), not by an image model. The bed frame is cut from approved plank and corner-post art, made seamless in code.

## Scope

**Committed for this redesign** (to be delivered in slices):

- the full-screen layout: top bar (with Redo and a menu for New/Clear), left toolbar with an explicit Select/Move mode and a sunlight brush, status line, collapsible inspector, inventory bar
- the catalog popup (search, category filters, plant tiles) where choosing a plant arms it and adds it to the inventory; the inventory bar with click to arm and drag to place
- the inspector's Selected and Garden (Strengths, Issues, Opportunities) sections with Find plants / Show me actions
- short-lived canvas feedback in place of the feedback list
- a visual pass on the shell and canvas, including the [Garden Art](#garden-art) above

**Later enhancements (not committed):**

- number-key (1–9) shortcuts for inventory plants
- the interaction directions listed under [Interaction Principles](#interaction-principles)
- optional, off-by-default sound

**Out of scope for this redesign** (persistence and accounts are planned separately; see [Polish, Landing, and Accounts](#polish-landing-and-accounts)): plant art scaled by mature size, new reasoning rules or opportunity policies, scores or other game mechanics, mobile/touch-first design.

## Open Questions

- Should the inspector show sources for curated plant facts? Part 2E currently keeps provenance out of the UI.
- Should the inventory show plants that are placed in the garden but no longer in the inventory?
- How should short-lived canvas messages behave when several findings happen at once, for example one move creating a pairing and a spacing issue?

---

# Polish, Landing, and Accounts

## Goal

Turn the planner into a polished public product without changing the domain model or the reasoning engine. Delivered in order:

- **A. Visual foundation:** restyle the shell with shared design tokens (palette, type, radii, shadows) and drawn UI icons in place of text glyphs. No behavior changes.
- **B. Landing page:** a responsive landing page at `/` and the planner at `/plan/`. The planner stays desktop-first, with a "best on desktop" note on small screens. *Implemented, along with A.* The landing page describes only what the planner does today, and its hero notes reuse the planner's own wording for real pairs in the data.
- **C. Local save:** the current garden plan (name, garden, inventory) saves to the browser automatically and is validated when loaded. *Implemented.* The garden name is edited in place in the top bar, which also says whether the garden is saved in this browser. Returning visitors reopen their garden; New Garden starts over and clears the save. Undo history is not saved.
- **D. Accounts:** magic-link sign-in, several saved gardens per user, and the local garden uploaded on first sign-in.

## Not in This Phase

Sharing, collaboration, public galleries, payments, and new reasoning rules.

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

The product borrows *interaction metaphors* from such games, such as a hotbar of chosen plants and tactile placement, and some of their warmth (the shell and art may use pixel art as an accent), but not their low-resolution look, overall interface, or game mechanics. Game inspiration shapes interaction and art, never reasoning: there are no scores, XP, levels, or health meters (see [No Garden Score](#no-garden-score)). The "strategy game" in the product vision means experimenting with a layout and seeing consequences, not winning.

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
- a database browser (the plant catalog is a quick visual chooser of plant tiles, not a data table; details live in the inspector)
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

Feedback must not be more precise than the model and data behind it. Physical positions do not make every rule physically precise: a placed position is design intent, and a product rule such as the 12-inch companion interaction distance is not a horticultural measurement.

Do not silently translate real-world horticultural values into precise spatial claims the current model cannot support. The same discipline applies to provenance (see Part 2E): a source that informed an abstract value is not a source that states that value.

### Expand Intelligence Gradually

Prefer:

**local → garden-wide → proactive**

First understand an individual placement.

Then understand garden composition.

Then consider recommendations or opportunities.

Do not sacrifice the core spatial interaction in order to build future infrastructure prematurely.