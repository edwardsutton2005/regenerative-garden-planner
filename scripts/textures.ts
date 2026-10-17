// Code-generated pixel textures for the garden canvas: soil, bed soil,
// grass, and a wooden bed frame. Deterministic (seeded) and seamless by
// construction, in the chunky pixel style of the approved plant art.
// See art/STYLE.md "Textures". Pure functions; scripts/build-art.ts writes
// the PNGs.

export type RGB = [number, number, number]

/** Pixels per texture tile. One soil/grass tile represents 12 inches. */
export const TILE_SIZE = 24

/** Bed frame source image: square, with BORDER-pixel planks on each side.
 * Drawn as a stretchable CSS border-image (corners fixed, edges repeat). */
export const FRAME_SIZE = 24
export const FRAME_BORDER = 6

const hex = (h: string): RGB => {
  const n = Number.parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Palettes, dark to light. Warm, saturated, matching the plant art. */
export const PALETTES = {
  soil: ['#6b4423', '#7d4f29', '#8f5c30', '#a06a37', '#b47b42'].map(hex),
  bedSoil: ['#3f2614', '#4d2f19', '#5b381e', '#6a4224', '#7b4e2b'].map(hex),
  grass: ['#3c7a28', '#4a8c2e', '#589f34', '#68b13b', '#7cc445'].map(hex),
  wood: {
    outline: hex('#3a2314'),
    shadow: hex('#6b4426'),
    plank: hex('#9a6a3c'),
    grain: hex('#7f5430'),
    highlight: hex('#c18c54'),
    post: hex('#7a4e2c'),
    postLight: hex('#99683d'),
  },
}

/** Small seeded PRNG (mulberry32): same seed, same sequence. */
function random(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Periodic value noise in [0, 1): sample(x + size, y) === sample(x, y), so a
 * tile built from it repeats without seams. `cell` must divide `size`.
 */
export function periodicNoise(size: number, cell: number, seed: number): (x: number, y: number) => number {
  const lattice = size / cell
  const next = random(seed)
  const values = Array.from({ length: lattice * lattice }, next)
  const at = (i: number, j: number) =>
    values[(((j % lattice) + lattice) % lattice) * lattice + (((i % lattice) + lattice) % lattice)]
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x, y) => {
    const fx = x / cell
    const fy = y / cell
    const i = Math.floor(fx)
    const j = Math.floor(fy)
    const tx = smooth(fx - i)
    const ty = smooth(fy - j)
    const top = at(i, j) * (1 - tx) + at(i + 1, j) * tx
    const bottom = at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx
    return top * (1 - ty) + bottom * ty
  }
}

function blankRgba(width: number, height: number) {
  return new Uint8Array(width * height * 4)
}

function setPixel(rgba: Uint8Array, width: number, x: number, y: number, color: RGB, alpha = 255) {
  const i = (y * width + x) * 4
  rgba[i] = color[0]
  rgba[i + 1] = color[1]
  rgba[i + 2] = color[2]
  rgba[i + 3] = alpha
}

type TileStyle = 'speckles' | 'blades'

/**
 * A seamless ground tile: two octaves of periodic noise quantized into the
 * palette (clusters, not static), plus small accents that wrap at the edges
 * (light speckles for soil, short blade highlights for grass).
 */
export function groundTile(palette: RGB[], seed: number, style: TileStyle, size = TILE_SIZE): Uint8Array {
  // Clusters small relative to the tile, so the repeat isn't obvious.
  const coarse = periodicNoise(size, 6, seed)
  const fine = periodicNoise(size, 3, seed + 1)
  const jitter = random(seed + 2)
  const rgba = blankRgba(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = coarse(x, y) * 0.5 + fine(x, y) * 0.35 + jitter() * 0.15
      const index = Math.min(palette.length - 2, Math.floor(v * (palette.length - 1)))
      setPixel(rgba, size, x, y, palette[index])
    }
  }
  // Accents in the lightest color, placed with wrap-around so seams stay hidden.
  const place = random(seed + 3)
  const light = palette[palette.length - 1]
  const count = Math.round((size * size) / (style === 'blades' ? 36 : 60))
  for (let k = 0; k < count; k++) {
    const x = Math.floor(place() * size)
    const y = Math.floor(place() * size)
    setPixel(rgba, size, x, y, light)
    if (style === 'blades') setPixel(rgba, size, x, (y + size - 1) % size, light)
  }
  return rgba
}

/**
 * The wooden bed frame as a 9-slice source: a square with FRAME_BORDER-pixel
 * planks around a transparent center. Corners are darker posts; top/bottom
 * planks have horizontal grain, side planks vertical grain, so edges can
 * repeat along any bed length.
 */
export function bedFrame(): Uint8Array {
  const { outline, shadow, plank, grain, highlight, post, postLight } = PALETTES.wood
  const s = FRAME_SIZE
  const b = FRAME_BORDER
  const rgba = blankRgba(s, s)
  const inCorner = (x: number, y: number) => (x < b || x >= s - b) && (y < b || y >= s - b)
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const horizontal = y < b || y >= s - b
      const vertical = x < b || x >= s - b
      if (!horizontal && !vertical) continue // transparent center: bed soil shows
      // Depth across the plank: 0 = outer edge … b-1 = inner edge.
      const depth = Math.min(x, y, s - 1 - x, s - 1 - y)
      let color: RGB
      if (depth === 0) color = outline
      else if (depth === b - 1) color = shadow // inner lip, casts onto the soil
      else if (inCorner(x, y)) color = depth === 1 ? postLight : post
      else if (depth === 1) color = highlight
      else {
        // Grain: dashed lines along the plank, repeating every 6 px of edge
        // length (FRAME_SIZE - 2 * FRAME_BORDER = 12 is a multiple of 6).
        const along = horizontal ? x : y
        const dash = depth === 2 ? along % 6 < 3 : depth === 4 ? (along + 3) % 6 < 3 : false
        color = dash ? grain : plank
      }
      setPixel(rgba, s, x, y, color)
    }
  }
  return rgba
}
