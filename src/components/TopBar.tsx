import { useRef } from 'react'
import { DEFAULT_GARDEN_NAME } from '../gardenPlan'
import Icon from './Icon'
import { formatSize } from './units'

/** Where the plan is saved, and how that's going. */
export type SaveStatus = 'browser' | 'unavailable' | 'saving' | 'saved' | 'error'

const SAVE_STATUS_TEXT: Record<SaveStatus, string> = {
  browser: 'Saved in this browser',
  unavailable: 'Not saved: browser storage is unavailable',
  saving: 'Saving…',
  saved: 'Saved to your account',
  error: "Couldn't save. Will retry.",
}

type TopBarProps = {
  gardenName: string
  saveStatus: SaveStatus
  /** Whether signing in is offered. */
  accountsAvailable: boolean
  onOpenMenu: () => void
  onRenameGarden: (name: string) => void
  gardenWidth: number
  gardenHeight: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClearGarden: () => void
}

/** The menu button, garden identity (an editable name) and save status,
 * undo/redo, and a menu for the destructive Clear Garden. */
function TopBar({
  gardenName,
  saveStatus,
  accountsAvailable,
  onOpenMenu,
  onRenameGarden,
  gardenWidth,
  gardenHeight,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearGarden,
}: TopBarProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  function fromMenu(action: () => void) {
    if (menuRef.current) menuRef.current.open = false
    action()
  }

  return (
    <header className="top-bar">
      <button type="button" className="top-bar__menu-button" onClick={onOpenMenu} aria-label="Menu">
        <Icon name="menu" />
      </button>
      <div className="top-bar__title">
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
        <span className={`top-bar__garden top-bar__garden--${saveStatus}`} role="status">
          {formatSize(gardenWidth, gardenHeight)} · {SAVE_STATUS_TEXT[saveStatus]}
          {accountsAvailable && (saveStatus === 'browser' || saveStatus === 'unavailable') && (
            <>
              {' · '}
              <button type="button" className="top-bar__sign-in" onClick={onOpenMenu}>
                Sign in
              </button>
            </>
          )}
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
