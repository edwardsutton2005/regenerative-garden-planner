import { describe, expect, it } from 'vitest'
import { FRAME_BORDER, FRAME_SIZE, PALETTES, TILE_SIZE, bedFrame, groundTile, periodicNoise } from './textures.ts'

const pixel = (rgba: Uint8Array, width: number, x: number, y: number) =>
  [...rgba.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)]

describe('periodicNoise', () => {
  it('repeats exactly with the tile size, so tiles have no seams', () => {
    const noise = periodicNoise(24, 8, 7)
    for (const [x, y] of [[0, 0], [3.5, 10], [23, 23], [11, 2]]) {
      expect(noise(x + 24, y)).toBeCloseTo(noise(x, y), 10)
      expect(noise(x, y + 24)).toBeCloseTo(noise(x, y), 10)
    }
  })

  it('stays in [0, 1)', () => {
    const noise = periodicNoise(24, 4, 3)
    for (let x = 0; x < 24; x += 0.5) expect(noise(x, x / 2)).toBeGreaterThanOrEqual(0)
  })
})

describe('groundTile', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    expect(groundTile(PALETTES.soil, 1, 'speckles')).toEqual(groundTile(PALETTES.soil, 1, 'speckles'))
    expect(groundTile(PALETTES.soil, 1, 'speckles')).not.toEqual(groundTile(PALETTES.soil, 2, 'speckles'))
  })

  it('is a fully opaque TILE_SIZE square using only palette colors', () => {
    const rgba = groundTile(PALETTES.grass, 5, 'blades')
    expect(rgba.length).toBe(TILE_SIZE * TILE_SIZE * 4)
    const allowed = new Set(PALETTES.grass.map((c) => c.join(',')))
    for (let i = 0; i < rgba.length; i += 4) {
      expect(rgba[i + 3]).toBe(255)
      expect(allowed.has(`${rgba[i]},${rgba[i + 1]},${rgba[i + 2]}`)).toBe(true)
    }
  })
})

describe('bedFrame', () => {
  const rgba = bedFrame()

  it('has opaque planks and a transparent center for the bed soil', () => {
    expect(pixel(rgba, FRAME_SIZE, 0, 0)[3]).toBe(255)
    expect(pixel(rgba, FRAME_SIZE, FRAME_BORDER - 1, FRAME_SIZE / 2)[3]).toBe(255)
    expect(pixel(rgba, FRAME_SIZE, FRAME_BORDER, FRAME_BORDER)[3]).toBe(0)
    expect(pixel(rgba, FRAME_SIZE, FRAME_SIZE / 2, FRAME_SIZE / 2)[3]).toBe(0)
  })

  it('is symmetric, so all four sides match when stretched', () => {
    for (let y = 0; y < FRAME_SIZE; y++) {
      for (let x = 0; x < FRAME_SIZE; x++) {
        expect(pixel(rgba, FRAME_SIZE, x, y)[3]).toBe(pixel(rgba, FRAME_SIZE, FRAME_SIZE - 1 - x, y)[3])
      }
    }
  })
})
