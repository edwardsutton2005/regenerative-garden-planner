import type { FocusedNeighborRelationship } from '../domain/relationships'
import type { FocusedSpacingViolation } from '../domain/spacing'
import type { Plant } from '../domain/plant'

type GardenInspectorProps = {
  plant: Plant
  neighbors: FocusedNeighborRelationship[]
  spacingViolations: FocusedSpacingViolation[]
  onClose: () => void
}

function GardenInspector({ plant, neighbors, spacingViolations, onClose }: GardenInspectorProps) {
  const notableNeighbors = neighbors.filter((n) => n.relationship !== 'neutral')

  return (
    <div className="garden-inspector">
      <div className="garden-inspector__header">
        <h2>{plant.name}</h2>
        <button
          type="button"
          className="garden-inspector__close"
          onClick={onClose}
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>

      <section className="garden-inspector__section">
        <h3>Adjacent relationships</h3>
        {notableNeighbors.length === 0 ? (
          <p className="garden-inspector__empty">No notable adjacent relationships</p>
        ) : (
          <ul className="garden-inspector__list">
            {notableNeighbors.map(({ plant: neighborPlant, relationship, coordinate }) => (
              <li
                key={`${coordinate.row},${coordinate.col}`}
                className={`garden-inspector__item garden-inspector__item--${relationship}`}
              >
                {relationship === 'companion'
                  ? `Companion: ${neighborPlant.name}`
                  : `Incompatible: ${neighborPlant.name}`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="garden-inspector__section">
        <h3>Same-species spacing</h3>
        {spacingViolations.length === 0 ? (
          <p className="garden-inspector__ok">No same-species spacing issues</p>
        ) : (
          <ul className="garden-inspector__list">
            {spacingViolations.map(({ coordinate, requiredDistance }) => (
              <li
                key={`${coordinate.row},${coordinate.col}`}
                className="garden-inspector__item garden-inspector__item--spacing"
              >
                {`Too close to another ${plant.name} (same-species spacing) — keep at least ${requiredDistance} cells apart.`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default GardenInspector
