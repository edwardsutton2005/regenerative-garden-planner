import { describe, expect, it } from 'vitest'
import { chooseGardenToOpen } from './cloudGardens'
import type { GardenSummary } from './cloudGardens'

function summary(id: string): GardenSummary {
  return { id, name: id, width: 120, height: 120, updatedAt: '2026-10-17T00:00:00Z' }
}

describe('chooseGardenToOpen', () => {
  const gardens = [summary('newest'), summary('older')]

  it('reopens the garden last open in this browser', () => {
    expect(chooseGardenToOpen(gardens, 'older')).toBe('older')
  })

  it('falls back to the most recently edited when the last one is gone or unknown', () => {
    expect(chooseGardenToOpen(gardens, 'deleted')).toBe('newest')
    expect(chooseGardenToOpen(gardens, null)).toBe('newest')
  })

  it('opens nothing for an account with no gardens', () => {
    expect(chooseGardenToOpen([], 'deleted')).toBeNull()
  })
})
