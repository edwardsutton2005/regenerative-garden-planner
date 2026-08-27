import { describe, expect, it } from 'vitest'
import { plants } from './plants'
import { relationshipRules } from './relationships'

function pairKey(plantAId: string, plantBId: string): string {
  return [plantAId, plantBId].sort().join(' :: ')
}

describe('relationshipRules seed data', () => {
  it('declares each plant pair at most once, in either order', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []

    for (const rule of relationshipRules) {
      const key = pairKey(rule.plantAId, rule.plantBId)
      const existingRelationship = seen.get(key)

      if (existingRelationship) {
        duplicates.push(
          `${key} is listed more than once (${existingRelationship} vs ${rule.relationship})`,
        )
      } else {
        seen.set(key, rule.relationship)
      }
    }

    // A pair being listed twice is a data-authoring mistake regardless of
    // whether the two entries agree — the runtime "incompatible wins" fallback
    // in getRelationship is a defensive backstop, not license for the source
    // data to actually contain duplicate or contradictory entries.
    expect(duplicates).toEqual([])
  })

  it('only references plant ids that exist in the plant catalogue', () => {
    const knownPlantIds = new Set(plants.map((plant) => plant.id))
    const unknownIds: string[] = []

    for (const rule of relationshipRules) {
      if (!knownPlantIds.has(rule.plantAId)) unknownIds.push(rule.plantAId)
      if (!knownPlantIds.has(rule.plantBId)) unknownIds.push(rule.plantBId)
    }

    expect(unknownIds).toEqual([])
  })
})
