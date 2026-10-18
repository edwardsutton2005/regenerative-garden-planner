import type { GardenState, Position } from '../domain/garden'
import { getAllBeds } from '../domain/garden'
import type { Plant } from '../domain/plant'
import type { PlantRelationshipRule } from '../domain/relationships'
import { evaluateNeighborsForFocuses } from '../domain/relationships'
import { evaluateCrowdingForFocuses, evaluateSpacingForFocuses } from '../domain/spacing'
import { evaluateSunlightFit } from '../domain/sunlightFit'

// Where the decorative gardener can walk, and how it reacts. UI-only: the
// gardener is not part of the garden, is never saved, and never affects
// reasoning. Positions are the gardener's feet, in garden inches.

/** Walking grid resolution, in inches. */
export const WALK_CELL = 6
/** How far the gardener's feet stay from beds and the garden's edge. */
export const GARDENER_CLEARANCE = 8

export type WalkGrid = {
  columns: number
  rows: number
  /** 1 where the gardener may stand, by cell index (row * columns + column). */
  walkable: Uint8Array
}

/** Which cells of the garden are open ground: inside the garden and clear
 * of every bed by GARDENER_CLEARANCE. */
export function walkGrid(garden: GardenState): WalkGrid {
  const columns = Math.ceil(garden.width / WALK_CELL)
  const rows = Math.ceil(garden.height / WALK_CELL)
  const walkable = new Uint8Array(columns * rows)
  const beds = getAllBeds(garden)
  const c = GARDENER_CLEARANCE
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = (col + 0.5) * WALK_CELL
      const y = (row + 0.5) * WALK_CELL
      if (x < c || y < c || x > garden.width - c || y > garden.height - c) continue
      const clear = beds.every((bed) => {
        const dx = Math.max(bed.position.x - x, 0, x - (bed.position.x + bed.width))
        const dy = Math.max(bed.position.y - y, 0, y - (bed.position.y + bed.height))
        return Math.hypot(dx, dy) >= c
      })
      if (clear) walkable[row * columns + col] = 1
    }
  }
  return { columns, rows, walkable }
}

function cellIndex(grid: WalkGrid, p: Position): number {
  const col = Math.min(Math.max(Math.floor(p.x / WALK_CELL), 0), grid.columns - 1)
  const row = Math.min(Math.max(Math.floor(p.y / WALK_CELL), 0), grid.rows - 1)
  return row * grid.columns + col
}

function cellCenter(grid: WalkGrid, index: number): Position {
  return {
    x: ((index % grid.columns) + 0.5) * WALK_CELL,
    y: (Math.floor(index / grid.columns) + 0.5) * WALK_CELL,
  }
}

export function isWalkable(grid: WalkGrid, p: Position): boolean {
  return grid.walkable[cellIndex(grid, p)] === 1
}

/** The point itself if it's open ground, otherwise the center of the
 * nearest open cell; null if the garden has none. */
export function nearestWalkable(grid: WalkGrid, p: Position): Position | null {
  if (isWalkable(grid, p)) return p
  let best: number | null = null
  let bestDistance = Infinity
  grid.walkable.forEach((open, i) => {
    if (!open) return
    const center = cellCenter(grid, i)
    const d = Math.hypot(center.x - p.x, center.y - p.y)
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  })
  return best === null ? null : cellCenter(grid, best)
}

const STEPS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
] as const

/**
 * A walking route from `from` to `to` over open ground, as waypoints ending
 * at `to`; null when `to` isn't open ground or can't be reached. A* over the
 * grid, moving in eight directions without cutting a blocked corner, then
 * dropping waypoints along straight runs.
 */
export function findPath(grid: WalkGrid, from: Position, to: Position): Position[] | null {
  if (!isWalkable(grid, to)) return null
  const start = cellIndex(grid, from)
  const goal = cellIndex(grid, to)
  if (start === goal) return [to]
  const { columns, rows, walkable } = grid
  const cost = new Float64Array(columns * rows).fill(Infinity)
  const came = new Int32Array(columns * rows).fill(-1)
  const goalCol = goal % columns
  const goalRow = Math.floor(goal / columns)
  const estimate = (i: number) => Math.hypot((i % columns) - goalCol, Math.floor(i / columns) - goalRow)
  // ponytail: linear-scan open list, fine for a 30 × 30 ft garden (3,600
  // cells); use a binary heap if gardens get much larger.
  const open = new Set([start])
  const score = new Map([[start, estimate(start)]])
  cost[start] = 0
  while (open.size) {
    let current = -1
    let currentScore = Infinity
    for (const i of open) {
      const s = score.get(i)!
      if (s < currentScore) {
        currentScore = s
        current = i
      }
    }
    if (current === goal) break
    open.delete(current)
    const col = current % columns
    const row = Math.floor(current / columns)
    for (const [dx, dy] of STEPS) {
      const nc = col + dx
      const nr = row + dy
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue
      const next = nr * columns + nc
      if (!walkable[next] && next !== start) continue
      // No squeezing diagonally between two blocked cells.
      if (dx && dy && (!walkable[row * columns + nc] || !walkable[nr * columns + col])) continue
      const step = cost[current] + (dx && dy ? Math.SQRT2 : 1)
      if (step < cost[next]) {
        cost[next] = step
        came[next] = current
        score.set(next, step + estimate(next))
        open.add(next)
      }
    }
  }
  if (came[goal] === -1) return null

  const cells: number[] = []
  for (let i = came[goal]; i !== start && i !== -1; i = came[i]) cells.unshift(i)
  // Keep only the cells where the direction changes.
  const turns = cells.filter((cell, k) => {
    const prev = k === 0 ? start : cells[k - 1]
    const next = k === cells.length - 1 ? goal : cells[k + 1]
    return next - cell !== cell - prev
  })
  return [...turns.map((i) => cellCenter(grid, i)), to]
}

/** A random open spot, or null if there is none. */
export function randomWalkable(grid: WalkGrid, random: () => number = Math.random): Position | null {
  const open: number[] = []
  grid.walkable.forEach((v, i) => v && open.push(i))
  return open.length ? cellCenter(grid, open[Math.floor(random() * open.length)]) : null
}

export type Reaction = 'happy' | 'puzzled'

/**
 * How the gardener reacts to the plants just placed or moved, from the
 * domain's own findings: puzzled at any issue (a poor pairing, plants too
 * close or crowding, a sunlight mismatch), happy at a companion pairing, otherwise none.
 */
export function reactionTo(
  garden: GardenState,
  placementIds: string[],
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
): Reaction | null {
  if (placementIds.length === 0) return null
  const neighbors = evaluateNeighborsForFocuses(garden, placementIds, plantsById, rules)
  const issue =
    neighbors.some((n) => n.relationship === 'incompatible') ||
    evaluateSpacingForFocuses(garden, placementIds, plantsById).length > 0 ||
    evaluateCrowdingForFocuses(garden, placementIds, plantsById).length > 0 ||
    placementIds.some((id) => evaluateSunlightFit(garden, id, plantsById)?.status === 'mismatch')
  if (issue) return 'puzzled'
  return neighbors.some((n) => n.relationship === 'companion') ? 'happy' : null
}
