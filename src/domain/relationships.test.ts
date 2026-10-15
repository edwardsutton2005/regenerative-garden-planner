import { describe, expect, it } from 'vitest'
import { createGarden, placePlant } from './garden'
import type { Position } from './garden'
import {
  COMPANION_INTERACTION_DISTANCE,
  evaluateNeighbors,
  evaluateNeighborsForFocuses,
  getRelationship,
} from './relationships'
import type { Plant } from './plant'
import type { PlantRelationshipRule } from './relationships'

const rules: PlantRelationshipRule[] = [
  { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
  { plantAId: 'carrot', plantBId: 'mint', relationship: 'incompatible' },
]

describe('getRelationship', () => {
  it('returns companion for a known beneficial pair', () => {
    expect(getRelationship('tomato', 'basil', rules)).toBe('companion')
  })

  it('returns incompatible for a known poor pair', () => {
    expect(getRelationship('carrot', 'mint', rules)).toBe('incompatible')
  })

  it('returns neutral when no rule matches', () => {
    expect(getRelationship('tomato', 'sunflower', rules)).toBe('neutral')
  })

  it('is symmetric regardless of argument order', () => {
    expect(getRelationship('tomato', 'basil', rules)).toBe(
      getRelationship('basil', 'tomato', rules),
    )
    expect(getRelationship('carrot', 'mint', rules)).toBe(
      getRelationship('mint', 'carrot', rules),
    )
  })

  it('is symmetric regardless of which side of the rule declares it', () => {
    // The rule above declares tomato as plantAId and basil as plantBId.
    // Looking it up as (basil, tomato) must resolve identically.
    expect(getRelationship('basil', 'tomato', rules)).toBe('companion')
  })

  it('returns neutral for a plant compared with itself', () => {
    expect(getRelationship('tomato', 'tomato', rules)).toBe('neutral')
  })

  it('incompatible takes precedence if a pair somehow matches both rule types', () => {
    const conflictingRules: PlantRelationshipRule[] = [
      { plantAId: 'a', plantBId: 'b', relationship: 'companion' },
      { plantAId: 'a', plantBId: 'b', relationship: 'incompatible' },
    ]
    expect(getRelationship('a', 'b', conflictingRules)).toBe('incompatible')
  })

  it('incompatible takes precedence regardless of array order', () => {
    const incompatibleFirst: PlantRelationshipRule[] = [
      { plantAId: 'a', plantBId: 'b', relationship: 'incompatible' },
      { plantAId: 'a', plantBId: 'b', relationship: 'companion' },
    ]
    const companionFirst: PlantRelationshipRule[] = [
      { plantAId: 'a', plantBId: 'b', relationship: 'companion' },
      { plantAId: 'a', plantBId: 'b', relationship: 'incompatible' },
    ]
    expect(getRelationship('a', 'b', incompatibleFirst)).toBe('incompatible')
    expect(getRelationship('a', 'b', companionFirst)).toBe('incompatible')
    expect(getRelationship('a', 'b', incompatibleFirst)).toBe(
      getRelationship('a', 'b', companionFirst),
    )
  })

  it('incompatible takes precedence even when the conflicting rule reverses the pair', () => {
    const reversedConflict: PlantRelationshipRule[] = [
      { plantAId: 'a', plantBId: 'b', relationship: 'companion' },
      { plantAId: 'b', plantBId: 'a', relationship: 'incompatible' },
    ]
    expect(getRelationship('a', 'b', reversedConflict)).toBe('incompatible')
  })
})

const plantsById: Record<string, Plant> = {
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    spacingInches: { min: 24, max: 36 },
    lifecycle: 'tender-perennial',
    ecologicalRoles: [],
  },
  basil: {
    id: 'basil',
    name: 'Basil',
    category: 'herb',
    spacingInches: { min: 6, max: 12 },
    lifecycle: 'annual',
    ecologicalRoles: ['pollinator-support'],
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    category: 'herb',
    spacingInches: { min: 18, max: 18 },
    lifecycle: 'perennial',
    ecologicalRoles: ['pollinator-support'],
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    spacingInches: { min: 2, max: 3 },
    lifecycle: 'biennial',
    ecologicalRoles: [],
  },
}

// Center of a 12" cell — where the current UI snaps placements.
function at(row: number, col: number): Position {
  return { x: col * 12 + 6, y: row * 12 + 6 }
}

describe('evaluateNeighbors', () => {
  it('classifies a companion 12" away (orthogonal neighbor under snapping)', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'b', 'basil', at(2, 3))

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toEqual([
      { placementId: 'b', plant: plantsById.basil, distance: 12, relationship: 'companion' },
    ])
  })

  it('classifies an incompatible neighbor', () => {
    let garden = placePlant(createGarden(), 'c', 'carrot', at(0, 0))
    garden = placePlant(garden, 'm', 'mint', at(1, 0))

    expect(evaluateNeighbors(garden, 'c', plantsById, rules)).toEqual([
      expect.objectContaining({ placementId: 'm', relationship: 'incompatible' }),
    ])
  })

  it('includes a neighbor exactly at the interaction distance', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', { x: 10, y: 10 })
    garden = placePlant(garden, 'b', 'basil', { x: 10 + COMPANION_INTERACTION_DISTANCE, y: 10 })

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toHaveLength(1)
  })

  it('excludes a neighbor just beyond the interaction distance', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', { x: 10, y: 10 })
    garden = placePlant(garden, 'b', 'basil', { x: 22.01, y: 10 })

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toEqual([])
  })

  it('excludes a diagonal neighbor under snapping (~16.97"), preserving V1 behavior', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'b', 'basil', at(3, 3))

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toEqual([])
  })

  it('excludes a plant two cells away', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 0))
    garden = placePlant(garden, 'b', 'basil', at(2, 2))

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toEqual([])
  })

  it('includes close non-grid neighbors in any direction', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', { x: 31.4, y: 67.8 })
    garden = placePlant(garden, 'b', 'basil', { x: 38.4, y: 75.8 }) // ~10.6" diagonal

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toHaveLength(1)
  })

  it('is symmetric: each side of a pair finds the other', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'b', 'basil', at(2, 3))

    expect(evaluateNeighbors(garden, 'b', plantsById, rules)).toEqual([
      expect.objectContaining({ placementId: 't', relationship: 'companion' }),
    ])
  })

  it('returns [] when nothing is nearby, or for an unknown placement or plant id', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'u', 'unknown-plant', at(5, 5))

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toEqual([])
    expect(evaluateNeighbors(garden, 'missing', plantsById, rules)).toEqual([])
    expect(evaluateNeighbors(garden, 'u', plantsById, rules)).toEqual([])
  })

  it('skips a nearby placement whose plant id is unknown', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'u', 'unknown-plant', at(2, 3))

    expect(evaluateNeighbors(garden, 't', plantsById, rules)).toEqual([])
  })
})

describe('evaluateNeighborsForFocuses', () => {
  it('matches a single-focus call to evaluateNeighbors', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'b', 'basil', at(2, 3))

    const single = evaluateNeighbors(garden, 't', plantsById, rules)
    expect(evaluateNeighborsForFocuses(garden, ['t'], plantsById, rules)).toEqual(
      single.map((r) => ({ ...r, focusPlacementId: 't', focusPlant: plantsById.tomato })),
    )
  })

  it('reports findings from two distant focuses independently', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'basil', at(0, 1))
    garden = placePlant(garden, 'c', 'carrot', at(5, 5))
    garden = placePlant(garden, 'm', 'mint', at(5, 4))

    const result = evaluateNeighborsForFocuses(garden, ['t', 'c'], plantsById, rules)
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ placementId: 'b', relationship: 'companion' }),
        expect.objectContaining({ placementId: 'm', relationship: 'incompatible' }),
      ]),
    )
    expect(result).toHaveLength(2)
  })

  it('reports a mutual finding between two nearby focuses only once', () => {
    let garden = placePlant(createGarden(), 't', 'tomato', at(2, 2))
    garden = placePlant(garden, 'b', 'basil', at(2, 3))

    const result = evaluateNeighborsForFocuses(garden, ['t', 'b'], plantsById, rules)
    expect(result).toHaveLength(1)
    expect(result[0].relationship).toBe('companion')
  })

  it('skips a focus that is missing or whose plant is not in the catalogue', () => {
    const garden = placePlant(createGarden(), 'u', 'unknown-plant', at(2, 2))

    expect(evaluateNeighborsForFocuses(garden, ['u', 'missing'], plantsById, rules)).toEqual([])
  })
})
