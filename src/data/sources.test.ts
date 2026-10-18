import { describe, expect, it } from 'vitest'
import { roleInfo } from './roles'
import { sources } from './sources'

describe('sources registry', () => {
  it('gives every source a unique id', () => {
    const ids = sources.map((source) => source.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size, 'duplicate source id found in registry').toBe(ids.length)
  })

  it('backs every role explanation with registered sources', () => {
    const knownSourceIds = new Set(sources.map((source) => source.id))
    for (const [role, info] of Object.entries(roleInfo)) {
      expect(info.sourceIds.length, `${role} has no source`).toBeGreaterThan(0)
      for (const id of info.sourceIds) expect(knownSourceIds.has(id), `${role}: ${id}`).toBe(true)
    }
  })
})
