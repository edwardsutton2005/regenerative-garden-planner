import { describe, expect, it } from 'vitest'
import { evaluateGardenComposition } from './composition'
import { createGarden, placePlant, removePlant, type GardenState } from './garden'
import type { Plant } from './plant'

const bushBean: Plant = {
  id: 'bush-bean',
  name: 'Bush Bean',
  category: 'vegetable',
  minimumSpacingCells: 2,
  lifecycle: 'annual',
  ecologicalRoles: ['nitrogen-fixation'],
}
const pea: Plant = {
  id: 'pea',
  name: 'Pea',
  category: 'vegetable',
  minimumSpacingCells: 2,
  lifecycle: 'annual',
  ecologicalRoles: ['nitrogen-fixation'],
}
const marigold: Plant = {
  id: 'marigold',
  name: 'Marigold',
  category: 'flower',
  minimumSpacingCells: 1,
  lifecycle: 'annual',
  ecologicalRoles: ['pollinator-support'],
}
const carrot: Plant = {
  id: 'carrot',
  name: 'Carrot',
  category: 'vegetable',
  minimumSpacingCells: 1,
  lifecycle: 'biennial',
  ecologicalRoles: [],
}
// Local-only fixture: no production seed plant currently carries two roles.
const clover: Plant = {
  id: 'clover',
  name: 'Clover',
  category: 'flower',
  minimumSpacingCells: 1,
  lifecycle: 'perennial',
  ecologicalRoles: ['nitrogen-fixation', 'pollinator-support'],
}

const plantsById: Record<string, Plant> = { 'bush-bean': bushBean, pea, marigold, carrot, clover }

describe('evaluateGardenComposition', () => {
  it('returns nothing for an empty garden', () => {
    expect(evaluateGardenComposition(createGarden(4, 4), plantsById)).toEqual([])
  })

  it('returns nothing when placed plants carry no ecological roles', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'carrot')
    expect(evaluateGardenComposition(garden, plantsById)).toEqual([])
  })

  it('reports a single represented role', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'bush-bean')
    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'nitrogen-fixation', plantIds: ['bush-bean'] },
    ])
  })

  it('reports multiple represented roles in canonical order', () => {
    let garden = createGarden(4, 4)
    garden = placePlant(garden, 0, 0, 'bush-bean')
    garden = placePlant(garden, 0, 1, 'marigold')

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'pollinator-support', plantIds: ['marigold'] },
      { role: 'nitrogen-fixation', plantIds: ['bush-bean'] },
    ])
  })

  it('lists multiple plant types that provide the same role, sorted by id', () => {
    let garden = createGarden(4, 4)
    garden = placePlant(garden, 0, 0, 'bush-bean')
    garden = placePlant(garden, 0, 1, 'pea')

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'nitrogen-fixation', plantIds: ['bush-bean', 'pea'] },
    ])
  })

  it('deduplicates repeated placements of the same plant type', () => {
    let garden = createGarden(4, 4)
    garden = placePlant(garden, 0, 0, 'bush-bean')
    garden = placePlant(garden, 1, 1, 'bush-bean')
    garden = placePlant(garden, 2, 2, 'bush-bean')

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'nitrogen-fixation', plantIds: ['bush-bean'] },
    ])
  })

  it('lists a plant under every role it carries', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'clover')

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'pollinator-support', plantIds: ['clover'] },
      { role: 'nitrogen-fixation', plantIds: ['clover'] },
    ])
  })

  it('produces the same result regardless of placement order', () => {
    let gardenA = createGarden(4, 4)
    gardenA = placePlant(gardenA, 0, 0, 'pea')
    gardenA = placePlant(gardenA, 0, 1, 'bush-bean')

    let gardenB = createGarden(4, 4)
    gardenB = placePlant(gardenB, 0, 1, 'bush-bean')
    gardenB = placePlant(gardenB, 0, 0, 'pea')
    gardenB = removePlant(gardenB, 0, 0)
    gardenB = placePlant(gardenB, 0, 0, 'pea')

    expect(evaluateGardenComposition(gardenA, plantsById)).toEqual(
      evaluateGardenComposition(gardenB, plantsById),
    )
  })

  it('omits an unrepresented role entirely rather than flagging it as missing', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'marigold')
    const result = evaluateGardenComposition(garden, plantsById)

    expect(result).toHaveLength(1)
    expect(result.find((r) => r.role === 'nitrogen-fixation')).toBeUndefined()
  })

  it('ignores a placement whose plant id is not in plantsById', () => {
    const garden: GardenState = {
      ...createGarden(4, 4),
      placements: { '0,0': { plantId: 'unknown-plant' } },
    }

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([])
  })
})
