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

export type FocusedSpacingViolation = SpacingViolation & {
  focusCoordinate: CellCoordinate
  focusPlant: Plant
}

/**
 * Like evaluateSpacing, but for more than one focus placement at once — e.g.
 * both cells changed by a garden-to-garden swap. Composes the existing
 * single-focus evaluateSpacing rather than reimplementing it.
 *
 * Swapping two same-species plants with each other leaves that species' set
 * of positions unchanged, so evaluating both resulting focuses can
 * independently rediscover the same violation. That's deduplicated by an
 * identity of ("spacing" + the unordered pair of cells involved), separate
 * from the relationship-finding identity used elsewhere, so a spacing
 * finding is never conflated with a companion/incompatible one.
 */
export function evaluateSpacingForFocuses(
  garden: GardenState,
  focuses: { coordinate: CellCoordinate; plant: Plant }[],
): FocusedSpacingViolation[] {
  const seen = new Set<string>()
  const combined: FocusedSpacingViolation[] = []

  for (const focus of focuses) {
    const violations = evaluateSpacing(
      garden,
      focus.coordinate.row,
      focus.coordinate.col,
      focus.plant,
    )

    for (const violation of violations) {
      const pair = [
        `${focus.coordinate.row},${focus.coordinate.col}`,
        `${violation.coordinate.row},${violation.coordinate.col}`,
      ]
        .sort()
        .join('|')
      const key = `spacing:${pair}`
      if (seen.has(key)) continue
      seen.add(key)
      combined.push({ ...violation, focusCoordinate: focus.coordinate, focusPlant: focus.plant })
    }
  }

  return combined
}
