export type GardenDimensions = {
  rows: number
  cols: number
}

/**
 * Garden state is an explicit mapping from cell coordinates to the id of the
 * plant placed there, rather than a fixed-size 2D array. This keeps state
 * independent of any particular grid size (see ARCHITECTURE.md).
 */
export type GardenState = {
  dimensions: GardenDimensions
  placements: Record<string, string>
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

export function createGarden(rows: number, cols: number): GardenState {
  return {
    dimensions: { rows, cols },
    placements: {},
  }
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
      [cellKey(row, col)]: plantId,
    },
  }
}

export function getPlantIdAt(
  garden: GardenState,
  row: number,
  col: number,
): string | undefined {
  return garden.placements[cellKey(row, col)]
}
