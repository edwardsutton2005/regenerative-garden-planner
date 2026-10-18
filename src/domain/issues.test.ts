import { describe, expect, it } from 'vitest'
import { createGarden, placePlant, setSunlightAt } from './garden'
import { evaluateGardenIssues } from './issues'
import type { Plant } from './plant'
import type { PlantRelationshipRule } from './relationships'

const plant = (id: string, spacing: number, sun?: Plant['sunlightRequirement']): Plant => ({
  id,
  name: id,
  category: 'vegetable',
  spacingInches: { min: spacing, max: spacing },
  lifecycle: 'annual',
  ecologicalRoles: [],
  sunlightRequirement: sun,
})
const plantsById: Record<string, Plant> = {
  tomato: plant('tomato', 24, ['full-sun']),
  potato: plant('potato', 12),
  basil: plant('basil', 6),
}
const rules: PlantRelationshipRule[] = [
  { plantAId: 'tomato', plantBId: 'potato', relationship: 'incompatible', reason: 'blight' },
  { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
]

describe('evaluateGardenIssues', () => {
  it('is empty for a healthy garden', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', { x: 10, y: 10 })
    garden = placePlant(garden, 'b', 'basil', { x: 30, y: 10 })
    expect(evaluateGardenIssues(garden, plantsById, rules)).toEqual([])
  })

  it('reports each kind of issue once, whichever plant finds it', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', { x: 10, y: 10 })
    garden = placePlant(garden, 't2', 'tomato', { x: 30, y: 10 }) // 20" < 24" spacing
    garden = placePlant(garden, 'p', 'potato', { x: 10, y: 22 }) // crowds t; clashes with all tomatoes
    garden = setSunlightAt(garden, 2, 2, 'shade')
    garden = placePlant(garden, 'shaded', 'tomato', { x: 30, y: 30 })

    const issues = evaluateGardenIssues(garden, plantsById, rules)
    const summary = issues.map((i) => `${i.kind}:${[...i.placementIds].sort().join('+')}`).sort()
    expect(summary).toEqual([
      'crowding:p+t',
      'incompatible:p+shaded',
      'incompatible:p+t',
      'incompatible:p+t2',
      'spacing:shaded+t2',
      'spacing:t+t2',
      'sunlight:shaded',
    ])
    expect(issues.find((i) => i.kind === 'incompatible')).toMatchObject({ rule: rules[0] })
  })
})
