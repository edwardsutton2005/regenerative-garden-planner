import { useState } from 'react'
import GardenControls from './components/GardenControls'
import GardenGrid from './components/GardenGrid'
import GardenSetup from './components/GardenSetup'
import type { PlantDragPayload } from './components/dragPayload'
import PlacementFeedback from './components/PlacementFeedback'
import PlantPicker from './components/PlantPicker'
import { plants } from './data/plants'
import { relationshipRules } from './data/relationships'
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
import { evaluateNeighbors } from './domain/relationships'
import { evaluateSpacing } from './domain/spacing'
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
  const [lastPlacement, setLastPlacement] = useState<LastPlacement | null>(null)

  function handleCreateGarden(rows: number, columns: number) {
    setGarden(createGarden(rows, columns))
  }

  function handleSelectPlant(plantId: string) {
    setSelectedPlantId(plantId)
    setEraserSelected(false)
  }

  function handleSelectEraser() {
    setEraserSelected(true)
    setSelectedPlantId(null)
  }

  function handleCellClick(row: number, col: number) {
    if (!garden) return

    if (selectedPlantId) {
      setGarden((current) => (current ? placePlant(current, row, col, selectedPlantId) : current))
      setLastPlacement({ row, col })
      return
    }

    if (eraserSelected) {
      if (getPlantIdAt(garden, row, col) === undefined) return
      setGarden((current) => (current ? removePlant(current, row, col) : current))
      setLastPlacement((prev) =>
        prev && prev.row === row && prev.col === col ? null : prev,
      )
    }
  }

  function handleCellDrop(row: number, col: number, payload: PlantDragPayload) {
    if (!garden) return

    if (payload.kind === 'picker') {
      if (!plantsById[payload.plantId]) return // unknown plant id — ignore
      setGarden((current) => (current ? placePlant(current, row, col, payload.plantId) : current))
      setLastPlacement({ row, col })
      return
    }

    // payload.kind === 'garden': never trust a caller-supplied plant id for
    // an existing placement — validate the source cell and let movePlant
    // derive the actual plant from current garden state.
    const { row: fromRow, col: fromCol } = payload.source
    if (!isValidCoordinate(garden, fromRow, fromCol)) return
    if (getPlantIdAt(garden, fromRow, fromCol) === undefined) return
    if (fromRow === row && fromCol === col) return

    setGarden((current) => (current ? movePlant(current, fromRow, fromCol, row, col) : current))
    setLastPlacement({ row, col })
  }

  function handleClearGarden() {
    setGarden((current) => (current ? clearGarden(current) : current))
    setLastPlacement(null)
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
    setLastPlacement(null)
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

  const lastPlacedPlantId = lastPlacement
    ? getPlantIdAt(garden, lastPlacement.row, lastPlacement.col)
    : undefined
  const lastPlacedPlant = lastPlacedPlantId ? plantsById[lastPlacedPlantId] : undefined
  const neighbors =
    lastPlacement && lastPlacedPlantId && lastPlacedPlant
      ? evaluateNeighbors(
          garden,
          lastPlacement.row,
          lastPlacement.col,
          lastPlacedPlantId,
          plantsById,
          relationshipRules,
        )
      : []
  const spacingViolations =
    lastPlacement && lastPlacedPlant
      ? evaluateSpacing(garden, lastPlacement.row, lastPlacement.col, lastPlacedPlant)
      : []

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
          <GardenGrid
            garden={garden}
            plantsById={plantsById}
            onCellClick={handleCellClick}
            onCellDrop={handleCellDrop}
          />
          {lastPlacedPlant && (
            <PlacementFeedback
              placedPlant={lastPlacedPlant}
              neighbors={neighbors}
              spacingViolations={spacingViolations}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
