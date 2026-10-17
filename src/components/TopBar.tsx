import { useRef } from 'react'
import { DEFAULT_GARDEN_NAME } from '../gardenPlan'
import Icon from './Icon'
import { formatSize } from './units'

type TopBarProps = {
  gardenName: string
  /** Whether the plan is saved in this browser. */
  saved: boolean
  onRenameGarden: (name: string) => void
  gardenWidth: number
  gardenHeight: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onNewGarden: () => void
  onClearGarden: () => void
}

/** Garden identity (an editable name), undo/redo, and a menu for the less
 * frequent, more destructive actions (New Garden, Clear Garden). */
function TopBar({
  gardenName,
  saved,
  onRenameGarden,
  gardenWidth,
  gardenHeight,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewGarden,
  onClearGarden,
}: TopBarProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  function fromMenu(action: () => void) {
    if (menuRef.current) menuRef.current.open = false
    action()
  }

  return (
    <header className="top-bar">
      <div className="top-bar__title">
        <a className="top-bar__app" href="/">
          Regenerative Garden Planner
        </a>
        <input
          className="top-bar__name"
          aria-label="Garden name"
          value={gardenName}
          size={Math.max(gardenName.length, 8)}
          maxLength={60}
          onChange={(e) => onRenameGarden(e.target.value)}
          onBlur={(e) => onRenameGarden(e.target.value.trim() || DEFAULT_GARDEN_NAME)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        <span className="top-bar__garden">
          {formatSize(gardenWidth, gardenHeight)} ·{' '}
          {saved ? 'Saved in this browser' : 'Not saved: browser storage is unavailable'}
        </span>
      </div>
      <div className="top-bar__actions">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (⌘Z / Ctrl+Z)"
          aria-keyshortcuts="Meta+Z Control+Z"
        >
          <Icon name="undo" /> Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y)"
          aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
        >
          <Icon name="redo" /> Redo
        </button>
        <details className="top-bar__menu" ref={menuRef}>
          <summary aria-label="Garden menu">
            <Icon name="more" />
          </summary>
          <div className="top-bar__menu-items">
            <button type="button" onClick={() => fromMenu(onNewGarden)}>
              New garden…
            </button>
            <button
              type="button"
              className="top-bar__danger"
              onClick={() => fromMenu(onClearGarden)}
            >
              Clear all plants
            </button>
          </div>
        </details>
      </div>
    </header>
  )
}

export default TopBar
