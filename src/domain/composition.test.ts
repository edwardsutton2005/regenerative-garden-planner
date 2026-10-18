import { describe, expect, it } from 'vitest'
import { evaluateGardenComposition, evaluateGardenDiversity } from './composition'
import { createGarden, placePlant, removePlant, type GardenState, type Position } from './garden'
import type { Plant } from './plant'

// Center of a 12" cell — where the current UI snaps placements. Placement
// ids in these tests are the "row,col" they were placed at.
function at(row: number, col: number): Position {
  return { x: col * 12 + 6, y: row * 12 + 6 }
}

const bushBean: Plant = {
  id: 'bush-bean',
  name: 'Bush Bean',
  category: 'vegetable',
  spacingInches: { min: 12, max: 12 },
  lifecycle: 'annual',
  ecologicalRoles: ['nitrogen-fixation'],
}
const pea: Plant = {
  id: 'pea',
  name: 'Pea',
  category: 'vegetable',
  spacingInches: { min: 12, max: 12 },
  lifecycle: 'annual',
  ecologicalRoles: ['nitrogen-fixation'],
}
const marigold: Plant = {
  id: 'marigold',
  name: 'Marigold',
  category: 'flower',
  spacingInches: { min: 12, max: 12 },
  lifecycle: 'annual',
  ecologicalRoles: ['pollinator-support'],
}
const carrot: Plant = {
  id: 'carrot',
  name: 'Carrot',
  category: 'vegetable',
  spacingInches: { min: 12, max: 12 },
  lifecycle: 'biennial',
  ecologicalRoles: [],
}
// Local-only fixture: no production seed plant currently carries two roles.
const clover: Plant = {
  id: 'clover',
  name: 'Clover',
  category: 'flower',
  spacingInches: { min: 12, max: 12 },
  lifecycle: 'perennial',
  ecologicalRoles: ['nitrogen-fixation', 'pollinator-support'],
}

const plantsById: Record<string, Plant> = { 'bush-bean': bushBean, pea, marigold, carrot, clover }

describe('evaluateGardenComposition', () => {
  it('returns nothing for an empty garden', () => {
    expect(evaluateGardenComposition(createGarden(48, 48), plantsById)).toEqual([])
  })

  it('returns nothing when placed plants carry no ecological roles', () => {
    const garden = placePlant(createGarden(48, 48), '0,0', 'carrot', at(0, 0))
    expect(evaluateGardenComposition(garden, plantsById)).toEqual([])
  })

  it('reports a single represented role', () => {
    const garden = placePlant(createGarden(48, 48), '0,0', 'bush-bean', at(0, 0))
    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'nitrogen-fixation', plantIds: ['bush-bean'] },
    ])
  })

  it('reports multiple represented roles in canonical order', () => {
    let garden = createGarden(48, 48)
    garden = placePlant(garden, '0,0', 'bush-bean', at(0, 0))
    garden = placePlant(garden, '0,1', 'marigold', at(0, 1))

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'pollinator-support', plantIds: ['marigold'] },
      { role: 'nitrogen-fixation', plantIds: ['bush-bean'] },
    ])
  })

  it('lists multiple plant types that provide the same role, sorted by id', () => {
    let garden = createGarden(48, 48)
    garden = placePlant(garden, '0,0', 'bush-bean', at(0, 0))
    garden = placePlant(garden, '0,1', 'pea', at(0, 1))

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'nitrogen-fixation', plantIds: ['bush-bean', 'pea'] },
    ])
  })

  it('deduplicates repeated placements of the same plant type', () => {
    let garden = createGarden(48, 48)
    garden = placePlant(garden, '0,0', 'bush-bean', at(0, 0))
    garden = placePlant(garden, '1,1', 'bush-bean', at(1, 1))
    garden = placePlant(garden, '2,2', 'bush-bean', at(2, 2))

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'nitrogen-fixation', plantIds: ['bush-bean'] },
    ])
  })

  it('lists a plant under every role it carries', () => {
    const garden = placePlant(createGarden(48, 48), '0,0', 'clover', at(0, 0))

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([
      { role: 'pollinator-support', plantIds: ['clover'] },
      { role: 'nitrogen-fixation', plantIds: ['clover'] },
    ])
  })

  it('produces the same result regardless of placement order', () => {
    let gardenA = createGarden(48, 48)
    gardenA = placePlant(gardenA, '0,0', 'pea', at(0, 0))
    gardenA = placePlant(gardenA, '0,1', 'bush-bean', at(0, 1))

    let gardenB = createGarden(48, 48)
    gardenB = placePlant(gardenB, '0,1', 'bush-bean', at(0, 1))
    gardenB = placePlant(gardenB, '0,0', 'pea', at(0, 0))
    gardenB = removePlant(gardenB, '0,0')
    gardenB = placePlant(gardenB, '0,0', 'pea', at(0, 0))

    expect(evaluateGardenComposition(gardenA, plantsById)).toEqual(
      evaluateGardenComposition(gardenB, plantsById),
    )
  })

  it('omits an unrepresented role entirely rather than flagging it as missing', () => {
    const garden = placePlant(createGarden(48, 48), '0,0', 'marigold', at(0, 0))
    const result = evaluateGardenComposition(garden, plantsById)

    expect(result).toHaveLength(1)
    expect(result.find((r) => r.role === 'nitrogen-fixation')).toBeUndefined()
  })

  it('ignores a placement whose plant id is not in plantsById', () => {
    const garden: GardenState = {
      ...createGarden(48, 48),
      placements: { '0,0': { id: '0,0', plantId: 'unknown-plant', position: at(0, 0) } },
    }

    expect(evaluateGardenComposition(garden, plantsById)).toEqual([])
  })
})

describe('evaluateGardenDiversity', () => {
  const withFamilies: Record<string, Plant> = {
    'bush-bean': { ...bushBean, family: 'Fabaceae' },
    pea: { ...pea, family: 'Fabaceae' },
    marigold: { ...marigold, family: 'Asteraceae' },
    carrot, // no family curated
  }

  it('is empty for an empty garden', () => {
    expect(evaluateGardenDiversity(createGarden(), withFamilies)).toEqual({
      plantTypes: 0,
      families: [],
      categories: {},
      lifecycles: {},
    })
  })

  it('counts distinct plant types, families, categories, and lifecycles', () => {
    let garden = placePlant(createGarden(), '0,0', 'bush-bean', at(0, 0))
    garden = placePlant(garden, '0,1', 'bush-bean', at(0, 1))
    garden = placePlant(garden, '0,2', 'pea', at(0, 2))
    garden = placePlant(garden, '0,3', 'marigold', at(0, 3))
    garden = placePlant(garden, '0,4', 'carrot', at(0, 4))
    garden = placePlant(garden, '0,5', 'unknown-plant', at(0, 5))

    expect(evaluateGardenDiversity(garden, withFamilies)).toEqual({
      plantTypes: 4,
      families: ['Asteraceae', 'Fabaceae'],
      categories: { vegetable: 3, flower: 1 },
      lifecycles: { annual: 3, biennial: 1 },
    })
  })
})
