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
})
