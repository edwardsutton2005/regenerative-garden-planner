import { useState } from 'react'
import GardenControls from './components/GardenControls'
import GardenGrid from './components/GardenGrid'
import PlacementFeedback from './components/PlacementFeedback'
import PlantPicker from './components/PlantPicker'
import { plants } from './data/plants'
import { relationshipRules } from './data/relationships'
import {
  clearGarden,
  createGarden,
  getPlantIdAt,
  hasPlacements,
  placePlant,
  removePlant,
} from './domain/garden'
import type { GardenState } from './domain/garden'
import type { Plant } from './domain/plant'
import { evaluateNeighbors } from './domain/relationships'
import './App.css'

const plantsById: Record<string, Plant> = Object.fromEntries(
  plants.map((plant) => [plant.id, plant]),
)

type LastPlacement = {
  row: number
  col: number
  plantId: string
}

function App() {
  const [garden, setGarden] = useState<GardenState>(() => createGarden())
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [eraserSelected, setEraserSelected] = useState(false)
  const [lastPlacement, setLastPlacement] = useState<LastPlacement | null>(null)

  function handleSelectPlant(plantId: string) {
    setSelectedPlantId(plantId)
    setEraserSelected(false)
  }

  function handleSelectEraser() {
    setEraserSelected(true)
    setSelectedPlantId(null)
  }

  function handleCellClick(row: number, col: number) {
    if (selectedPlantId) {
      setGarden((current) => placePlant(current, row, col, selectedPlantId))
      setLastPlacement({ row, col, plantId: selectedPlantId })
      return
    }

    if (eraserSelected) {
      if (getPlantIdAt(garden, row, col) === undefined) return
      setGarden((current) => removePlant(current, row, col))
      setLastPlacement((prev) =>
        prev && prev.row === row && prev.col === col ? null : prev,
      )
    }
  }

  function handleClearGarden() {
    setGarden((current) => clearGarden(current))
    setLastPlacement(null)
  }

  function handleCreateNewGarden(rows: number, columns: number) {
    if (hasPlacements(garden)) {
      const confirmed = window.confirm(
        'Start a new garden? This will discard the current layout.',
      )
      if (!confirmed) return
    }
    setGarden(createGarden(rows, columns))
    setLastPlacement(null)
  }

  const lastPlacedPlant = lastPlacement ? plantsById[lastPlacement.plantId] : undefined
  const neighbors =
    lastPlacement && lastPlacedPlant
      ? evaluateNeighbors(
          garden,
          lastPlacement.row,
          lastPlacement.col,
          lastPlacement.plantId,
          plantsById,
          relationshipRules,
        )
      : []

  return (
    <div className="app">
      <header className="app-header">
        <h1>Regenerative Garden Planner</h1>
        <p>Select a plant, then place it in the garden. Select the eraser to remove one.</p>
      </header>
      <GardenControls
        rows={garden.rows}
        columns={garden.columns}
        onCreateNewGarden={handleCreateNewGarden}
        onClearGarden={handleClearGarden}
      />
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
          />
          {lastPlacedPlant && (
            <PlacementFeedback placedPlant={lastPlacedPlant} neighbors={neighbors} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
