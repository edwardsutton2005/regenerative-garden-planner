import { useState } from 'react'
import { GARDEN_MAX_SIZE, GARDEN_MIN_SIZE } from '../domain/garden'

type GardenSetupProps = {
  initialRows: number
  initialColumns: number
  onCreateGarden: (rows: number, columns: number) => void
}

function clampSize(value: number): number {
  if (Number.isNaN(value)) return GARDEN_MIN_SIZE
  return Math.min(Math.max(value, GARDEN_MIN_SIZE), GARDEN_MAX_SIZE)
}

function GardenSetup({ initialRows, initialColumns, onCreateGarden }: GardenSetupProps) {
  const [draftRows, setDraftRows] = useState(initialRows)
  const [draftColumns, setDraftColumns] = useState(initialColumns)

  return (
    <div className="garden-setup">
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
          onClick={() => onCreateGarden(clampSize(draftRows), clampSize(draftColumns))}
        >
          Create Garden
        </button>
      </div>
    </div>
  )
}

export default GardenSetup
