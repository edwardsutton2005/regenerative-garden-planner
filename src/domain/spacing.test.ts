import { describe, expect, it } from 'vitest'
import { createGarden, placePlant } from './garden'
import type { Position } from './garden'
import { evaluateSpacing, evaluateSpacingForFocuses } from './spacing'
import type { Plant } from './plant'

const tomato: Plant = {
  id: 'tomato',
  name: 'Tomato',
  category: 'vegetable',
  spacingInches: { min: 24, max: 36 },
  lifecycle: 'tender-perennial',
  ecologicalRoles: [],
}
const carrot: Plant = {
  id: 'carrot',
  name: 'Carrot',
  category: 'vegetable',
  spacingInches: { min: 2, max: 3 },
  lifecycle: 'biennial',
  ecologicalRoles: [],
}
const basil: Plant = {
  id: 'basil',
  name: 'Basil',
  category: 'herb',
  spacingInches: { min: 6, max: 12 },
  lifecycle: 'annual',
  ecologicalRoles: ['pollinator-support'],
}
const plantsById: Record<string, Plant> = { tomato, carrot, basil }

// Center of a 12" cell — where the current UI snaps placements.
function at(row: number, col: number): Position {
  return { x: col * 12 + 6, y: row * 12 + 6 }
}

describe('evaluateSpacing', () => {
  it('reports no violation when same-species plants are far enough apart', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(0, 3))

    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([])
  })

  it('reports a violation with the Euclidean distance when same-species plants are too close', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(0, 1))

    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([
      { placementId: 'b', plant: tomato, distance: 12, requiredDistance: 24 },
    ])
  })

  it('uses Euclidean distance, so a diagonal neighbor is ~16.97" away, not 12"', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(1, 1))

    const [violation] = evaluateSpacing(garden, 'a', plantsById)
    expect(violation.distance).toBeCloseTo(16.97, 2)
  })

  it('is not a violation when distance exactly equals the minimum', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(0, 2)) // 24"

    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([])
  })

  it('is a violation just under the minimum, at non-grid positions', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', { x: 10, y: 10 })
    garden = placePlant(garden, 'b', 'tomato', { x: 33.9, y: 10 }) // 23.9"

    expect(evaluateSpacing(garden, 'a', plantsById)).toHaveLength(1)
  })

  it('never reports a violation for a cross-species pair', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'basil', at(0, 1))

    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([])
    expect(evaluateSpacing(garden, 'b', plantsById)).toEqual([])
  })

  it('a plant whose minimum is under 12" cannot violate at adjacent snapped positions', () => {
    let garden = placePlant(createGarden(), 'a', 'carrot', at(0, 0))
    garden = placePlant(garden, 'b', 'carrot', at(0, 1))

    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([])
  })

  it('treats two same-species plants at the same position as a violation at distance 0', () => {
    let garden = placePlant(createGarden(), 'a', 'carrot', { x: 6, y: 6 })
    garden = placePlant(garden, 'b', 'carrot', { x: 6, y: 6 })

    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([
      { placementId: 'b', plant: carrot, distance: 0, requiredDistance: 2 },
    ])
  })

  it('excludes the focus placement itself', () => {
    const garden = placePlant(createGarden(), 'a', 'tomato', at(3, 3))
    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([])
  })

  it('returns [] for an unknown placement or plant id', () => {
    const garden = placePlant(createGarden(), 'a', 'unknown-plant', at(0, 0))
    expect(evaluateSpacing(garden, 'missing', plantsById)).toEqual([])
    expect(evaluateSpacing(garden, 'a', plantsById)).toEqual([])
  })
})

describe('evaluateSpacingForFocuses', () => {
  it('matches a single-focus call to evaluateSpacing', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(0, 1))

    const single = evaluateSpacing(garden, 'a', plantsById)
    expect(evaluateSpacingForFocuses(garden, ['a'], plantsById)).toEqual(
      single.map((v) => ({ ...v, focusPlacementId: 'a', focusPlant: tomato })),
    )
  })

  it('reports violations from two independent focuses', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(0, 1))
    garden = placePlant(garden, 'c', 'basil', { x: 100, y: 100 })
    garden = placePlant(garden, 'd', 'basil', { x: 103, y: 100 })

    expect(evaluateSpacingForFocuses(garden, ['a', 'c'], plantsById)).toHaveLength(2)
  })

  it('reports a violation between two focuses only once', () => {
    let garden = placePlant(createGarden(), 'a', 'tomato', at(0, 0))
    garden = placePlant(garden, 'b', 'tomato', at(0, 1))

    expect(evaluateSpacingForFocuses(garden, ['a', 'b'], plantsById)).toHaveLength(1)
  })
})
