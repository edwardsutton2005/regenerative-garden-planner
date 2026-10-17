import { useState } from 'react'
import { GARDEN_MAX_SIZE, GARDEN_MIN_SIZE, isValidGardenDimension } from '../domain/garden'

// The domain measures in inches; setup asks for whole feet.
const INCHES_PER_FOOT = 12
const MIN_FEET = GARDEN_MIN_SIZE / INCHES_PER_FOOT
const MAX_FEET = GARDEN_MAX_SIZE / INCHES_PER_FOOT

type GardenSetupProps = {
  /** Inches. */
  initialWidth: number
  /** Inches. */
  initialHeight: number
  /** Called with width and height in inches. */
  onCreateGarden: (width: number, height: number) => void
}

const DIMENSION_HINT = `Whole number of feet from ${MIN_FEET} to ${MAX_FEET}`

/**
 * Parses a raw draft input (feet) into a valid dimension in inches, or null
 * if it isn't one yet. Never clamps or substitutes a value — the caller decides what to do
 * with null (show an error, disable submission), the draft string itself is
 * left exactly as the user typed it.
 */
function parseDimension(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const inches = Number(trimmed) * INCHES_PER_FOOT
  return isValidGardenDimension(inches) ? inches : null
}

function GardenSetup({ initialWidth, initialHeight, onCreateGarden }: GardenSetupProps) {
  const [draftWidth, setDraftWidth] = useState(String(initialWidth / INCHES_PER_FOOT))
  const [draftHeight, setDraftHeight] = useState(String(initialHeight / INCHES_PER_FOOT))

  const width = parseDimension(draftWidth)
  const height = parseDimension(draftHeight)
  const widthInvalid = width === null
  const heightInvalid = height === null
  const canCreate = width !== null && height !== null

  return (
    <div className="garden-setup">
      <div className="garden-controls">
        <label className="garden-controls__field">
          Width (ft)
          <input
            type="number"
            min={MIN_FEET}
            max={MAX_FEET}
            value={draftWidth}
            aria-invalid={widthInvalid}
            onChange={(e) => setDraftWidth(e.target.value)}
          />
          {widthInvalid && <span className="garden-controls__error">{DIMENSION_HINT}</span>}
        </label>
        <label className="garden-controls__field">
          Length (ft)
          <input
            type="number"
            min={MIN_FEET}
            max={MAX_FEET}
            value={draftHeight}
            aria-invalid={heightInvalid}
            onChange={(e) => setDraftHeight(e.target.value)}
          />
          {heightInvalid && <span className="garden-controls__error">{DIMENSION_HINT}</span>}
        </label>
        <button
          type="button"
          className="garden-controls__create"
          disabled={!canCreate}
          title={canCreate ? undefined : `Enter a valid width and length (${MIN_FEET}-${MAX_FEET} ft) to create a garden`}
          onClick={() => {
            if (width !== null && height !== null) onCreateGarden(width, height)
          }}
        >
          Create Garden
        </button>
      </div>
    </div>
  )
}

export default GardenSetup
