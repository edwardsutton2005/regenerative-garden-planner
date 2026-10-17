import { describe, expect, it } from 'vitest'
import { createGarden, isValidPosition } from '../domain/garden'
import {
  clientToGarden,
  scaleBarLength,
  percentCircle,
  percentPoint,
  percentRect,
  snapTo,
  toPlantPosition,
} from './canvasGeometry'

const garden = createGarden(120, 60) // 10 ft x 5 ft

describe('clientToGarden', () => {
  it('maps proportionally, independent of rendered size and offset', () => {
    const small = { left: 0, top: 0, width: 600, height: 300 }
    const large = { left: 50, top: 20, width: 1200, height: 600 }
    expect(clientToGarden(150, 75, small, garden)).toEqual({ x: 30, y: 15 })
    expect(clientToGarden(50 + 300, 20 + 150, large, garden)).toEqual({ x: 30, y: 15 })
  })

  it('clamps to the closed garden bounds', () => {
    const box = { left: 0, top: 0, width: 600, height: 300 }
    expect(clientToGarden(-40, -10, box, garden)).toEqual({ x: 0, y: 0 })
    expect(clientToGarden(900, 500, box, garden)).toEqual({ x: 120, y: 60 })
  })
})

describe('toPlantPosition', () => {
  it('rounds to the nearest whole inch', () => {
    expect(toPlantPosition({ x: 31.4, y: 27.6 }, garden)).toEqual({ x: 31, y: 28 })
  })

  it('clamps below to 0', () => {
    expect(toPlantPosition({ x: -3, y: -0.2 }, garden)).toEqual({ x: 0, y: 0 })
  })

  it('keeps the half-open far edge: input that would round onto it lands strictly inside', () => {
    expect(toPlantPosition({ x: 119.4, y: 59.4 }, garden)).toEqual({ x: 119, y: 59 })
    expect(toPlantPosition({ x: 119.7, y: 60 }, garden)).toEqual({ x: 119, y: 59 })
  })

  it('always produces a valid domain position, without changing the garden', () => {
    for (const x of [0, 0.4, 59.5, 119.49, 119.5, 119.99, 120, 500]) {
      expect(isValidPosition(garden, toPlantPosition({ x, y: x / 2 }, garden))).toBe(true)
    }
    expect(garden.width).toBe(120)
  })

  it('works for garden sizes that are not whole inches', () => {
    const odd = { ...garden, width: 100.5 }
    expect(toPlantPosition({ x: 100.4, y: 0 }, odd).x).toBe(100)
  })
})

describe('snapTo', () => {
  it('rounds to the nearest step', () => {
    expect(snapTo(14, 6)).toBe(12)
    expect(snapTo(15, 6)).toBe(18)
  })
})

describe('percent helpers', () => {
  it('express points, rects, and circles as percentages of the garden', () => {
    expect(percentPoint(garden, { x: 30, y: 15 })).toEqual({ left: '25%', top: '25%' })
    expect(percentRect(garden, { position: { x: 0, y: 30 }, width: 60, height: 30 })).toEqual({
      left: '0%',
      top: '50%',
      width: '50%',
      height: '50%',
    })
    expect(percentCircle(garden, { x: 60, y: 30 }, 12)).toEqual({
      left: '40%',
      top: '30%',
      width: '20%',
      height: '40%',
    })
  })
})

describe('scaleBarLength', () => {
  it('picks the longest round length that fits', () => {
    expect(scaleBarLength(4.5, 120)).toBe(24) // 24" = 108 px; 36" would be 162 px
    expect(scaleBarLength(1, 120)).toBe(120) // exactly fits
    expect(scaleBarLength(0.1, 120)).toBe(1200)
  })

  it('falls back to the shortest length when even that is too long', () => {
    expect(scaleBarLength(200, 120)).toBe(1)
  })
})
