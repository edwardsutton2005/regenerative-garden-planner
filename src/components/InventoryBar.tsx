import type { Plant } from '../domain/plant'
import { PLANT_DRAG_MIME_TYPE } from './dragPayload'
import type { PlantDragPayload } from './dragPayload'
import Icon from './Icon'
import PlantSwatch from './PlantSwatch'

type InventoryBarProps = {
  /** The plant types in use in this garden, in order. */
  plants: Plant[]
  /** The armed plant brush, if any. */
  activePlantId: string | null
  /** Arms the plant brush (or disarms it, if it's already active). */
  onChoose: (plantId: string) => void
  onRemove: (plantId: string) => void
  onOpenCatalog: () => void
  /** Called with the plant id when a drag to the canvas starts, null when it
   * ends — the canvas needs it for a live preview, since browsers hide drag
   * data until drop. */
  onDragPlant: (plantId: string | null) => void
}

/**
 * Quick access to the plant types in use in this garden — a palette, not a
 * gate: plants can also be chosen straight from the catalog. No fixed slot
 * count; the bar scrolls horizontally.
 */
function InventoryBar({
  plants,
  activePlantId,
  onChoose,
  onRemove,
  onOpenCatalog,
  onDragPlant,
}: InventoryBarProps) {
  return (
    <div className="inventory" role="toolbar" aria-label="Your plants">
      {plants.length === 0 && (
        <p className="inventory__empty">Add plants to start designing</p>
      )}
      {plants.length > 0 && (
        <ul className="inventory__slots">
          {plants.map((plant) => {
            const active = plant.id === activePlantId
            return (
              <li key={plant.id} className="inventory__slot-wrap">
                <button
                  type="button"
                  draggable
                  className={`inventory__slot${active ? ' inventory__slot--active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onChoose(plant.id)}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy'
                    const payload: PlantDragPayload = { kind: 'plant-type', plantId: plant.id }
                    e.dataTransfer.setData(PLANT_DRAG_MIME_TYPE, JSON.stringify(payload))
                    onDragPlant(plant.id)
                  }}
                  onDragEnd={() => onDragPlant(null)}
                >
                  <PlantSwatch plant={plant} />
                  <span className="inventory__name">{plant.name}</span>
                </button>
                <button
                  type="button"
                  className="inventory__remove"
                  aria-label={`Remove ${plant.name} from your plants`}
                  title="Remove from your plants (placed plants stay)"
                  onClick={() => onRemove(plant.id)}
                >
                  <Icon name="close" size={12} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <button type="button" className="inventory__add" onClick={onOpenCatalog}>
        <Icon name="plus" /> Add plants
      </button>
    </div>
  )
}

export default InventoryBar
