import type { Plant } from '../domain/plant'

/**
 * Placeholder plant visual (a category-colored disc with the name's first
 * letters) until illustrated plant art exists. Decorative: the plant's name
 * is always shown as text next to it.
 */
function PlantSwatch({ plant }: { plant: Plant }) {
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
