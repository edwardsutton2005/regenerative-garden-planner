import type { Plant } from '../domain/plant'

// spacingInches is the source's plant-to-plant spacing in inches (not
// between-row spacing), stored as a min-max range; the spacing rule uses
// only min. It governs spacing between two placements of the SAME plant only
// (see domain/plant.ts and domain/spacing.ts). Every value is backed by a
// registered source in evidence.spacingGuidance — see docs/data-sources.md
// "Spacing" for each quoted statement, the variety each figure assumes, and
// where sources disagree.
//
// lifecycle and ecologicalRoles are curated per the Part 2B taxonomy fixed
// in PRODUCT.md — lifecycle is the standard horticultural classification,
// and ecologicalRoles record a plant's supported capability (e.g. as a
// pollinator resource), not a claim that the function is occurring right
// now. Both are intrinsic plant facts, independent of spacing/category.
//
// sunlightRequirement (Part 3B) is the categorical SunlightLevel set each
// plant is curated to accept, each backed by a specific, linkable
// university/college Extension source in evidence.sunlightRequirement — see
// docs/data-sources.md "Sunlight" for the human-readable table of exactly
// what each source does and does not explicitly state, and the V1
// full-sun/partial-sun/shade normalization policy the sets below follow.
//
// evidence (Part 2E) records claim-level provenance where it's actually
// attributable — see domain/plant.ts. Most entries below have none for
// lifecycle/ecologicalRoles/spacing: the comments above predate per-claim
// citation discipline and only describe a dataset-wide sourcing policy, not
// a specific source per plant, so attaching one would misrepresent
// precision we don't have. Sunflower's spacingGuidance is the one exception
// there. sunlightRequirement is held to a stricter standard — every plant's
// accepted set is backed by a registered source (see data/sources.ts).
export const plants: Plant[] = [
  // Spacing: 24-36 in apart for vining types; bush types can be set closer (UMN).
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    spacingInches: { min: 24, max: 36 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['umn-extension-tomatoes'],
      sunlightRequirement: ['umn-extension-tomatoes'],
    },
  },
  // Spacing: 2-3 in apart in the row (USU).
  // Lifecycle: biennial, though typically harvested in its first year.
  {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    spacingInches: { min: 2, max: 3 },
    lifecycle: 'biennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun', 'partial-sun'],
    evidence: {
      spacingGuidance: ['usu-extension-carrots'],
      sunlightRequirement: ['illinois-extension-salad-in-the-shade'],
    },
  },
  // Spacing: 4 in apart for leaf lettuce; head types need more (Illinois).
  // Lifecycle: annual.
  {
    id: 'lettuce',
    name: 'Lettuce',
    category: 'vegetable',
    spacingInches: { min: 4, max: 4 },
    lifecycle: 'annual',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun', 'partial-sun'],
    evidence: {
      spacingGuidance: ['illinois-extension-lettuce'],
      sunlightRequirement: ['illinois-extension-salad-in-the-shade', 'illinois-extension-lettuce'],
    },
  },
  // Spacing: 6-12 in apart (UMN).
  // Lifecycle: annual. Pollinator support is a capability when the plant is
  // allowed to flower — the app does not model flowering stage.
  {
    id: 'basil',
    name: 'Basil',
    category: 'herb',
    spacingInches: { min: 6, max: 12 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['umn-extension-basil'],
      sunlightRequirement: [
        'umn-extension-herbs',
        'pennstate-extension-basil',
        'illinois-extension-basil',
      ],
    },
  },
  // Spacing: 18 in apart — peppermint-specific; no general mint figure found (NC State).
  // Lifecycle: perennial.
  {
    id: 'mint',
    name: 'Mint',
    category: 'herb',
    spacingInches: { min: 18, max: 18 },
    lifecycle: 'perennial',
    ecologicalRoles: ['pollinator-support'],
    sunlightRequirement: ['full-sun', 'partial-sun'],
    evidence: {
      spacingGuidance: ['ncsu-extension-peppermint'],
      sunlightRequirement: ['usu-extension-mint'],
    },
  },
  // Spacing: 2 ft apart (Penn State); UF/IFAS gives 36-48 in.
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'rosemary',
    name: 'Rosemary',
    category: 'herb',
    spacingInches: { min: 24, max: 24 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: ['pollinator-support'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['pennstate-extension-rosemary'],
      sunlightRequirement: ['illinois-extension-rosemary'],
    },
  },
  // Spacing: 8-10 in apart for French marigold (Clemson HGIC).
  // Lifecycle: annual.
  {
    id: 'marigold',
    name: 'Marigold',
    category: 'flower',
    spacingInches: { min: 8, max: 10 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['clemson-hgic-marigolds'],
      sunlightRequirement: ['umn-extension-marigolds'],
    },
  },
  // Spacing: 18-24 in apart for branching cultivars (UMN).
  // Lifecycle: annual.
  {
    id: 'sunflower',
    name: 'Sunflower',
    category: 'flower',
    spacingInches: { min: 18, max: 24 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['umn-extension-sunflowers'],
      sunlightRequirement: ['illinois-extension-sunflowers'],
    },
  },
  // Spacing: 3-4 in apart (UMN).
  // Lifecycle: biennial, though typically harvested in its first year.
  {
    id: 'onion',
    name: 'Onion',
    category: 'vegetable',
    spacingInches: { min: 3, max: 4 },
    lifecycle: 'biennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['umn-extension-onions'],
      sunlightRequirement: ['umn-extension-onions'],
    },
  },
  // Spacing: 2-3 in apart in the row (USU).
  // Lifecycle: annual. Nitrogen-fixation reflects the plant's capability
  // via symbiotic rhizobia, not active transfer to neighboring plants.
  {
    id: 'bush-bean',
    name: 'Bush Bean',
    category: 'vegetable',
    spacingInches: { min: 2, max: 3 },
    lifecycle: 'annual',
    ecologicalRoles: ['nitrogen-fixation'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['usu-extension-beans'],
      sunlightRequirement: ['usu-extension-beans'],
    },
  },
  // Spacing: 1-2 in apart in the row (USU); UMN's narrow-trench figure differs — see docs/data-sources.md.
  // Lifecycle: annual. See Bush Bean note on nitrogen-fixation.
  {
    id: 'pea',
    name: 'Pea',
    category: 'vegetable',
    spacingInches: { min: 1, max: 2 },
    lifecycle: 'annual',
    ecologicalRoles: ['nitrogen-fixation'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['usu-extension-peas'],
      sunlightRequirement: ['umn-extension-peas'],
    },
  },
  // Spacing: 18 in apart in the row (USU).
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'bell-pepper',
    name: 'Bell Pepper',
    category: 'vegetable',
    spacingInches: { min: 18, max: 18 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['usu-extension-peppers'],
      sunlightRequirement: ['umn-extension-raised-bed-gardens'],
    },
  },
  // Spacing: 2 ft apart for single transplants (USU).
  // Lifecycle: annual.
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'vegetable',
    spacingInches: { min: 24, max: 24 },
    lifecycle: 'annual',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['usu-extension-cucumber'],
      sunlightRequirement: ['illinois-extension-get-started'],
    },
  },
  // Spacing: 12-18 in apart in the row (USU).
  // Lifecycle: biennial, though typically harvested in its first year.
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'vegetable',
    spacingInches: { min: 12, max: 18 },
    lifecycle: 'biennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['usu-extension-cabbage'],
      sunlightRequirement: ['usu-extension-cabbage'],
    },
  },
  // Spacing: 10-12 in apart (UMN).
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'potato',
    name: 'Potato',
    category: 'vegetable',
    spacingInches: { min: 10, max: 12 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['umn-extension-potatoes'],
      sunlightRequirement: ['umn-extension-potatoes'],
    },
  },
  // Spacing: 10-12 in apart (UMN).
  // Lifecycle: annual.
  {
    id: 'dill',
    name: 'Dill',
    category: 'herb',
    spacingInches: { min: 10, max: 12 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
    sunlightRequirement: ['full-sun'],
    evidence: {
      spacingGuidance: ['umn-extension-dill'],
      sunlightRequirement: ['illinois-extension-dill'],
    },
  },
]
