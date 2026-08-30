import type { GardenState } from './garden'
import { getAllPlacements } from './garden'
import type { EcologicalRole, Plant } from './plant'
import { ECOLOGICAL_ROLES } from './plant'

export type RoleComposition = {
  role: EcologicalRole
  plantIds: string[]
}

/**
 * Which curated ecological roles are currently represented across the whole
 * garden, and which unique plant types provide each one. An observation,
 * not a judgment — an omitted role only means nothing placed provides it,
 * and repeated placements of one plant still count as a single provider.
 *
 * Whole-garden by construction (built from getAllPlacements, not a focus
 * list): composition must reflect the entire current garden on every
 * render, unlike the incremental *ForFocuses evaluators used elsewhere for
 * transient per-placement feedback.
 */
export function evaluateGardenComposition(
  garden: GardenState,
  plantsById: Record<string, Plant>,
): RoleComposition[] {
  const plantIdsByRole = new Map<EcologicalRole, Set<string>>()

  for (const { plantId } of getAllPlacements(garden)) {
    const plant = plantsById[plantId]
    if (!plant) continue // unknown plant id — ignore defensively, as evaluateNeighbors does

    for (const role of plant.ecologicalRoles) {
      if (!plantIdsByRole.has(role)) plantIdsByRole.set(role, new Set())
      plantIdsByRole.get(role)!.add(plant.id)
    }
  }

  return ECOLOGICAL_ROLES.filter((role) => plantIdsByRole.has(role)).map((role) => ({
    role,
    plantIds: [...plantIdsByRole.get(role)!].sort(),
  }))
}
