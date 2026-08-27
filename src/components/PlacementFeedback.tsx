import type { NeighborRelationship } from '../domain/relationships'
import type { SpacingViolation } from '../domain/spacing'
import type { Plant } from '../domain/plant'

type PlacementFeedbackProps = {
  placedPlant: Plant
  neighbors: NeighborRelationship[]
  spacingViolations: SpacingViolation[]
}

function PlacementFeedback({
  placedPlant,
  neighbors,
  spacingViolations,
}: PlacementFeedbackProps) {
  const notableNeighbors = neighbors.filter((n) => n.relationship !== 'neutral')

  if (notableNeighbors.length === 0 && spacingViolations.length === 0) return null

  return (
    <ul className="placement-feedback">
      {notableNeighbors.map(({ plant, relationship, coordinate }) => (
        <li
          key={`relationship-${coordinate.row},${coordinate.col}`}
          className={`placement-feedback__item placement-feedback__item--${relationship}`}
        >
          {relationship === 'companion'
            ? `Great pairing: ${placedPlant.name} + ${plant.name}`
            : `${placedPlant.name} and ${plant.name} may not grow well together.`}
        </li>
      ))}
      {spacingViolations.map(({ coordinate, requiredDistance }) => (
        <li
          key={`spacing-${coordinate.row},${coordinate.col}`}
          className="placement-feedback__item placement-feedback__item--spacing"
        >
          {`Two ${placedPlant.name} plants are too close together — keep at least ${requiredDistance} cells apart.`}
        </li>
      ))}
    </ul>
  )
}

export default PlacementFeedback
