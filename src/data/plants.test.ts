import { describe, expect, it } from 'vitest'
import type { EcologicalRole, PlantLifecycle } from '../domain/plant'
import { plants } from './plants'

describe('plants seed data', () => {
  it('gives every plant a positive integer minimumSpacingCells', () => {
    for (const plant of plants) {
      expect(
        Number.isInteger(plant.minimumSpacingCells) && plant.minimumSpacingCells > 0,
        `${plant.name} has an invalid minimumSpacingCells: ${plant.minimumSpacingCells}`,
      ).toBe(true)
    }
  })

  it('gives every plant a unique id', () => {
    const ids = plants.map((plant) => plant.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size, 'duplicate plant id found in seed data').toBe(ids.length)
  })

  it('gives every plant a deduplicated ecologicalRoles list', () => {
    for (const plant of plants) {
      const uniqueRoles = new Set(plant.ecologicalRoles)
      expect(
        uniqueRoles.size,
        `${plant.name} has a duplicate ecologicalRole: ${plant.ecologicalRoles.join(', ')}`,
      ).toBe(plant.ecologicalRoles.length)
    }
  })

  // Regression coverage for the curated Part 2B lifecycle/ecologicalRoles
  // assignments — these are horticultural judgment calls, not something
  // TypeScript's union types can verify, so a future edit that silently
  // changes one should fail a test. Table-driven by id rather than array
  // index/length so this doesn't assume the library stays at exactly these
  // 16 plants.
  const expectedIdentity: Record<string, { lifecycle: PlantLifecycle; ecologicalRoles: EcologicalRole[] }> = {
    tomato: { lifecycle: 'tender-perennial', ecologicalRoles: [] },
    carrot: { lifecycle: 'biennial', ecologicalRoles: [] },
    lettuce: { lifecycle: 'annual', ecologicalRoles: [] },
    basil: { lifecycle: 'annual', ecologicalRoles: ['pollinator-support'] },
    mint: { lifecycle: 'perennial', ecologicalRoles: ['pollinator-support'] },
    rosemary: { lifecycle: 'tender-perennial', ecologicalRoles: ['pollinator-support'] },
    marigold: { lifecycle: 'annual', ecologicalRoles: ['pollinator-support'] },
    sunflower: { lifecycle: 'annual', ecologicalRoles: ['pollinator-support'] },
    onion: { lifecycle: 'biennial', ecologicalRoles: [] },
    'bush-bean': { lifecycle: 'annual', ecologicalRoles: ['nitrogen-fixation'] },
    pea: { lifecycle: 'annual', ecologicalRoles: ['nitrogen-fixation'] },
    'bell-pepper': { lifecycle: 'tender-perennial', ecologicalRoles: [] },
    cucumber: { lifecycle: 'annual', ecologicalRoles: [] },
    cabbage: { lifecycle: 'biennial', ecologicalRoles: [] },
    potato: { lifecycle: 'tender-perennial', ecologicalRoles: [] },
    dill: { lifecycle: 'annual', ecologicalRoles: ['pollinator-support'] },
  }

  it.each(Object.entries(expectedIdentity))(
    'assigns the curated lifecycle/ecologicalRoles for %s',
    (id, expected) => {
      const plant = plants.find((p) => p.id === id)
      expect(plant, `expected a seed plant with id "${id}"`).toBeDefined()
      expect(plant!.lifecycle).toBe(expected.lifecycle)
      expect(plant!.ecologicalRoles).toEqual(expected.ecologicalRoles)
    },
  )
})
