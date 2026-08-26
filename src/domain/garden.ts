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
    rows < GARDEN_MIN_SIZE ||
    rows > GARDEN_MAX_SIZE ||
    columns < GARDEN_MIN_SIZE ||
    columns > GARDEN_MAX_SIZE
  ) {
    throw new Error(
      `Garden dimensions must be between ${GARDEN_MIN_SIZE} and ${GARDEN_MAX_SIZE} (got ${rows}x${columns}).`,
    )
  }

  return { rows, columns, placements: {} }
}

export function placePlant(
  garden: GardenState,
  row: number,
  col: number,
  plantId: string,
): GardenState {
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
  return garden.placements[cellKey(row, col)]?.plantId
}

export type CellCoordinate = {
  row: number
  col: number
}

/**
 * Immediately-adjacent (orthogonal: up/down/left/right) cells for a given
 * coordinate, clipped to the garden's bounds. Diagonal neighbors are not
 * considered adjacent.
 */
export function getAdjacentCoordinates(
  garden: GardenState,
  row: number,
  col: number,
): CellCoordinate[] {
  const candidates: CellCoordinate[] = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ]

  return candidates.filter(
    (c) =>
      c.row >= 0 && c.row < garden.rows && c.col >= 0 && c.col < garden.columns,
  )
}
