import type { CellCoordinate, GardenState } from './garden'
import { chebyshevDistance, getAllPlacements } from './garden'
import type { Plant } from './plant'

export type SpacingViolation = {
  coordinate: CellCoordinate
  plant: Plant
  distance: number
  requiredDistance: number
}

/**
 * Finds every other placement of the *same* plant that is closer than
 * plant.minimumSpacingCells to (row, col). V1 spacing only applies between
 * repeated placements of the same species — real spacing guidance (e.g.
 * "space tomatoes 24-36 inches apart") is same-species guidance, not a
 * cross-species distance requirement, so a cross-species pair (e.g. tomato
 * next to basil) never produces a spacing violation here. Cross-species
 * relationships are handled separately by companion/incompatible feedback.
 *
 * Distance uses Chebyshev distance, so a diagonal neighbor counts the same
 * as an orthogonal one — deliberately different from the orthogonal-only
 * adjacency used for companion/incompatible feedback.
 *
 * Only evaluates the given cell against the rest of the garden; it does
 * not compute spacing for the whole board.
 */
export function evaluateSpacing(
  garden: GardenState,
  row: number,
  col: number,
  plant: Plant,
): SpacingViolation[] {
  const violations: SpacingViolation[] = []

  for (const { coordinate, plantId } of getAllPlacements(garden)) {
    if (coordinate.row === row && coordinate.col === col) continue
    if (plantId !== plant.id) continue // V1: same-species pairs only

    const distance = chebyshevDistance({ row, col }, coordinate)

    if (distance < plant.minimumSpacingCells) {
      violations.push({
        coordinate,
        plant,
        distance,
        requiredDistance: plant.minimumSpacingCells,
      })
    }
  }

  return violations
}
