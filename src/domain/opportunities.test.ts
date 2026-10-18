import { describe, expect, it } from 'vitest'
import {
  evaluateBedCompanionSuggestions,
  evaluateBedRoleSuggestions,
  evaluateCompanionOpportunityForPlacement,
  evaluateRoleSuggestions,
} from './opportunities'
import { addBed, createGarden, placePlant } from './garden'
import type { GardenState, Position } from './garden'
import type { Plant } from './plant'
import type { PlantRelationshipRule } from './relationships'

// Center of a 12" cell — where the current UI snaps placements. Placement
// ids in these tests are the "row,col" they were placed at.
function at(row: number, col: number): Position {
  return { x: col * 12 + 6, y: row * 12 + 6 }
}

describe('evaluateRoleSuggestions', () => {
  const bushBean: Plant = {
    id: 'bush-bean',
    name: 'Bush Bean',
    category: 'vegetable',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'annual',
    ecologicalRoles: ['nitrogen-fixation'],
  }
  const pea: Plant = { ...bushBean, id: 'pea', name: 'Pea' }
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
  // No catalogue plant here provides beneficial-insects.
  const plantsById: Record<string, Plant> = { pea, 'bush-bean': bushBean, marigold, carrot }

  it('suggests every role an empty garden lacks, with its providers, in canonical order', () => {
    expect(evaluateRoleSuggestions(createGarden(48, 48), plantsById)).toEqual([
      { role: 'pollinator-support', candidatePlantIds: ['marigold'] },
      { role: 'nitrogen-fixation', candidatePlantIds: ['bush-bean', 'pea'] },
    ])
  })

  it('drops a role once any placed plant provides it', () => {
    const garden = placePlant(createGarden(48, 48), 'p', 'pea', at(0, 0))
    expect(evaluateRoleSuggestions(garden, plantsById)).toEqual([
      { role: 'pollinator-support', candidatePlantIds: ['marigold'] },
    ])
  })

  it('suggests nothing once every providable role is represented', () => {
    let garden = placePlant(createGarden(48, 48), 'p', 'pea', at(0, 0))
    garden = placePlant(garden, 'm', 'marigold', at(2, 2))
    expect(evaluateRoleSuggestions(garden, plantsById)).toEqual([])
  })

  it('is unaffected by roleless or unknown placed plants', () => {
    let garden = placePlant(createGarden(48, 48), 'c', 'carrot', at(0, 0))
    garden = placePlant(garden, 'u', 'unknown-plant', at(2, 2))
    expect(evaluateRoleSuggestions(garden, plantsById)).toEqual(
      evaluateRoleSuggestions(createGarden(48, 48), plantsById),
    )
  })
})

describe('evaluateCompanionOpportunityForPlacement', () => {
  const tomato: Plant = {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  }
  const basil: Plant = {
    id: 'basil',
    name: 'Basil',
    category: 'herb',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  }
  const marigold: Plant = {
    id: 'marigold',
    name: 'Marigold',
    category: 'flower',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  }
  const potato: Plant = {
    id: 'potato',
    name: 'Potato',
    category: 'vegetable',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  }
  const carrot: Plant = {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    spacingInches: { min: 12, max: 12 },
    lifecycle: 'biennial',
    ecologicalRoles: [],
  }
  const plantsById: Record<string, Plant> = { tomato, basil, marigold, potato, carrot }

  const rules: PlantRelationshipRule[] = [
    { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
    { plantAId: 'tomato', plantBId: 'marigold', relationship: 'companion' },
    { plantAId: 'tomato', plantBId: 'potato', relationship: 'incompatible' },
  ]

  it('returns catalogue companion candidates when nothing nearby is a companion', () => {
    const garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    expect(evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)).toEqual({
      candidatePlantIds: ['basil', 'marigold'],
    })
  })

  it('returns null once a nearby modeled companion is present', () => {
    let garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    garden = placePlant(garden, '1,2', 'basil', at(1, 2))
    expect(evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)).toBeNull()
  })

  it('does not treat a nearby incompatible plant as a companion, and never suggests it', () => {
    let garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    garden = placePlant(garden, '1,2', 'potato', at(1, 2))
    const result = evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)
    expect(result).toEqual({ candidatePlantIds: ['basil', 'marigold'] })
    expect(result?.candidatePlantIds).not.toContain('potato')
  })

  it('does not treat a nearby neutral plant as a companion', () => {
    let garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    garden = placePlant(garden, '1,2', 'carrot', at(1, 2))
    expect(evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)).toEqual({
      candidatePlantIds: ['basil', 'marigold'],
    })
  })

  it('does not produce duplicate candidates when a pair is authored in the reverse direction too', () => {
    const rulesWithDuplicate: PlantRelationshipRule[] = [
      ...rules,
      { plantAId: 'basil', plantBId: 'tomato', relationship: 'companion' },
    ]
    const garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    const result = evaluateCompanionOpportunityForPlacement(
      garden,
      '1,1',
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
    const garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    const result = evaluateCompanionOpportunityForPlacement(
      garden,
      '1,1',
      plantsById,
      rulesWithUnknownPlant,
    )
    expect(result?.candidatePlantIds).toEqual(['basil', 'marigold'])
  })

  it('produces a stable candidate order across calls', () => {
    const garden = placePlant(createGarden(48, 48), '1,1', 'tomato', at(1, 1))
    const first = evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)
    const second = evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)
    expect(first).toEqual(second)
  })

  it('returns null for an empty garden rather than treating it as "no nearby companion"', () => {
    const garden = createGarden(48, 48)
    expect(evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)).toBeNull()
  })

  it('returns null for an unknown placement id', () => {
    const garden = createGarden(48, 48)
    expect(evaluateCompanionOpportunityForPlacement(garden, 'missing', plantsById, rules)).toBeNull()
  })

  it('returns null when the placed plant id is unknown to plantsById', () => {
    const garden: GardenState = {
      ...createGarden(48, 48),
      placements: { '1,1': { id: '1,1', plantId: 'unknown-plant', position: at(1, 1) } },
    }
    expect(evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)).toBeNull()
  })

  it('finds candidates symmetrically from the other side of a companion pair', () => {
    const garden = placePlant(createGarden(48, 48), '1,1', 'basil', at(1, 1))
    const result = evaluateCompanionOpportunityForPlacement(garden, '1,1', plantsById, rules)
    expect(result?.candidatePlantIds).toContain('tomato')
  })
})

describe('bed suggestions', () => {
  const base = { category: 'vegetable', lifecycle: 'annual' } as const
  const plant = (id: string, roles: Plant['ecologicalRoles'] = []): Plant => ({
    ...base,
    id,
    name: id,
    spacingInches: { min: 6, max: 6 },
    ecologicalRoles: roles,
  })
  const plantsById: Record<string, Plant> = {
    tomato: plant('tomato'),
    basil: plant('basil'),
    onion: plant('onion'),
    potato: plant('potato'),
    pea: plant('pea', ['nitrogen-fixation']),
    'bush-bean': plant('bush-bean', ['nitrogen-fixation']),
  }
  const rules: PlantRelationshipRule[] = [
    { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
    { plantAId: 'tomato', plantBId: 'onion', relationship: 'companion' },
    { plantAId: 'onion', plantBId: 'pea', relationship: 'incompatible' },
    { plantAId: 'onion', plantBId: 'bush-bean', relationship: 'incompatible' },
    { plantAId: 'potato', plantBId: 'pea', relationship: 'incompatible' },
  ]

  // Four 36" beds in a row; a plant placed "in" a bed sits at its center.
  function gardenWith(beds: Record<string, string[]>): GardenState {
    let garden = createGarden(240, 120)
    Object.entries(beds).forEach(([bedId, plantIds], i) => {
      garden = addBed(garden, bedId, bedId, { position: { x: i * 48, y: 0 }, width: 36, height: 36 })
      plantIds.forEach((plantId, j) => {
        garden = placePlant(garden, `${bedId}-${j}`, plantId, { x: i * 48 + 6 + j * 12, y: 18 })
      })
    })
    return garden
  }

  it('suggests a nitrogen fixer for planted beds without one, never one that clashes', () => {
    const garden = gardenWith({ A: ['tomato'], B: ['onion'], C: ['pea'], D: [] })
    expect(evaluateBedRoleSuggestions(garden, plantsById, rules)).toEqual([
      { role: 'nitrogen-fixation', bedIds: ['A'], candidatePlantIds: ['bush-bean', 'pea'] },
    ])
  })

  it('splits beds that suit different providers, so every candidate suits every listed bed', () => {
    const garden = gardenWith({ A: ['tomato'], B: ['potato'], C: ['basil'] })
    expect(evaluateBedRoleSuggestions(garden, plantsById, rules)).toEqual([
      { role: 'nitrogen-fixation', bedIds: ['A', 'C'], candidatePlantIds: ['bush-bean', 'pea'] },
      { role: 'nitrogen-fixation', bedIds: ['B'], candidatePlantIds: ['bush-bean'] },
    ])
  })

  it('moves nitrogen fixing out of garden-wide suggestions once a bed is planted', () => {
    const roles = (g: GardenState) => evaluateRoleSuggestions(g, plantsById).map((s) => s.role)
    expect(roles(createGarden())).toContain('nitrogen-fixation')
    expect(roles(gardenWith({ A: [] }))).toContain('nitrogen-fixation')
    expect(roles(gardenWith({ A: ['tomato'] }))).not.toContain('nitrogen-fixation')
  })

  it('suggests companions of what each bed holds, most beds first', () => {
    const garden = gardenWith({ A: ['tomato'], B: ['tomato', 'onion'] })
    expect(evaluateBedCompanionSuggestions(garden, plantsById, rules)).toEqual([
      { plantId: 'basil', bedIds: ['A', 'B'], companionOfPlantIds: ['tomato'] },
      { plantId: 'onion', bedIds: ['A'], companionOfPlantIds: ['tomato'] },
    ])
  })

  it('never suggests a companion that clashes with something else in the bed', () => {
    const garden = gardenWith({ A: ['tomato', 'pea'] })
    expect(
      evaluateBedCompanionSuggestions(garden, plantsById, rules).map((s) => s.plantId),
    ).toEqual(['basil'])
  })

  it('ignores plants in open ground', () => {
    const garden = placePlant(gardenWith({ A: [] }), 'loose', 'tomato', { x: 200, y: 100 })
    expect(evaluateBedCompanionSuggestions(garden, plantsById, rules)).toEqual([])
    expect(evaluateBedRoleSuggestions(garden, plantsById, rules)).toEqual([])
  })
})
