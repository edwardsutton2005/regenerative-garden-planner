# Graph Report - regenerative-garden  (2026-09-22)

## Corpus Check
- Corpus is ~36,390 words - fits in a single context window. You may not need a graph.

## Summary
- 313 nodes · 578 edges · 21 communities (18 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.88)
- Token cost: 194,443 input · 0 output

## Community Hubs (Navigation)
- Plant & Relationship Data Layer
- App Interaction Handlers
- App State & Drag Payload
- Package Dependencies
- Inspector & Spacing Feedback
- TS App Compiler Config
- Agent Instructions & Guardrails
- Product Vision & Feel
- TS Node Compiler Config
- Deterministic Reasoning Layers
- Domain Rules (Spacing/Companion/Opportunities)
- Plant Ecological Roles & Sources
- Data Provenance & Composition Rules
- Garden Planner UI Screenshot
- Lint Config
- Garden Composition Component
- Reasoning Design Principles
- Sunlight Mapping
- TS Root Config
- App Entry Point
- Favicon Brand Mark

## God Nodes (most connected - your core abstractions)
1. `App()` - 28 edges
2. `Regenerative Garden Planner Product Vision` - 22 edges
3. `compilerOptions` - 18 edges
4. `isValidCoordinate()` - 15 edges
5. `Plant` - 15 edges
6. `compilerOptions` - 15 edges
7. `getPlantIdAt()` - 14 edges
8. `Agent Instructions` - 13 edges
9. `Architecture Document` - 13 edges
10. `placePlant()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Keep It Simple` --semantically_similar_to--> `Build the Smallest Useful System`  [INFERRED] [semantically similar]
  AGENTS.md → PRODUCT.md
- `GardenState` --semantically_similar_to--> `Garden Canvas`  [INFERRED] [semantically similar]
  ARCHITECTURE.md → PRODUCT.md
- `README Overview` --semantically_similar_to--> `The Garden Itself Is the Interface`  [INFERRED] [semantically similar]
  README.md → PRODUCT.md
- `Separate Domain Logic from UI` --conceptually_related_to--> `Deterministic Domain Logic`  [INFERRED]
  AGENTS.md → ARCHITECTURE.md
- `Agent Instructions` --references--> `Regenerative Garden Planner Product Vision`  [EXTRACTED]
  AGENTS.md → PRODUCT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **V1 Core Feedback Loop** — product_garden_canvas, product_companion_planting, product_spacing, product_feedback [INFERRED 0.75]
- **Deterministic Reasoning Pipeline (Layers 1-3)** — docs_reasoning_engine_layer1_domain_facts, docs_reasoning_engine_layer2_deterministic_reasoning, docs_reasoning_engine_layer3_explanation [EXTRACTED 1.00]
- **Part 2 Development Sequence (2A-2E)** — product_persistent_inspection, product_plant_identity_ecological_roles, product_garden_composition, product_opportunities, product_knowledge_provenance [EXTRACTED 1.00]

## Communities (21 total, 3 thin omitted)

### Community 0 - "Plant & Relationship Data Layer"
Cohesion: 0.09
Nodes (32): @vitejs/plugin-react, vitest, plants, relationshipRules, sources, evaluateGardenComposition(), bushBean, carrot (+24 more)

### Community 1 - "App Interaction Handlers"
Cohesion: 0.13
Nodes (30): App(), handleCellClick(), handleCellDrop(), handleCellPaint(), handleClearGarden(), handleCreateGarden(), handleNewGarden(), isInspected() (+22 more)

### Community 2 - "App State & Drag Payload"
Cohesion: 0.09
Nodes (26): react, react-dom, ActiveTool, InspectedCoordinate, LastPlacement, plantsById, SetupDimensions, isPlantDragPayload() (+18 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, react, react-dom, devDependencies, oxlint, @types/node, @types/react, @types/react-dom (+20 more)

### Community 4 - "Inspector & Spacing Feedback"
Cohesion: 0.15
Nodes (16): formatEnumLabel(), GardenInspector(), GardenInspectorProps, PlacementFeedback(), PlacementFeedbackProps, CellCoordinate, chebyshevDistance(), getAllPlacements() (+8 more)

### Community 5 - "TS App Compiler Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Agent Instructions & Guardrails"
Cohesion: 0.12
Nodes (19): Agent Instructions, Completion Checklist, Git Safety, Guiding Principle, Planning Before Implementation, Preserve Explainability, Product Experience Principle, Secrets and Security (+11 more)

### Community 7 - "Product Vision & Feel"
Cohesion: 0.12
Nodes (18): The Garden Itself Is the Interface, Feedback, Optional Future Part 2: Garden Areas / Beds, Garden Score, Immediate Feedback vs. Persistent Status, Plant Information, Plant Library, Future Part 2: Plant Physical Structure (+10 more)

### Community 8 - "TS Node Compiler Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Deterministic Reasoning Layers"
Cohesion: 0.18
Nodes (11): Deterministic Reasoning Architecture, Future LLM Boundary, GardenComposition Component, GardenInspector Component, GardenOpportunities Component, Layer 1: Domain Facts, Layer 2: Deterministic Reasoning, Layer 3: Explanation (+3 more)

### Community 10 - "Domain Rules (Spacing/Companion/Opportunities)"
Cohesion: 0.22
Nodes (9): Separate Domain Logic from UI, Deterministic Domain Logic, Opportunities Rule, Relationships Rule (Companion/Incompatible), Spacing Rule, Spacing (Data Sources), Companion Planting, Part 2D: Opportunities (+1 more)

### Community 11 - "Plant Ecological Roles & Sources"
Cohesion: 0.22
Nodes (9): Adding New Knowledge, Companion and Incompatible Relationships, Farmers' Almanac Companion Planting Guide, Gardening Data and Sources, Lifecycle and Ecological Roles (Data Sources), The Old Farmer's Almanac Companion Planting Guide, Ecological Roles, Lifecycle (+1 more)

### Community 12 - "Data Provenance & Composition Rules"
Cohesion: 0.25
Nodes (8): Treat Data Carefully, Composition Rule, Curation Policy, Sunflowers — University of Minnesota Extension, Part 2C: Garden Composition, Part 2E: Knowledge Provenance, Part 2 Development Sequence, Part 2A: Persistent Inspection

### Community 13 - "Garden Planner UI Screenshot"
Cohesion: 0.38
Nodes (7): Companion Planting Suggestions (Local Opportunities: Onion, Pea, Rosemary for Carrot), Garden Composition Panel (Pollinator support, Nitrogen fixation), Garden Grid (cell layout, New/Clear Garden controls), Plant Detail Panel (Carrot: identity, adjacency, spacing, opportunities), Plant Palette Sidebar, Garden Planner UI Screenshot, Tomato Same-Species Spacing Warning ("keep at least 4 cells apart")

### Community 14 - "Lint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Garden Composition Component"
Cohesion: 0.53
Nodes (5): formatEnumLabel(), GardenComposition(), GardenCompositionProps, snapshotText(), RoleComposition

### Community 16 - "Reasoning Design Principles"
Cohesion: 0.40
Nodes (5): Keep It Simple, Build the Smallest Useful System, Do Not Imply Unsupported Precision, Expand Intelligence Gradually, Store Facts, Derive Meaning

### Community 17 - "Sunlight Mapping"
Cohesion: 0.40
Nodes (5): Sunlight Mapping, Sunlight (Data Sources), Part 3: Garden Conditions & Local Ecology, Part 3A: Garden Environment & Sunlight Mapping, Part 3B: Plant Sunlight Knowledge & Fit

## Knowledge Gaps
- **131 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+126 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Plant & Relationship Data Layer` to `App Interaction Handlers`, `Package Dependencies`, `Inspector & Spacing Feedback`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `react` connect `App State & Drag Payload` to `App Interaction Handlers`, `Package Dependencies`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `Regenerative Garden Planner Product Vision` connect `Product Vision & Feel` to `Agent Instructions & Guardrails`, `Deterministic Reasoning Layers`, `Domain Rules (Spacing/Companion/Opportunities)`, `Data Provenance & Composition Rules`, `Reasoning Design Principles`, `Sunlight Mapping`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _131 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Plant & Relationship Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.09131205673758866 - nodes in this community are weakly interconnected._
- **Should `App Interaction Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.13363363363363365 - nodes in this community are weakly interconnected._
- **Should `App State & Drag Payload` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._