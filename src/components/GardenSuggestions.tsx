import { relationshipRules } from '../data/relationships'
import { roleInfo } from '../data/roles'
import type { GardenBed } from '../domain/garden'
import type {
  BedCompanionSuggestion,
  BedRoleSuggestion,
  RoleSuggestion,
} from '../domain/opportunities'
import type { EcologicalRole, Plant } from '../domain/plant'
import { findRule } from '../domain/relationships'
import PlantSwatch from './PlantSwatch'
import SourceLinks from './SourceLinks'

/** Companion cards beyond this many are left out, so the list stays short. */
const MAX_COMPANION_CARDS = 4

export type Suggestions = {
  garden: RoleSuggestion[]
  bedRoles: BedRoleSuggestion[]
  companions: BedCompanionSuggestion[]
}

type GardenSuggestionsProps = {
  /** Null while suggestions are switched off: they aren't evaluated then. */
  suggestions: Suggestions | null
  plantsById: Record<string, Plant>
  beds: Record<string, GardenBed>
  /** How many beds hold plants, so "every bed" can replace a long list. */
  plantedBedCount: number
  inventory: string[]
  onToggle: () => void
  /** Arms the plant brush with this plant, ready to place. */
  onChoosePlant: (plantId: string) => void
  onSelectBed: (bedId: string) => void
  /** Points the canvas at a card's beds and, within them, these plant types. */
  onHighlight: (target: { bedIds: string[]; plantIds: string[] } | null) => void
}

/**
 * Opt-in invitations: roles a bed or the garden lacks, and companions that
 * suit what each bed holds. Off by default: an absent role is not a problem.
 */
function GardenSuggestions({
  suggestions,
  plantsById,
  beds,
  plantedBedCount,
  inventory,
  onToggle,
  onChoosePlant,
  onSelectBed,
  onHighlight,
}: GardenSuggestionsProps) {
  const on = suggestions !== null
  const empty =
    on &&
    suggestions.garden.length + suggestions.bedRoles.length + suggestions.companions.length === 0

  function plantChips(plantIds: string[]) {
    return (
      <span className="garden-suggestions__chips">
        {plantIds
          .flatMap((id) => plantsById[id] ?? [])
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((plant) => {
            const owned = inventory.includes(plant.id)
            return (
              <button
                key={plant.id}
                type="button"
                className="garden-suggestions__chip"
                onClick={() => onChoosePlant(plant.id)}
                title={`Place ${plant.name}${owned ? ' (in your inventory)' : ''}`}
                aria-label={`Place ${plant.name}${owned ? ', in your inventory' : ''}`}
              >
                <PlantSwatch plant={plant} />
                {plant.name}
                {owned && <span className="garden-suggestions__owned" aria-hidden="true" />}
              </button>
            )
          })}
      </span>
    )
  }

  function bedChips(bedIds: string[]) {
    if (bedIds.length > 1 && bedIds.length === plantedBedCount) {
      return (
        <span className="garden-suggestions__chips">
          <span className="garden-suggestions__label">Beds: every planted bed</span>
        </span>
      )
    }
    return (
      <span className="garden-suggestions__chips">
        <span className="garden-suggestions__label">Beds:</span>
        {bedIds
          .flatMap((id) => beds[id] ?? [])
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
          .map((bed) => (
            <button
              key={bed.id}
              type="button"
              className="garden-suggestions__chip garden-suggestions__chip--bed"
              onClick={() => onSelectBed(bed.id)}
              title={`Show ${bed.name}`}
            >
              {bed.name}
            </button>
          ))}
      </span>
    )
  }

  // Hovering or focusing within a card points at what it refers to.
  function pointAt(bedIds: string[], plantIds: string[] = []) {
    const point = () => onHighlight({ bedIds, plantIds })
    return { onMouseEnter: point, onFocus: point }
  }

  function roleCard(role: EcologicalRole, key: string, plantIds: string[], bedIds?: string[]) {
    return (
      <li key={key} className="garden-suggestions__card" {...(bedIds && pointAt(bedIds))}>
        <span className="garden-suggestions__invite">
          {roleInfo[role].suggestion}
          {!bedIds && <span className="garden-suggestions__scope"> · whole garden</span>}
        </span>
        <span className="garden-suggestions__why">{roleInfo[role].why}</span>
        {bedIds && bedChips(bedIds)}
        {plantChips(plantIds)}
        <SourceLinks ids={roleInfo[role].sourceIds} />
      </li>
    )
  }

  return (
    <section className="garden-suggestions" aria-label="Suggestions">
      <div className="garden-suggestions__header">
        <h3 className="garden-suggestions__title" id="garden-suggestions-title">
          Suggestions
        </h3>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="garden-suggestions-title"
          className="switch"
          onClick={onToggle}
        >
          <span className="switch__thumb" />
        </button>
      </div>
      {empty && <p className="garden-suggestions__done">Nothing to suggest right now.</p>}
      {on && !empty && (
        <ul
          className="garden-suggestions__list"
          onMouseLeave={() => onHighlight(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) onHighlight(null)
          }}
        >
          {suggestions.bedRoles.map((s) =>
            roleCard(s.role, `bed-${s.role}-${s.bedIds.join()}`, s.candidatePlantIds, s.bedIds),
          )}
          {suggestions.companions.slice(0, MAX_COMPANION_CARDS).map((suggestion) => {
            const { plantId, bedIds, companionOfPlantIds } = suggestion
            const plant = plantsById[plantId]
            const companions = companionOfPlantIds.flatMap((id) => plantsById[id] ?? [])
            return (
              <li
                key={`companion-${plantId}`}
                className="garden-suggestions__card"
                {...pointAt(bedIds, companionOfPlantIds)}
              >
                <span className="garden-suggestions__invite">Add {plant.name}</span>
                <span className="garden-suggestions__why">
                  Companion to {companions.map((p) => p.name).join(', ')}
                </span>
                {companions.map((other) => {
                  const rule = findRule(plantId, other.id, 'companion', relationshipRules)
                  return rule?.reason ? (
                    <span key={other.id} className="garden-suggestions__reason">
                      {rule.reason} <SourceLinks ids={rule.sourceIds} />
                    </span>
                  ) : null
                })}
                {bedChips(bedIds)}
                {plantChips([plantId])}
              </li>
            )
          })}
          {suggestions.garden.map((s) => roleCard(s.role, `garden-${s.role}`, s.candidatePlantIds))}
        </ul>
      )}
    </section>
  )
}

export default GardenSuggestions
