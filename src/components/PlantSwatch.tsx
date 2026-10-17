import type { Plant } from '../domain/plant'
import { plantIconUrl } from './plantArt'

/**
 * A plant's icon: its approved art, or a placeholder (a category-colored
 * disc with the name's first letters) when it has none yet. Decorative: the
 * plant's name is always shown as text next to it.
 */
function PlantSwatch({ plant }: { plant: Plant }) {
  const icon = plantIconUrl(plant.id)
  if (icon) {
    return <img className="plant-swatch plant-swatch--art" src={icon} alt="" draggable={false} />
  }
  const initials = plant.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
  return (
    <span className={`plant-swatch plant-swatch--${plant.category}`} aria-hidden="true">
      {initials}
    </span>
  )
}

export default PlantSwatch
