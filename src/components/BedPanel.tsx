import { useState } from 'react'
import type { GardenBed } from '../domain/garden'
import Icon from './Icon'
import { formatSize } from './units'

type BedPanelProps = {
  bed: GardenBed
  /** Names of the plants currently inside the bed (derived from positions). */
  plantNames: string[]
  onRename: (name: string) => void
  onDelete: () => void
  onClose: () => void
}

/**
 * The selected bed's details. Render with `key={bed.id}` so the name draft
 * resets when a different bed is selected.
 */
function BedPanel({ bed, plantNames, onRename, onDelete, onClose }: BedPanelProps) {
  const [draftName, setDraftName] = useState(bed.name)

  // "Tomato ×2, Basil" — counts per plant, in first-seen order.
  const counts = new Map<string, number>()
  for (const name of plantNames) counts.set(name, (counts.get(name) ?? 0) + 1)
  const contents = [...counts].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))

  // Commits a non-empty name; an emptied field snaps back to the current name.
  function commitName() {
    if (draftName.trim() === '') setDraftName(bed.name)
    else if (draftName !== bed.name) onRename(draftName)
  }

  return (
    <div className="garden-inspector bed-panel">
      <div className="garden-inspector__header">
        <input
          className="bed-panel__name"
          aria-label="Bed name"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              setDraftName(bed.name)
              e.currentTarget.blur()
            }
          }}
        />
        <button
          type="button"
          className="garden-inspector__close"
          onClick={onClose}
          aria-label="Deselect bed"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <section className="garden-inspector__section">
        <h3>Size</h3>
        <p className="garden-inspector__lifecycle">{formatSize(bed.width, bed.height)}</p>
      </section>

      <section className="garden-inspector__section">
        <h3>Plants in this bed</h3>
        {contents.length === 0 ? (
          <p className="garden-inspector__empty">No plants yet</p>
        ) : (
          <p className="garden-inspector__lifecycle">{contents.join(', ')}</p>
        )}
      </section>

      <button type="button" className="bed-panel__delete" onClick={onDelete}>
        Delete bed
      </button>
    </div>
  )
}

export default BedPanel
