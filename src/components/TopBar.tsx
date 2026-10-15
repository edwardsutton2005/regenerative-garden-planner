import { useRef } from 'react'
import { formatSize } from './units'

type TopBarProps = {
  gardenWidth: number
  gardenHeight: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onNewGarden: () => void
  onClearGarden: () => void
}

/** Garden identity, undo/redo, and a menu for the less frequent, more
 * destructive actions (New Garden, Clear Garden). */
function TopBar({
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
        <span className="top-bar__app">Regenerative Garden Planner</span>
        <span className="top-bar__garden">Garden · {formatSize(gardenWidth, gardenHeight)}</span>
      </div>
      <div className="top-bar__actions">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (⌘Z / Ctrl+Z)"
          aria-keyshortcuts="Meta+Z Control+Z"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y)"
          aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
        >
          ↷ Redo
        </button>
        <details className="top-bar__menu" ref={menuRef}>
          <summary aria-label="Garden menu">⋯</summary>
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
