import { roleInfo } from '../data/roles'
import type { GardenDiversity, RoleComposition } from '../domain/composition'
import type { Plant } from '../domain/plant'
import { PLANT_FAMILIES } from '../domain/plant'
import Icon from './Icon'

type GardenCompositionProps = {
  composition: RoleComposition[]
  diversity: GardenDiversity
  plantsById: Record<string, Plant>
}

// Turns a kebab-case literal like 'tender-perennial' into "Tender perennial"
// for display. Duplicated from GardenInspector's identical helper — two
// lines, no shared deps, not worth a shared util module.
function formatEnumLabel(value: string): string {
  const spaced = value.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** "Vegetable 3 · Herb 2" from a count per kind, in a fixed order. */
function mix(counts: Partial<Record<string, number>>, order: string[]): string {
  return order
    .filter((kind) => counts[kind])
    .map((kind) => `${formatEnumLabel(kind)} ${counts[kind]}`)
    .join(' · ')
}

function snapshotText({ plantTypes, families }: GardenDiversity, composition: RoleComposition[]) {
  if (plantTypes === 0) return 'Nothing planted yet'
  const counts = `${plantTypes} ${plantTypes === 1 ? 'plant' : 'plants'} · ${families.length} ${
    families.length === 1 ? 'family' : 'families'
  }`
  return [counts, ...composition.map((c) => roleInfo[c.role].label)].join(' · ')
}

function GardenComposition({ composition, diversity, plantsById }: GardenCompositionProps) {
  return (
    <details className="garden-composition">
      <summary className="garden-composition__summary">
        <Icon name="chevronRight" size={14} />
        <span className="garden-composition__title">Garden composition</span>
        <span className="garden-composition__snapshot">{snapshotText(diversity, composition)}</span>
      </summary>
      {diversity.plantTypes === 0 ? (
        <p className="garden-composition__empty">Place plants to see what your garden is made of.</p>
      ) : (
        <ul className="garden-composition__list">
          {composition.map(({ role, plantIds }) => (
            <li key={role} className="garden-composition__item">
              <span className="garden-composition__role">{roleInfo[role].label}</span>
              <span className="garden-composition__providers">
                {plantIds
                  .map((id) => plantsById[id]?.name ?? id)
                  .sort((a, b) => a.localeCompare(b))
                  .join(', ')}
              </span>
            </li>
          ))}
          <li className="garden-composition__item">
            <span className="garden-composition__role">Kinds of plant</span>
            <span className="garden-composition__providers">
              {mix(diversity.categories, ['vegetable', 'herb', 'flower'])}
            </span>
          </li>
          <li className="garden-composition__item">
            <span className="garden-composition__role">Life cycles</span>
            <span className="garden-composition__providers">
              {mix(diversity.lifecycles, ['annual', 'biennial', 'tender-perennial', 'perennial'])}
            </span>
          </li>
          {diversity.families.length > 0 && (
            <li className="garden-composition__item">
              <span className="garden-composition__role">Plant families</span>
              <span className="garden-composition__providers">
                {diversity.families.map((family) => PLANT_FAMILIES[family]).join(', ')}
              </span>
            </li>
          )}
        </ul>
      )}
    </details>
  )
}

export default GardenComposition
