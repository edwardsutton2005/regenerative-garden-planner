import type { CellCoordinate, GardenState } from './garden'
import { getAdjacentCoordinates, getPlantIdAt } from './garden'
import type { Plant } from './plant'

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

export type NeighborRelationship = {
  coordinate: CellCoordinate
  plant: Plant
  relationship: PlantRelationshipType | 'neutral'
}

/**
 * Classifies the relationship between the plant at (row, col) and each
 * occupied, immediately-adjacent cell. Only looks at that one cell's
 * neighbors, not the whole garden.
 */
export function evaluateNeighbors(
  garden: GardenState,
  row: number,
  col: number,
  plantId: string,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): NeighborRelationship[] {
  return getAdjacentCoordinates(garden, row, col)
    .map((coordinate) => {
      const neighborPlantId = getPlantIdAt(garden, coordinate.row, coordinate.col)
      const neighborPlant = neighborPlantId ? plantsById[neighborPlantId] : undefined
      if (!neighborPlant) return null

      return {
        coordinate,
        plant: neighborPlant,
        relationship: getRelationship(plantId, neighborPlantId!, rules),
      }
    })
    .filter((entry): entry is NeighborRelationship => entry !== null)
}

export type FocusedNeighborRelationship = NeighborRelationship & {
  focusCoordinate: CellCoordinate
  focusPlant: Plant
}

/**
 * Like evaluateNeighbors, but for more than one focus placement at once —
 * e.g. both cells changed by a garden-to-garden swap, which each may have
 * gained a new companion/incompatible consequence. Composes the existing
 * single-focus evaluateNeighbors rather than reimplementing it.
 *
 * If two focus coordinates are themselves adjacent, evaluating both would
 * independently rediscover the same real pair from each side. That's
 * deduplicated by an identity of (relationship type + the unordered pair of
 * cells involved) so a genuinely different finding between the same two
 * cells is never possible to conflate with it.
 */
export function evaluateNeighborsForFocuses(
  garden: GardenState,
  focuses: { coordinate: CellCoordinate; plantId: string }[],
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): FocusedNeighborRelationship[] {
  const seen = new Set<string>()
  const combined: FocusedNeighborRelationship[] = []

  for (const focus of focuses) {
    const focusPlant = plantsById[focus.plantId]
    if (!focusPlant) continue

    const results = evaluateNeighbors(
      garden,
      focus.coordinate.row,
      focus.coordinate.col,
      focus.plantId,
      plantsById,
      rules,
    )

    for (const result of results) {
      const pair = [
        `${focus.coordinate.row},${focus.coordinate.col}`,
        `${result.coordinate.row},${result.coordinate.col}`,
      ]
        .sort()
        .join('|')
      const key = `${result.relationship}:${pair}`
      if (seen.has(key)) continue
      seen.add(key)
      combined.push({ ...result, focusCoordinate: focus.coordinate, focusPlant })
    }
  }

  return combined
}
