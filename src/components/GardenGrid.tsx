import { useEffect, useState } from 'react'
import type { GardenState } from '../domain/garden'
import { getPlantIdAt, getSunlightAt } from '../domain/garden'
import type { Plant } from '../domain/plant'
import type { PlantDragPayload } from './dragPayload'
import { PLANT_DRAG_MIME_TYPE, isPlantDragPayload } from './dragPayload'

type GardenGridProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  inspectedCoordinate: { row: number; col: number } | null
  onCellClick: (row: number, col: number) => void
  onCellDrop: (row: number, col: number, payload: PlantDragPayload) => void
  /** Whether a sunlight tool (paint or clear) is currently selected. While
   * true, cells are painted via pointer sweep instead of native plant
   * drag/drop, which is disabled for the duration. */
  paintMode: boolean
  onCellPaint: (row: number, col: number) => void
}

function GardenGrid({
  garden,
  plantsById,
  inspectedCoordinate,
  onCellClick,
  onCellDrop,
  paintMode,
  onCellPaint,
}: GardenGridProps) {
  const { rows, columns } = garden
  const rowIndexes = Array.from({ length: rows }, (_, row) => row)
  const colIndexes = Array.from({ length: columns }, (_, col) => col)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [isPainting, setIsPainting] = useState(false)

  // Backstop for ending a paint gesture even when the pointer is released
  // (or the gesture is cancelled) outside the grid entirely — onPointerUp/
  // onPointerLeave on the grid container catch the common case, but only a
  // window-level listener is guaranteed to fire regardless of where the
  // pointer ends up. Only attached while actually painting, so this stays
  // cheap and self-cleaning rather than a standing global listener.
  useEffect(() => {
    if (!isPainting) return

    const stopPainting = () => setIsPainting(false)
    window.addEventListener('pointerup', stopPainting)
    window.addEventListener('pointercancel', stopPainting)
    return () => {
      window.removeEventListener('pointerup', stopPainting)
      window.removeEventListener('pointercancel', stopPainting)
    }
  }, [isPainting])

  return (
    <div
      className="garden-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(44px, 1fr))` }}
      onPointerUp={() => setIsPainting(false)}
      onPointerLeave={() => setIsPainting(false)}
      onPointerCancel={() => setIsPainting(false)}
    >
      {rowIndexes.map((row) =>
        colIndexes.map((col) => {
          const plantId = getPlantIdAt(garden, row, col)
          const plant = plantId ? plantsById[plantId] : undefined
          const sunlightLevel = getSunlightAt(garden, row, col)
          const key = `${row},${col}`
          const isInspected =
            inspectedCoordinate?.row === row && inspectedCoordinate?.col === col

          return (
            <button
              type="button"
              key={key}
              draggable={Boolean(plant) && !paintMode}
              className={`garden-cell${plant ? ` garden-cell--${plant.category}` : ''}${
                sunlightLevel ? ` garden-cell--sun-${sunlightLevel}` : ''
              }${dragOverKey === key ? ' garden-cell--drag-over' : ''}${
                isInspected ? ' garden-cell--inspected' : ''
              }`}
              onClick={() => onCellClick(row, col)}
              onPointerDown={(e) => {
                if (!paintMode) return
                e.preventDefault()
                setIsPainting(true)
                onCellPaint(row, col)
              }}
              onPointerEnter={(e) => {
                if (!paintMode || !isPainting) return
                // Defense in depth: if the primary button is no longer held
                // (a missed pointerup somehow slipped through), stop rather
                // than keep painting.
                if ((e.buttons & 1) === 0) {
                  setIsPainting(false)
                  return
                }
                onCellPaint(row, col)
              }}
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
