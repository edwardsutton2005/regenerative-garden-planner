import { describe, expect, it } from 'vitest'
import { PALETTES, TILE_SIZE, groundTile, periodicNoise, seamlessStrip } from './textures.ts'

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

describe('seamlessStrip', () => {
  // A 10×1 strip whose red channel is its column index.
  const width = 10
  const source = new Uint8Array(width * 4)
  for (let x = 0; x < width; x++) source.set([x * 20, 0, 0, 255], x * 4)
  const out = seamlessStrip(source, width, 1, 4)

  it('is shorter by the blend, and its first column continues from its last', () => {
    expect(out.length).toBe(6 * 4)
    expect(pixel(out, 6, 0, 0)).toEqual(pixel(source, width, 6, 0))
    expect(pixel(out, 6, 5, 0)).toEqual(pixel(source, width, 5, 0))
  })

  it('leaves columns past the blend untouched', () => {
    expect(pixel(out, 6, 4, 0)).toEqual(pixel(source, width, 4, 0))
  })
})
