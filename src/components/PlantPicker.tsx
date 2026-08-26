import type { Plant } from '../domain/plant'

type PlantPickerProps = {
  plants: Plant[]
  selectedPlantId: string | null
  eraserSelected: boolean
  onSelectPlant: (plantId: string) => void
  onSelectEraser: () => void
}

function PlantPicker({
  plants,
  selectedPlantId,
  eraserSelected,
  onSelectPlant,
  onSelectEraser,
}: PlantPickerProps) {
  return (
    <div className="plant-picker">
      <h2>Plants</h2>
      <ul>
        {plants.map((plant) => (
          <li key={plant.id}>
            <button
              type="button"
              className={`plant-option plant-option--${plant.category}${
                plant.id === selectedPlantId ? ' plant-option--selected' : ''
              }`}
              aria-pressed={plant.id === selectedPlantId}
              onClick={() => onSelectPlant(plant.id)}
            >
              {plant.name}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={`plant-option plant-option--eraser${
              eraserSelected ? ' plant-option--selected' : ''
            }`}
            aria-pressed={eraserSelected}
            onClick={onSelectEraser}
          >
            Eraser
          </button>
        </li>
      </ul>
    </div>
  )
}

export default PlantPicker
