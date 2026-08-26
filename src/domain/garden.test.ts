import { describe, expect, it } from 'vitest'
import {
  GARDEN_MAX_SIZE,
  GARDEN_MIN_SIZE,
  clearGarden,
  createGarden,
  getAdjacentCoordinates,
  getPlantIdAt,
  hasPlacements,
  placePlant,
  removePlant,
} from './garden'

describe('createGarden', () => {
  it('creates a garden with the given dimensions and no placements', () => {
    const garden = createGarden(5, 6)
    expect(garden.rows).toBe(5)
    expect(garden.columns).toBe(6)
    expect(garden.placements).toEqual({})
  })

  it('uses the documented default size when no dimensions are given', () => {
    const garden = createGarden()
    expect(garden.rows).toBe(10)
    expect(garden.columns).toBe(10)
  })

  it('accepts the minimum and maximum bounds', () => {
    expect(() => createGarden(GARDEN_MIN_SIZE, GARDEN_MIN_SIZE)).not.toThrow()
    expect(() => createGarden(GARDEN_MAX_SIZE, GARDEN_MAX_SIZE)).not.toThrow()
  })

  it('rejects dimensions outside the documented bounds', () => {
    expect(() => createGarden(GARDEN_MIN_SIZE - 1, 10)).toThrow()
    expect(() => createGarden(10, GARDEN_MAX_SIZE + 1)).toThrow()
  })
})

describe('placePlant / getPlantIdAt', () => {
  it('places a plant and reads it back at that coordinate', () => {
    const garden = placePlant(createGarden(), 2, 3, 'tomato')
    expect(getPlantIdAt(garden, 2, 3)).toBe('tomato')
  })

  it('returns undefined for an empty cell', () => {
    const garden = createGarden()
    expect(getPlantIdAt(garden, 0, 0)).toBeUndefined()
  })

  it('overwrites whatever was previously placed in that cell', () => {
    let garden = createGarden()
    garden = placePlant(garden, 0, 0, 'tomato')
    garden = placePlant(garden, 0, 0, 'basil')
    expect(getPlantIdAt(garden, 0, 0)).toBe('basil')
  })

  it('does not mutate the original garden state', () => {
    const original = createGarden()
    placePlant(original, 0, 0, 'tomato')
    expect(getPlantIdAt(original, 0, 0)).toBeUndefined()
  })
})

describe('getAdjacentCoordinates', () => {
  it('returns 2 neighbors for a corner cell', () => {
    const garden = createGarden(5, 5)
    const neighbors = getAdjacentCoordinates(garden, 0, 0)
    expect(neighbors).toHaveLength(2)
    expect(neighbors).toEqual(
      expect.arrayContaining([
        { row: 1, col: 0 },
        { row: 0, col: 1 },
      ]),
    )
  })

  it('returns 3 neighbors for an edge cell', () => {
    const garden = createGarden(5, 5)
    const neighbors = getAdjacentCoordinates(garden, 0, 2)
    expect(neighbors).toHaveLength(3)
  })

  it('returns 4 neighbors for an interior cell', () => {
    const garden = createGarden(5, 5)
    const neighbors = getAdjacentCoordinates(garden, 2, 2)
    expect(neighbors).toHaveLength(4)
    expect(neighbors).toEqual(
      expect.arrayContaining([
        { row: 1, col: 2 },
        { row: 3, col: 2 },
        { row: 2, col: 1 },
        { row: 2, col: 3 },
      ]),
    )
  })

  it('does not include diagonal neighbors', () => {
    const garden = createGarden(5, 5)
    const neighbors = getAdjacentCoordinates(garden, 2, 2)
    expect(neighbors).not.toEqual(
      expect.arrayContaining([{ row: 1, col: 1 }]),
    )
  })
})

describe('removePlant', () => {
  it('removes the plant at the given coordinate', () => {
    let garden = createGarden()
    garden = placePlant(garden, 1, 1, 'tomato')
    garden = removePlant(garden, 1, 1)
    expect(getPlantIdAt(garden, 1, 1)).toBeUndefined()
  })

  it('leaves other placements untouched', () => {
    let garden = createGarden()
    garden = placePlant(garden, 1, 1, 'tomato')
    garden = placePlant(garden, 2, 2, 'basil')
    garden = removePlant(garden, 1, 1)
    expect(getPlantIdAt(garden, 2, 2)).toBe('basil')
  })

  it('is a safe no-op on an already-empty cell', () => {
    const garden = createGarden()
    expect(() => removePlant(garden, 0, 0)).not.toThrow()
    expect(getPlantIdAt(removePlant(garden, 0, 0), 0, 0)).toBeUndefined()
  })

  it('does not mutate the original garden state', () => {
    const original = placePlant(createGarden(), 0, 0, 'tomato')
    removePlant(original, 0, 0)
    expect(getPlantIdAt(original, 0, 0)).toBe('tomato')
  })
})

describe('clearGarden', () => {
  it('removes all placements while preserving dimensions', () => {
    let garden = createGarden(6, 7)
    garden = placePlant(garden, 0, 0, 'tomato')
    garden = placePlant(garden, 1, 1, 'basil')
    const cleared = clearGarden(garden)
    expect(cleared.placements).toEqual({})
    expect(cleared.rows).toBe(6)
    expect(cleared.columns).toBe(7)
  })

  it('is a no-op-equivalent on an already-empty garden', () => {
    const garden = createGarden()
    expect(clearGarden(garden).placements).toEqual({})
  })

  it('does not mutate the original garden state', () => {
    const original = placePlant(createGarden(), 0, 0, 'tomato')
    clearGarden(original)
    expect(getPlantIdAt(original, 0, 0)).toBe('tomato')
  })
})

describe('hasPlacements', () => {
  it('is false for a fresh garden', () => {
    expect(hasPlacements(createGarden())).toBe(false)
  })

  it('is true once a plant has been placed', () => {
    const garden = placePlant(createGarden(), 0, 0, 'tomato')
    expect(hasPlacements(garden)).toBe(true)
  })

  it('is false again after clearing', () => {
    const garden = placePlant(createGarden(), 0, 0, 'tomato')
    expect(hasPlacements(clearGarden(garden))).toBe(false)
  })
})
