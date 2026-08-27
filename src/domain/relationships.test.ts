import { describe, expect, it } from 'vitest'
import { createGarden, placePlant } from './garden'
import { evaluateNeighbors, getRelationship } from './relationships'
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

describe('evaluateNeighbors', () => {
  const plantsById: Record<string, Plant> = {
    tomato: { id: 'tomato', name: 'Tomato', category: 'vegetable', minimumSpacingCells: 4 },
    basil: { id: 'basil', name: 'Basil', category: 'herb', minimumSpacingCells: 2 },
    mint: { id: 'mint', name: 'Mint', category: 'herb', minimumSpacingCells: 3 },
    carrot: { id: 'carrot', name: 'Carrot', category: 'vegetable', minimumSpacingCells: 1 },
  }

  it('classifies an adjacent companion', () => {
    let garden = createGarden(5, 5)
    garden = placePlant(garden, 2, 2, 'tomato')
    garden = placePlant(garden, 2, 3, 'basil')

    const result = evaluateNeighbors(garden, 2, 2, 'tomato', plantsById, rules)

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          coordinate: { row: 2, col: 3 },
          relationship: 'companion',
        }),
      ]),
    )
  })

  it('classifies an adjacent incompatible neighbor', () => {
    let garden = createGarden(5, 5)
    garden = placePlant(garden, 0, 0, 'carrot')
    garden = placePlant(garden, 1, 0, 'mint')

    const result = evaluateNeighbors(garden, 0, 0, 'carrot', plantsById, rules)

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          coordinate: { row: 1, col: 0 },
          relationship: 'incompatible',
        }),
      ]),
    )
  })

  it('does not include a plant that is two cells away', () => {
    let garden = createGarden(5, 5)
    garden = placePlant(garden, 2, 0, 'tomato')
    garden = placePlant(garden, 2, 2, 'basil')

    const result = evaluateNeighbors(garden, 2, 0, 'tomato', plantsById, rules)

    expect(result).toEqual([])
  })

  it('returns an empty array when there are no occupied neighbors', () => {
    const garden = placePlant(createGarden(5, 5), 2, 2, 'tomato')

    expect(evaluateNeighbors(garden, 2, 2, 'tomato', plantsById, rules)).toEqual([])
  })
})
