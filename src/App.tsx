import { useState } from 'react'
import GardenGrid from './components/GardenGrid'
import PlacementFeedback from './components/PlacementFeedback'
import PlantPicker from './components/PlantPicker'
import { plants } from './data/plants'
import { relationshipRules } from './data/relationships'
import { createGarden, placePlant } from './domain/garden'
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
  const [lastPlacement, setLastPlacement] = useState<LastPlacement | null>(null)

  function handleCellClick(row: number, col: number) {
    if (!selectedPlantId) return
    setGarden((current) => placePlant(current, row, col, selectedPlantId))
    setLastPlacement({ row, col, plantId: selectedPlantId })
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
        <p>Select a plant, then place it in the garden.</p>
      </header>
      <main className="app-main">
        <PlantPicker
          plants={plants}
          selectedPlantId={selectedPlantId}
          onSelectPlant={setSelectedPlantId}
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
