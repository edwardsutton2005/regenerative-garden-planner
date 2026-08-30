import type { RoleComposition } from '../domain/composition'
import type { Plant } from '../domain/plant'

type GardenCompositionProps = {
  composition: RoleComposition[]
  plantsById: Record<string, Plant>
}

// Turns a kebab-case literal like 'pollinator-support' into "Pollinator
// support" for display. Duplicated from GardenInspector's identical helper —
// two lines, no shared deps, not worth a shared util module at two callers.
function formatEnumLabel(value: string): string {
  const spaced = value.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function snapshotText(composition: RoleComposition[]): string {
  if (composition.length === 0) return 'No modeled roles yet'
  return composition.map((c) => formatEnumLabel(c.role)).join(' · ')
}

function GardenComposition({ composition, plantsById }: GardenCompositionProps) {
  return (
    <details className="garden-composition">
      <summary className="garden-composition__summary">
        <span className="garden-composition__title">Garden composition</span>
        <span className="garden-composition__snapshot">{snapshotText(composition)}</span>
      </summary>
      {composition.length === 0 ? (
        <p className="garden-composition__empty">No modeled roles yet</p>
      ) : (
        <ul className="garden-composition__list">
          {composition.map(({ role, plantIds }) => (
            <li key={role} className="garden-composition__item">
              <span className="garden-composition__role">{formatEnumLabel(role)}</span>
              <span className="garden-composition__providers">
                {plantIds
                  .map((id) => plantsById[id]?.name ?? id)
                  .sort((a, b) => a.localeCompare(b))
                  .join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}

export default GardenComposition
