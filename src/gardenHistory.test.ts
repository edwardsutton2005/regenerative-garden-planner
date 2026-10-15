import { describe, expect, it } from 'vitest'
import { createGarden, placePlant, setSunlightAt } from './domain/garden'
import type { GardenState } from './domain/garden'
import {
  EMPTY_HISTORY,
  UNDO_LIMIT,
  applyChange,
  applyWithoutRecording,
  recordCheckpoint,
  redo,
  startHistory,
  undo,
} from './gardenHistory'

const place = (id: string, x: number) => (g: GardenState) => placePlant(g, id, 'tomato', { x, y: 6 })

describe('garden history', () => {
  it('undoes and redoes a change', () => {
    let h = startHistory(createGarden())
    h = applyChange(h, place('a', 6))
    expect(Object.keys(h.garden!.placements)).toEqual(['a'])

    h = undo(h)
    expect(h.garden!.placements).toEqual({})
    expect(h.future).toHaveLength(1)

    h = redo(h)
    expect(Object.keys(h.garden!.placements)).toEqual(['a'])
    expect(h.future).toHaveLength(0)
  })

  it('a new change clears redo', () => {
    let h = startHistory(createGarden())
    h = applyChange(h, place('a', 6))
    h = undo(h)
    h = applyChange(h, place('b', 18))
    expect(h.future).toEqual([])
    expect(redo(h)).toBe(h)
  })

  it('records nothing for a no-op change', () => {
    const h = startHistory(createGarden())
    expect(applyChange(h, (g) => g)).toBe(h)
  })

  it('undo and redo are no-ops at the ends of history, and before a garden exists', () => {
    const h = startHistory(createGarden())
    expect(undo(h)).toBe(h)
    expect(redo(h)).toBe(h)
    expect(applyChange(EMPTY_HISTORY, place('a', 6))).toBe(EMPTY_HISTORY)
  })

  it('a checkpoint plus unrecorded changes undo as one step', () => {
    let h = startHistory(createGarden())
    h = recordCheckpoint(h)
    h = applyWithoutRecording(h, (g) => setSunlightAt(g, 0, 0, 'shade'))
    h = applyWithoutRecording(h, (g) => setSunlightAt(g, 0, 1, 'shade'))
    expect(h.past).toHaveLength(1)

    h = undo(h)
    expect(h.garden!.environment.sunlightByCell).toEqual({})
  })

  it(`keeps at most ${UNDO_LIMIT} undo steps`, () => {
    let h = startHistory(createGarden())
    for (let i = 0; i < UNDO_LIMIT + 5; i++) h = applyChange(h, place(`p${i}`, 6))
    expect(h.past).toHaveLength(UNDO_LIMIT)
  })
})
