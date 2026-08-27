export type CellKey = string

/**
 * What is placed in a single garden cell. Kept as an explicit record (rather
 * than a bare plant id string) so it can grow additional per-placement data
 * later without another state-shape change.
 */
export type PlacedPlant = {
  plantId: string
}

/**
 * Garden state is an explicit mapping from cell coordinates to what is
 * placed there, rather than a fixed-size 2D array. This keeps state
 * independent of any particular grid size (see ARCHITECTURE.md).
 */
export type GardenState = {
  rows: number
  columns: number
  placements: Record<CellKey, PlacedPlant>
}

export const GARDEN_MIN_SIZE = 4
export const GARDEN_MAX_SIZE = 30
export const GARDEN_DEFAULT_SIZE = 10

function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`
}

export function createGarden(
  rows: number = GARDEN_DEFAULT_SIZE,
  columns: number = GARDEN_DEFAULT_SIZE,
): GardenState {
  if (
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows < GARDEN_MIN_SIZE ||
    rows > GARDEN_MAX_SIZE ||
    columns < GARDEN_MIN_SIZE ||
    columns > GARDEN_MAX_SIZE
  ) {
    throw new Error(
      `Garden dimensions must be whole numbers between ${GARDEN_MIN_SIZE} and ${GARDEN_MAX_SIZE} (got ${rows}x${columns}).`,
    )
  }

  return { rows, columns, placements: {} }
}

/**
 * Whether (row, col) is an addressable cell in this garden: a pair of
 * integers within [0, rows) x [0, columns). Every operation below treats an
 * invalid coordinate as a no-op (or returns "nothing there"), rather than
 * throwing — consistent with how these operations already treat an empty or
 * unchanged cell.
 */
export function isValidCoordinate(
  garden: GardenState,
  row: number,
  col: number,
): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < garden.rows &&
    col >= 0 &&
    col < garden.columns
  )
}

export function placePlant(
  garden: GardenState,
  row: number,
  col: number,
  plantId: string,
): GardenState {
  if (!isValidCoordinate(garden, row, col)) return garden

  return {
    ...garden,
    placements: {
      ...garden.placements,
      [cellKey(row, col)]: { plantId },
    },
  }
}

export function getPlantIdAt(
  garden: GardenState,
  row: number,
  col: number,
): string | undefined {
  if (!isValidCoordinate(garden, row, col)) return undefined
  return garden.placements[cellKey(row, col)]?.plantId
}

/**
 * Removes whatever is placed at (row, col), if anything. Calling this on an
 * already-empty or out-of-bounds cell is a safe no-op.
 */
export function removePlant(
  garden: GardenState,
  row: number,
  col: number,
): GardenState {
  if (!isValidCoordinate(garden, row, col)) return garden
  const placements = { ...garden.placements }
  delete placements[cellKey(row, col)]
  return { ...garden, placements }
}

/**
 * Moves whatever is at (fromRow, fromCol) to (toRow, toCol).
 *
 * If the destination is empty, this is a plain move: the source cell
 * becomes empty. If the destination is occupied, the two plants swap
 * places rather than the destination's plant being discarded. Moving from
 * an empty or out-of-bounds source, or to the same cell, is a safe no-op.
 */
export function movePlant(
  garden: GardenState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): GardenState {
  if (
    !isValidCoordinate(garden, fromRow, fromCol) ||
    !isValidCoordinate(garden, toRow, toCol)
  ) {
    return garden
  }

  const plantId = getPlantIdAt(garden, fromRow, fromCol)
  if (!plantId) return garden
  if (fromRow === toRow && fromCol === toCol) return garden

  const destinationPlantId = getPlantIdAt(garden, toRow, toCol)

  const withPlantMoved = placePlant(garden, toRow, toCol, plantId)

  return destinationPlantId
    ? placePlant(withPlantMoved, fromRow, fromCol, destinationPlantId)
    : removePlant(withPlantMoved, fromRow, fromCol)
}

/**
 * Removes all placements while preserving the garden's dimensions.
 */
export function clearGarden(garden: GardenState): GardenState {
  return { ...garden, placements: {} }
}

/**
 * Whether the garden has at least one placed plant. Used to decide, for
 * example, whether starting a new garden needs confirmation.
 */
export function hasPlacements(garden: GardenState): boolean {
  return Object.keys(garden.placements).length > 0
}

export type CellCoordinate = {
  row: number
  col: number
}

/**
 * Chebyshev distance between two coordinates: the larger of the row and
 * column deltas. Diagonal neighbors are distance 1, same as orthogonal
 * neighbors — used for spacing, deliberately unlike the orthogonal-only
 * adjacency used for companion/incompatible feedback.
 */
export function chebyshevDistance(a: CellCoordinate, b: CellCoordinate): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

export type PlacedPlantEntry = {
  coordinate: CellCoordinate
  plantId: string
}

/**
 * All current placements as coordinate + plant id pairs, decoding the
 * internal cell-key encoding so callers never need to parse it themselves.
 */
export function getAllPlacements(garden: GardenState): PlacedPlantEntry[] {
  return Object.entries(garden.placements).map(([key, placed]) => {
    const [rowText, colText] = key.split(',')
    return {
      coordinate: { row: Number(rowText), col: Number(colText) },
      plantId: placed.plantId,
    }
  })
}

/**
 * Immediately-adjacent (orthogonal: up/down/left/right) cells for a given
 * coordinate, clipped to the garden's bounds. Diagonal neighbors are not
 * considered adjacent. Returns an empty array if (row, col) itself is not a
 * valid coordinate in this garden.
 */
export function getAdjacentCoordinates(
  garden: GardenState,
  row: number,
  col: number,
): CellCoordinate[] {
  if (!isValidCoordinate(garden, row, col)) return []

  const candidates: CellCoordinate[] = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ]

  return candidates.filter((c) => isValidCoordinate(garden, c.row, c.col))
}
