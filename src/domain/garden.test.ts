import { describe, expect, it } from 'vitest'
import {
  ENVIRONMENT_CELL_SIZE,
  addBed,
  getAllBeds,
  getBed,
  getBedAt,
  getPlacementsInBed,
  isValidBedRect,
  moveBed,
  nextBedName,
  removeBed,
  renameBed,
  resizeBed,
  GARDEN_DEFAULT_SIZE,
  GARDEN_MAX_SIZE,
  GARDEN_MIN_SIZE,
  cellAt,
  clearGarden,
  clearSunlightAt,
  createGarden,
  distance,
  getAllPlacements,
  getEnvironmentColumns,
  getEnvironmentRows,
  getPlacement,
  getSunlightAt,
  hasPlacements,
  isValidCell,
  isValidGardenDimension,
  isValidPosition,
  movePlant,
  placePlant,
  removePlant,
  setSunlightAt,
} from './garden'

describe('createGarden', () => {
  it('creates a garden with the given dimensions in inches, no placements, and no modeled sunlight', () => {
    const garden = createGarden(60, 72)
    expect(garden.width).toBe(60)
    expect(garden.height).toBe(72)
    expect(garden.placements).toEqual({})
    expect(garden.environment).toEqual({ cellSize: ENVIRONMENT_CELL_SIZE, sunlightByCell: {} })
  })

  it('uses the documented default size when no dimensions are given', () => {
    const garden = createGarden()
    expect(garden.width).toBe(GARDEN_DEFAULT_SIZE)
    expect(garden.height).toBe(GARDEN_DEFAULT_SIZE)
  })

  it('accepts the minimum and maximum bounds', () => {
    expect(() => createGarden(GARDEN_MIN_SIZE, GARDEN_MIN_SIZE)).not.toThrow()
    expect(() => createGarden(GARDEN_MAX_SIZE, GARDEN_MAX_SIZE)).not.toThrow()
  })

  it('rejects dimensions outside the documented bounds', () => {
    expect(() => createGarden(GARDEN_MIN_SIZE - ENVIRONMENT_CELL_SIZE, 120)).toThrow()
    expect(() => createGarden(120, GARDEN_MAX_SIZE + ENVIRONMENT_CELL_SIZE)).toThrow()
  })

  it('rejects dimensions that are not whole multiples of the environmental cell size', () => {
    expect(() => createGarden(126, 120)).toThrow()
    expect(() => createGarden(120, 60.5)).toThrow()
  })

  it('rejects non-finite dimensions', () => {
    expect(() => createGarden(Number.NaN, 120)).toThrow()
    expect(() => createGarden(120, Number.POSITIVE_INFINITY)).toThrow()
  })
})

describe('isValidGardenDimension', () => {
  it('accepts the bounds and whole multiples of the cell size between them', () => {
    expect(isValidGardenDimension(GARDEN_MIN_SIZE)).toBe(true)
    expect(isValidGardenDimension(GARDEN_MAX_SIZE)).toBe(true)
    expect(isValidGardenDimension(132)).toBe(true)
  })

  it('rejects values outside the bounds, off-grid values, and non-finite values', () => {
    expect(isValidGardenDimension(GARDEN_MIN_SIZE - ENVIRONMENT_CELL_SIZE)).toBe(false)
    expect(isValidGardenDimension(GARDEN_MAX_SIZE + ENVIRONMENT_CELL_SIZE)).toBe(false)
    expect(isValidGardenDimension(50)).toBe(false)
    expect(isValidGardenDimension(Number.NaN)).toBe(false)
  })
})

describe('isValidPosition', () => {
  const garden = createGarden(60, 48)

  it('accepts continuous, non-grid positions inside the garden', () => {
    expect(isValidPosition(garden, { x: 31.4, y: 27.8 })).toBe(true)
    expect(isValidPosition(garden, { x: 0, y: 0 })).toBe(true)
  })

  it('is half-open: the far edges are outside', () => {
    expect(isValidPosition(garden, { x: 59.99, y: 47.99 })).toBe(true)
    expect(isValidPosition(garden, { x: 60, y: 0 })).toBe(false)
    expect(isValidPosition(garden, { x: 0, y: 48 })).toBe(false)
  })

  it('rejects negative and non-finite positions', () => {
    expect(isValidPosition(garden, { x: -0.1, y: 0 })).toBe(false)
    expect(isValidPosition(garden, { x: Number.NaN, y: 0 })).toBe(false)
    expect(isValidPosition(garden, { x: 0, y: Number.POSITIVE_INFINITY })).toBe(false)
  })
})

describe('environmental cells', () => {
  const garden = createGarden(60, 48) // 5 columns x 4 rows of 12" cells

  it('derives rows and columns from dimensions and cell size', () => {
    expect(getEnvironmentRows(garden)).toBe(4)
    expect(getEnvironmentColumns(garden)).toBe(5)
  })

  it('isValidCell accepts in-bounds integer cells and rejects others', () => {
    expect(isValidCell(garden, 0, 0)).toBe(true)
    expect(isValidCell(garden, 3, 4)).toBe(true)
    expect(isValidCell(garden, 4, 0)).toBe(false)
    expect(isValidCell(garden, 0, 5)).toBe(false)
    expect(isValidCell(garden, -1, 0)).toBe(false)
    expect(isValidCell(garden, 1.5, 0)).toBe(false)
  })

  it('cellAt maps a continuous position to the cell containing it', () => {
    expect(cellAt(garden, { x: 31.4, y: 27.8 })).toEqual({ row: 2, col: 2 })
    expect(cellAt(garden, { x: 0, y: 0 })).toEqual({ row: 0, col: 0 })
  })

  it('cellAt assigns a position on a shared boundary to the cell below/right', () => {
    expect(cellAt(garden, { x: 12, y: 24 })).toEqual({ row: 2, col: 1 })
  })

  it('cellAt maps positions just inside the far edges to the last cells', () => {
    expect(cellAt(garden, { x: 59.99, y: 47.99 })).toEqual({ row: 3, col: 4 })
  })

  it('cellAt returns undefined outside the garden', () => {
    expect(cellAt(garden, { x: 60, y: 0 })).toBeUndefined()
  })

})

describe('placePlant / getPlacement', () => {
  it('places a plant at a position and reads it back by id', () => {
    const garden = placePlant(createGarden(), 'p1', 'tomato', { x: 31.4, y: 67.8 })
    expect(getPlacement(garden, 'p1')).toEqual({
      id: 'p1',
      plantId: 'tomato',
      position: { x: 31.4, y: 67.8 },
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(getPlacement(createGarden(), 'missing')).toBeUndefined()
  })

  it('allows two placements at the same position — occupancy is not a domain rule', () => {
    let garden = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    garden = placePlant(garden, 'p2', 'basil', { x: 6, y: 6 })
    expect(getAllPlacements(garden)).toHaveLength(2)
  })

  it('is a no-op when the id is already in use, never overwriting an identity', () => {
    const garden = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    expect(placePlant(garden, 'p1', 'basil', { x: 18, y: 6 })).toBe(garden)
  })

  it('is a no-op for a position outside the garden', () => {
    const garden = createGarden(60, 60)
    expect(placePlant(garden, 'p1', 'tomato', { x: 60, y: 0 })).toBe(garden)
    expect(placePlant(garden, 'p1', 'tomato', { x: -1, y: 0 })).toBe(garden)
  })

  it('does not mutate the original garden state', () => {
    const original = createGarden()
    placePlant(original, 'p1', 'tomato', { x: 6, y: 6 })
    expect(original.placements).toEqual({})
  })
})

describe('removePlant', () => {
  it('removes the placement with the given id and leaves others untouched', () => {
    let garden = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    garden = placePlant(garden, 'p2', 'basil', { x: 18, y: 6 })
    garden = removePlant(garden, 'p1')
    expect(getPlacement(garden, 'p1')).toBeUndefined()
    expect(getPlacement(garden, 'p2')?.plantId).toBe('basil')
  })

  it('is a safe no-op for an unknown id', () => {
    const garden = createGarden()
    expect(removePlant(garden, 'missing')).toBe(garden)
  })

  it('does not mutate the original garden state', () => {
    const original = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    removePlant(original, 'p1')
    expect(getPlacement(original, 'p1')).toBeDefined()
  })
})

describe('movePlant', () => {
  it('changes position but keeps identity and plant', () => {
    let garden = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    garden = movePlant(garden, 'p1', { x: 40.5, y: 20.25 })
    expect(getPlacement(garden, 'p1')).toEqual({
      id: 'p1',
      plantId: 'tomato',
      position: { x: 40.5, y: 20.25 },
    })
  })

  it('is a no-op for an unknown id or a position outside the garden', () => {
    const garden = placePlant(createGarden(60, 60), 'p1', 'tomato', { x: 6, y: 6 })
    expect(movePlant(garden, 'missing', { x: 18, y: 6 })).toBe(garden)
    expect(movePlant(garden, 'p1', { x: 60, y: 6 })).toBe(garden)
  })

  it('does not mutate the original garden state', () => {
    const original = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    movePlant(original, 'p1', { x: 18, y: 6 })
    expect(getPlacement(original, 'p1')?.position).toEqual({ x: 6, y: 6 })
  })
})

describe('distance', () => {
  it('is 0 for the same position', () => {
    expect(distance({ x: 6, y: 6 }, { x: 6, y: 6 })).toBe(0)
  })

  it('is Euclidean', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(distance({ x: 6, y: 6 }, { x: 18, y: 18 })).toBeCloseTo(16.97, 2)
  })

  it('is symmetric', () => {
    const a = { x: 31.4, y: 67.8 }
    const b = { x: 2, y: 5 }
    expect(distance(a, b)).toBe(distance(b, a))
  })
})

describe('sunlight', () => {
  it('is undefined for an unmodeled cell', () => {
    expect(getSunlightAt(createGarden(), 0, 0)).toBeUndefined()
  })

  it('sets a level and reads it back', () => {
    const garden = setSunlightAt(createGarden(), 2, 3, 'full-sun')
    expect(getSunlightAt(garden, 2, 3)).toBe('full-sun')
    expect(getSunlightAt(garden, 3, 2)).toBeUndefined()
  })

  it('overwrites rather than toggles, and is idempotent', () => {
    let garden = setSunlightAt(createGarden(), 1, 1, 'full-sun')
    garden = setSunlightAt(garden, 1, 1, 'shade')
    garden = setSunlightAt(garden, 1, 1, 'shade')
    expect(getSunlightAt(garden, 1, 1)).toBe('shade')
  })

  it('clearSunlightAt returns a cell to unmodeled, and is safe on an unmodeled cell', () => {
    let garden = setSunlightAt(createGarden(), 1, 1, 'full-sun')
    garden = clearSunlightAt(garden, 1, 1)
    expect(getSunlightAt(garden, 1, 1)).toBeUndefined()
    expect(getSunlightAt(clearSunlightAt(garden, 0, 0), 0, 0)).toBeUndefined()
  })

  it('treats out-of-bounds cells as no-ops', () => {
    const garden = createGarden(60, 60)
    expect(setSunlightAt(garden, 5, 0, 'full-sun')).toBe(garden)
    expect(getSunlightAt(garden, -1, 0)).toBeUndefined()
    expect(clearSunlightAt(garden, 5, 0)).toBe(garden)
  })

  it('does not mutate the original garden state', () => {
    const original = createGarden()
    setSunlightAt(original, 0, 0, 'full-sun')
    expect(getSunlightAt(original, 0, 0)).toBeUndefined()
  })
})

describe('clearGarden / hasPlacements', () => {
  it('removes all placements while preserving dimensions and modeled sunlight', () => {
    let garden = createGarden(72, 84)
    garden = placePlant(garden, 'p1', 'tomato', { x: 6, y: 6 })
    garden = setSunlightAt(garden, 3, 3, 'shade')

    const cleared = clearGarden(garden)
    expect(cleared.placements).toEqual({})
    expect(cleared.width).toBe(72)
    expect(cleared.height).toBe(84)
    expect(getSunlightAt(cleared, 3, 3)).toBe('shade')
  })

  it('returns the same garden when there is nothing to clear', () => {
    const garden = createGarden()
    expect(clearGarden(garden)).toBe(garden)
  })

  it('hasPlacements tracks whether anything is placed', () => {
    const garden = placePlant(createGarden(), 'p1', 'tomato', { x: 6, y: 6 })
    expect(hasPlacements(createGarden())).toBe(false)
    expect(hasPlacements(garden)).toBe(true)
    expect(hasPlacements(clearGarden(garden))).toBe(false)
  })
})

describe('beds', () => {
  // A 4 x 6 ft bed at an arbitrary, off-grid position — beds are not tied
  // to the 12" environmental grid.
  const rect = { position: { x: 7.5, y: 30 }, width: 48, height: 72 }

  it('adds a bed with arbitrary physical position and size', () => {
    const garden = addBed(createGarden(), 'b1', 'Bed 1', rect)
    expect(getBed(garden, 'b1')).toEqual({ id: 'b1', name: 'Bed 1', ...rect })
    expect(getAllBeds(garden)).toHaveLength(1)
  })

  it('starts a new garden with no beds', () => {
    expect(createGarden().beds).toEqual({})
  })

  it('rejects a bed that leaves the garden, has non-positive size, or is non-finite', () => {
    const garden = createGarden(120, 120)
    expect(isValidBedRect(garden, { position: { x: 100, y: 0 }, width: 24, height: 24 })).toBe(false)
    expect(isValidBedRect(garden, { position: { x: -1, y: 0 }, width: 24, height: 24 })).toBe(false)
    expect(isValidBedRect(garden, { position: { x: 0, y: 0 }, width: 0, height: 24 })).toBe(false)
    expect(isValidBedRect(garden, { position: { x: 0, y: 0 }, width: Number.NaN, height: 24 })).toBe(false)
    expect(addBed(garden, 'b1', 'Bed 1', { position: { x: 100, y: 0 }, width: 24, height: 24 })).toBe(garden)
  })

  it('accepts a bed that exactly fills the garden', () => {
    const garden = createGarden(120, 120)
    expect(isValidBedRect(garden, { position: { x: 0, y: 0 }, width: 120, height: 120 })).toBe(true)
  })

  it('rejects overlapping beds but allows beds that share an edge', () => {
    const garden = addBed(createGarden(), 'b1', 'Bed 1', { position: { x: 0, y: 0 }, width: 24, height: 24 })
    expect(isValidBedRect(garden, { position: { x: 23.9, y: 0 }, width: 24, height: 24 })).toBe(false)
    expect(isValidBedRect(garden, { position: { x: 24, y: 0 }, width: 24, height: 24 })).toBe(true)
  })

  it('is a no-op when the id is already in use', () => {
    const garden = addBed(createGarden(), 'b1', 'Bed 1', rect)
    expect(addBed(garden, 'b1', 'Bed 2', { position: { x: 70, y: 0 }, width: 12, height: 12 })).toBe(garden)
  })

  it('nextBedName uses the lowest unused number', () => {
    let garden = createGarden()
    expect(nextBedName(garden)).toBe('Bed 1')
    garden = addBed(garden, 'a', 'Bed 1', { position: { x: 0, y: 0 }, width: 12, height: 12 })
    garden = addBed(garden, 'b', 'Bed 2', { position: { x: 24, y: 0 }, width: 12, height: 12 })
    expect(nextBedName(garden)).toBe('Bed 3')
    garden = removeBed(garden, 'a')
    expect(nextBedName(garden)).toBe('Bed 1')
  })

  it('renameBed trims, and ignores empty names and unknown ids', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', rect)
    garden = renameBed(garden, 'b1', '  Herb box  ')
    expect(getBed(garden, 'b1')?.name).toBe('Herb box')
    expect(renameBed(garden, 'b1', '   ')).toBe(garden)
    expect(renameBed(garden, 'missing', 'x')).toBe(garden)
  })

  it('derives bed membership from position, half-open like cells', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', { position: { x: 12, y: 12 }, width: 24, height: 24 })
    garden = placePlant(garden, 'inside', 'tomato', { x: 12, y: 12 })
    garden = placePlant(garden, 'edge', 'basil', { x: 36, y: 20 })
    garden = placePlant(garden, 'ground', 'carrot', { x: 50, y: 50 })

    expect(getBedAt(garden, { x: 12, y: 12 })?.id).toBe('b1')
    expect(getBedAt(garden, { x: 36, y: 20 })).toBeUndefined()
    expect(getPlacementsInBed(garden, 'b1').map((p) => p.id)).toEqual(['inside'])
    expect(getPlacementsInBed(garden, 'missing')).toEqual([])
  })

  it('places plants outside beds as normal', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', rect)
    garden = placePlant(garden, 'p', 'tomato', { x: 100, y: 6 })
    expect(getPlacement(garden, 'p')).toBeDefined()
    expect(getBedAt(garden, { x: 100, y: 6 })).toBeUndefined()
  })

  it('moveBed moves the bed and the plants inside it by the same distance, leaving others', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', { position: { x: 0, y: 0 }, width: 24, height: 24 })
    garden = placePlant(garden, 'in', 'tomato', { x: 6, y: 18 })
    garden = placePlant(garden, 'out', 'basil', { x: 30, y: 6 })
    garden = moveBed(garden, 'b1', { x: 48, y: 36 })

    expect(getBed(garden, 'b1')?.position).toEqual({ x: 48, y: 36 })
    expect(getPlacement(garden, 'in')?.position).toEqual({ x: 54, y: 54 })
    expect(getPlacement(garden, 'out')?.position).toEqual({ x: 30, y: 6 })
    expect(getPlacementsInBed(garden, 'b1').map((p) => p.id)).toEqual(['in'])
  })

  it('moveBed is a no-op for an unknown id, a destination outside the garden, or an overlap', () => {
    let garden = addBed(createGarden(120, 120), 'b1', 'Bed 1', { position: { x: 0, y: 0 }, width: 24, height: 24 })
    garden = addBed(garden, 'b2', 'Bed 2', { position: { x: 48, y: 0 }, width: 24, height: 24 })
    garden = placePlant(garden, 'in', 'tomato', { x: 6, y: 6 })

    expect(moveBed(garden, 'missing', { x: 0, y: 48 })).toBe(garden)
    expect(moveBed(garden, 'b1', { x: 100, y: 0 })).toBe(garden)
    expect(moveBed(garden, 'b1', { x: 36, y: 0 })).toBe(garden)
  })

  it('moveBed may move a bed onto part of its own old footprint', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', { position: { x: 0, y: 0 }, width: 24, height: 24 })
    garden = moveBed(garden, 'b1', { x: 12, y: 0 })
    expect(getBed(garden, 'b1')?.position).toEqual({ x: 12, y: 0 })
  })

  it('resizeBed changes the rectangle without moving plants', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', { position: { x: 0, y: 0 }, width: 48, height: 24 })
    garden = placePlant(garden, 'p', 'tomato', { x: 42, y: 6 })
    const resized = { position: { x: 0, y: 0 }, width: 24, height: 24 }
    garden = resizeBed(garden, 'b1', resized)

    expect(getBed(garden, 'b1')).toMatchObject(resized)
    expect(getPlacement(garden, 'p')?.position).toEqual({ x: 42, y: 6 })
    expect(getBedAt(garden, { x: 42, y: 6 })).toBeUndefined()
  })

  it('resizeBed is a no-op for an unknown id or an invalid rectangle', () => {
    const garden = addBed(createGarden(120, 120), 'b1', 'Bed 1', rect)
    expect(resizeBed(garden, 'missing', rect)).toBe(garden)
    expect(resizeBed(garden, 'b1', { ...rect, width: -12 })).toBe(garden)
  })

  it('removeBed leaves its plants in place', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', rect)
    garden = placePlant(garden, 'p', 'tomato', { x: 20, y: 40 })
    garden = removeBed(garden, 'b1')

    expect(getBed(garden, 'b1')).toBeUndefined()
    expect(getPlacement(garden, 'p')?.position).toEqual({ x: 20, y: 40 })
    expect(removeBed(garden, 'missing')).toBe(garden)
  })

  it('clearGarden keeps beds — they are site layout, not planting design', () => {
    let garden = addBed(createGarden(), 'b1', 'Bed 1', rect)
    garden = placePlant(garden, 'p', 'tomato', { x: 20, y: 40 })
    const cleared = clearGarden(garden)
    expect(cleared.placements).toEqual({})
    expect(getBed(cleared, 'b1')).toBeDefined()
  })
})
