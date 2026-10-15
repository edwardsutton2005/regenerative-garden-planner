import type { GardenState } from './garden'
import { distance, getAllPlacements, getPlacement } from './garden'
import type { Plant } from './plant'

export type SpacingViolation = {
  placementId: string
  plant: Plant
  distance: number
  requiredDistance: number
}

/**
 * Finds every other placement of the *same* plant whose Euclidean distance
 * from the given placement is less than plant.spacingInches.min. Spacing
 * only applies between repeated placements of the same species — real
 * spacing guidance (e.g. "space tomatoes 24-36 inches apart") is
 * same-species guidance, not a cross-species distance requirement, so a
 * cross-species pair never produces a spacing violation here.
 *
 * The plant is derived from GardenState, never passed in, so it can't
 * disagree with what's actually placed. Returns [] for an unknown placement
 * or plant id.
 */
export function evaluateSpacing(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
): SpacingViolation[] {
  const focus = getPlacement(garden, placementId)
  const plant = focus ? plantsById[focus.plantId] : undefined
  if (!focus || !plant) return []

  const requiredDistance = plant.spacingInches.min
  const violations: SpacingViolation[] = []

  for (const other of getAllPlacements(garden)) {
    if (other.id === focus.id || other.plantId !== plant.id) continue

    const d = distance(focus.position, other.position)
    if (d < requiredDistance) {
      violations.push({ placementId: other.id, plant, distance: d, requiredDistance })
    }
  }

  return violations
}

export type FocusedSpacingViolation = SpacingViolation & {
  focusPlacementId: string
  focusPlant: Plant
}

/**
 * Like evaluateSpacing, but for more than one focus placement at once — e.g.
 * both placements changed by a swap. Composes evaluateSpacing rather than
 * reimplementing it.
 *
 * Two focuses that violate each other's spacing would independently
 * rediscover the same violation from each side, so findings are
 * deduplicated by the unordered pair of placement ids.
 */
export function evaluateSpacingForFocuses(
  garden: GardenState,
  placementIds: string[],
  plantsById: Record<string, Plant>,
): FocusedSpacingViolation[] {
  const seen = new Set<string>()
  const combined: FocusedSpacingViolation[] = []

  for (const focusPlacementId of placementIds) {
    for (const violation of evaluateSpacing(garden, focusPlacementId, plantsById)) {
      const key = [focusPlacementId, violation.placementId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      combined.push({ ...violation, focusPlacementId, focusPlant: violation.plant })
    }
  }

  return combined
}
