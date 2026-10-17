import { describe, expect, it } from 'vitest'
import { addBed, createGarden, placePlant, setSunlightAt } from './domain/garden'
import { DEFAULT_GARDEN_NAME, PLAN_SCHEMA_VERSION, parsePlan, serializePlan } from './gardenPlan'
import type { GardenPlan } from './gardenPlan'

function samplePlan(): GardenPlan {
  let garden = createGarden(120, 96)
  garden = addBed(garden, 'bed-1', 'Bed 1', { position: { x: 12, y: 12 }, width: 48, height: 24 })
  garden = setSunlightAt(garden, 1, 2, 'partial-sun')
  garden = placePlant(garden, 'p1', 'tomato', { x: 24, y: 18 })
  garden = placePlant(garden, 'p2', 'basil', { x: 31.4, y: 67.8 })
  return { name: 'Back yard', garden, inventory: ['tomato', 'basil'] }
}

// A saved plan as raw JSON data, for tampering with in tests.
function savedData(): Record<string, unknown> & { garden: Record<string, unknown> } {
  return JSON.parse(serializePlan(samplePlan()))
}

describe('parsePlan', () => {
  it('round-trips a plan exactly', () => {
    const plan = samplePlan()
    expect(parsePlan(serializePlan(plan))).toEqual({ plan, droppedPlacements: 0 })
  })

  it('records the schema version', () => {
    expect(savedData().schemaVersion).toBe(PLAN_SCHEMA_VERSION)
  })

  it('discards malformed JSON, an unknown version, or an invalid garden', () => {
    expect(parsePlan('{not json')).toBeNull()
    expect(parsePlan('null')).toBeNull()
    expect(parsePlan(JSON.stringify({ ...savedData(), schemaVersion: 99 }))).toBeNull()

    const badSize = savedData()
    badSize.garden.width = 50 // not a multiple of the 12-inch cell
    expect(parsePlan(JSON.stringify(badSize))).toBeNull()

    const noPlacements = savedData()
    delete noPlacements.garden.placements
    expect(parsePlan(JSON.stringify(noPlacements))).toBeNull()
  })

  it('drops placements of plants no longer in the catalog, and counts them', () => {
    const data = savedData()
    const placements = data.garden.placements as Record<string, unknown>
    placements.gone = { id: 'gone', plantId: 'not-a-plant', position: { x: 5, y: 5 } }
    placements.outside = { id: 'outside', plantId: 'tomato', position: { x: 500, y: 5 } }

    const loaded = parsePlan(JSON.stringify(data))
    expect(loaded?.droppedPlacements).toBe(2)
    expect(Object.keys(loaded!.plan.garden.placements).sort()).toEqual(['p1', 'p2'])
  })

  it('skips invalid beds and sunlight cells without discarding the plan', () => {
    const data = savedData()
    const beds = data.garden.beds as Record<string, unknown>
    // Overlaps Bed 1.
    beds.overlap = { id: 'overlap', name: 'Bed 2', position: { x: 24, y: 12 }, width: 24, height: 24 }
    const env = data.garden.environment as { sunlightByCell: Record<string, unknown> }
    env.sunlightByCell['0,0'] = 'blazing'
    env.sunlightByCell['99,99'] = 'shade'

    const garden = parsePlan(JSON.stringify(data))!.plan.garden
    expect(Object.keys(garden.beds)).toEqual(['bed-1'])
    expect(garden.environment.sunlightByCell).toEqual({ '1,2': 'partial-sun' })
  })

  it('cleans the name and inventory', () => {
    const data = savedData()
    data.name = '   '
    data.inventory = ['tomato', 'tomato', 'not-a-plant', 7, 'basil']

    const plan = parsePlan(JSON.stringify(data))!.plan
    expect(plan.name).toBe(DEFAULT_GARDEN_NAME)
    expect(plan.inventory).toEqual(['tomato', 'basil'])
  })
})
