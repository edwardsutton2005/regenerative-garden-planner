import type { User } from '@supabase/supabase-js'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import App from './App'
import NavDrawer from './components/NavDrawer'
import type { DrawerGarden } from './components/NavDrawer'
import type { SaveStatus } from './components/TopBar'
import {
  chooseGardenToOpen,
  deleteGarden,
  listGardens,
  loadGarden,
  loadLastOpenedId,
  saveGarden,
  setLastOpenedId,
} from './cloudGardens'
import type { GardenSummary } from './cloudGardens'
import { hasPlacements } from './domain/garden'
import {
  DEFAULT_GARDEN_NAME,
  canSavePlans,
  clearSavedPlan,
  loadSavedPlan,
  savePlan,
  serializePlan,
} from './gardenPlan'
import type { GardenPlan, LoadedPlan } from './gardenPlan'
import { supabase } from './supabase'

type Size = { width: number; height: number }

// What the planner page shows. A garden view is keyed, so opening another
// garden starts the workspace fresh (selection, tools, undo history).
type View =
  | { kind: 'loading' }
  | { kind: 'error' }
  | {
      kind: 'garden'
      key: string
      /** The account garden's id, or null for the browser garden. */
      cloudId: string | null
      initial: LoadedPlan | null
      setupSize?: Size
    }

const SAVE_DELAY_MS = 1000
const RETRY_DELAY_MS = 5000
const REDIRECT_URL = `${location.origin}/plan/`

function browserGardenView(): View {
  return { kind: 'garden', key: crypto.randomUUID(), cloudId: null, initial: loadSavedPlan() }
}

/**
 * The planner page: who is signed in, which garden is open, and where it
 * saves. Signed out, the one garden lives in this browser. Signed in,
 * gardens live in the account; the first sign-in in a browser uploads its
 * garden as a new account garden. See ARCHITECTURE.md "Persistence".
 */
function PlannerShell() {
  const [view, setView] = useState<View>(() =>
    supabase ? { kind: 'loading' } : browserGardenView(),
  )
  const [user, setUser] = useState<User | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() =>
    canSavePlans() ? 'browser' : 'unavailable',
  )
  const [gardens, setGardens] = useState<GardenSummary[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  // The plan on screen as of its last change, and a copy taken when the
  // menu opens, so the menu shows unsaved edits like a rename.
  const latestPlan = useRef<GardenPlan | null>(null)
  const [menuPlan, setMenuPlan] = useState<GardenPlan | null>(null)
  // The signed-in user's id; undefined until Supabase has said.
  const userId = useRef<string | null | undefined>(undefined)

  // Saving to the account: the newest unsaved plan goes after a pause in
  // editing, and saves run one at a time, in order.
  const pending = useRef<{ id: string; plan: GardenPlan } | null>(null)
  const lastSavedJson = useRef<string | null>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  /** Saves now. Resolves to whether everything is saved. */
  function flushSave(): Promise<boolean> {
    window.clearTimeout(saveTimer.current)
    const run = saveQueue.current.then(async () => {
      const job = pending.current
      if (!job || !supabase) return
      pending.current = null
      try {
        await saveGarden(supabase, job.id, job.plan)
        lastSavedJson.current = serializePlan(job.plan)
        setLastOpenedId(job.id)
        if (!pending.current) setSaveStatus('saved')
      } catch {
        pending.current ??= job
        setSaveStatus('error')
        saveTimer.current = window.setTimeout(flushSave, RETRY_DELAY_MS)
      }
    })
    saveQueue.current = run
    return run.then(() => pending.current === null)
  }

  // ponytail: last write wins across tabs and devices; compare updated_at
  // before saving if people start editing one garden in two places.
  function handlePlanChange(plan: GardenPlan | null) {
    latestPlan.current = plan
    if (view.kind !== 'garden') return
    if (!view.cloudId) {
      if (plan) savePlan(plan)
      else clearSavedPlan()
      return
    }
    if (!plan || serializePlan(plan) === lastSavedJson.current) return
    pending.current = { id: view.cloudId, plan }
    setSaveStatus('saving')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(flushSave, SAVE_DELAY_MS)
  }

  // Leaving with an unsaved change asks first. ponytail: closing the tab
  // within a second of an edit still loses that edit if the user leaves
  // anyway; send it with fetch keepalive if that matters.
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (pending.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  // --- account gardens --------------------------------------------------------

  /** Opens an account garden, or the setup screen for a new one (id null,
   * or a garden that no longer exists). */
  async function showCloudGarden(id: string | null, setupSize?: Size) {
    const loaded = id && supabase ? await loadGarden(supabase, id) : null
    const cloudId = loaded && id ? id : crypto.randomUUID()
    // A garden with parts that couldn't be restored saves its cleaned
    // version straight away, as the browser save does.
    lastSavedJson.current = loaded && !loaded.droppedPlacements ? serializePlan(loaded.plan) : null
    latestPlan.current = loaded?.plan ?? null
    if (loaded) setLastOpenedId(cloudId)
    setView({ kind: 'garden', key: cloudId, cloudId, initial: loaded, setupSize })
    setSaveStatus('saved')
  }

  async function withLoading(task: () => Promise<void>) {
    setMenuOpen(false)
    setView({ kind: 'loading' })
    try {
      await task()
    } catch {
      setView({ kind: 'error' })
    }
  }

  function enterAccount() {
    const client = supabase
    if (!client) return
    return withLoading(async () => {
      const browserGarden = loadSavedPlan()
      if (browserGarden) {
        const id = crypto.randomUUID()
        await saveGarden(client, id, browserGarden.plan)
        clearSavedPlan()
        setLastOpenedId(id)
      }
      const list = await listGardens(client)
      setGardens(list)
      await showCloudGarden(chooseGardenToOpen(list, loadLastOpenedId()))
    })
  }

  // Signing out leaves nothing of the account behind in this browser.
  function leaveAccount() {
    pending.current = null
    window.clearTimeout(saveTimer.current)
    clearSavedPlan()
    setLastOpenedId(null)
    setGardens([])
    latestPlan.current = null
    setView(browserGardenView())
    setSaveStatus(canSavePlans() ? 'browser' : 'unavailable')
  }

  const onAuthChange = useEffectEvent((next: User | null) => {
    setUser(next)
    const previous = userId.current
    const nextId = next?.id ?? null
    // Token refreshes and repeat events for the same user change nothing.
    if (nextId === previous) return
    userId.current = nextId
    if (nextId) void enterAccount()
    else if (previous) leaveAccount()
    else setView(browserGardenView())
  })

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase's own calls can't be awaited inside this callback.
      window.setTimeout(() => onAuthChange(session?.user ?? null))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // --- menu actions -----------------------------------------------------------

  function openMenu() {
    setMenuPlan(latestPlan.current)
    setMenuError(null)
    setMenuOpen(true)
    if (user && supabase) {
      listGardens(supabase).then(setGardens, () =>
        setMenuError("Couldn't refresh your gardens. Check your connection."),
      )
    }
  }

  async function handleOpenGarden(id: string) {
    setMenuOpen(false)
    if (await flushSave()) await withLoading(() => showCloudGarden(id))
  }

  async function handleNewGarden() {
    const current = latestPlan.current
    // The setup screen starts at the size of the garden just left.
    const setupSize = current
      ? { width: current.garden.width, height: current.garden.height }
      : undefined
    if (user) {
      setMenuOpen(false)
      if (await flushSave()) await withLoading(() => showCloudGarden(null, setupSize))
      return
    }
    if (
      current &&
      hasPlacements(current.garden) &&
      !window.confirm('Start a new garden? This will discard the current layout.')
    ) {
      return
    }
    setMenuOpen(false)
    setView({ kind: 'garden', key: crypto.randomUUID(), cloudId: null, initial: null, setupSize })
  }

  async function handleDeleteGarden(id: string) {
    if (!supabase) return
    const isCurrent = view.kind === 'garden' && view.cloudId === id
    // Stop saving the garden being deleted, so a late save can't bring it
    // back. Its unsaved change is kept in case the delete fails.
    const unsaved = isCurrent ? pending.current : null
    if (isCurrent) {
      pending.current = null
      window.clearTimeout(saveTimer.current)
      await saveQueue.current
    }
    try {
      await deleteGarden(supabase, id)
    } catch {
      setMenuError("Couldn't delete the garden. Check your connection and try again.")
      if (unsaved) {
        pending.current = unsaved
        void flushSave()
      }
      return
    }
    setGardens((list) => list.filter((g) => g.id !== id))
    if (isCurrent) await withLoading(() => showCloudGarden(null))
  }

  async function handleSendEmailLink(email: string): Promise<string | null> {
    if (!supabase) return 'Accounts are unavailable.'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URL },
    })
    if (!error) return null
    return error.status === 429
      ? 'Too many sign-in emails were sent recently. Try again in a little while.'
      : "Couldn't send the link. Check the address and try again."
  }

  function handleSignInWithGoogle() {
    void supabase?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: REDIRECT_URL } })
  }

  async function handleSignOut() {
    setMenuOpen(false)
    // An unsaved change stays (and the status says so) rather than being
    // dropped by signing out.
    if (supabase && (await flushSave())) await supabase.auth.signOut()
  }

  // --- render -----------------------------------------------------------------

  const currentId = view.kind === 'garden' ? (view.cloudId ?? view.key) : null
  const live: DrawerGarden | null =
    menuPlan && currentId
      ? {
          id: currentId,
          name: menuPlan.name.trim() || DEFAULT_GARDEN_NAME,
          width: menuPlan.garden.width,
          height: menuPlan.garden.height,
        }
      : null
  let drawerGardens: DrawerGarden[] = live ? [live] : []
  if (user) {
    drawerGardens = gardens.map((g) => (live && g.id === live.id ? { ...g, ...live } : g))
    if (live && !gardens.some((g) => g.id === live.id)) drawerGardens.unshift(live)
  }

  const drawer = (
    <NavDrawer
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      accountsAvailable={supabase !== null}
      email={user ? (user.email ?? 'Signed in') : null}
      gardens={drawerGardens}
      currentId={currentId}
      error={menuError}
      onOpenGarden={(id) => void handleOpenGarden(id)}
      onNewGarden={() => void handleNewGarden()}
      onDeleteGarden={user ? (id) => void handleDeleteGarden(id) : undefined}
      onSignInWithGoogle={handleSignInWithGoogle}
      onSendEmailLink={handleSendEmailLink}
      onSignOut={() => void handleSignOut()}
    />
  )

  if (view.kind === 'garden') {
    return (
      <>
        <App
          key={view.key}
          initialPlan={view.initial}
          setupSize={view.setupSize}
          saveStatus={saveStatus}
          accountsAvailable={supabase !== null}
          onPlanChange={handlePlanChange}
          onOpenMenu={openMenu}
        />
        {drawer}
      </>
    )
  }

  return (
    <>
      <div className="setup-screen">
        {view.kind === 'loading' ? (
          <p className="shell-message shell-message--loading">Loading…</p>
        ) : (
          <div className="setup-screen__card shell-message" role="alert">
            <h1>Couldn&rsquo;t open your gardens</h1>
            <p>Check your connection and try again.</p>
            <div className="shell-message__actions">
              <button type="button" className="shell-message__primary" onClick={() => void enterAccount()}>
                Try again
              </button>
              <button type="button" onClick={openMenu}>
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
      {drawer}
    </>
  )
}

export default PlannerShell
