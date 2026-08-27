import { describe, expect, it } from 'vitest'
import { createGarden, placePlant } from './garden'
import { evaluateSpacing } from './spacing'
import type { Plant } from './plant'

const tomato: Plant = {
  id: 'tomato',
  name: 'Tomato',
  category: 'vegetable',
  minimumSpacingCells: 4,
}
const carrot: Plant = {
  id: 'carrot',
  name: 'Carrot',
  category: 'vegetable',
  minimumSpacingCells: 1,
}
const basil: Plant = {
  id: 'basil',
  name: 'Basil',
  category: 'herb',
  minimumSpacingCells: 2,
}

describe('evaluateSpacing', () => {
  it('reports no violation when same-species plants are far enough apart', () => {
    let garden = createGarden(10, 10)
    garden = placePlant(garden, 0, 0, 'tomato')
    garden = placePlant(garden, 5, 5, 'tomato')

    expect(evaluateSpacing(garden, 0, 0, tomato)).toEqual([])
  })

  it('reports a violation when same-species plants are closer than required', () => {
    let garden = createGarden(10, 10)
    garden = placePlant(garden, 0, 0, 'tomato')
    garden = placePlant(garden, 0, 2, 'tomato')

    const result = evaluateSpacing(garden, 0, 0, tomato)

    expect(result).toEqual([
      {
        coordinate: { row: 0, col: 2 },
        plant: tomato,
        distance: 2,
        requiredDistance: 4,
      },
    ])
  })

  it('never reports a violation for a cross-species pair, regardless of how close or how different their spacing needs are', () => {
    let garden = createGarden(10, 10)
    garden = placePlant(garden, 0, 0, 'tomato') // requires 4
    garden = placePlant(garden, 0, 1, 'basil') // adjacent, requires 2

    expect(evaluateSpacing(garden, 0, 0, tomato)).toEqual([])
    expect(evaluateSpacing(garden, 0, 1, basil)).toEqual([])
  })

  it('treats a diagonal same-species neighbor as distance 1, same as orthogonal', () => {
    let garden = createGarden(10, 10)
    garden = placePlant(garden, 5, 5, 'basil')
    garden = placePlant(garden, 6, 6, 'basil') // diagonal neighbor

    const result = evaluateSpacing(garden, 5, 5, basil)

    expect(result).toEqual([
      {
        coordinate: { row: 6, col: 6 },
        plant: basil,
        distance: 1,
        requiredDistance: 2,
      },
    ])
  })

  it('is not a violation when distance exactly equals the required minimum', () => {
    let garden = createGarden(10, 10)
    garden = placePlant(garden, 0, 0, 'basil')
    garden = placePlant(garden, 0, 2, 'basil') // distance 2, requires 2

    expect(evaluateSpacing(garden, 0, 0, basil)).toEqual([])
  })

  it('carrot (minimumSpacingCells 1) never triggers a violation against an adjacent carrot', () => {
    let garden = createGarden(10, 10)
    garden = placePlant(garden, 0, 0, 'carrot')
    garden = placePlant(garden, 0, 1, 'carrot')

    expect(evaluateSpacing(garden, 0, 0, carrot)).toEqual([])
  })

  it('excludes the focus cell itself', () => {
    const garden = placePlant(createGarden(10, 10), 3, 3, 'tomato')
    expect(evaluateSpacing(garden, 3, 3, tomato)).toEqual([])
  })
})
