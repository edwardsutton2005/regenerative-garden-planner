import { describe, expect, it } from 'vitest'
import {
  evaluateCompanionOpportunityForPlacement,
  evaluateGardenOpportunities,
} from './opportunities'
import { createGarden, placePlant } from './garden'
import type { GardenState } from './garden'
import type { Plant } from './plant'
import type { PlantRelationshipRule } from './relationships'

describe('evaluateGardenOpportunities', () => {
  const bushBean: Plant = {
    id: 'bush-bean',
    name: 'Bush Bean',
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
  const plantsById: Record<string, Plant> = { 'bush-bean': bushBean, marigold, carrot }

  it('surfaces the opportunity for an empty garden', () => {
    expect(evaluateGardenOpportunities(createGarden(4, 4), plantsById)).toEqual([
      { type: 'pollinator-support-absent' },
    ])
  })

  it('surfaces the opportunity when only roleless plants are placed', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'carrot')
    expect(evaluateGardenOpportunities(garden, plantsById)).toEqual([
      { type: 'pollinator-support-absent' },
    ])
  })

  it('still surfaces the opportunity when nitrogen-fixation is represented but pollinator-support is not', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'bush-bean')
    expect(evaluateGardenOpportunities(garden, plantsById)).toEqual([
      { type: 'pollinator-support-absent' },
    ])
  })

  it('does not surface the opportunity once pollinator-support is represented', () => {
    const garden = placePlant(createGarden(4, 4), 0, 0, 'marigold')
    expect(evaluateGardenOpportunities(garden, plantsById)).toEqual([])
  })

  it('is unaffected by repeated pollinator-support placements', () => {
    let garden = createGarden(4, 4)
    garden = placePlant(garden, 0, 0, 'marigold')
    garden = placePlant(garden, 1, 1, 'marigold')
    garden = placePlant(garden, 2, 2, 'marigold')
    expect(evaluateGardenOpportunities(garden, plantsById)).toEqual([])
  })

  it('handles an unknown placed plant id defensively, reflecting the rest of the garden', () => {
    const garden: GardenState = {
      ...createGarden(4, 4),
      placements: { '0,0': { plantId: 'unknown-plant' } },
    }
    expect(evaluateGardenOpportunities(garden, plantsById)).toEqual([
      { type: 'pollinator-support-absent' },
    ])
  })
})

describe('evaluateCompanionOpportunityForPlacement', () => {
  const tomato: Plant = {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    minimumSpacingCells: 4,
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  }
  const basil: Plant = {
    id: 'basil',
    name: 'Basil',
    category: 'herb',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  }
  const marigold: Plant = {
    id: 'marigold',
    name: 'Marigold',
    category: 'flower',
    minimumSpacingCells: 2,
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  }
  const potato: Plant = {
    id: 'potato',
    name: 'Potato',
    category: 'vegetable',
    minimumSpacingCells: 3,
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  }
  const carrot: Plant = {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    minimumSpacingCells: 1,
    lifecycle: 'biennial',
    ecologicalRoles: [],
  }
  const plantsById: Record<string, Plant> = { tomato, basil, marigold, potato, carrot }

  const rules: PlantRelationshipRule[] = [
    { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
    { plantAId: 'tomato', plantBId: 'marigold', relationship: 'companion' },
    { plantAId: 'tomato', plantBId: 'potato', relationship: 'incompatible' },
  ]

  it('returns catalogue companion candidates when nothing adjacent is a companion', () => {
    const garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    expect(evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)).toEqual({
      candidatePlantIds: ['basil', 'marigold'],
    })
  })

  it('returns null once an adjacent modeled companion is present', () => {
    let garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    garden = placePlant(garden, 1, 2, 'basil')
    expect(evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)).toBeNull()
  })

  it('does not treat an adjacent incompatible plant as a companion, and never suggests it', () => {
    let garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    garden = placePlant(garden, 1, 2, 'potato')
    const result = evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)
    expect(result).toEqual({ candidatePlantIds: ['basil', 'marigold'] })
    expect(result?.candidatePlantIds).not.toContain('potato')
  })

  it('does not treat an adjacent neutral plant as a companion', () => {
    let garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    garden = placePlant(garden, 1, 2, 'carrot')
    expect(evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)).toEqual({
      candidatePlantIds: ['basil', 'marigold'],
    })
  })

  it('does not produce duplicate candidates when a pair is authored in the reverse direction too', () => {
    const rulesWithDuplicate: PlantRelationshipRule[] = [
      ...rules,
      { plantAId: 'basil', plantBId: 'tomato', relationship: 'companion' },
    ]
    const garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    const result = evaluateCompanionOpportunityForPlacement(
      garden,
      1,
      1,
      plantsById,
      rulesWithDuplicate,
    )
    expect(result?.candidatePlantIds).toEqual(['basil', 'marigold'])
  })

  it('excludes a companion rule that references a plant outside the current catalogue', () => {
    const rulesWithUnknownPlant: PlantRelationshipRule[] = [
      ...rules,
      { plantAId: 'tomato', plantBId: 'kale', relationship: 'companion' },
    ]
    const garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    const result = evaluateCompanionOpportunityForPlacement(
      garden,
      1,
      1,
      plantsById,
      rulesWithUnknownPlant,
    )
    expect(result?.candidatePlantIds).toEqual(['basil', 'marigold'])
  })

  it('produces a stable candidate order across calls', () => {
    const garden = placePlant(createGarden(4, 4), 1, 1, 'tomato')
    const first = evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)
    const second = evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)
    expect(first).toEqual(second)
  })

  it('returns null for an empty coordinate rather than treating it as "no adjacent companion"', () => {
    const garden = createGarden(4, 4)
    expect(evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)).toBeNull()
  })

  it('returns null for an out-of-bounds coordinate', () => {
    const garden = createGarden(4, 4)
    expect(evaluateCompanionOpportunityForPlacement(garden, 99, 99, plantsById, rules)).toBeNull()
  })

  it('returns null when the placed plant id is unknown to plantsById', () => {
    const garden: GardenState = {
      ...createGarden(4, 4),
      placements: { '1,1': { plantId: 'unknown-plant' } },
    }
    expect(evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)).toBeNull()
  })

  it('finds candidates symmetrically from the other side of a companion pair', () => {
    const garden = placePlant(createGarden(4, 4), 1, 1, 'basil')
    const result = evaluateCompanionOpportunityForPlacement(garden, 1, 1, plantsById, rules)
    expect(result?.candidatePlantIds).toContain('tomato')
  })
})
