import { useEffect, useEffectEvent, useState } from 'react'
import BedPanel from './components/BedPanel'
import CanvasViewport from './components/CanvasViewport'
import GardenCanvas from './components/GardenCanvas'
import type { CanvasMode } from './components/GardenCanvas'
import GardenComposition from './components/GardenComposition'
import GardenInspector from './components/GardenInspector'
import GardenOpportunities from './components/GardenOpportunities'
import GardenSetup from './components/GardenSetup'
import Icon from './components/Icon'
import InventoryBar from './components/InventoryBar'
import PlacementFeedback from './components/PlacementFeedback'
import PlantCatalog from './components/PlantCatalog'
import ToolRail from './components/ToolRail'
import type { RailTool, SunlightBrush } from './components/ToolRail'
import TopBar from './components/TopBar'
import type { SaveStatus } from './components/TopBar'
import { toPlantPosition } from './components/canvasGeometry'
import { addToInventory, removeFromInventory } from './components/plantChoice'
import { useWorkspaceShortcuts } from './components/useWorkspaceShortcuts'
import { plants } from './data/plants'
import { relationshipRules } from './data/relationships'
import { evaluateGardenComposition } from './domain/composition'
import {
  evaluateCompanionOpportunityForPlacement,
  evaluateGardenOpportunities,
} from './domain/opportunities'
import {
  GARDEN_DEFAULT_SIZE,
  addBed,
  clearGarden,
  clearSunlightAt,
  createGarden,
  getBed,
  getBedAt,
  getPlacement,
  getPlacementsInBed,
  moveBed,
  movePlant,
  nextBedName,
  placePlant,
  removeBed,
  removePlant,
  renameBed,
  resizeBed,
  setSunlightAt,
} from './domain/garden'
import type { BedRect, GardenState, Position } from './domain/garden'
import type { Plant } from './domain/plant'
import { evaluateNeighborsForFocuses } from './domain/relationships'
import { evaluateSpacingForFocuses } from './domain/spacing'
import { evaluateSunlightFit } from './domain/sunlightFit'
import type { SunlightFitResult } from './domain/sunlightFit'
import {
  EMPTY_HISTORY,
  applyChange,
  applyWithoutRecording,
  recordCheckpoint,
  redo,
  startHistory,
  undo,
} from './gardenHistory'
import type { GardenHistory } from './gardenHistory'
import { DEFAULT_GARDEN_NAME } from './gardenPlan'
import type { GardenPlan, LoadedPlan } from './gardenPlan'
import './App.css'

const plantsById: Record<string, Plant> = Object.fromEntries(
  plants.map((plant) => [plant.id, plant]),
)

// Inches.
type SetupDimensions = {
  width: number
  height: number
}

// Exactly one tool is active at a time, and each variant carries only the
// data that tool needs. Every tool is a persistent brush: it stays active
// until another tool or plant is chosen, or Escape returns to Select.
type ActiveTool =
  | { kind: 'select' }
  | { kind: 'plant'; plantId: string }
  | { kind: 'beds' }
  | { kind: 'sunlight'; brush: SunlightBrush }
  | { kind: 'eraser' }

// What is selected, if anything: one plant or one bed, never both.
type Selection = { kind: 'plant'; id: string } | { kind: 'bed'; id: string } | null

const SELECT: ActiveTool = { kind: 'select' }

type AppProps = {
  /** The plan to open, or null for the setup screen. */
  initialPlan: LoadedPlan | null
  /** Prefills the setup screen. */
  setupSize?: SetupDimensions
  saveStatus: SaveStatus
  accountsAvailable: boolean
  /** Told the plan after every change, and null while on the setup screen.
   * Where it saves is the caller's business (see PlannerShell). */
  onPlanChange: (plan: GardenPlan | null) => void
  onOpenMenu: () => void
}

/** The workspace for one garden. Opening another garden mounts a new one. */
function App({
  initialPlan,
  setupSize,
  saveStatus,
  accountsAvailable,
  onPlanChange,
  onOpenMenu,
}: AppProps) {
  // The garden and its undo/redo history (see gardenHistory.ts). No garden
  // yet means the app is on the setup screen.
  const [history, setHistory] = useState<GardenHistory>(() =>
    initialPlan ? startHistory(initialPlan.plan.garden) : EMPTY_HISTORY,
  )
  const { garden } = history
  const [gardenName, setGardenName] = useState(initialPlan?.plan.name ?? DEFAULT_GARDEN_NAME)
  const [activeTool, setActiveTool] = useState<ActiveTool>(SELECT)
  // Remembered across tool switches, so Sunlight resumes with the last brush.
  const [sunlightBrush, setSunlightBrush] = useState<SunlightBrush>('full-sun')
  const [selection, setSelection] = useState<Selection>(null)
  // Plant types in use in this garden, in order: a palette, not a gate, and
  // never an input to reasoning. Not part of undo history.
  const [inventory, setInventory] = useState<string[]>(initialPlan?.plan.inventory ?? [])
  // Said once after loading if some saved plants couldn't be restored;
  // cleared by the next garden change.
  const [loadNotice, setLoadNotice] = useState(() => {
    const dropped = initialPlan?.droppedPlacements ?? 0
    if (dropped === 0) return null
    return dropped === 1
      ? "1 saved plant couldn't be restored and was left out."
      : `${dropped} saved plants couldn't be restored and were left out.`
  })
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  // Placement ids to show transient feedback for: the plant just placed or
  // moved.
  const [lastPlacementIds, setLastPlacementIds] = useState<string[]>([])
  // The plant type being dragged from the inventory, for the canvas preview.
  const [draggedPlantTypeId, setDraggedPlantTypeId] = useState<string | null>(null)

  // Bed selection is only shown (and only editable) in Select and Beds, so
  // other tools' clicks and keys never edit a bed.
  const bedSelectionVisible = activeTool.kind === 'select' || activeTool.kind === 'beds'
  const selectedPlacementId = selection?.kind === 'plant' ? selection.id : null
  const selectedBedId = selection?.kind === 'bed' && bedSelectionVisible ? selection.id : null

  // Autosave: every change reports the current plan.
  const reportPlan = useEffectEvent(() => {
    onPlanChange(garden && { name: gardenName, garden, inventory })
  })
  useEffect(() => reportPlan(), [garden, gardenName, inventory])

  // --- garden changes (all undoable) ----------------------------------------

  function updateGarden(change: (current: GardenState) => GardenState) {
    setHistory((h) => applyChange(h, change))
    setLoadNotice(null)
  }

  function handleUndo() {
    setHistory(undo)
    setLastPlacementIds([]) // feedback described the change being undone
  }

  function handleRedo() {
    setHistory(redo)
    setLastPlacementIds([])
  }

  // A sunlight stroke paints many cells but is one undo step.
  function handlePaintStart() {
    setHistory(recordCheckpoint)
  }

  function handlePaint(row: number, col: number) {
    if (activeTool.kind !== 'sunlight') return
    const { brush } = activeTool
    setHistory((h) =>
      applyWithoutRecording(h, (g) =>
        brush === 'clear' ? clearSunlightAt(g, row, col) : setSunlightAt(g, row, col, brush),
      ),
    )
  }

  function addPlacement(plantId: string, position: Position): string {
    const id = crypto.randomUUID()
    updateGarden((current) => placePlant(current, id, plantId, position))
    setLastPlacementIds([id])
    return id
  }

  function removePlacement(placementId: string) {
    updateGarden((current) => removePlant(current, placementId))
    setLastPlacementIds((prev) => prev.filter((id) => id !== placementId))
    setSelection((current) => (current?.id === placementId ? null : current))
  }

  function handleMovePlant(placementId: string, position: Position) {
    updateGarden((current) => movePlant(current, placementId, position))
    setLastPlacementIds([placementId])
  }

  function deleteBed(bedId: string) {
    updateGarden((current) => removeBed(current, bedId))
    setSelection((current) => (current?.id === bedId ? null : current))
  }

  // --- tools ----------------------------------------------------------------

  function handleSelectRailTool(tool: RailTool) {
    switch (tool) {
      case 'select':
        setActiveTool(SELECT)
        return
      case 'beds':
        setActiveTool({ kind: 'beds' })
        return
      case 'sunlight':
        setActiveTool({ kind: 'sunlight', brush: sunlightBrush })
        return
      case 'eraser':
        setActiveTool({ kind: 'eraser' })
        return
    }
  }

  function handleSelectSunlightBrush(brush: SunlightBrush) {
    setSunlightBrush(brush)
    setActiveTool({ kind: 'sunlight', brush })
  }

  // Inventory click arms the plant brush; clicking the armed plant disarms
  // it, back to Select.
  function handleChooseInventoryPlant(plantId: string) {
    setActiveTool((current) =>
      current.kind === 'plant' && current.plantId === plantId ? SELECT : { kind: 'plant', plantId },
    )
  }

  // Choosing in the catalog: arm the brush, add the type to the inventory
  // (incidentally), close the catalog, and return to the canvas.
  function handleChooseCatalogPlant(plantId: string) {
    if (!plantsById[plantId]) return
    setActiveTool({ kind: 'plant', plantId })
    setInventory((inv) => addToInventory(inv, plantId))
    setCatalogOpen(false)
  }

  // Escape steps back: out of the active tool to Select, then clears the
  // selection.
  function handleEscape() {
    if (activeTool.kind !== 'select') setActiveTool(SELECT)
    else setSelection(null)
  }

  function handleDeleteSelection() {
    if (selectedPlacementId) removePlacement(selectedPlacementId)
    else if (selectedBedId) deleteBed(selectedBedId)
  }

  useWorkspaceShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onEscape: handleEscape,
    onDelete: handleDeleteSelection,
    enabled: garden !== null && !catalogOpen,
  })

  // --- canvas events --------------------------------------------------------

  // A click on empty canvas, at a whole-inch position.
  function handleCanvasClick(position: Position) {
    if (!garden) return
    if (activeTool.kind === 'plant') {
      addPlacement(activeTool.plantId, position)
    } else if (activeTool.kind === 'select') {
      // Select the bed at this exact point, or clear the selection.
      const bed = getBedAt(garden, position)
      setSelection(bed ? { kind: 'bed', id: bed.id } : null)
    }
    // Eraser: nothing to erase here. Sunlight paints on pointer down and
    // Beds handles its own input, so a click never touches plants.
  }

  // A click (or Enter/Space) on a plant: the eraser removes it; otherwise
  // it's selected for inspection. A plant brush never places on top of an
  // existing plant.
  function handlePlantClick(placementId: string) {
    if (activeTool.kind === 'eraser') removePlacement(placementId)
    else setSelection({ kind: 'plant', id: placementId })
  }

  function handlePlantTypeDrop(plantId: string, position: Position) {
    if (!plantsById[plantId]) return // unknown plant id — ignore
    addPlacement(plantId, position)
    setDraggedPlantTypeId(null)
  }

  // Keyboard placement: the active plant at the garden's physical center —
  // deterministic, independent of scroll position.
  function handlePlaceAtCenter(): string | null {
    if (!garden || activeTool.kind !== 'plant') return null
    const center = toPlantPosition({ x: garden.width / 2, y: garden.height / 2 }, garden)
    return addPlacement(activeTool.plantId, center)
  }

  // --- garden lifecycle -----------------------------------------------------

  function handleCreateGarden(width: number, height: number) {
    setHistory(startHistory(createGarden(width, height)))
  }

  function handleClearGarden() {
    updateGarden((current) => clearGarden(current))
    setLastPlacementIds([])
    setSelection((current) => (current?.kind === 'plant' ? null : current))
  }

  if (!garden) {
    return (
      <div className="setup-screen">
        <button type="button" className="setup-screen__menu" onClick={onOpenMenu}>
          <Icon name="menu" /> Menu
        </button>
        <div className="setup-screen__card">
          <header className="app-header">
            <h1>Regenerative Garden Planner</h1>
            <p>Choose your garden size to get started.</p>
          </header>
          <GardenSetup
            initialWidth={setupSize?.width ?? GARDEN_DEFAULT_SIZE}
            initialHeight={setupSize?.height ?? GARDEN_DEFAULT_SIZE}
            onCreateGarden={handleCreateGarden}
          />
        </div>
      </div>
    )
  }

  // --- derived state ----------------------------------------------------------

  const canvasMode: CanvasMode = activeTool.kind

  const neighbors = evaluateNeighborsForFocuses(
    garden,
    lastPlacementIds,
    plantsById,
    relationshipRules,
  )
  const spacingViolations = evaluateSpacingForFocuses(garden, lastPlacementIds, plantsById)
  const sunlightMismatches = lastPlacementIds
    .map((id) => evaluateSunlightFit(garden, id, plantsById))
    .filter((r): r is SunlightFitResult => r !== null && r.status === 'mismatch')

  const composition = evaluateGardenComposition(garden, plantsById)
  const gardenOpportunities = evaluateGardenOpportunities(garden, plantsById)

  const inspectedPlacement = selectedPlacementId
    ? getPlacement(garden, selectedPlacementId)
    : undefined
  const inspectedPlant = inspectedPlacement ? plantsById[inspectedPlacement.plantId] : undefined
  const inspectedIds = inspectedPlacement ? [inspectedPlacement.id] : []

  const inspectorNeighbors = evaluateNeighborsForFocuses(
    garden,
    inspectedIds,
    plantsById,
    relationshipRules,
  )
  const inspectorSpacing = evaluateSpacingForFocuses(garden, inspectedIds, plantsById)
  const inspectorSunlightFit = inspectedPlacement
    ? evaluateSunlightFit(garden, inspectedPlacement.id, plantsById)
    : null
  const localCompanionOpportunity = inspectedPlacement
    ? evaluateCompanionOpportunityForPlacement(
        garden,
        inspectedPlacement.id,
        plantsById,
        relationshipRules,
      )
    : null
  const inspectedBed = inspectedPlacement ? getBedAt(garden, inspectedPlacement.position) : undefined

  const selectedBed = selectedBedId ? getBed(garden, selectedBedId) : undefined
  const selectedBedPlantNames = selectedBed
    ? getPlacementsInBed(garden, selectedBed.id)
        .map((p) => plantsById[p.plantId]?.name)
        .filter((name): name is string => name !== undefined)
    : []

  const companionCandidates = (localCompanionOpportunity?.candidatePlantIds ?? [])
    .map((id) => plantsById[id])
    .filter((p): p is Plant => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  const inventoryPlants = inventory
    .map((id) => plantsById[id])
    .filter((p): p is Plant => p !== undefined)
  const activePlant = activeTool.kind === 'plant' ? plantsById[activeTool.plantId] : undefined

  // The status line: what tool and setting are active and what a click does.
  const status = (() => {
    switch (activeTool.kind) {
      case 'plant':
        return `Planting ${activePlant?.name ?? 'plant'} — click to place · Esc to stop`
      case 'beds':
        return 'Beds — drag on open ground to draw a bed · Esc to stop'
      case 'sunlight': {
        const label = {
          'full-sun': 'Full sun',
          'partial-sun': 'Partial sun',
          shade: 'Shade',
          clear: 'Clear sunlight',
        }[activeTool.brush]
        return `Sunlight: ${label} — drag to paint · Esc to stop`
      }
      case 'eraser':
        return 'Eraser — click plants to remove them · Esc to stop'
      case 'select':
        return selectedBed
          ? `${selectedBed.name} selected — drag its tab to move, a corner to resize · Delete removes`
          : inspectedPlant
            ? `${inspectedPlant.name} selected — drag to move · Delete removes · Esc to deselect`
            : inventory.length === 0
              ? 'Select — choose a plant with + Add plants below'
              : 'Select — click a plant or bed · drag plants to move them'
    }
  })()

  return (
    <div className={`workspace${inspectorOpen ? '' : ' workspace--inspector-closed'}`}>
      <TopBar
        gardenName={gardenName}
        saveStatus={saveStatus}
        accountsAvailable={accountsAvailable}
        onOpenMenu={onOpenMenu}
        onRenameGarden={setGardenName}
        gardenWidth={garden.width}
        gardenHeight={garden.height}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearGarden={handleClearGarden}
      />

      <ToolRail
        activeTool={activeTool.kind}
        sunlightBrush={sunlightBrush}
        onSelectTool={handleSelectRailTool}
        onSelectSunlightBrush={handleSelectSunlightBrush}
      />

      <main className="workspace__canvas">
        <p className="workspace__status" aria-live="polite">
          {status}
          {loadNotice && <span className="workspace__notice">{loadNotice}</span>}
        </p>
        <CanvasViewport
          key={`${garden.width}x${garden.height}`}
          gardenWidth={garden.width}
          dragToPan={activeTool.kind === 'select'}
        >
          <GardenCanvas
            garden={garden}
            plantsById={plantsById}
            rules={relationshipRules}
            mode={canvasMode}
            selectedPlacementId={selectedPlacementId}
            draggedPlantTypeId={draggedPlantTypeId}
            onCanvasClick={handleCanvasClick}
            onPlantClick={handlePlantClick}
            onMovePlant={handleMovePlant}
            onRemovePlant={removePlacement}
            onPlantTypeDrop={handlePlantTypeDrop}
            onPaint={handlePaint}
            onPaintStart={handlePaintStart}
            onPlaceAtCenter={handlePlaceAtCenter}
            beds={{
              editing: activeTool.kind === 'beds',
              selectedBedId,
              onSelectBed: (id) => setSelection(id ? { kind: 'bed', id } : null),
              onCreateBed: (rect: BedRect) => {
                const id = crypto.randomUUID()
                updateGarden((current) => addBed(current, id, nextBedName(current), rect))
                setSelection({ kind: 'bed', id })
              },
              onMoveBed: (id, position) => updateGarden((current) => moveBed(current, id, position)),
              onResizeBed: (id, rect) => updateGarden((current) => resizeBed(current, id, rect)),
            }}
          />
        </CanvasViewport>
      </main>

      <aside className="workspace__inspector" aria-label="Inspector">
        <button
          type="button"
          className="workspace__inspector-toggle"
          onClick={() => setInspectorOpen((open) => !open)}
          aria-expanded={inspectorOpen}
          aria-label={inspectorOpen ? 'Collapse inspector' : 'Expand inspector'}
        >
          <Icon name={inspectorOpen ? 'chevronRight' : 'chevronLeft'} size={16} />
        </button>
        {inspectorOpen && (
          <div className="workspace__inspector-body">
            {selectedBed && (
              <BedPanel
                key={selectedBed.id}
                bed={selectedBed}
                plantNames={selectedBedPlantNames}
                onRename={(name) =>
                  updateGarden((current) => renameBed(current, selectedBed.id, name))
                }
                onDelete={() => deleteBed(selectedBed.id)}
                onClose={() => setSelection(null)}
              />
            )}
            {inspectedPlant && (
              <GardenInspector
                plant={inspectedPlant}
                bedName={inspectedBed?.name}
                neighbors={inspectorNeighbors}
                spacingViolations={inspectorSpacing}
                sunlightFit={inspectorSunlightFit}
                companionCandidates={companionCandidates}
                onClose={() => setSelection(null)}
              />
            )}
            {/* Temporary home for "what just happened?" feedback; Slice 2
                replaces it with short-lived messages on the canvas. */}
            <PlacementFeedback
              neighbors={neighbors}
              spacingViolations={spacingViolations}
              sunlightMismatches={sunlightMismatches}
            />
            <GardenComposition composition={composition} plantsById={plantsById} />
            <GardenOpportunities opportunities={gardenOpportunities} />
          </div>
        )}
      </aside>

      <InventoryBar
        plants={inventoryPlants}
        activePlantId={activePlant?.id ?? null}
        onChoose={handleChooseInventoryPlant}
        onRemove={(plantId) => setInventory((inv) => removeFromInventory(inv, plantId))}
        onOpenCatalog={() => setCatalogOpen(true)}
        onDragPlant={setDraggedPlantTypeId}
      />

      {catalogOpen && (
        <PlantCatalog
          plants={plants}
          inventory={inventory}
          onChoose={handleChooseCatalogPlant}
          onClose={() => setCatalogOpen(false)}
        />
      )}
    </div>
  )
}

export default App
