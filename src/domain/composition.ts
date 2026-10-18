import type { GardenState } from './garden'
import { getAllPlacements } from './garden'
import type { EcologicalRole, Plant, PlantCategory, PlantFamily, PlantLifecycle } from './plant'
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

export type GardenDiversity = {
  /** Distinct plant types placed. */
  plantTypes: number
  /** Distinct botanical families, sorted. Plants without a family are left out. */
  families: PlantFamily[]
  /** Plant types per category and per lifecycle; zero counts are omitted. */
  categories: Partial<Record<PlantCategory, number>>
  lifecycles: Partial<Record<PlantLifecycle, number>>
}

/**
 * How varied the garden is, by distinct plant type: how many types, which
 * families, and the category and lifecycle mix. Descriptive like role
 * composition — counts of kinds of plant, never a score — and repeated
 * placements of one plant count once.
 */
export function evaluateGardenDiversity(
  garden: GardenState,
  plantsById: Record<string, Plant>,
): GardenDiversity {
  const placed = new Map<string, Plant>()
  for (const { plantId } of getAllPlacements(garden)) {
    const plant = plantsById[plantId]
    if (plant) placed.set(plant.id, plant)
  }

  const families = new Set<PlantFamily>()
  const categories: GardenDiversity['categories'] = {}
  const lifecycles: GardenDiversity['lifecycles'] = {}
  for (const plant of placed.values()) {
    if (plant.family) families.add(plant.family)
    categories[plant.category] = (categories[plant.category] ?? 0) + 1
    lifecycles[plant.lifecycle] = (lifecycles[plant.lifecycle] ?? 0) + 1
  }

  return { plantTypes: placed.size, families: [...families].sort(), categories, lifecycles }
}
