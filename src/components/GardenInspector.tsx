import type { FocusedNeighborRelationship } from '../domain/relationships'
import type { FocusedSpacingViolation } from '../domain/spacing'
import type { SunlightFitResult } from '../domain/sunlightFit'
import type { Plant } from '../domain/plant'
import Icon from './Icon'
import PlantSwatch from './PlantSwatch'
import SourceLinks from './SourceLinks'

type GardenInspectorProps = {
  plant: Plant
  /** The bed containing this placement, derived from its position. */
  bedName: string | undefined
  neighbors: FocusedNeighborRelationship[]
  spacingViolations: FocusedSpacingViolation[]
  crowding: FocusedSpacingViolation[]
  sunlightFit: SunlightFitResult | null
  companionCandidates: Plant[]
  onClose: () => void
}

// Turns a kebab-case literal like 'tender-perennial' into "Tender perennial"
// for display. Purely mechanical — no lookup table needed.
function formatEnumLabel(value: string): string {
  const spaced = value.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function sunlightFitMessage(result: SunlightFitResult): string {
  switch (result.status) {
    case 'fit':
      return `Fits the modeled sunlight here (${formatEnumLabel(result.cellSunlight!)}).`
    case 'mismatch':
      return `May not suit the modeled sunlight here (${formatEnumLabel(result.cellSunlight!)}).`
    case 'unmodeled-cell':
      return 'Sunlight has not been modeled for this cell yet.'
    case 'unmodeled-requirement':
      return `${result.plant.name}’s sunlight requirement has not been curated yet.`
  }
}

function GardenInspector({
  plant,
  bedName,
  neighbors,
  spacingViolations,
  crowding,
  sunlightFit,
  companionCandidates,
  onClose,
}: GardenInspectorProps) {
  const notableNeighbors = neighbors.filter((n) => n.relationship !== 'neutral')

  return (
    <div className="garden-inspector">
      <div className="garden-inspector__header">
        <h2 className="garden-inspector__title">
          <PlantSwatch plant={plant} />
          {plant.name}
        </h2>
        <button
          type="button"
          className="garden-inspector__close"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <Icon name="close" size={16} />
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
        <h3>Location</h3>
        <p className="garden-inspector__lifecycle">{bedName ? `In ${bedName}` : 'In open ground'}</p>
      </section>

      <section className="garden-inspector__section">
        <h3>Nearby relationships</h3>
        {notableNeighbors.length === 0 ? (
          <p className="garden-inspector__empty">No notable nearby relationships</p>
        ) : (
          <ul className="garden-inspector__list">
            {notableNeighbors.map(({ plant: neighborPlant, relationship, rule, placementId }) => (
              <li
                key={placementId}
                className={`garden-inspector__item garden-inspector__item--${relationship}`}
              >
                <span className="garden-inspector__item-title">
                  {relationship === 'companion'
                    ? `Companion: ${neighborPlant.name}`
                    : `Incompatible: ${neighborPlant.name}`}
                </span>
                {rule?.reason && <span className="garden-inspector__reason">{rule.reason}</span>}
                <SourceLinks ids={rule?.sourceIds} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="garden-inspector__section">
        <h3>Spacing</h3>
        {spacingViolations.length === 0 && crowding.length === 0 ? (
          <p className="garden-inspector__ok">Room to grow</p>
        ) : (
          <ul className="garden-inspector__list">
            {spacingViolations.map(({ placementId, requiredDistance }) => (
              <li
                key={placementId}
                className="garden-inspector__item garden-inspector__item--spacing"
              >
                {`Too close to another ${plant.name} (same-species spacing) — keep at least ${requiredDistance} inches apart.`}
              </li>
            ))}
            {crowding.map(({ placementId, plant: other, requiredDistance }) => (
              <li
                key={`crowding-${placementId}`}
                className="garden-inspector__item garden-inspector__item--spacing"
              >
                {`May crowd ${other.name} — about ${requiredDistance} inches between centers gives each room (an estimate from each plant’s typical width).`}
              </li>
            ))}
          </ul>
        )}
      </section>

      {sunlightFit && (
        <section className="garden-inspector__section">
          <h3>Sunlight fit</h3>
          <p
            className={`garden-inspector__sunlight-fit garden-inspector__sunlight-fit--${sunlightFit.status}`}
          >
            {sunlightFitMessage(sunlightFit)}
          </p>
        </section>
      )}

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
