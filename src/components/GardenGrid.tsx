import { useState } from 'react'
import type { GardenState } from '../domain/garden'
import { getPlantIdAt } from '../domain/garden'
import type { Plant } from '../domain/plant'

export type PlantDragPayload = {
  plantId: string
  source?: { row: number; col: number }
}

type GardenGridProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  onCellClick: (row: number, col: number) => void
  onCellDrop: (row: number, col: number, payload: PlantDragPayload) => void
}

function GardenGrid({ garden, plantsById, onCellClick, onCellDrop }: GardenGridProps) {
  const { rows, columns } = garden
  const rowIndexes = Array.from({ length: rows }, (_, row) => row)
  const colIndexes = Array.from({ length: columns }, (_, col) => col)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  return (
    <div
      className="garden-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {rowIndexes.map((row) =>
        colIndexes.map((col) => {
          const plantId = getPlantIdAt(garden, row, col)
          const plant = plantId ? plantsById[plantId] : undefined
          const key = `${row},${col}`

          return (
            <button
              type="button"
              key={key}
              draggable={Boolean(plant)}
              className={`garden-cell${plant ? ` garden-cell--${plant.category}` : ''}${
                dragOverKey === key ? ' garden-cell--drag-over' : ''
              }`}
              onClick={() => onCellClick(row, col)}
              onDragStart={(e) => {
                if (!plantId) return
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData(
                  'text/plain',
                  JSON.stringify({ plantId, source: { row, col } }),
                )
              }}
              onDragOver={(e) => {
                e.preventDefault()
              }}
              onDragEnter={() => setDragOverKey(key)}
              onDragLeave={() =>
                setDragOverKey((current) => (current === key ? null : current))
              }
              onDrop={(e) => {
                e.preventDefault()
                setDragOverKey(null)
                const raw = e.dataTransfer.getData('text/plain')
                if (!raw) return
                let payload: PlantDragPayload
                try {
                  payload = JSON.parse(raw)
                } catch {
                  return
                }
                if (!payload?.plantId) return
                onCellDrop(row, col, payload)
              }}
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
