import { useState } from 'react'
import GardenGrid from './components/GardenGrid'
import PlantPicker from './components/PlantPicker'
import { plants } from './data/plants'
import { createGarden, placePlant } from './domain/garden'
import type { GardenState } from './domain/garden'
import type { Plant } from './domain/plant'
import './App.css'

const GRID_ROWS = 6
const GRID_COLS = 6

const plantsById: Record<string, Plant> = Object.fromEntries(
  plants.map((plant) => [plant.id, plant]),
)

function App() {
  const [garden, setGarden] = useState<GardenState>(() =>
    createGarden(GRID_ROWS, GRID_COLS),
  )
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)

  function handleCellClick(row: number, col: number) {
    if (!selectedPlantId) return
    setGarden((current) => placePlant(current, row, col, selectedPlantId))
  }

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
        <GardenGrid
          garden={garden}
          plantsById={plantsById}
          onCellClick={handleCellClick}
        />
      </main>
    </div>
  )
}

export default App
