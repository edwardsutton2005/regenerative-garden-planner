import { useState } from 'react'
import GardenComposition from './components/GardenComposition'
import GardenControls from './components/GardenControls'
import GardenGrid from './components/GardenGrid'
import GardenInspector from './components/GardenInspector'
import GardenOpportunities from './components/GardenOpportunities'
import GardenSetup from './components/GardenSetup'
import type { PlantDragPayload } from './components/dragPayload'
import PlacementFeedback from './components/PlacementFeedback'
import PlantPicker from './components/PlantPicker'
import { plants } from './data/plants'
import { relationshipRules } from './data/relationships'
import { evaluateGardenComposition } from './domain/composition'
import {
  evaluateCompanionOpportunityForPlacement,
  evaluateGardenOpportunities,
} from './domain/opportunities'
import {
  GARDEN_DEFAULT_SIZE,
  clearGarden,
  createGarden,
  getPlantIdAt,
  hasPlacements,
  isValidCoordinate,
  movePlant,
  placePlant,
  removePlant,
} from './domain/garden'
import type { GardenState } from './domain/garden'
import type { Plant } from './domain/plant'
import { evaluateNeighborsForFocuses } from './domain/relationships'
import { evaluateSpacingForFocuses } from './domain/spacing'
import './App.css'

const plantsById: Record<string, Plant> = Object.fromEntries(
  plants.map((plant) => [plant.id, plant]),
)

type LastPlacement = {
  row: number
  col: number
}

type SetupDimensions = {
  rows: number
  columns: number
}

// The placement currently being inspected, or null if nothing is (see
// ARCHITECTURE.md "Inspection Is UI State" — not part of GardenState).
type InspectedCoordinate = {
  row: number
  col: number
} | null

function App() {
  // No garden yet means the app is on the setup screen; once created, a
  // garden's dimensions are fixed for its lifetime (see ARCHITECTURE.md).
  const [garden, setGarden] = useState<GardenState | null>(null)
  const [setupDimensions, setSetupDimensions] = useState<SetupDimensions>({
    rows: GARDEN_DEFAULT_SIZE,
    columns: GARDEN_DEFAULT_SIZE,
  })
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [eraserSelected, setEraserSelected] = useState(false)
  // Coordinates to show transient feedback for. Usually one (the cell just
  // placed or moved to); a garden-to-garden swap changes two cells, so both
  // go here.
  const [lastPlacements, setLastPlacements] = useState<LastPlacement[]>([])
  const [inspectedCoordinate, setInspectedCoordinate] = useState<InspectedCoordinate>(null)

  function isInspected(row: number, col: number): boolean {
    return inspectedCoordinate?.row === row && inspectedCoordinate?.col === col
  }

  function handleCreateGarden(rows: number, columns: number) {
    setGarden(createGarden(rows, columns))
  }

  function handleSelectPlant(plantId: string) {
    // Selecting the already-selected plant returns to the neutral state;
    // selecting/deselecting never touches inspection.
    setSelectedPlantId((current) => (current === plantId ? null : plantId))
    setEraserSelected(false)
  }

  function handleSelectEraser() {
    setEraserSelected((current) => !current)
    setSelectedPlantId(null)
  }

  function handleCellClick(row: number, col: number) {
    if (!garden) return

    if (selectedPlantId) {
      // Clicking a cell that already holds the selected plant toggles it
      // off instead of "replacing" it with itself — saves switching to the
      // eraser for a quick undo of the same plant.
      if (getPlantIdAt(garden, row, col) === selectedPlantId) {
        setGarden((current) => (current ? removePlant(current, row, col) : current))
        setLastPlacements((prev) => prev.filter((p) => !(p.row === row && p.col === col)))
        if (isInspected(row, col)) setInspectedCoordinate(null)
        return
      }

      setGarden((current) => (current ? placePlant(current, row, col, selectedPlantId) : current))
      setLastPlacements([{ row, col }])
      // A placement landing on the inspected cell is a replace — the
      // inspected placement no longer exists as it was, so close.
      if (isInspected(row, col)) setInspectedCoordinate(null)
      return
    }

    if (eraserSelected) {
      if (getPlantIdAt(garden, row, col) === undefined) return
      setGarden((current) => (current ? removePlant(current, row, col) : current))
      setLastPlacements((prev) => prev.filter((p) => !(p.row === row && p.col === col)))
      if (isInspected(row, col)) setInspectedCoordinate(null)
      return
    }

    // Neutral: click an occupied cell to inspect it, an empty cell to clear
    // inspection.
    const plantId = getPlantIdAt(garden, row, col)
    setInspectedCoordinate(plantId ? { row, col } : null)
  }

  function handleCellDrop(row: number, col: number, payload: PlantDragPayload) {
    if (!garden) return

    if (payload.kind === 'picker') {
      if (!plantsById[payload.plantId]) return // unknown plant id — ignore
      setGarden((current) => (current ? placePlant(current, row, col, payload.plantId) : current))
      setLastPlacements([{ row, col }])
      if (isInspected(row, col)) setInspectedCoordinate(null)
      return
    }

    // payload.kind === 'garden': never trust a caller-supplied plant id for
    // an existing placement — validate the source cell and let movePlant
    // derive the actual plant from current garden state.
    const { row: fromRow, col: fromCol } = payload.source
    if (!isValidCoordinate(garden, fromRow, fromCol)) return
    if (getPlantIdAt(garden, fromRow, fromCol) === undefined) return
    if (fromRow === row && fromCol === col) return

    // A swap (destination already occupied) changes both cells; an ordinary
    // move-to-empty only changes the destination.
    const isSwap = getPlantIdAt(garden, row, col) !== undefined

    setGarden((current) => (current ? movePlant(current, fromRow, fromCol, row, col) : current))
    setLastPlacements(
      isSwap ? [{ row, col }, { row: fromRow, col: fromCol }] : [{ row, col }],
    )

    // Follow the inspected plant through a move or swap rather than closing
    // inspection — its coordinate changed, its identity didn't.
    setInspectedCoordinate((current) => {
      if (!current) return current
      if (current.row === fromRow && current.col === fromCol) return { row, col }
      if (isSwap && current.row === row && current.col === col) {
        return { row: fromRow, col: fromCol }
      }
      return current
    })
  }

  function handleClearGarden() {
    setGarden((current) => (current ? clearGarden(current) : current))
    setLastPlacements([])
    setInspectedCoordinate(null)
  }

  function handleNewGarden() {
    if (!garden) return

    if (hasPlacements(garden)) {
      const confirmed = window.confirm(
        'Start a new garden? This will discard the current layout.',
      )
      if (!confirmed) return
    }

    // Return to the setup screen, prefilled with the garden just left,
    // rather than immediately creating a replacement.
    setSetupDimensions({ rows: garden.rows, columns: garden.columns })
    setGarden(null)
    setLastPlacements([])
    setInspectedCoordinate(null)
  }

  if (!garden) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Regenerative Garden Planner</h1>
          <p>Choose your garden size to get started.</p>
        </header>
        <GardenSetup
          initialRows={setupDimensions.rows}
          initialColumns={setupDimensions.columns}
          onCreateGarden={handleCreateGarden}
        />
      </div>
    )
  }

  const focusEntries = lastPlacements
    .map((p) => {
      const plantId = getPlantIdAt(garden, p.row, p.col)
      return plantId ? { coordinate: p, plantId } : null
    })
    .filter((f): f is { coordinate: LastPlacement; plantId: string } => f !== null)

  const neighbors = evaluateNeighborsForFocuses(
    garden,
    focusEntries,
    plantsById,
    relationshipRules,
  )

  const spacingFocusEntries = focusEntries
    .map((f) => {
      const plant = plantsById[f.plantId]
      return plant ? { coordinate: f.coordinate, plant } : null
    })
    .filter((f): f is { coordinate: LastPlacement; plant: Plant } => f !== null)

  const spacingViolations = evaluateSpacingForFocuses(garden, spacingFocusEntries)

  const composition = evaluateGardenComposition(garden, plantsById)
  const gardenOpportunities = evaluateGardenOpportunities(garden, plantsById)

  const inspectedPlantId = inspectedCoordinate
    ? getPlantIdAt(garden, inspectedCoordinate.row, inspectedCoordinate.col)
    : undefined
  const inspectedPlant = inspectedPlantId ? plantsById[inspectedPlantId] : undefined

  const inspectorNeighbors =
    inspectedCoordinate && inspectedPlantId
      ? evaluateNeighborsForFocuses(
          garden,
          [{ coordinate: inspectedCoordinate, plantId: inspectedPlantId }],
          plantsById,
          relationshipRules,
        )
      : []

  const inspectorSpacing =
    inspectedCoordinate && inspectedPlant
      ? evaluateSpacingForFocuses(garden, [
          { coordinate: inspectedCoordinate, plant: inspectedPlant },
        ])
      : []

  const localCompanionOpportunity = inspectedCoordinate
    ? evaluateCompanionOpportunityForPlacement(
        garden,
        inspectedCoordinate.row,
        inspectedCoordinate.col,
        plantsById,
        relationshipRules,
      )
    : null

  const companionCandidates = (localCompanionOpportunity?.candidatePlantIds ?? [])
    .map((id) => plantsById[id])
    .filter((p): p is Plant => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="app">
      <header className="app-header">
        <h1>Regenerative Garden Planner</h1>
        <p>Select a plant, then place it in the garden. Select the eraser to remove one.</p>
      </header>
      <GardenControls onNewGarden={handleNewGarden} onClearGarden={handleClearGarden} />
      <main className="app-main">
        <PlantPicker
          plants={plants}
          selectedPlantId={selectedPlantId}
          eraserSelected={eraserSelected}
          onSelectPlant={handleSelectPlant}
          onSelectEraser={handleSelectEraser}
        />
        <div className="garden-column">
          <div className="garden-grid-viewport">
            <GardenGrid
              garden={garden}
              plantsById={plantsById}
              inspectedCoordinate={inspectedCoordinate}
              onCellClick={handleCellClick}
              onCellDrop={handleCellDrop}
            />
          </div>
          <PlacementFeedback neighbors={neighbors} spacingViolations={spacingViolations} />
        </div>
        <div className="garden-rail">
          <GardenComposition composition={composition} plantsById={plantsById} />
          <GardenOpportunities opportunities={gardenOpportunities} />
          {inspectedPlant && (
            <GardenInspector
              plant={inspectedPlant}
              neighbors={inspectorNeighbors}
              spacingViolations={inspectorSpacing}
              companionCandidates={companionCandidates}
              onClose={() => setInspectedCoordinate(null)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
