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

  const rule = rules.find(
    (r) =>
      (r.plantAId === plantAId && r.plantBId === plantBId) ||
      (r.plantAId === plantBId && r.plantBId === plantAId),
  )

  return rule?.relationship ?? 'neutral'
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
