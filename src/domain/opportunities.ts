import { evaluateGardenComposition } from './composition'
import type { GardenState } from './garden'
import { getAllBeds, getPlacement, getPlacementsInBed } from './garden'
import type { EcologicalRole, Plant } from './plant'
import { ECOLOGICAL_ROLES } from './plant'
import { evaluateNeighbors, getRelationship } from './relationships'
import type { PlantRelationshipRule } from './relationships'

export type RoleSuggestion = {
  role: EcologicalRole
  /** Catalogue plants that provide the role, sorted by id. */
  candidatePlantIds: string[]
}

/**
 * Roles whose benefit stays where the plant grows, so they are suggested per
 * bed. Nitrogen from legumes enriches their own bed's soil, mostly once the
 * plants break down; pollinators and beneficial insects roam the whole
 * garden, so those stay garden-wide.
 */
export const BED_SCOPED_ROLES: readonly EcologicalRole[] = ['nitrogen-fixation']

/** Each bed with at least one known plant, with the plant ids in it. */
export function plantedBeds(garden: GardenState, plantsById: Record<string, Plant>) {
  return getAllBeds(garden)
    .map((bed) => ({
      bedId: bed.id,
      plantIds: new Set(
        getPlacementsInBed(garden, bed.id)
          .map((p) => p.plantId)
          .filter((id) => plantsById[id]),
      ),
    }))
    .filter((bed) => bed.plantIds.size > 0)
}

/** Whether `plantId` clashes with nothing already in the bed. */
function fitsBed(plantId: string, bedPlantIds: Set<string>, rules: PlantRelationshipRule[]) {
  return [...bedPlantIds].every((id) => getRelationship(plantId, id, rules) !== 'incompatible')
}

/**
 * Garden-wide suggestions, shown only when the person asks for them: for
 * each curated role that nothing placed provides, the catalogue plants that
 * do. Absence is not a deficiency (PRODUCT.md Part 2D), which is why the UI
 * keeps these behind a switch. A role no catalogue plant provides is
 * skipped. Bed-scoped roles are left to evaluateBedRoleSuggestions once any
 * bed holds plants.
 */
export function evaluateRoleSuggestions(
  garden: GardenState,
  plantsById: Record<string, Plant>,
): RoleSuggestion[] {
  const represented = new Set(evaluateGardenComposition(garden, plantsById).map((c) => c.role))
  const bedsTakeOver = plantedBeds(garden, plantsById).length > 0
  return ECOLOGICAL_ROLES.filter(
    (role) => !represented.has(role) && !(bedsTakeOver && BED_SCOPED_ROLES.includes(role)),
  )
    .map((role) => ({ role, candidatePlantIds: providersOf(role, plantsById) }))
    .filter((suggestion) => suggestion.candidatePlantIds.length > 0)
}

function providersOf(role: EcologicalRole, plantsById: Record<string, Plant>): string[] {
  return Object.values(plantsById)
    .filter((plant) => plant.ecologicalRoles.includes(role))
    .map((plant) => plant.id)
    .sort()
}

export type BedRoleSuggestion = {
  role: EcologicalRole
  /** Planted beds without the role, in bed order. */
  bedIds: string[]
  /** Providers that clash with nothing in any of those beds, sorted by id. */
  candidatePlantIds: string[]
}

/**
 * For each bed-scoped role, the planted beds that lack it and the providers
 * that would suit them. A provider that clashes with something in a bed is
 * never offered for it, and a bed no provider suits is left out. Beds that
 * suit different providers get separate suggestions, so every listed
 * candidate suits every listed bed.
 */
export function evaluateBedRoleSuggestions(
  garden: GardenState,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): BedRoleSuggestion[] {
  const beds = plantedBeds(garden, plantsById)
  const suggestions: BedRoleSuggestion[] = []
  for (const role of BED_SCOPED_ROLES) {
    const providers = providersOf(role, plantsById)
    const byCandidates = new Map<string, BedRoleSuggestion>()
    for (const bed of beds) {
      if ([...bed.plantIds].some((id) => plantsById[id].ecologicalRoles.includes(role))) continue
      const candidatePlantIds = providers.filter((id) => fitsBed(id, bed.plantIds, rules))
      if (candidatePlantIds.length === 0) continue
      const key = candidatePlantIds.join('|')
      const group = byCandidates.get(key) ?? { role, bedIds: [], candidatePlantIds }
      group.bedIds.push(bed.bedId)
      byCandidates.set(key, group)
    }
    suggestions.push(...byCandidates.values())
  }
  return suggestions
}

export type BedCompanionSuggestion = {
  plantId: string
  /** Beds where the plant would sit with a companion and clash with nothing. */
  bedIds: string[]
  /** The plants already in those beds it is a companion of, sorted by id. */
  companionOfPlantIds: string[]
}

/**
 * Catalogue plants worth adding to beds: a plant suits a bed when the bed
 * doesn't already have it, it is a modeled companion of at least one plant
 * there, and it clashes with none. Ordered by how many beds it suits, then
 * by id.
 */
export function evaluateBedCompanionSuggestions(
  garden: GardenState,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): BedCompanionSuggestion[] {
  const beds = plantedBeds(garden, plantsById)
  const suggestions: BedCompanionSuggestion[] = []
  for (const plantId of Object.keys(plantsById).sort()) {
    const bedIds: string[] = []
    const companions = new Set<string>()
    for (const bed of beds) {
      if (bed.plantIds.has(plantId) || !fitsBed(plantId, bed.plantIds, rules)) continue
      const helped = [...bed.plantIds].filter(
        (id) => getRelationship(plantId, id, rules) === 'companion',
      )
      if (helped.length === 0) continue
      bedIds.push(bed.bedId)
      helped.forEach((id) => companions.add(id))
    }
    if (bedIds.length > 0) {
      suggestions.push({ plantId, bedIds, companionOfPlantIds: [...companions].sort() })
    }
  }
  return suggestions.sort((a, b) => b.bedIds.length - a.bedIds.length)
}

export type LocalCompanionOpportunity = {
  candidatePlantIds: string[]
}

/**
 * For the given placement: if it has no modeled companion within the
 * interaction distance, which other catalogue plants have a modeled
 * companion relationship with it. GardenState is the sole source of truth
 * for what's placed — the plant id is derived from the placement, never
 * passed independently, so this can't drift from what's actually placed.
 *
 * Reuses evaluateNeighbors/getRelationship rather than reimplementing
 * proximity or relationship symmetry. Returns null when there's no
 * opportunity to show: the placement or its plant id is unknown, it
 * already has a nearby companion, or there are no companion candidates.
 */
export function evaluateCompanionOpportunityForPlacement(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): LocalCompanionOpportunity | null {
  const plantId = getPlacement(garden, placementId)?.plantId
  if (!plantId || !plantsById[plantId]) return null

  const hasNearbyCompanion = evaluateNeighbors(garden, placementId, plantsById, rules).some(
    (n) => n.relationship === 'companion',
  )
  if (hasNearbyCompanion) return null

  const candidatePlantIds = Object.keys(plantsById)
    .filter((id) => id !== plantId)
    .filter((id) => getRelationship(plantId, id, rules) === 'companion')
    .sort()

  return candidatePlantIds.length > 0 ? { candidatePlantIds } : null
}
