import { describe, expect, it } from 'vitest'
import { sources } from './sources'

describe('sources registry', () => {
  it('gives every source a unique id', () => {
    const ids = sources.map((source) => source.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size, 'duplicate source id found in registry').toBe(ids.length)
  })
})
