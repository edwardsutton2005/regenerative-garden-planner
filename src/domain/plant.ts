import type { SourceId } from './source'
import type { SunlightLevel } from './garden'

export type PlantCategory = 'vegetable' | 'herb' | 'flower'

export type PlantLifecycle = 'annual' | 'biennial' | 'perennial' | 'tender-perennial'

/**
 * The curated ecological capabilities a plant can contribute to the garden,
 * in canonical display/derivation order. This array is the single source of
 * truth — EcologicalRole is derived from it rather than maintained as a
 * separately-authored union, so the type and the runtime order can't drift
 * apart. A role records what a plant is capable of contributing under
 * credible horticultural guidance, not a claim that the function is
 * occurring right now (e.g. a pollinator-support plant that hasn't flowered
 * yet still carries the role). Kept deliberately small — see
 * ARCHITECTURE.md for why this stays curated data, not a rule engine.
 */
export const ECOLOGICAL_ROLES = ['pollinator-support', 'nitrogen-fixation', 'beneficial-insects'] as const

export type EcologicalRole = (typeof ECOLOGICAL_ROLES)[number]

/** The botanical families in the catalogue, with their common names. */
export const PLANT_FAMILIES = {
  Amaryllidaceae: 'Onion family',
  Apiaceae: 'Carrot family',
  Asteraceae: 'Daisy family',
  Brassicaceae: 'Cabbage family',
  Cucurbitaceae: 'Gourd family',
  Fabaceae: 'Legume family',
  Lamiaceae: 'Mint family',
  Solanaceae: 'Nightshade family',
} as const

export type PlantFamily = keyof typeof PLANT_FAMILIES

/**
 * A sourced plant-to-plant spacing range, in inches. When a source states a
 * single value, min and max are equal.
 */
export type SpacingRange = {
  min: number
  max: number
}

export type Plant = {
  id: string
  name: string
  category: PlantCategory
  /**
   * Sourced plant-to-plant spacing between two placements of *this same
   * plant*, in inches (not between-row spacing). Applied only between
   * same-species placements — real spacing guidance describes how far apart
   * to space a crop from itself, not a cross-species distance requirement.
   * The spacing rule uses only `min`; `max` preserves the source's stated
   * range. See docs/data-sources.md "Spacing".
   */
  spacingInches: SpacingRange
  /**
   * Sourced typical mature width (spread) of one plant, in inches. Sizes the
   * plant's footprint (see footprintRadius); absent means not curated yet.
   */
  matureWidthInches?: SpacingRange
  /**
   * How this plant normally completes its life cycle. 'tender-perennial'
   * means biologically capable of persisting multiple years but frost-
   * sensitive and commonly grown as an annual in colder climates — do not
   * treat a tender-perennial as durable multi-year garden structure without
   * climate context (relevant once garden composition exists).
   */
  lifecycle: PlantLifecycle
  /** Botanical family. Absent means not curated yet; the data test requires
   * it for every catalogue plant. */
  family?: PlantFamily
  /**
   * Curated ecological capabilities this plant contributes (may be empty).
   * Not a claim of real-time occurrence — see EcologicalRole.
   */
  ecologicalRoles: EcologicalRole[]
  /**
   * The categorical SunlightLevel(s) this plant is curated to accept — an
   * unordered set membership test (e.g. ['full-sun', 'partial-sun']), not a
   * ranked scale from "too little" to "too much" sun. Absent (rather than an
   * empty array) means this plant's requirement is not yet modeled — a real
   * curation gap, distinct from a cell's own unmodeled sunlight (see
   * domain/sunlightFit.ts and ARCHITECTURE.md "Sunlight Mapping").
   */
  sunlightRequirement?: SunlightLevel[]
  /**
   * Claim-level source evidence, present only where actually recorded.
   * Absence means no source has been attributed yet, not that the fact is
   * unsupported. Never read by domain/spacing.ts, domain/relationships.ts,
   * domain/composition.ts, or domain/opportunities.ts — see
   * ARCHITECTURE.md "Knowledge Provenance Is Separate From Reasoning."
   */
  evidence?: PlantEvidence
}

/**
 * Per-fact source evidence for a Plant. Kept fact-specific (not one shared
 * bucket) so a source is traceable to what it actually supports.
 */
export type PlantEvidence = {
  lifecycle?: SourceId[]
  /** Sources stating this plant's spacingInches. */
  spacingGuidance?: SourceId[]
  /** Sources stating this plant's matureWidthInches. */
  matureWidth?: SourceId[]
  ecologicalRoles?: Partial<Record<EcologicalRole, SourceId[]>>
  /**
   * Sources supporting this plant's curated sunlightRequirement. The
   * cell-level sunlight a user paints onto the garden is their own
   * declaration and never carries evidence — only this curated,
   * plant-side fact does. See ARCHITECTURE.md "Knowledge Provenance Is
   * Separate From Reasoning."
   */
  sunlightRequirement?: SourceId[]
}

/**
 * The room a plant needs around its center: half its sourced typical mature
 * width, using the low end of the range so "may crowd" stays conservative.
 * Falls back to half its same-species minimum spacing when width isn't
 * curated. Crowding between different plants is an estimate from each
 * plant's own size, not a sourced cross-species distance. See
 * ARCHITECTURE.md "Footprints".
 */
export function footprintRadius(plant: Plant): number {
  return (plant.matureWidthInches ?? plant.spacingInches).min / 2
}
