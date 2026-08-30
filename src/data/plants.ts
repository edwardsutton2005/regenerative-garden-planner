import type { Plant } from '../domain/plant'

// minimumSpacingCells is a relative tier (1 = least room needed, 4 = most),
// informed by the real spacing-apart guidance noted per plant below — not a
// stated inches-per-cell conversion. It governs spacing between two
// placements of the SAME plant only (V1 does not apply it across species —
// see domain/plant.ts and domain/spacing.ts). Where guidance varies by
// variety or planting method, a representative common-garden figure was
// used. Sources: UMN Extension (https://extension.umn.edu/flowers/sunflowers)
// where available, otherwise The Old Farmer's Almanac plant guides, Farmers'
// Almanac, or cross-checked spacing charts (Gardening Know How, Blooming
// Expert).
//
// lifecycle and ecologicalRoles are curated per the Part 2B taxonomy fixed
// in PRODUCT.md — lifecycle is the standard horticultural classification,
// and ecologicalRoles record a plant's supported capability (e.g. as a
// pollinator resource), not a claim that the function is occurring right
// now. Both are intrinsic plant facts, independent of spacing/category.
//
// evidence (Part 2E) records claim-level provenance where it's actually
// attributable — see domain/plant.ts. Most entries below have none: the
// comments above predate per-claim citation discipline and only describe a
// dataset-wide sourcing policy, not a specific source per plant, so
// attaching one would misrepresent precision we don't have. Sunflower is
// the one exception with a genuinely specific, linkable source.
export const plants: Plant[] = [
  // ~24-36 in apart.
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    minimumSpacingCells: 4,
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  },
  // ~2-3 in apart — by far the tightest-packed of the seed plants.
  // Lifecycle: biennial, though typically harvested in its first year.
  {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    minimumSpacingCells: 1,
    lifecycle: 'biennial',
    ecologicalRoles: [],
  },
  // ~4-8 in apart (leaf lettuce).
  // Lifecycle: annual.
  {
    id: 'lettuce',
    name: 'Lettuce',
    category: 'vegetable',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: [],
  },
  // ~10-12 in apart.
  // Lifecycle: annual. Pollinator support is a capability when the plant is
  // allowed to flower — the app does not model flowering stage.
  {
    id: 'basil',
    name: 'Basil',
    category: 'herb',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  },
  // ~18 in apart.
  // Lifecycle: perennial.
  {
    id: 'mint',
    name: 'Mint',
    category: 'herb',
    minimumSpacingCells: 3,
    lifecycle: 'perennial',
    ecologicalRoles: ['pollinator-support'],
  },
  // ~24-36 in apart (mature shrub spacing).
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'rosemary',
    name: 'Rosemary',
    category: 'herb',
    minimumSpacingCells: 4,
    lifecycle: 'tender-perennial',
    ecologicalRoles: ['pollinator-support'],
  },
  // ~6-10 in apart (French marigold, a common garden variety).
  // Lifecycle: annual.
  {
    id: 'marigold',
    name: 'Marigold',
    category: 'flower',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  },
  // ~18 in apart (typical branching garden variety, per UMN Extension).
  // Lifecycle: annual.
  {
    id: 'sunflower',
    name: 'Sunflower',
    category: 'flower',
    minimumSpacingCells: 3,
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
    // The only current seed plant with a specific, attributable spacing
    // source — see data/sources.ts.
    evidence: { spacingGuidance: ['umn-extension-sunflowers'] },
  },
  // ~3-6 in apart.
  // Lifecycle: biennial, though typically harvested in its first year.
  {
    id: 'onion',
    name: 'Onion',
    category: 'vegetable',
    minimumSpacingCells: 2,
    lifecycle: 'biennial',
    ecologicalRoles: [],
  },
  // ~1-4 in apart, depending on planting method/source.
  // Lifecycle: annual. Nitrogen-fixation reflects the plant's capability
  // via symbiotic rhizobia, not active transfer to neighboring plants.
  {
    id: 'bush-bean',
    name: 'Bush Bean',
    category: 'vegetable',
    minimumSpacingCells: 1,
    lifecycle: 'annual',
    ecologicalRoles: ['nitrogen-fixation'],
  },
  // ~2 in apart, per common garden guidance.
  // Lifecycle: annual. See Bush Bean note on nitrogen-fixation.
  {
    id: 'pea',
    name: 'Pea',
    category: 'vegetable',
    minimumSpacingCells: 1,
    lifecycle: 'annual',
    ecologicalRoles: ['nitrogen-fixation'],
  },
  // ~12-18 in apart.
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'bell-pepper',
    name: 'Bell Pepper',
    category: 'vegetable',
    minimumSpacingCells: 3,
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  },
  // ~12-18 in apart.
  // Lifecycle: annual.
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'vegetable',
    minimumSpacingCells: 3,
    lifecycle: 'annual',
    ecologicalRoles: [],
  },
  // ~15-18 in apart.
  // Lifecycle: biennial, though typically harvested in its first year.
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'vegetable',
    minimumSpacingCells: 3,
    lifecycle: 'biennial',
    ecologicalRoles: [],
  },
  // ~12-18 in apart, depending on planting method/type.
  // Lifecycle: tender perennial; commonly grown as an annual in colder
  // climates.
  {
    id: 'potato',
    name: 'Potato',
    category: 'vegetable',
    minimumSpacingCells: 3,
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  },
  // ~10-12 in apart.
  // Lifecycle: annual.
  {
    id: 'dill',
    name: 'Dill',
    category: 'herb',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  },
]
