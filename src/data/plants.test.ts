import { describe, expect, it } from 'vitest'
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
})
