import { plants } from './data/plants'
import {
  ENVIRONMENT_CELL_SIZE,
  addBed,
  createGarden,
  isValidGardenDimension,
  placePlant,
  setSunlightAt,
} from './domain/garden'
import type { GardenState, Position, SunlightLevel } from './domain/garden'

/**
 * A garden plan: what gets saved. The garden's facts plus the things that
 * belong with this plan but aren't garden facts (its name and the inventory
 * palette). Undo history is not part of a plan. See ARCHITECTURE.md
 * "Planned Persistence Direction".
 */
export type GardenPlan = {
  name: string
  garden: GardenState
  inventory: string[]
}

export type LoadedPlan = {
  plan: GardenPlan
  /** Saved placements that couldn't be restored, such as a plant no longer
   * in the catalog. */
  droppedPlacements: number
}

/** Bump when the saved shape changes. A save with another version is
 * discarded rather than trusted. */
export const PLAN_SCHEMA_VERSION = 1

export const DEFAULT_GARDEN_NAME = 'My garden'

const STORAGE_KEY = 'regenerative-garden:plan'

const PLANT_IDS: ReadonlySet<string> = new Set(plants.map((plant) => plant.id))
const SUNLIGHT_LEVELS: ReadonlySet<unknown> = new Set<SunlightLevel>([
  'full-sun',
  'partial-sun',
  'shade',
])

export function serializePlan(plan: GardenPlan): string {
  return JSON.stringify({ schemaVersion: PLAN_SCHEMA_VERSION, ...plan })
}

/**
 * Reads a saved plan without trusting it. Anything wrong with its overall
 * shape (bad JSON, unknown version, invalid garden size) discards the whole
 * plan. Individual items are rebuilt through the domain's own operations,
 * so an invalid placement, bed, or sunlight cell is skipped, never loaded.
 */
export function parsePlan(json: string): LoadedPlan | null {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return null
  }
  if (!isRecord(data) || data.schemaVersion !== PLAN_SCHEMA_VERSION) return null

  const saved = data.garden
  if (
    !isRecord(saved) ||
    typeof saved.width !== 'number' ||
    typeof saved.height !== 'number' ||
    !isValidGardenDimension(saved.width) ||
    !isValidGardenDimension(saved.height) ||
    !isRecord(saved.placements) ||
    !isRecord(saved.beds) ||
    !isRecord(saved.environment) ||
    saved.environment.cellSize !== ENVIRONMENT_CELL_SIZE ||
    !isRecord(saved.environment.sunlightByCell)
  ) {
    return null
  }

  let garden = createGarden(saved.width, saved.height)

  for (const bed of Object.values(saved.beds)) {
    if (
      isRecord(bed) &&
      typeof bed.id === 'string' &&
      typeof bed.name === 'string' &&
      isPosition(bed.position) &&
      typeof bed.width === 'number' &&
      typeof bed.height === 'number'
    ) {
      const { x, y } = bed.position
      garden = addBed(garden, bed.id, bed.name, {
        position: { x, y },
        width: bed.width,
        height: bed.height,
      })
    }
  }

  for (const [key, level] of Object.entries(saved.environment.sunlightByCell)) {
    const [row, col] = key.split(',').map(Number)
    if (SUNLIGHT_LEVELS.has(level)) garden = setSunlightAt(garden, row, col, level as SunlightLevel)
  }

  let droppedPlacements = 0
  for (const placement of Object.values(saved.placements)) {
    const next =
      isRecord(placement) &&
      typeof placement.id === 'string' &&
      typeof placement.plantId === 'string' &&
      PLANT_IDS.has(placement.plantId) &&
      isPosition(placement.position)
        ? placePlant(garden, placement.id, placement.plantId, {
            x: placement.position.x,
            y: placement.position.y,
          })
        : garden
    if (next === garden) droppedPlacements++
    garden = next
  }

  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const inventory = Array.isArray(data.inventory)
    ? [...new Set(data.inventory)].filter(
        (id): id is string => typeof id === 'string' && PLANT_IDS.has(id),
      )
    : []

  return {
    plan: { name: name || DEFAULT_GARDEN_NAME, garden, inventory },
    droppedPlacements,
  }
}

// --- browser storage ---------------------------------------------------------
// Storage can be missing, full, or blocked (private windows, site settings),
// so every access is guarded and the planner works without it.

export function loadSavedPlan(): LoadedPlan | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    return json === null ? null : parsePlan(json)
  } catch {
    return null
  }
}

/** Whether this browser lets the planner save at all. Checked once, at
 * startup. */
export function canSavePlans(): boolean {
  try {
    localStorage.setItem(`${STORAGE_KEY}:test`, '1')
    localStorage.removeItem(`${STORAGE_KEY}:test`)
    return true
  } catch {
    return false
  }
}

// ponytail: a failed write (storage full) is silent; surface it if saves
// ever approach the browser's ~5 MB limit.
export function savePlan(plan: GardenPlan): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializePlan(plan))
  } catch {
    // See canSavePlans.
  }
}

export function clearSavedPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing saved to clear.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosition(value: unknown): value is Position {
  return isRecord(value) && Number.isFinite(value.x) && Number.isFinite(value.y)
}
