import type { GardenState } from './garden'
import { distance, getAllPlacements, getPlacement } from './garden'
import type { Plant } from './plant'
import type { SourceId } from './source'

export type PlantRelationshipType = 'companion' | 'incompatible'

/**
 * A single, order-independent relationship between two plants. Each real
 * relationship should be authored once; `getRelationship` matches it
 * regardless of which id is passed as A and which as B.
 */
export type PlantRelationshipRule = {
  plantAId: string
  plantBId: string
  relationship: PlantRelationshipType
  /**
   * Claim-level source evidence for this specific pair, present only where
   * actually recorded. Absence means no source has been attributed yet, not
   * that the relationship is unsupported. Never read by getRelationship or
   * evaluateNeighbors — see ARCHITECTURE.md "Knowledge Provenance Is
   * Separate From Reasoning."
   */
  sourceIds?: SourceId[]
}

export function getRelationship(
  plantAId: string,
  plantBId: string,
  rules: PlantRelationshipRule[],
): PlantRelationshipType | 'neutral' {
  if (plantAId === plantBId) return 'neutral'

  const matching = rules.filter(
    (r) =>
      (r.plantAId === plantAId && r.plantBId === plantBId) ||
      (r.plantAId === plantBId && r.plantBId === plantAId),
  )

  if (matching.length === 0) return 'neutral'

  // If a pair is ever declared as both companion and incompatible (it
  // shouldn't be — the seed data is validated separately to catch that),
  // incompatible wins, order-independently. This is a defensive runtime
  // fallback, not license for the source data to actually conflict.
  return matching.some((r) => r.relationship === 'incompatible')
    ? 'incompatible'
    : 'companion'
}

/**
 * Companion/incompatible interaction distance, in inches (inclusive). A
 * product rule that preserves V1's orthogonal-adjacency behavior under 12"
 * snapping (orthogonal neighbors are 12" apart, diagonal ~16.97"), not a
 * horticulturally sourced distance. See ARCHITECTURE.md "Relationships".
 */
export const COMPANION_INTERACTION_DISTANCE = 12

export type NeighborRelationship = {
  placementId: string
  plant: Plant
  distance: number
  relationship: PlantRelationshipType | 'neutral'
}

/**
 * Classifies the relationship between the given placement and every other
 * placement within COMPANION_INTERACTION_DISTANCE of it. The focus plant is
 * derived from GardenState, never passed in. Returns [] for an unknown
 * placement or plant id; neighbors with unknown plant ids are skipped.
 */
export function evaluateNeighbors(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): NeighborRelationship[] {
  const focus = getPlacement(garden, placementId)
  if (!focus || !plantsById[focus.plantId]) return []

  const neighbors: NeighborRelationship[] = []
  for (const other of getAllPlacements(garden)) {
    if (other.id === focus.id) continue
    const plant = plantsById[other.plantId]
    if (!plant) continue

    const d = distance(focus.position, other.position)
    if (d > COMPANION_INTERACTION_DISTANCE) continue

    neighbors.push({
      placementId: other.id,
      plant,
      distance: d,
      relationship: getRelationship(focus.plantId, other.plantId, rules),
    })
  }
  return neighbors
}

export type FocusedNeighborRelationship = NeighborRelationship & {
  focusPlacementId: string
  focusPlant: Plant
}

/**
 * Like evaluateNeighbors, but for more than one focus placement at once —
 * e.g. both placements changed by a swap. Composes evaluateNeighbors rather
 * than reimplementing it.
 *
 * Two focuses within interaction distance of each other would independently
 * rediscover the same real pair from each side, so findings are
 * deduplicated by (relationship type + the unordered pair of placement ids).
 */
export function evaluateNeighborsForFocuses(
  garden: GardenState,
  placementIds: string[],
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): FocusedNeighborRelationship[] {
  const seen = new Set<string>()
  const combined: FocusedNeighborRelationship[] = []

  for (const focusPlacementId of placementIds) {
    const focus = getPlacement(garden, focusPlacementId)
    const focusPlant = focus ? plantsById[focus.plantId] : undefined
    if (!focusPlant) continue

    for (const result of evaluateNeighbors(garden, focusPlacementId, plantsById, rules)) {
      const pair = [focusPlacementId, result.placementId].sort().join('|')
      const key = `${result.relationship}:${pair}`
      if (seen.has(key)) continue
      seen.add(key)
      combined.push({ ...result, focusPlacementId, focusPlant })
    }
  }

  return combined
}
