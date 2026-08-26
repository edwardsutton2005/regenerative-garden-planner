import { describe, expect, it } from 'vitest'
import {
  GARDEN_MAX_SIZE,
  GARDEN_MIN_SIZE,
  clearGarden,
  createGarden,
  getAdjacentCoordinates,
  getPlantIdAt,
  hasPlacements,
  isValidCoordinate,
  movePlant,
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

  it('rejects non-finite dimensions', () => {
    expect(() => createGarden(Number.NaN, 10)).toThrow()
    expect(() => createGarden(10, Number.POSITIVE_INFINITY)).toThrow()
    expect(() => createGarden(Number.NEGATIVE_INFINITY, 10)).toThrow()
  })

  it('rejects non-integer dimensions', () => {
    expect(() => createGarden(5.5, 10)).toThrow()
    expect(() => createGarden(10, 6.1)).toThrow()
  })
})

describe('isValidCoordinate', () => {
  const garden = createGarden(5, 5)

  it('accepts coordinates within bounds', () => {
    expect(isValidCoordinate(garden, 0, 0)).toBe(true)
    expect(isValidCoordinate(garden, 4, 4)).toBe(true)
  })

  it('rejects negative coordinates', () => {
    expect(isValidCoordinate(garden, -1, 0)).toBe(false)
  })

  it('rejects coordinates at or beyond the garden size', () => {
    expect(isValidCoordinate(garden, 5, 0)).toBe(false)
    expect(isValidCoordinate(garden, 0, 5)).toBe(false)
  })

  it('rejects non-integer and non-finite coordinates', () => {
    expect(isValidCoordinate(garden, 1.5, 0)).toBe(false)
    expect(isValidCoordinate(garden, Number.NaN, 0)).toBe(false)
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

  it('placing at an out-of-bounds coordinate is a no-op', () => {
    const garden = createGarden(5, 5)
    expect(placePlant(garden, 5, 0, 'tomato')).toEqual(garden)
    expect(placePlant(garden, -1, 0, 'tomato')).toEqual(garden)
  })

  it('reading an out-of-bounds coordinate returns undefined', () => {
    const garden = createGarden(5, 5)
    expect(getPlantIdAt(garden, 5, 0)).toBeUndefined()
    expect(getPlantIdAt(garden, 0, -1)).toBeUndefined()
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

  it('returns an empty array for an out-of-bounds coordinate', () => {
    const garden = createGarden(5, 5)
    expect(getAdjacentCoordinates(garden, 5, 0)).toEqual([])
    expect(getAdjacentCoordinates(garden, -1, 0)).toEqual([])
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

  it('removing at an out-of-bounds coordinate is a no-op', () => {
    const garden = createGarden(5, 5)
    expect(removePlant(garden, 5, 0)).toEqual(garden)
  })
})

describe('movePlant', () => {
  it('moves a plant from an occupied source to an empty destination', () => {
    let garden = placePlant(createGarden(), 1, 1, 'tomato')
    garden = movePlant(garden, 1, 1, 3, 3)
    expect(getPlantIdAt(garden, 1, 1)).toBeUndefined()
    expect(getPlantIdAt(garden, 3, 3)).toBe('tomato')
  })

  it('swaps both plants when the destination is occupied', () => {
    let garden = createGarden()
    garden = placePlant(garden, 1, 1, 'tomato')
    garden = placePlant(garden, 3, 3, 'basil')
    garden = movePlant(garden, 1, 1, 3, 3)
    expect(getPlantIdAt(garden, 3, 3)).toBe('tomato')
    expect(getPlantIdAt(garden, 1, 1)).toBe('basil')
  })

  it('is a no-op when the source is empty', () => {
    let garden = placePlant(createGarden(), 3, 3, 'basil')
    garden = movePlant(garden, 1, 1, 3, 3)
    expect(getPlantIdAt(garden, 3, 3)).toBe('basil')
    expect(getPlantIdAt(garden, 1, 1)).toBeUndefined()
  })

  it('is a no-op when moving a cell onto itself', () => {
    let garden = placePlant(createGarden(), 1, 1, 'tomato')
    garden = movePlant(garden, 1, 1, 1, 1)
    expect(getPlantIdAt(garden, 1, 1)).toBe('tomato')
  })

  it('does not mutate the original garden state', () => {
    let original = createGarden()
    original = placePlant(original, 1, 1, 'tomato')
    original = placePlant(original, 3, 3, 'basil')
    movePlant(original, 1, 1, 3, 3)
    expect(getPlantIdAt(original, 1, 1)).toBe('tomato')
    expect(getPlantIdAt(original, 3, 3)).toBe('basil')
  })

  it('is a no-op when the source coordinate is out of bounds', () => {
    const garden = createGarden(5, 5)
    expect(movePlant(garden, 5, 0, 0, 0)).toEqual(garden)
  })

  it('is a no-op when the destination coordinate is out of bounds', () => {
    const garden = placePlant(createGarden(5, 5), 1, 1, 'tomato')
    expect(movePlant(garden, 1, 1, 5, 0)).toEqual(garden)
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
