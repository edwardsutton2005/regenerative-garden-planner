import { describe, expect, it } from 'vitest'
import { plants } from '../data/plants'
import { relationshipRules } from '../data/relationships'
import { addBed, createGarden, getBedAt, placePlant } from '../domain/garden'
import type { GardenState, Position } from '../domain/garden'
import { GARDENER_CLEARANCE, findPath, isWalkable, nearestWalkable, reactionTo, walkGrid } from './gardenerPath'

const plantsById = Object.fromEntries(plants.map((p) => [p.id, p]))

// A 10 × 10 ft garden with a bed wall across the middle, open only at the
// right-hand end.
function walledGarden(): GardenState {
  return addBed(createGarden(120, 120), 'wall', 'Wall', {
    position: { x: 0, y: 48 },
    width: 84,
    height: 24,
  })
}

/** No point along the route, sampled each inch, is inside a bed. */
function routeAvoidsBeds(garden: GardenState, from: Position, route: Position[]): boolean {
  let at = from
  for (const next of route) {
    const steps = Math.ceil(Math.hypot(next.x - at.x, next.y - at.y))
    for (let s = 1; s <= steps; s++) {
      const p = { x: at.x + ((next.x - at.x) * s) / steps, y: at.y + ((next.y - at.y) * s) / steps }
      if (getBedAt(garden, p)) return false
    }
    at = next
  }
  return true
}

describe('walkGrid', () => {
  it('keeps the gardener clear of beds and the garden edge', () => {
    const grid = walkGrid(walledGarden())
    expect(isWalkable(grid, { x: 30, y: 20 })).toBe(true)
    expect(isWalkable(grid, { x: 30, y: 60 })).toBe(false) // in the bed
    expect(isWalkable(grid, { x: 30, y: 48 - GARDENER_CLEARANCE / 2 })).toBe(false) // too close to it
    expect(isWalkable(grid, { x: 2, y: 20 })).toBe(false) // too close to the edge
  })
})

describe('findPath', () => {
  it('walks around a bed rather than through it', () => {
    const garden = walledGarden()
    const from = { x: 30, y: 21 }
    const to = { x: 30, y: 99 }
    const route = findPath(walkGrid(garden), from, to)!
    expect(route.at(-1)).toEqual(to)
    expect(route.some((p) => p.x > 84)).toBe(true) // through the gap at the right
    expect(routeAvoidsBeds(garden, from, route)).toBe(true)
  })

  it('finds no route to a spot cut off by beds, or to a spot inside a bed', () => {
    const sealed = addBed(walledGarden(), 'plug', 'Plug', {
      position: { x: 84, y: 48 },
      width: 36,
      height: 24,
    })
    const grid = walkGrid(sealed)
    expect(findPath(grid, { x: 30, y: 21 }, { x: 30, y: 99 })).toBeNull()
    expect(findPath(grid, { x: 30, y: 21 }, { x: 30, y: 60 })).toBeNull()
  })
})

describe('nearestWalkable', () => {
  it('moves a spot inside a bed to the nearest open ground', () => {
    const grid = walkGrid(walledGarden())
    const landed = nearestWalkable(grid, { x: 30, y: 52 })!
    expect(isWalkable(grid, landed)).toBe(true)
    expect(landed.y).toBeLessThan(48) // just above the wall, the nearer side
  })

  it('leaves open ground as it is', () => {
    const grid = walkGrid(walledGarden())
    expect(nearestWalkable(grid, { x: 30.5, y: 20 })).toEqual({ x: 30.5, y: 20 })
  })
})

describe('reactionTo', () => {
  const garden = createGarden(120, 120)
  const react = (g: GardenState, ids: string[]) => reactionTo(g, ids, plantsById, relationshipRules)

  it('is happy at a companion pairing', () => {
    const g = placePlant(placePlant(garden, 't', 'tomato', { x: 30, y: 30 }), 'b', 'basil', { x: 38, y: 30 })
    expect(react(g, ['b'])).toBe('happy')
  })

  it('is puzzled at a poor pairing, even next to a good one', () => {
    let g = placePlant(garden, 't', 'tomato', { x: 30, y: 30 })
    g = placePlant(g, 'b', 'basil', { x: 38, y: 30 })
    g = placePlant(g, 'p', 'potato', { x: 30, y: 38 })
    expect(react(g, ['t'])).toBe('puzzled')
  })

  it('has no reaction to a plant with no neighbors, or to nothing placed', () => {
    const g = placePlant(garden, 't', 'tomato', { x: 30, y: 30 })
    expect(react(g, ['t'])).toBeNull()
    expect(react(g, [])).toBeNull()
  })
})
