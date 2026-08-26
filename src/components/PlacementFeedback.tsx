import type { NeighborRelationship } from '../domain/relationships'
import type { Plant } from '../domain/plant'

type PlacementFeedbackProps = {
  placedPlant: Plant
  neighbors: NeighborRelationship[]
}

function PlacementFeedback({ placedPlant, neighbors }: PlacementFeedbackProps) {
  const notable = neighbors.filter((n) => n.relationship !== 'neutral')

  if (notable.length === 0) return null

  return (
    <ul className="placement-feedback">
      {notable.map(({ plant, relationship, coordinate }) => (
        <li
          key={`${coordinate.row},${coordinate.col}`}
          className={`placement-feedback__item placement-feedback__item--${relationship}`}
        >
          {relationship === 'companion'
            ? `Great pairing: ${placedPlant.name} + ${plant.name}`
            : `${placedPlant.name} and ${plant.name} may not grow well together.`}
        </li>
      ))}
    </ul>
  )
}

export default PlacementFeedback
