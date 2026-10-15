import { describe, expect, it } from 'vitest'
import type { EcologicalRole, PlantLifecycle } from '../domain/plant'
import type { SunlightLevel } from '../domain/garden'
import { plants } from './plants'
import { sources } from './sources'

describe('plants seed data', () => {
  it('gives every plant a positive spacingInches range with min <= max', () => {
    for (const plant of plants) {
      const { min, max } = plant.spacingInches
      expect(min > 0 && min <= max, `${plant.name} has an invalid spacingInches: ${min}-${max}`).toBe(
        true,
      )
    }
  })

  it('backs every spacingInches value with at least one registered source', () => {
    // Spacing values are physical claims taken from sources, never
    // conversions — see docs/data-sources.md "Spacing".
    for (const plant of plants) {
      expect(
        plant.evidence?.spacingGuidance?.length ?? 0,
        `${plant.name} has spacingInches but no evidence.spacingGuidance source`,
      ).toBeGreaterThan(0)
    }
  })

  // Regression coverage for the researched spacing values in
  // docs/data-sources.md, so a silent edit to a sourced figure fails a test.
  const expectedSpacing: Record<string, [number, number]> = {
    tomato: [24, 36],
    carrot: [2, 3],
    lettuce: [4, 4],
    basil: [6, 12],
    mint: [18, 18],
    rosemary: [24, 24],
    marigold: [8, 10],
    sunflower: [18, 24],
    onion: [3, 4],
    'bush-bean': [2, 3],
    pea: [1, 2],
    'bell-pepper': [18, 18],
    cucumber: [24, 24],
    cabbage: [12, 18],
    potato: [10, 12],
    dill: [10, 12],
  }

  it.each(Object.entries(expectedSpacing))('assigns the sourced spacingInches for %s', (id, [min, max]) => {
    expect(plants.find((p) => p.id === id)?.spacingInches).toEqual({ min, max })
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

  it('only references registered source ids in evidence', () => {
    const knownSourceIds = new Set(sources.map((source) => source.id))
    const unknownIds: string[] = []

    for (const plant of plants) {
      const evidence = plant.evidence
      if (!evidence) continue

      const referencedIds = [
        ...(evidence.lifecycle ?? []),
        ...(evidence.spacingGuidance ?? []),
        ...Object.values(evidence.ecologicalRoles ?? {}).flat(),
        ...(evidence.sunlightRequirement ?? []),
      ]

      for (const id of referencedIds) {
        if (!knownSourceIds.has(id)) unknownIds.push(`${plant.name}: ${id}`)
      }
    }

    expect(unknownIds).toEqual([])
  })

  it('backs every modeled sunlightRequirement with at least one registered source', () => {
    // Stricter than lifecycle/ecologicalRoles/spacing: sunlightRequirement is
    // curated specifically to feed Part 3B fit reasoning, so (unlike those
    // older fields) every accepted set here must trace to a real Extension
    // source rather than an un-cited judgment call — see the module comment
    // above and docs/data-sources.md "Sunlight".
    for (const plant of plants) {
      if (!plant.sunlightRequirement) continue // not yet curated at all — a separate, valid state

      const cited = plant.evidence?.sunlightRequirement ?? []
      expect(
        cited.length,
        `${plant.name} has a sunlightRequirement but no evidence.sunlightRequirement source`,
      ).toBeGreaterThan(0)
    }
  })

  it('gives every modeled sunlightRequirement a non-empty, deduplicated list', () => {
    for (const plant of plants) {
      const requirement = plant.sunlightRequirement
      if (!requirement) continue // not yet curated — a valid state, not a violation

      expect(requirement.length, `${plant.name} has an empty sunlightRequirement`).toBeGreaterThan(
        0,
      )
      const uniqueLevels = new Set(requirement)
      expect(
        uniqueLevels.size,
        `${plant.name} has a duplicate sunlightRequirement level: ${requirement.join(', ')}`,
      ).toBe(requirement.length)
    }
  })

  // Regression coverage for the curated Part 2B lifecycle/ecologicalRoles
  // assignments — these are horticultural judgment calls, not something
  // TypeScript's union types can verify, so a future edit that silently
  // changes one should fail a test. Table-driven by id rather than array
  // index/length so this doesn't assume the library stays at exactly these
  // 16 plants.
  const expectedIdentity: Record<
    string,
    {
      lifecycle: PlantLifecycle
      ecologicalRoles: EcologicalRole[]
      sunlightRequirement: SunlightLevel[]
    }
  > = {
    tomato: {
      lifecycle: 'tender-perennial',
      ecologicalRoles: [],
      sunlightRequirement: ['full-sun'],
    },
    carrot: {
      lifecycle: 'biennial',
      ecologicalRoles: [],
      sunlightRequirement: ['full-sun', 'partial-sun'],
    },
    lettuce: {
      lifecycle: 'annual',
      ecologicalRoles: [],
      sunlightRequirement: ['full-sun', 'partial-sun'],
    },
    basil: {
      lifecycle: 'annual',
      ecologicalRoles: ['pollinator-support'],
      sunlightRequirement: ['full-sun'],
    },
    mint: {
      lifecycle: 'perennial',
      ecologicalRoles: ['pollinator-support'],
      sunlightRequirement: ['full-sun', 'partial-sun'],
    },
    rosemary: {
      lifecycle: 'tender-perennial',
      ecologicalRoles: ['pollinator-support'],
      sunlightRequirement: ['full-sun'],
    },
    marigold: {
      lifecycle: 'annual',
      ecologicalRoles: ['pollinator-support'],
      sunlightRequirement: ['full-sun'],
    },
    sunflower: {
      lifecycle: 'annual',
      ecologicalRoles: ['pollinator-support'],
      sunlightRequirement: ['full-sun'],
    },
    onion: { lifecycle: 'biennial', ecologicalRoles: [], sunlightRequirement: ['full-sun'] },
    'bush-bean': {
      lifecycle: 'annual',
      ecologicalRoles: ['nitrogen-fixation'],
      sunlightRequirement: ['full-sun'],
    },
    pea: {
      lifecycle: 'annual',
      ecologicalRoles: ['nitrogen-fixation'],
      sunlightRequirement: ['full-sun'],
    },
    'bell-pepper': {
      lifecycle: 'tender-perennial',
      ecologicalRoles: [],
      sunlightRequirement: ['full-sun'],
    },
    cucumber: { lifecycle: 'annual', ecologicalRoles: [], sunlightRequirement: ['full-sun'] },
    cabbage: {
      lifecycle: 'biennial',
      ecologicalRoles: [],
      sunlightRequirement: ['full-sun'],
    },
    potato: {
      lifecycle: 'tender-perennial',
      ecologicalRoles: [],
      sunlightRequirement: ['full-sun'],
    },
    dill: {
      lifecycle: 'annual',
      ecologicalRoles: ['pollinator-support'],
      sunlightRequirement: ['full-sun'],
    },
  }

  it.each(Object.entries(expectedIdentity))(
    'assigns the curated lifecycle/ecologicalRoles/sunlightRequirement for %s',
    (id, expected) => {
      const plant = plants.find((p) => p.id === id)
      expect(plant, `expected a seed plant with id "${id}"`).toBeDefined()
      expect(plant!.lifecycle).toBe(expected.lifecycle)
      expect(plant!.ecologicalRoles).toEqual(expected.ecologicalRoles)
      expect(plant!.sunlightRequirement).toEqual(expected.sunlightRequirement)
    },
  )
})
