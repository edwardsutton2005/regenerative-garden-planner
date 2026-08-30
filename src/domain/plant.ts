import type { SourceId } from './source'

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
export const ECOLOGICAL_ROLES = ['pollinator-support', 'nitrogen-fixation'] as const

export type EcologicalRole = (typeof ECOLOGICAL_ROLES)[number]

export type Plant = {
  id: string
  name: string
  category: PlantCategory
  /**
   * Minimum required spacing between two placements of *this same plant*,
   * in abstract grid cells (Chebyshev distance). V1 applies this only
   * between same-species placements (e.g. Tomato-to-Tomato) — real spacing
   * guidance describes how far apart to space a crop from itself, not a
   * cross-species distance requirement, so it is not applied between
   * different species. Cross-species relationships are handled separately
   * by companion/incompatible feedback. Informed by real horticultural
   * spacing guidance but not a stated real-world unit conversion — see
   * data/plants.ts.
   */
  minimumSpacingCells: number
  /**
   * How this plant normally completes its life cycle. 'tender-perennial'
   * means biologically capable of persisting multiple years but frost-
   * sensitive and commonly grown as an annual in colder climates — do not
   * treat a tender-perennial as durable multi-year garden structure without
   * climate context (relevant once garden composition exists).
   */
  lifecycle: PlantLifecycle
  /**
   * Curated ecological capabilities this plant contributes (may be empty).
   * Not a claim of real-time occurrence — see EcologicalRole.
   */
  ecologicalRoles: EcologicalRole[]
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
  /**
   * Sources here inform this plant's normalized minimumSpacingCells tier —
   * they state real-world horticultural spacing guidance, never the
   * abstract cell number itself. See minimumSpacingCells and
   * ARCHITECTURE.md "Physical Plant Data Does Not Define Grid Scale."
   */
  spacingGuidance?: SourceId[]
  ecologicalRoles?: Partial<Record<EcologicalRole, SourceId[]>>
}
