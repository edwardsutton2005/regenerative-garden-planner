import { evaluateGardenComposition } from './composition'
import type { GardenState } from './garden'
import { getPlantIdAt, isValidCoordinate } from './garden'
import type { Plant } from './plant'
import { evaluateNeighbors, getRelationship } from './relationships'
import type { PlantRelationshipRule } from './relationships'

export type GardenOpportunityType = 'pollinator-support-absent'

export type GardenOpportunity = {
  type: GardenOpportunityType
}

/**
 * Garden-wide opportunities. A specific, hand-authored policy — not "for
 * every absent role, recommend it." Currently the only policy: pollinator
 * support is worth considering if nothing currently placed represents it.
 * Nitrogen-fixation absence is deliberately not surfaced; that would need
 * its own explicit policy decision, not a generalization of this one.
 */
export function evaluateGardenOpportunities(
  garden: GardenState,
  plantsById: Record<string, Plant>,
): GardenOpportunity[] {
  const hasPollinatorSupport = evaluateGardenComposition(garden, plantsById).some(
    (c) => c.role === 'pollinator-support',
  )
  return hasPollinatorSupport ? [] : [{ type: 'pollinator-support-absent' }]
}

export type LocalCompanionOpportunity = {
  candidatePlantIds: string[]
}

/**
 * For the plant actually placed at (row, col): if it has no orthogonally
 * adjacent modeled companion, which other catalogue plants have a modeled
 * companion relationship with it. GardenState is the sole source of truth
 * for what's placed there — the plant id is derived from (row, col), never
 * passed independently, so this can't drift from what's actually placed.
 *
 * Reuses evaluateNeighbors/getRelationship rather than reimplementing
 * adjacency or relationship symmetry. Returns null when there's no
 * opportunity to show: the coordinate is invalid or empty, the placed
 * plant id is unknown, it already has an adjacent companion, or there are
 * no companion candidates at all.
 */
export function evaluateCompanionOpportunityForPlacement(
  garden: GardenState,
  row: number,
  col: number,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): LocalCompanionOpportunity | null {
  if (!isValidCoordinate(garden, row, col)) return null

  const plantId = getPlantIdAt(garden, row, col)
  if (!plantId || !plantsById[plantId]) return null

  const hasAdjacentCompanion = evaluateNeighbors(garden, row, col, plantId, plantsById, rules).some(
    (n) => n.relationship === 'companion',
  )
  if (hasAdjacentCompanion) return null

  const candidatePlantIds = Object.keys(plantsById)
    .filter((id) => id !== plantId)
    .filter((id) => getRelationship(plantId, id, rules) === 'companion')
    .sort()

  return candidatePlantIds.length > 0 ? { candidatePlantIds } : null
}
