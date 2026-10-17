import { describe, expect, it } from 'vitest'
import { DEFAULT_KEY_OPTIONS, hexToRgb, keyOutBackground, transparentPathFor } from './remove-background.ts'

const MAGENTA: [number, number, number] = [255, 0, 255]
const OUTLINE: [number, number, number] = [0, 48, 0] // dark green
const LEAF: [number, number, number] = [80, 200, 40]

/** Builds an RGB image from rows of single-character pixel codes. */
function image(rows: string[], palette: Record<string, [number, number, number]>) {
  const height = rows.length
  const width = rows[0].length
  const rgb = new Uint8Array(width * height * 3)
  rows.forEach((row, y) =>
    [...row].forEach((code, x) => rgb.set(palette[code], (y * width + x) * 3)),
  )
  return { rgb, width, height }
}

const alphaAt = (rgba: Uint8Array, width: number, x: number, y: number) => rgba[(y * width + x) * 4 + 3]
const colorAt = (rgba: Uint8Array, width: number, x: number, y: number) =>
  [...rgba.subarray((y * width + x) * 4, (y * width + x) * 4 + 3)]

describe('keyOutBackground', () => {
  const palette = {
    m: MAGENTA,
    n: [235, 25, 230] as [number, number, number], // JPEG-noisy magenta
    p: [200, 60, 180] as [number, number, number], // pink fringe smeared into an edge
    k: [230, 40, 200] as [number, number, number], // a pinkish subject color
    t: [90, 20, 90] as [number, number, number], // outline blended with magenta by JPEG
    s: [200, 110, 170] as [number, number, number], // blurred pink smear, far from pure key
    r: [210, 40, 40] as [number, number, number], // a red subject (bell pepper)
    o: OUTLINE,
    l: LEAF,
  }

  it('removes border-connected key background, including JPEG-noisy key pixels', () => {
    const { rgb, width, height } = image(['mnmmm', 'moooo', 'molll', 'moooo', 'mmmnm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 0, 0)).toBe(0)
    expect(alphaAt(rgba, width, 1, 0)).toBe(0) // noisy magenta
    expect(alphaAt(rgba, width, 3, 4)).toBe(0)
  })

  it('keeps dark outlines and subject colors fully opaque', () => {
    const { rgb, width, height } = image(['mmmmm', 'moooo', 'molll', 'moooo', 'mmmmm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 1, 1)).toBe(255) // outline
    expect(alphaAt(rgba, width, 3, 2)).toBe(255) // leaf
  })

  it('removes near-pure key pockets enclosed by the subject', () => {
    const { rgb, width, height } = image(['mmmmm', 'mooom', 'momom', 'mooom', 'mmmmm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 2, 2)).toBe(0) // gap between leaves
  })

  it('keeps enclosed pinkish subject colors that are not near-pure key', () => {
    const { rgb, width, height } = image(['mmmmm', 'mooom', 'mokom', 'mooom', 'mmmmm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 2, 2)).toBe(255)
  })

  it('defringes a key-tinted edge pixel to the color just inside it', () => {
    // 't' is a dark outline JPEG-blended with magenta; inside it is outline.
    const { rgb, width, height } = image(['mmmmmm', 'mtoooo', 'mtollo', 'mtoooo', 'mmmmmm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 1, 2)).toBe(255) // edge kept, not cut
    expect(colorAt(rgba, width, 1, 2)).toEqual(OUTLINE) // tint replaced
  })

  it('leaves a normal dark outline untouched by defringing', () => {
    const { rgb, width, height } = image(['mmmmm', 'moooo', 'molll', 'moooo', 'mmmmm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(colorAt(rgba, width, 1, 2)).toEqual(OUTLINE)
  })

  it('removes pink fringe touching the background, but not fringe-colored pixels inside', () => {
    const { rgb, width, height } = image(['mmmmmm', 'mpoooo', 'mpopoo', 'mpoooo', 'mmmmmm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 1, 2)).toBe(0) // edge fringe
    expect(alphaAt(rgba, width, 3, 2)).toBe(255) // enclosed, not touching background
  })

  it('removes a blurred pink smear connected to the background', () => {
    const { rgb, width, height } = image(['mmmmm', 'moooo', 'molll', 'mssss', 'msssm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 2, 3)).toBe(0)
    expect(alphaAt(rgba, width, 3, 4)).toBe(0)
    expect(alphaAt(rgba, width, 3, 2)).toBe(255) // the leaf above survives
  })

  it('keeps an enclosed pink-tinted color, and red subjects touching the background', () => {
    const { rgb, width, height } = image(['mmmmm', 'mooom', 'mosom', 'mooom', 'mrrrm'], palette)
    const { rgba } = keyOutBackground(rgb, width, height)
    expect(alphaAt(rgba, width, 2, 2)).toBe(255) // enclosed, not connected
    expect(alphaAt(rgba, width, 2, 4)).toBe(255) // red is not a magenta cast
  })

  it('can turn the smear pass off for red-purple subjects', () => {
    // Fringe cleanup reaches two pixels deep; the smear pass would reach all.
    const { rgb, width, height } = image(['msssss'], palette)
    const on = keyOutBackground(rgb, width, height).rgba
    const off = keyOutBackground(rgb, width, height, { ...DEFAULT_KEY_OPTIONS, tintMargin: null }).rgba
    expect(alphaAt(on, width, 4, 0)).toBe(0)
    expect(alphaAt(off, width, 4, 0)).toBe(255)
  })

  it('reports the removed share', () => {
    const { rgb, width, height } = image(['mm', 'oo'], palette)
    expect(keyOutBackground(rgb, width, height).removedFraction).toBe(0.5)
  })
})

describe('helpers', () => {
  it('parses the key hex used in the art config', () => {
    expect(hexToRgb('#FF00FF')).toEqual(DEFAULT_KEY_OPTIONS.key)
  })

  it('names transparent outputs next to the raw candidate', () => {
    expect(transparentPathFor('art/candidates/basil/basil-plant-2.jpg')).toBe(
      'art/candidates/basil/basil-plant-2-transparent.png',
    )
  })
})
