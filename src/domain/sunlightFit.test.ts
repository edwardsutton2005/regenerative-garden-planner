import { describe, expect, it } from 'vitest'
import { evaluateSunlightFit } from './sunlightFit'
import { createGarden, placePlant, setSunlightAt } from './garden'
import type { GardenState } from './garden'
import type { Plant } from './plant'

describe('evaluateSunlightFit', () => {
  const tomato: Plant = {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    minimumSpacingCells: 4,
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
  }
  const lettuce: Plant = {
    id: 'lettuce',
    name: 'Lettuce',
    category: 'vegetable',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun', 'partial-sun'],
  }
  // No sunlightRequirement — represents a plant whose sunlight requirement
  // has not been curated yet.
  const carrot: Plant = {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    minimumSpacingCells: 1,
    lifecycle: 'biennial',
    ecologicalRoles: [],
  }
  const plantsById: Record<string, Plant> = { tomato, lettuce, carrot }

  it('returns null for an out-of-bounds coordinate', () => {
    const garden = createGarden(4, 4)
    expect(evaluateSunlightFit(garden, 99, 99, plantsById)).toBeNull()
  })

  it('returns null for an empty cell', () => {
    const garden = createGarden(4, 4)
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)).toBeNull()
  })

  it('returns null when the placed plant id is unknown to plantsById', () => {
    const garden: GardenState = {
      ...createGarden(4, 4),
      placements: { '0,0': { plantId: 'unknown-plant' } },
    }
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)).toBeNull()
  })

  it('reports fit when the cell sunlight is in the plant’s accepted set', () => {
    let garden = placePlant(createGarden(4, 4), 0, 0, 'tomato')
    garden = setSunlightAt(garden, 0, 0, 'full-sun')
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)).toEqual({
      coordinate: { row: 0, col: 0 },
      plant: tomato,
      cellSunlight: 'full-sun',
      status: 'fit',
    })
  })

  it('reports fit for any level in a multi-level accepted set', () => {
    let garden = placePlant(createGarden(4, 4), 0, 0, 'lettuce')
    garden = setSunlightAt(garden, 0, 0, 'partial-sun')
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)?.status).toBe('fit')
  })

  it('reports mismatch when the cell sunlight is modeled but outside the accepted set', () => {
    let garden = placePlant(createGarden(4, 4), 0, 0, 'tomato')
    garden = setSunlightAt(garden, 0, 0, 'shade')
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)).toEqual({
      coordinate: { row: 0, col: 0 },
      plant: tomato,
      cellSunlight: 'shade',
      status: 'mismatch',
    })
  })

  it('treats levels categorically, not as an ordered scale', () => {
    // 'partial-sun' sits "between" full-sun and shade on no scale the
    // evaluator recognizes — it is simply absent from tomato's set.
    let garden = placePlant(createGarden(4, 4), 0, 0, 'tomato')
    garden = setSunlightAt(garden, 0, 0, 'partial-sun')
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)?.status).toBe('mismatch')
  })

  it('reports unmodeled-cell when the plant has a requirement but the cell has no modeled sunlight', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'tomato')
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)).toEqual({
      coordinate: { row: 0, col: 0 },
      plant: tomato,
      cellSunlight: undefined,
      status: 'unmodeled-cell',
    })
  })

  it('reports unmodeled-requirement when the plant has no curated sunlight requirement, even if the cell is modeled', () => {
    let garden = placePlant(createGarden(4, 4), 0, 0, 'carrot')
    garden = setSunlightAt(garden, 0, 0, 'full-sun')
    expect(evaluateSunlightFit(garden, 0, 0, plantsById)).toEqual({
      coordinate: { row: 0, col: 0 },
      plant: carrot,
      cellSunlight: 'full-sun',
      status: 'unmodeled-requirement',
    })
  })

  it('never reports mismatch when either side is unmodeled', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'carrot')
    const result = evaluateSunlightFit(garden, 0, 0, plantsById)
    expect(result?.status).not.toBe('mismatch')
    expect(result?.status).toBe('unmodeled-requirement')
  })
})
