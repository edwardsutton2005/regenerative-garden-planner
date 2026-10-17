import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { plantIconUrl } from './plantArt'
import { formatSize } from './units'

export type DrawerGarden = {
  id: string
  name: string
  width: number
  height: number
  /** Absent for the browser garden. */
  updatedAt?: string
}

type LinkState =
  | { status: 'idle' | 'sending' | 'sent' }
  | { status: 'error'; message: string }

type NavDrawerProps = {
  open: boolean
  onClose: () => void
  /** False when the project has no accounts configured. */
  accountsAvailable: boolean
  /** The signed-in user's email, or null when signed out. */
  email: string | null
  /** Signed in: the account's gardens. Signed out: the browser garden, if
   * any. */
  gardens: DrawerGarden[]
  currentId: string | null
  /** A failed menu action, said in the gardens section. */
  error: string | null
  onOpenGarden: (id: string) => void
  onNewGarden: () => void
  /** Only account gardens can be deleted. */
  onDeleteGarden?: (id: string) => void
  onSignInWithGoogle: () => void
  /** Resolves to an error message, or null once the link is sent. */
  onSendEmailLink: (email: string) => Promise<string | null>
  onSignOut: () => void
}

/**
 * The planner's menu: a drawer over the left of the workspace with the way
 * home, the gardens, and the account. Things used between editing sessions,
 * not during them, so it stays out of the garden's way until opened. A
 * native modal dialog: Escape closes it and the page behind is inert.
 */
function NavDrawer({
  open,
  onClose,
  accountsAvailable,
  email,
  gardens,
  currentId,
  error,
  onOpenGarden,
  onNewGarden,
  onDeleteGarden,
  onSignInWithGoogle,
  onSendEmailLink,
  onSignOut,
}: NavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [link, setLink] = useState<LinkState>({ status: 'idle' })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setLink({ status: 'sending' })
    const message = await onSendEmailLink(emailInput.trim())
    setLink(message ? { status: 'error', message } : { status: 'sent' })
  }

  return (
    <dialog
      ref={dialogRef}
      className="nav-drawer"
      aria-label="Menu"
      onClose={() => {
        setConfirmingId(null)
        onClose()
      }}
      // The garden's keyboard shortcuts don't apply while the menu is open.
      onKeyDown={(e) => e.stopPropagation()}
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="nav-drawer__body">
        <header className="nav-drawer__header">
          <span className="nav-drawer__brand">
            <img src={plantIconUrl('tomato')} alt="" width={28} height={28} />
            Regenerative Garden Planner
          </span>
          <button type="button" className="nav-drawer__close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </header>

        <a className="nav-drawer__home" href="/">
          <Icon name="chevronLeft" size={16} /> Home
        </a>

        <section className="nav-drawer__section" aria-labelledby="nav-gardens">
          <div className="nav-drawer__section-head">
            <h2 id="nav-gardens">My gardens</h2>
            <button type="button" className="nav-drawer__new" onClick={onNewGarden}>
              <Icon name="plus" size={16} /> New
            </button>
          </div>
          {gardens.length === 0 ? (
            <p className="nav-drawer__hint">No gardens yet.</p>
          ) : (
            <ul className="nav-drawer__gardens">
              {gardens.map((garden) => {
                const current = garden.id === currentId
                return (
                  <li
                    key={garden.id}
                    className={`nav-drawer__garden${current ? ' nav-drawer__garden--current' : ''}`}
                  >
                    {confirmingId === garden.id ? (
                      <div className="nav-drawer__confirm">
                        <span>Delete “{garden.name}”?</span>
                        <button
                          type="button"
                          className="nav-drawer__danger"
                          onClick={() => {
                            setConfirmingId(null)
                            onDeleteGarden?.(garden.id)
                          }}
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="nav-drawer__open"
                          aria-current={current ? 'true' : undefined}
                          onClick={() => (current ? onClose() : onOpenGarden(garden.id))}
                        >
                          <span className="nav-drawer__garden-name">{garden.name}</span>
                          <span className="nav-drawer__garden-meta">
                            {formatSize(garden.width, garden.height)}
                            {garden.updatedAt &&
                              ` · ${new Date(garden.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}`}
                          </span>
                        </button>
                        {onDeleteGarden && (
                          <button
                            type="button"
                            className="nav-drawer__delete"
                            aria-label={`Delete ${garden.name}`}
                            onClick={() => setConfirmingId(garden.id)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {error && (
            <p className="nav-drawer__error" role="alert">
              {error}
            </p>
          )}
          {accountsAvailable && !email && (
            <p className="nav-drawer__hint">
              Sign in to keep more than one garden and use them on any device.
            </p>
          )}
        </section>

        {accountsAvailable && (
          <section className="nav-drawer__section nav-drawer__account" aria-label="Account">
            {email ? (
              <div className="nav-drawer__user">
                <span className="nav-drawer__avatar" aria-hidden="true">
                  {email[0].toUpperCase()}
                </span>
                <span className="nav-drawer__email">{email}</span>
                <button type="button" className="nav-drawer__sign-out" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <h2>Sign in</h2>
                <button type="button" className="nav-drawer__google" onClick={onSignInWithGoogle}>
                  Continue with Google
                </button>
                <form className="nav-drawer__email-form" onSubmit={handleSendLink}>
                  <label htmlFor="nav-email">or email me a sign-in link</label>
                  <div className="nav-drawer__email-row">
                    <input
                      id="nav-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value)
                        setLink({ status: 'idle' })
                      }}
                    />
                    <button type="submit" disabled={link.status === 'sending'}>
                      Send
                    </button>
                  </div>
                </form>
                {link.status === 'sent' && (
                  <p className="nav-drawer__hint" role="status">
                    Check your inbox for a sign-in link.
                  </p>
                )}
                {link.status === 'error' && (
                  <p className="nav-drawer__error" role="alert">
                    {link.message}
                  </p>
                )}
              </>
            )}
            <a className="nav-drawer__privacy" href="/privacy/">
              Privacy
            </a>
          </section>
        )}
      </div>
    </dialog>
  )
}

export default NavDrawer
