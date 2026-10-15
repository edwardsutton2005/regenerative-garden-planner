import { describe, expect, it } from 'vitest'
import { evaluateSunlightFit } from './sunlightFit'
import { createGarden, placePlant, setSunlightAt } from './garden'
import type { GardenState, Position } from './garden'
import type { Plant } from './plant'

// Center of a 12" cell — where the current UI snaps placements. Placement
// ids in these tests are the "row,col" they were placed at.
function at(row: number, col: number): Position {
  return { x: col * 12 + 6, y: row * 12 + 6 }
}

describe('evaluateSunlightFit', () => {
  const tomato: Plant = {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
    sunlightRequirement: ['full-sun'],
  }
  const lettuce: Plant = {
    id: 'lettuce',
    name: 'Lettuce',
    category: 'vegetable',
    spacingInches: { min: 12, max: 12 },
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
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'biennial',
    ecologicalRoles: [],
  }
  const plantsById: Record<string, Plant> = { tomato, lettuce, carrot }

  it('returns null for an unknown placement id', () => {
    const garden = createGarden(48, 48)
    expect(evaluateSunlightFit(garden, 'missing', plantsById)).toBeNull()
  })

  it('returns null for an unknown placement id in an empty garden', () => {
    const garden = createGarden(48, 48)
    expect(evaluateSunlightFit(garden, '0,0', plantsById)).toBeNull()
  })

  it('returns null when the placed plant id is unknown to plantsById', () => {
    const garden: GardenState = {
      ...createGarden(48, 48),
      placements: { '0,0': { id: '0,0', plantId: 'unknown-plant', position: at(0, 0) } },
    }
    expect(evaluateSunlightFit(garden, '0,0', plantsById)).toBeNull()
  })

  it('reports fit when the cell sunlight is in the plant’s accepted set', () => {
    let garden = placePlant(createGarden(48, 48), '0,0', 'tomato', at(0, 0))
    garden = setSunlightAt(garden, 0, 0, 'full-sun')
    expect(evaluateSunlightFit(garden, '0,0', plantsById)).toEqual({
      placementId: '0,0',
      plant: tomato,
      cellSunlight: 'full-sun',
      status: 'fit',
    })
  })

  it('reports fit for any level in a multi-level accepted set', () => {
    let garden = placePlant(createGarden(48, 48), '0,0', 'lettuce', at(0, 0))
    garden = setSunlightAt(garden, 0, 0, 'partial-sun')
    expect(evaluateSunlightFit(garden, '0,0', plantsById)?.status).toBe('fit')
  })

  it('reports mismatch when the cell sunlight is modeled but outside the accepted set', () => {
    let garden = placePlant(createGarden(48, 48), '0,0', 'tomato', at(0, 0))
    garden = setSunlightAt(garden, 0, 0, 'shade')
    expect(evaluateSunlightFit(garden, '0,0', plantsById)).toEqual({
      placementId: '0,0',
      plant: tomato,
      cellSunlight: 'shade',
      status: 'mismatch',
    })
  })

  it('treats levels categorically, not as an ordered scale', () => {
    // 'partial-sun' sits "between" full-sun and shade on no scale the
    // evaluator recognizes — it is simply absent from tomato's set.
    let garden = placePlant(createGarden(48, 48), '0,0', 'tomato', at(0, 0))
    garden = setSunlightAt(garden, 0, 0, 'partial-sun')
    expect(evaluateSunlightFit(garden, '0,0', plantsById)?.status).toBe('mismatch')
  })

  it('reports unmodeled-cell when the plant has a requirement but the cell has no modeled sunlight', () => {
    const garden = placePlant(createGarden(48, 48), '0,0', 'tomato', at(0, 0))
    expect(evaluateSunlightFit(garden, '0,0', plantsById)).toEqual({
      placementId: '0,0',
      plant: tomato,
      cellSunlight: undefined,
      status: 'unmodeled-cell',
    })
  })

  it('reports unmodeled-requirement when the plant has no curated sunlight requirement, even if the cell is modeled', () => {
    let garden = placePlant(createGarden(48, 48), '0,0', 'carrot', at(0, 0))
    garden = setSunlightAt(garden, 0, 0, 'full-sun')
    expect(evaluateSunlightFit(garden, '0,0', plantsById)).toEqual({
      placementId: '0,0',
      plant: carrot,
      cellSunlight: 'full-sun',
      status: 'unmodeled-requirement',
    })
  })

  it('reads sunlight from the environmental cell containing a non-grid position', () => {
    let garden = placePlant(createGarden(48, 48), 'p', 'tomato', { x: 31.4, y: 27.8 })
    garden = setSunlightAt(garden, 2, 2, 'shade')
    expect(evaluateSunlightFit(garden, 'p', plantsById)?.cellSunlight).toBe('shade')
  })

  it('reads a position on a cell boundary from the cell below/right', () => {
    let garden = placePlant(createGarden(48, 48), 'p', 'tomato', { x: 12, y: 12 })
    garden = setSunlightAt(garden, 0, 0, 'shade')
    garden = setSunlightAt(garden, 1, 1, 'full-sun')
    expect(evaluateSunlightFit(garden, 'p', plantsById)?.status).toBe('fit')
  })

  it('never reports mismatch when either side is unmodeled', () => {
    const garden = placePlant(createGarden(48, 48), '0,0', 'carrot', at(0, 0))
    const result = evaluateSunlightFit(garden, '0,0', plantsById)
    expect(result?.status).not.toBe('mismatch')
    expect(result?.status).toBe('unmodeled-requirement')
  })
})
