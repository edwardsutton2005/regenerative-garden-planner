import type { GardenState } from '../domain/garden'
import { getPlantIdAt } from '../domain/garden'
import type { Plant } from '../domain/plant'

type GardenGridProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  onCellClick: (row: number, col: number) => void
}

function GardenGrid({ garden, plantsById, onCellClick }: GardenGridProps) {
  const { rows, columns } = garden
  const rowIndexes = Array.from({ length: rows }, (_, row) => row)
  const colIndexes = Array.from({ length: columns }, (_, col) => col)

  return (
    <div
      className="garden-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {rowIndexes.map((row) =>
        colIndexes.map((col) => {
          const plantId = getPlantIdAt(garden, row, col)
          const plant = plantId ? plantsById[plantId] : undefined

          return (
            <button
              type="button"
              key={`${row},${col}`}
              className={`garden-cell${plant ? ` garden-cell--${plant.category}` : ''}`}
              onClick={() => onCellClick(row, col)}
            >
              {plant ? plant.name : ''}
            </button>
          )
        }),
      )}
    </div>
  )
}

export default GardenGrid
