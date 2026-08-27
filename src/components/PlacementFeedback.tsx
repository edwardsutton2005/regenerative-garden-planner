import type { FocusedNeighborRelationship } from '../domain/relationships'
import type { FocusedSpacingViolation } from '../domain/spacing'

type PlacementFeedbackProps = {
  neighbors: FocusedNeighborRelationship[]
  spacingViolations: FocusedSpacingViolation[]
}

function PlacementFeedback({ neighbors, spacingViolations }: PlacementFeedbackProps) {
  const notableNeighbors = neighbors.filter((n) => n.relationship !== 'neutral')

  if (notableNeighbors.length === 0 && spacingViolations.length === 0) return null

  return (
    <ul className="placement-feedback">
      {notableNeighbors.map(({ plant, relationship, coordinate, focusCoordinate, focusPlant }) => (
        <li
          key={`relationship-${focusCoordinate.row},${focusCoordinate.col}-${coordinate.row},${coordinate.col}`}
          className={`placement-feedback__item placement-feedback__item--${relationship}`}
        >
          {relationship === 'companion'
            ? `Great pairing: ${focusPlant.name} + ${plant.name}`
            : `${focusPlant.name} and ${plant.name} may not grow well together.`}
        </li>
      ))}
      {spacingViolations.map(({ coordinate, requiredDistance, focusCoordinate, focusPlant }) => (
        <li
          key={`spacing-${focusCoordinate.row},${focusCoordinate.col}-${coordinate.row},${coordinate.col}`}
          className="placement-feedback__item placement-feedback__item--spacing"
        >
          {`Two ${focusPlant.name} plants are too close together — keep at least ${requiredDistance} cells apart.`}
        </li>
      ))}
    </ul>
  )
}

export default PlacementFeedback
