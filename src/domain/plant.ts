export type PlantCategory = 'vegetable' | 'herb' | 'flower'

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
}
