import { useState } from 'react'
import { GARDEN_MAX_SIZE, GARDEN_MIN_SIZE, isValidGardenDimension } from '../domain/garden'

type GardenSetupProps = {
  initialRows: number
  initialColumns: number
  onCreateGarden: (rows: number, columns: number) => void
}

const DIMENSION_HINT = `Whole number from ${GARDEN_MIN_SIZE} to ${GARDEN_MAX_SIZE}`

/**
 * Parses a raw draft input into a valid dimension, or null if it isn't one
 * yet. Never clamps or substitutes a value — the caller decides what to do
 * with null (show an error, disable submission), the draft string itself is
 * left exactly as the user typed it.
 */
function parseDimension(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return isValidGardenDimension(value) ? value : null
}

function GardenSetup({ initialRows, initialColumns, onCreateGarden }: GardenSetupProps) {
  const [draftRows, setDraftRows] = useState(String(initialRows))
  const [draftColumns, setDraftColumns] = useState(String(initialColumns))

  const rows = parseDimension(draftRows)
  const columns = parseDimension(draftColumns)
  const rowsInvalid = rows === null
  const columnsInvalid = columns === null
  const canCreate = rows !== null && columns !== null

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
            aria-invalid={rowsInvalid}
            onChange={(e) => setDraftRows(e.target.value)}
          />
          {rowsInvalid && <span className="garden-controls__error">{DIMENSION_HINT}</span>}
        </label>
        <label className="garden-controls__field">
          Columns
          <input
            type="number"
            min={GARDEN_MIN_SIZE}
            max={GARDEN_MAX_SIZE}
            value={draftColumns}
            aria-invalid={columnsInvalid}
            onChange={(e) => setDraftColumns(e.target.value)}
          />
          {columnsInvalid && <span className="garden-controls__error">{DIMENSION_HINT}</span>}
        </label>
        <button
          type="button"
          disabled={!canCreate}
          title={canCreate ? undefined : `Enter valid rows and columns (${GARDEN_MIN_SIZE}-${GARDEN_MAX_SIZE}) to create a garden`}
          onClick={() => {
            if (rows !== null && columns !== null) onCreateGarden(rows, columns)
          }}
        >
          Create Garden
        </button>
      </div>
    </div>
  )
}

export default GardenSetup
