type GardenControlsProps = {
  onNewGarden: () => void
  onClearGarden: () => void
}

function GardenControls({ onNewGarden, onClearGarden }: GardenControlsProps) {
  return (
    <div className="garden-controls">
      <button type="button" onClick={onNewGarden}>
        New Garden
      </button>
      <button type="button" onClick={onClearGarden}>
        Clear Garden
      </button>
    </div>
  )
}

export default GardenControls
