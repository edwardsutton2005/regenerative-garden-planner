import { useState } from 'react'
import type { GardenState } from '../domain/garden'
import { getPlantIdAt } from '../domain/garden'
import type { Plant } from '../domain/plant'
import type { PlantDragPayload } from './dragPayload'
import { PLANT_DRAG_MIME_TYPE, isPlantDragPayload } from './dragPayload'

type GardenGridProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  inspectedCoordinate: { row: number; col: number } | null
  onCellClick: (row: number, col: number) => void
  onCellDrop: (row: number, col: number, payload: PlantDragPayload) => void
}

function GardenGrid({
  garden,
  plantsById,
  inspectedCoordinate,
  onCellClick,
  onCellDrop,
}: GardenGridProps) {
  const { rows, columns } = garden
  const rowIndexes = Array.from({ length: rows }, (_, row) => row)
  const colIndexes = Array.from({ length: columns }, (_, col) => col)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  return (
    <div
      className="garden-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(44px, 1fr))` }}
    >
      {rowIndexes.map((row) =>
        colIndexes.map((col) => {
          const plantId = getPlantIdAt(garden, row, col)
          const plant = plantId ? plantsById[plantId] : undefined
          const key = `${row},${col}`
          const isInspected =
            inspectedCoordinate?.row === row && inspectedCoordinate?.col === col

          return (
            <button
              type="button"
              key={key}
              draggable={Boolean(plant)}
              className={`garden-cell${plant ? ` garden-cell--${plant.category}` : ''}${
                dragOverKey === key ? ' garden-cell--drag-over' : ''
              }${isInspected ? ' garden-cell--inspected' : ''}`}
              onClick={() => onCellClick(row, col)}
              onDragStart={(e) => {
                if (!plantId) return
                e.dataTransfer.effectAllowed = 'move'
                const payload: PlantDragPayload = { kind: 'garden', source: { row, col } }
                e.dataTransfer.setData(PLANT_DRAG_MIME_TYPE, JSON.stringify(payload))
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
                const raw = e.dataTransfer.getData(PLANT_DRAG_MIME_TYPE)
                if (!raw) return
                let parsed: unknown
                try {
                  parsed = JSON.parse(raw)
                } catch {
                  return
                }
                if (!isPlantDragPayload(parsed)) return
                onCellDrop(row, col, parsed)
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
