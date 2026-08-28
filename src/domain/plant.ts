export type PlantCategory = 'vegetable' | 'herb' | 'flower'

export type PlantLifecycle = 'annual' | 'biennial' | 'perennial' | 'tender-perennial'

/**
 * A curated ecological capability a plant can contribute to the garden.
 * This records what the plant is capable of contributing under credible
 * horticultural guidance, not a claim that the function is occurring right
 * now (e.g. a pollinator-support plant that hasn't flowered yet still
 * carries the role). Kept deliberately small — see ARCHITECTURE.md for why
 * this stays a curated fact on Plant rather than a generalized rule engine.
 */
export type EcologicalRole = 'pollinator-support' | 'nitrogen-fixation'

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
}
