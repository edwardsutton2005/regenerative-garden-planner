// Turns a generated candidate's flat key-color background (see BACKGROUND in
// plant-art-config.ts) into real transparency. Post-processing only: kept
// separate from generation so either can change independently.
//
// Usage (for candidates already on disk):
//   npm run art:transparent -- basil sunflower
//   npm run art:transparent -- basil --force      (rebuild existing outputs)
//
// Method, chosen for flat-background pixel art with dark outlines:
//   1. Flood-fill from the image border through pixels close to the key
//      color. Only background connected to the edge is removed, so a
//      key-like color *inside* the subject is never cut.
//   2. Remove enclosed pockets: pixels very close to the key color anywhere
//      (gaps between leaves the border fill can't reach). A tighter
//      tolerance than step 1, so pinkish subject colors survive.
//   3. Remove key-tinted smears connected to the background: light pixels
//      whose red and blue both clearly exceed green (a magenta cast), spreading
//      out from removed pixels. Catches blurred, half-rendered patches the
//      model sometimes leaves at an edge, without touching enclosed colors.
//   4. Remove the remaining fringe: pixels touching the removed area that
//      are still fairly close to the key color (JPEG smears the key into
//      edge pixels). Dark outlines are far from magenta, so they survive.
//   5. Defringe: an edge pixel noticeably more key-tinted than the subject
//      pixel just inside it takes that inner color, removing the one-pixel
//      purple/red line JPEG leaves along outlines without moving the edge.

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'

export type KeyOptions = {
  /** Key color as [r, g, b]. */
  key: [number, number, number]
  /** Max RGB distance from the key for flood-filled background. */
  backgroundTolerance: number
  /** Max RGB distance from the key for enclosed pockets (not connected to
   * the border). Tighter, so pinkish subject colors are kept. */
  pocketTolerance: number
  /** How far both red and blue must exceed green for a pixel connected to
   * the background to count as a key-tinted smear. Null disables. Tuned for
   * a magenta key; red-purple subjects (e.g. red cabbage) need it off. */
  tintMargin: number | null
  /** Max RGB distance from the key for edge fringe pixels. */
  fringeTolerance: number
  /** How many pixels deep to clean the fringe. */
  fringePasses: number
  /** How much more key-tinted (in RGB distance) an edge pixel must be than
   * its inner neighbor to take the neighbor's color. */
  defringeMargin: number
}

export const DEFAULT_KEY_OPTIONS: KeyOptions = {
  key: [255, 0, 255],
  backgroundTolerance: 110,
  pocketTolerance: 70,
  tintMargin: 40,
  fringeTolerance: 190,
  fringePasses: 2,
  defringeMargin: 30,
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Pure keying on raw pixels: RGB (3 channels) in, RGBA (4 channels) out.
 * Removed pixels become fully transparent; everything else is opaque.
 */
export function keyOutBackground(
  rgb: Uint8Array,
  width: number,
  height: number,
  options: KeyOptions = DEFAULT_KEY_OPTIONS,
): { rgba: Uint8Array; removedFraction: number } {
  const count = width * height
  const [kr, kg, kb] = options.key
  const distance = (i: number) =>
    Math.hypot(rgb[i * 3] - kr, rgb[i * 3 + 1] - kg, rgb[i * 3 + 2] - kb)

  const removed = new Uint8Array(count)
  const neighbors = (i: number) => {
    const x = i % width
    const out: number[] = []
    if (x > 0) out.push(i - 1)
    if (x < width - 1) out.push(i + 1)
    if (i >= width) out.push(i - width)
    if (i < count - width) out.push(i + width)
    return out
  }

  // 1. Flood fill from every border pixel that looks like the key.
  const stack: number[] = []
  for (let x = 0; x < width; x++) stack.push(x, count - width + x)
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1)
  while (stack.length > 0) {
    const i = stack.pop()!
    if (removed[i] || distance(i) > options.backgroundTolerance) continue
    removed[i] = 1
    for (const n of neighbors(i)) if (!removed[n]) stack.push(n)
  }

  // 2. Enclosed pockets of near-pure key color.
  for (let i = 0; i < count; i++) {
    if (!removed[i] && distance(i) <= options.pocketTolerance) removed[i] = 1
  }

  // 3. Key-tinted smears connected to removed background.
  if (options.tintMargin !== null) {
    const margin = options.tintMargin
    // Smears are light, blurred pinks; dark purple outline blends are left
    // for the defringe step, which recolors rather than cuts them.
    const tinted = (i: number) => {
      const [r, g, b] = [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]
      return Math.min(r, b) - g > margin && Math.max(r, b) >= 130
    }
    const smear: number[] = []
    for (let i = 0; i < count; i++) if (removed[i]) smear.push(i)
    while (smear.length > 0) {
      const i = smear.pop()!
      for (const n of neighbors(i)) {
        if (!removed[n] && tinted(n)) {
          removed[n] = 1
          smear.push(n)
        }
      }
    }
  }

  // 4. Fringe: key-tinted pixels touching removed background.
  for (let pass = 0; pass < options.fringePasses; pass++) {
    const fringe: number[] = []
    for (let i = 0; i < count; i++) {
      if (removed[i] || distance(i) > options.fringeTolerance) continue
      if (neighbors(i).some((n) => removed[n])) fringe.push(i)
    }
    for (const i of fringe) removed[i] = 1
  }

  const rgba = new Uint8Array(count * 4)
  let removedCount = 0
  for (let i = 0; i < count; i++) {
    rgba[i * 4] = rgb[i * 3]
    rgba[i * 4 + 1] = rgb[i * 3 + 1]
    rgba[i * 4 + 2] = rgb[i * 3 + 2]
    rgba[i * 4 + 3] = removed[i] ? 0 : 255
    removedCount += removed[i]
  }

  // 5. Defringe edge pixels from their least key-tinted inner neighbor.
  const isEdge = (i: number) => !removed[i] && neighbors(i).some((n) => removed[n])
  for (let i = 0; i < count; i++) {
    if (!isEdge(i)) continue
    let best = -1
    for (const n of neighbors(i)) {
      if (removed[n] || isEdge(n)) continue
      if (best < 0 || distance(n) > distance(best)) best = n
    }
    if (best >= 0 && distance(best) - distance(i) > options.defringeMargin) {
      rgba[i * 4] = rgb[best * 3]
      rgba[i * 4 + 1] = rgb[best * 3 + 1]
      rgba[i * 4 + 2] = rgb[best * 3 + 2]
    }
  }
  return { rgba, removedFraction: removedCount / count }
}

/** The transparent output's path for a raw candidate path. */
export function transparentPathFor(rawPath: string): string {
  return rawPath.replace(/\.[^.]+$/, '-transparent.png')
}

/** Reads a candidate image, keys out its background, and writes a PNG. */
export async function makeTransparent(
  inputPath: string,
  outputPath: string,
  options: KeyOptions = DEFAULT_KEY_OPTIONS,
): Promise<{ removedFraction: number; warning?: string }> {
  const { data, info } = await sharp(inputPath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { rgba, removedFraction } = keyOutBackground(
    new Uint8Array(data.buffer, data.byteOffset, data.length),
    info.width,
    info.height,
    options,
  )
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outputPath)

  // A background share far outside the usual range suggests the key color
  // wasn't flat or the subject touches the edges; worth a manual look.
  const warning =
    removedFraction < 0.15
      ? `only ${(removedFraction * 100).toFixed(0)}% removed: background may not be flat key color`
      : removedFraction > 0.9
        ? `${(removedFraction * 100).toFixed(0)}% removed: subject may have been cut`
        : undefined
  return { removedFraction, warning }
}

// --- CLI: process existing candidates ---------------------------------------

const CANDIDATES_DIR = 'art/candidates'
const RAW_CANDIDATE = /^(.+-(plant|icon)(-\d+)?)\.(jpg|jpeg|png|webp)$/

async function main(argv: string[]) {
  const force = argv.includes('--force')
  const plantIds = argv.filter((a) => !a.startsWith('--'))
  if (plantIds.length === 0) {
    console.error('\n✖ Name the plants to process, e.g. "npm run art:transparent -- basil sunflower".\n')
    process.exit(1)
  }

  for (const plantId of plantIds) {
    const dir = join(CANDIDATES_DIR, plantId)
    if (!existsSync(dir)) {
      console.log(`• ${plantId}: no candidates in ${dir}`)
      continue
    }
    const raws = readdirSync(dir)
      .filter((f) => RAW_CANDIDATE.test(f) && !f.endsWith('-transparent.png'))
      .sort()
    for (const file of raws) {
      const input = join(dir, file)
      const output = transparentPathFor(input)
      if (existsSync(output) && !force) {
        console.log(`• ${output} exists (use --force to rebuild)`)
        continue
      }
      const { removedFraction, warning } = await makeTransparent(input, output)
      console.log(
        `• ${output} (${(removedFraction * 100).toFixed(0)}% background removed)${warning ? `\n    ⚠ ${warning}` : ''}`,
      )
    }
  }
}

// Run as a CLI only when executed directly, not when imported by the generator.
if (import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2))
