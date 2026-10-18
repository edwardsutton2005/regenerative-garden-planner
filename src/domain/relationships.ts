import type { GardenState } from './garden'
import { distance, getAllPlacements, getPlacement } from './garden'
import type { Plant } from './plant'
import { footprintRadius } from './plant'
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
  /** Why the pair helps or clashes, paraphrasing a source in sourceIds.
   * Absent when no source says why. Display only. */
  reason?: string
  /**
   * Claim-level source evidence for this specific pair, present only where
   * actually recorded. Absence means no source has been attributed yet, not
   * that the relationship is unsupported. Never read by getRelationship or
   * evaluateNeighbors (they only pass the rule along) — see ARCHITECTURE.md
   * "Knowledge Provenance Is Separate From Reasoning."
   */
  sourceIds?: SourceId[]
}

function rulesFor(plantAId: string, plantBId: string, rules: PlantRelationshipRule[]) {
  return rules.filter(
    (r) =>
      (r.plantAId === plantAId && r.plantBId === plantBId) ||
      (r.plantAId === plantBId && r.plantBId === plantAId),
  )
}

/** The rule declaring this relationship for the pair, in either order. */
export function findRule(
  plantAId: string,
  plantBId: string,
  relationship: PlantRelationshipType,
  rules: PlantRelationshipRule[],
): PlantRelationshipRule | undefined {
  return rulesFor(plantAId, plantBId, rules).find((r) => r.relationship === relationship)
}

export function getRelationship(
  plantAId: string,
  plantBId: string,
  rules: PlantRelationshipRule[],
): PlantRelationshipType | 'neutral' {
  if (plantAId === plantBId) return 'neutral'

  const matching = rulesFor(plantAId, plantBId, rules)
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
 * Companion/incompatible interaction gap, in inches (inclusive): how far
 * apart two plants' footprints (see footprintRadius) may be and still
 * count as neighbors, so bigger plants reach farther. A product rule, not a
 * horticulturally sourced distance. See ARCHITECTURE.md "Relationships".
 */
export const COMPANION_INTERACTION_GAP = 12

export type NeighborRelationship = {
  placementId: string
  plant: Plant
  /** Center-to-center distance, in inches. */
  distance: number
  relationship: PlantRelationshipType | 'neutral'
  /** The rule behind a non-neutral relationship, for its reason and sources. */
  rule?: PlantRelationshipRule
}

/**
 * Classifies the relationship between the given placement and every other
 * placement whose footprint is within COMPANION_INTERACTION_GAP of its own.
 * The focus plant is derived from GardenState, never passed in. Returns []
 * for an unknown placement or plant id; neighbors with unknown plant ids
 * are skipped.
 */
export function evaluateNeighbors(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): NeighborRelationship[] {
  const focus = getPlacement(garden, placementId)
  const focusPlant = focus ? plantsById[focus.plantId] : undefined
  if (!focus || !focusPlant) return []

  const neighbors: NeighborRelationship[] = []
  for (const other of getAllPlacements(garden)) {
    if (other.id === focus.id) continue
    const plant = plantsById[other.plantId]
    if (!plant) continue

    const d = distance(focus.position, other.position)
    const gap = d - footprintRadius(focusPlant) - footprintRadius(plant)
    if (gap > COMPANION_INTERACTION_GAP) continue

    const relationship = getRelationship(focus.plantId, other.plantId, rules)
    const rule =
      relationship === 'neutral'
        ? undefined
        : findRule(focus.plantId, other.plantId, relationship, rules)
    neighbors.push({ placementId: other.id, plant, distance: d, relationship, rule })
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
