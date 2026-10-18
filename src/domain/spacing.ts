import type { GardenState } from './garden'
import { distance, getAllPlacements, getPlacement } from './garden'
import type { Plant } from './plant'
import { footprintRadius } from './plant'

export type SpacingViolation = {
  placementId: string
  /** The other placement's plant. */
  plant: Plant
  distance: number
  requiredDistance: number
}

/**
 * Every other placement closer to the given one than `required` says, for
 * the pairs it returns a distance for. The focus plant is derived from
 * GardenState, never passed in. Returns [] for an unknown placement or
 * plant id; others with unknown plant ids are skipped.
 */
function closerThan(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
  required: (focus: Plant, other: Plant) => number | null,
): SpacingViolation[] {
  const focus = getPlacement(garden, placementId)
  const focusPlant = focus ? plantsById[focus.plantId] : undefined
  if (!focus || !focusPlant) return []

  const violations: SpacingViolation[] = []
  for (const other of getAllPlacements(garden)) {
    const plant = plantsById[other.plantId]
    if (other.id === focus.id || !plant) continue

    const requiredDistance = required(focusPlant, plant)
    if (requiredDistance === null) continue

    const d = distance(focus.position, other.position)
    if (d < requiredDistance) {
      violations.push({ placementId: other.id, plant, distance: d, requiredDistance })
    }
  }
  return violations
}

/**
 * Finds every other placement of the *same* plant whose Euclidean distance
 * from the given placement is less than plant.spacingInches.min. Real
 * spacing guidance (e.g. "space tomatoes 24-36 inches apart") is
 * same-species guidance; mixed pairs are evaluateCrowding's estimate.
 */
export function evaluateSpacing(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
): SpacingViolation[] {
  return closerThan(garden, placementId, plantsById, (focus, other) =>
    focus.id === other.id ? focus.spacingInches.min : null,
  )
}

/**
 * Finds every placement of a *different* plant whose footprint overlaps the
 * given placement's (closer than the two footprint radii combined). An
 * estimate extended from each plant's own spacing — see footprintRadius.
 */
export function evaluateCrowding(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
): SpacingViolation[] {
  return closerThan(garden, placementId, plantsById, (focus, other) =>
    focus.id === other.id ? null : footprintRadius(focus) + footprintRadius(other),
  )
}

export type FocusedSpacingViolation = SpacingViolation & {
  focusPlacementId: string
  focusPlant: Plant
}

/**
 * Runs an evaluator for more than one focus placement at once — e.g. both
 * placements changed by a swap. Two focuses that violate each other would
 * rediscover the same violation from each side, so findings are
 * deduplicated by the unordered pair of placement ids.
 */
function forFocuses(
  garden: GardenState,
  placementIds: string[],
  plantsById: Record<string, Plant>,
  evaluate: typeof evaluateSpacing,
): FocusedSpacingViolation[] {
  const seen = new Set<string>()
  const combined: FocusedSpacingViolation[] = []

  for (const focusPlacementId of placementIds) {
    const focusPlant = plantsById[getPlacement(garden, focusPlacementId)?.plantId ?? '']
    if (!focusPlant) continue

    for (const violation of evaluate(garden, focusPlacementId, plantsById)) {
      const key = [focusPlacementId, violation.placementId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      combined.push({ ...violation, focusPlacementId, focusPlant })
    }
  }

  return combined
}

export function evaluateSpacingForFocuses(
  garden: GardenState,
  placementIds: string[],
  plantsById: Record<string, Plant>,
): FocusedSpacingViolation[] {
  return forFocuses(garden, placementIds, plantsById, evaluateSpacing)
}

export function evaluateCrowdingForFocuses(
  garden: GardenState,
  placementIds: string[],
  plantsById: Record<string, Plant>,
): FocusedSpacingViolation[] {
  return forFocuses(garden, placementIds, plantsById, evaluateCrowding)
}
