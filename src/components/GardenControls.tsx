import { useState } from 'react'
import { GARDEN_MAX_SIZE, GARDEN_MIN_SIZE } from '../domain/garden'

type GardenControlsProps = {
  rows: number
  columns: number
  onCreateNewGarden: (rows: number, columns: number) => void
  onClearGarden: () => void
}

function clampSize(value: number): number {
  if (Number.isNaN(value)) return GARDEN_MIN_SIZE
  return Math.min(Math.max(value, GARDEN_MIN_SIZE), GARDEN_MAX_SIZE)
}

function GardenControls({
  rows,
  columns,
  onCreateNewGarden,
  onClearGarden,
}: GardenControlsProps) {
  const [draftRows, setDraftRows] = useState(rows)
  const [draftColumns, setDraftColumns] = useState(columns)

  return (
    <div className="garden-controls">
      <label className="garden-controls__field">
        Rows
        <input
          type="number"
          min={GARDEN_MIN_SIZE}
          max={GARDEN_MAX_SIZE}
          value={draftRows}
          onChange={(e) => setDraftRows(Number(e.target.value))}
        />
      </label>
      <label className="garden-controls__field">
        Columns
        <input
          type="number"
          min={GARDEN_MIN_SIZE}
          max={GARDEN_MAX_SIZE}
          value={draftColumns}
          onChange={(e) => setDraftColumns(Number(e.target.value))}
        />
      </label>
      <button
        type="button"
        onClick={() => onCreateNewGarden(clampSize(draftRows), clampSize(draftColumns))}
      >
        New Garden
      </button>
      <button type="button" onClick={onClearGarden}>
        Clear Garden
      </button>
    </div>
  )
}

export default GardenControls
