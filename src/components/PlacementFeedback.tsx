import type { FocusedNeighborRelationship } from '../domain/relationships'
import type { FocusedSpacingViolation } from '../domain/spacing'
import type { SunlightFitResult } from '../domain/sunlightFit'

// Turns a kebab-case literal like 'full-sun' into "Full sun" for display.
// Duplicated from GardenInspector/GardenComposition's identical helper — see
// GardenComposition's comment for why this isn't a shared util.
function formatEnumLabel(value: string): string {
  const spaced = value.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

type PlacementFeedbackProps = {
  neighbors: FocusedNeighborRelationship[]
  spacingViolations: FocusedSpacingViolation[]
  sunlightMismatches: SunlightFitResult[]
}

function PlacementFeedback({
  neighbors,
  spacingViolations,
  sunlightMismatches,
}: PlacementFeedbackProps) {
  const notableNeighbors = neighbors.filter((n) => n.relationship !== 'neutral')

  // The live region stays mounted (even when empty) so screen readers
  // announce feedback after a placement or keyboard move.
  return (
    <ul className="placement-feedback" aria-live="polite">
      {notableNeighbors.map(({ plant, relationship, placementId, focusPlacementId, focusPlant }) => (
        <li
          key={`relationship-${focusPlacementId}-${placementId}`}
          className={`placement-feedback__item placement-feedback__item--${relationship}`}
        >
          {relationship === 'companion'
            ? `Great pairing: ${focusPlant.name} + ${plant.name}`
            : `${focusPlant.name} and ${plant.name} may not grow well together.`}
        </li>
      ))}
      {spacingViolations.map(({ placementId, requiredDistance, focusPlacementId, focusPlant }) => (
        <li
          key={`spacing-${focusPlacementId}-${placementId}`}
          className="placement-feedback__item placement-feedback__item--spacing"
        >
          {`Two ${focusPlant.name} plants are too close together — keep at least ${requiredDistance} inches apart.`}
        </li>
      ))}
      {sunlightMismatches.map(({ placementId, plant, cellSunlight }) => (
        <li
          key={`sunlight-${placementId}`}
          className="placement-feedback__item placement-feedback__item--sunlight"
        >
          {`${plant.name} may not suit the modeled sunlight here (${formatEnumLabel(cellSunlight!)}).`}
        </li>
      ))}
    </ul>
  )
}

export default PlacementFeedback
