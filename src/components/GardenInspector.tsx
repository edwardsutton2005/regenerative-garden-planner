import type { FocusedNeighborRelationship } from '../domain/relationships'
import type { FocusedSpacingViolation } from '../domain/spacing'
import type { Plant } from '../domain/plant'

type GardenInspectorProps = {
  plant: Plant
  neighbors: FocusedNeighborRelationship[]
  spacingViolations: FocusedSpacingViolation[]
  companionCandidates: Plant[]
  onClose: () => void
}

// Turns a kebab-case literal like 'tender-perennial' into "Tender perennial"
// for display. Purely mechanical — no lookup table needed.
function formatEnumLabel(value: string): string {
  const spaced = value.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function GardenInspector({
  plant,
  neighbors,
  spacingViolations,
  companionCandidates,
  onClose,
}: GardenInspectorProps) {
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
        <h3>Plant identity</h3>
        <p className="garden-inspector__lifecycle">{formatEnumLabel(plant.lifecycle)}</p>
        {plant.ecologicalRoles.length > 0 && (
          <ul className="garden-inspector__list garden-inspector__list--roles">
            {plant.ecologicalRoles.map((role) => (
              <li key={role} className="garden-inspector__item garden-inspector__item--role">
                {formatEnumLabel(role)}
              </li>
            ))}
          </ul>
        )}
      </section>

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

      {companionCandidates.length > 0 && (
        <section className="garden-inspector__section">
          <h3>Local opportunities</h3>
          <ul className="garden-inspector__list">
            {companionCandidates.map((candidate) => (
              <li
                key={candidate.id}
                className="garden-inspector__item garden-inspector__item--opportunity"
              >
                {`Consider a companion option: ${candidate.name}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default GardenInspector
