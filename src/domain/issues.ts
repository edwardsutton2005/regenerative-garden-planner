import type { GardenState, SunlightLevel } from './garden'
import { getAllPlacements } from './garden'
import type { Plant } from './plant'
import type { PlantRelationshipRule } from './relationships'
import { evaluateNeighborsForFocuses } from './relationships'
import { evaluateCrowdingForFocuses, evaluateSpacingForFocuses } from './spacing'
import { evaluateSunlightFit } from './sunlightFit'

type Pair = { placementIds: [string, string]; plants: [Plant, Plant] }

export type GardenIssue =
  | (Pair & { kind: 'incompatible'; rule: PlantRelationshipRule | undefined })
  | (Pair & { kind: 'spacing' | 'crowding'; distance: number; requiredDistance: number })
  | { kind: 'sunlight'; placementIds: [string]; plant: Plant; cellSunlight: SunlightLevel }

/**
 * Every current issue in the garden, each reported once: incompatible
 * neighbors, same-species spacing, crowding, and sunlight mismatches. The
 * existing evaluators run with every placement as a focus; they already
 * deduplicate a pair found from both sides.
 */
export function evaluateGardenIssues(
  garden: GardenState,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): GardenIssue[] {
  const ids = getAllPlacements(garden).map((p) => p.id)
  const issues: GardenIssue[] = []

  for (const n of evaluateNeighborsForFocuses(garden, ids, plantsById, rules)) {
    if (n.relationship !== 'incompatible') continue
    issues.push({
      kind: 'incompatible',
      placementIds: [n.focusPlacementId, n.placementId],
      plants: [n.focusPlant, n.plant],
      rule: n.rule,
    })
  }
  const spacing = (kind: 'spacing' | 'crowding', found: ReturnType<typeof evaluateSpacingForFocuses>) =>
    found.forEach((v) =>
      issues.push({
        kind,
        placementIds: [v.focusPlacementId, v.placementId],
        plants: [v.focusPlant, v.plant],
        distance: v.distance,
        requiredDistance: v.requiredDistance,
      }),
    )
  spacing('spacing', evaluateSpacingForFocuses(garden, ids, plantsById))
  spacing('crowding', evaluateCrowdingForFocuses(garden, ids, plantsById))
  for (const id of ids) {
    const fit = evaluateSunlightFit(garden, id, plantsById)
    if (fit?.status === 'mismatch') {
      issues.push({ kind: 'sunlight', placementIds: [id], plant: fit.plant, cellSunlight: fit.cellSunlight! })
    }
  }
  return issues
}
