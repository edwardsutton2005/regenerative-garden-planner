// Builds the app's art from the approved masters and the code-generated
// textures. Output is small and committed; masters stay in art/.
//
//   npm run art:build
//
// Writes:
//   public/art/plants/<plant-id>.png    canvas sprites (trimmed, 128 px)
//   public/art/icons/<plant-id>.png     inventory/catalog icons (trimmed, 128 px)
//   public/art/textures/*.png           soil, bed soil, grass (code-generated),
//                                       bed frame (from the approved plank art)
//   public/art/characters/gardener.png  the gardener's animation frames, re-packed
//                                       into an even grid (see sprite-sheet.ts)
//   src/components/artAssets.ts         which plants have art, and the gardener
//                                       sheet's layout (generated)

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { cutOutBackground, findFigures, headCenter, layoutFrames, readingOrder } from './sprite-sheet.ts'
import { PALETTES, TILE_SIZE, groundTile, seamlessStrip } from './textures.ts'

const MANIFEST = 'art/approved/manifest.json'
const OUT = 'public/art'
const GENERATED_MODULE = 'src/components/artAssets.ts'
/** App sprite/icon size: about 3× the 44 px display size, for sharp
 * rendering on high-density screens. */
const ASSET_SIZE = 128
/** Bed board thickness in the frame image: the plank art's own pixel grid
 * (about 5.6 source pixels per art pixel), so it renders crisp. The CSS
 * border-image slice must match. */
const BED_BOARD = 24
/** Source columns cross-faded to hide the plank's repeat joint. */
const PLANK_BLEND = 60
/** The gardener sheet: its grid (art/STYLE.md "Character: the Gardener"),
 * the background-removal step (see cutOutBackground; higher values leak
 * into figures with outline gaps), the smallest region counted as a figure,
 * and padding around each frame. */
const GARDENER = { columns: 4, rows: 6, backgroundStep: 8, minFigurePixels: 2000, pad: 4 }
/** The frame whose width the app treats as the gardener's width: idle,
 * facing the viewer (row 4, column 1). */
const GARDENER_REFERENCE_FRAME = 12

type Manifest = {
  plants: Record<string, { file: string }>
  icons: Record<string, { file: string }>
  bed: { plank: { file: string }; corner: { file: string } }
  characters: { gardener: { file: string } }
}

/** Trim transparent margins, then fit into a centered square. */
async function buildAsset(source: string, target: string) {
  await sharp(source)
    .trim()
    .resize(ASSET_SIZE, ASSET_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9, palette: true })
    .toFile(target)
}

async function writeRgba(rgba: Uint8Array, size: number, target: string) {
  await sharp(rgba, { raw: { width: size, height: size, channels: 4 } }).png({ compressionLevel: 9 }).toFile(target)
}

/**
 * The bed frame as a 9-slice image for CSS border-image: a seamless plank
 * section on each side (outer edge outward, so all sides match) and a post
 * in each corner, around a transparent center.
 */
async function buildBedFrame(plankFile: string, cornerFile: string, target: string) {
  const { data, info } = await sharp(plankFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const stripWidth = info.width - PLANK_BLEND
  const strip = seamlessStrip(new Uint8Array(data), info.width, info.height, PLANK_BLEND)
  const length = Math.round((stripWidth * BED_BOARD) / info.height)
  const top = await sharp(strip, { raw: { width: stripWidth, height: info.height, channels: 4 } })
    .resize(length, BED_BOARD, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer()
  const corner = await sharp(cornerFile).resize(BED_BOARD, BED_BOARD, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer()
  const far = BED_BOARD + length
  const size = far + BED_BOARD
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: top, left: BED_BOARD, top: 0 },
      { input: await sharp(top).flip().toBuffer(), left: BED_BOARD, top: far },
      { input: await sharp(top).rotate(270).toBuffer(), left: 0, top: BED_BOARD },
      { input: await sharp(top).rotate(90).toBuffer(), left: far, top: BED_BOARD },
      ...[[0, 0], [far, 0], [0, far], [far, far]].map(([left, y]) => ({ input: corner, left, top: y })),
    ])
    .png({ compressionLevel: 9 })
    .toFile(target)
}

/**
 * The gardener's frames, cut out of the painted background and re-packed
 * into an even grid, head centers on one line and feet on one baseline.
 * Returns the layout the app needs to place and scale a frame.
 */
async function buildGardenerSheet(source: string, target: string) {
  const { columns, rows } = GARDENER
  const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const rgb = new Uint8Array(data)
  const alpha = cutOutBackground(rgb, width, height, GARDENER.backgroundStep)
  const { figures: found, owner } = findFigures(alpha, width, height, GARDENER.minFigurePixels)
  if (found.length !== columns * rows) {
    throw new Error(`Gardener sheet: expected ${columns * rows} figures, found ${found.length}.`)
  }
  const figures = readingOrder(found, columns)
  const anchors = figures.map((f) => headCenter(alpha, width, f))
  const layout = layoutFrames(figures, anchors, GARDENER.pad)
  const sheetWidth = layout.frameWidth * columns
  const sheetHeight = layout.frameHeight * rows
  const sheet = new Uint8Array(sheetWidth * sheetHeight * 4)
  figures.forEach((figure, i) => {
    const frameLeft = (i % columns) * layout.frameWidth + layout.offsets[i].x
    const frameTop = Math.floor(i / columns) * layout.frameHeight + layout.offsets[i].y
    for (let y = figure.top; y <= figure.bottom; y++) {
      for (let x = figure.left; x <= figure.right; x++) {
        const from = y * width + x
        if (owner[from] !== figure.id) continue
        const to = ((frameTop + y - figure.top) * sheetWidth + frameLeft + x - figure.left) * 4
        sheet.set([rgb[from * 3], rgb[from * 3 + 1], rgb[from * 3 + 2], 255], to)
      }
    }
  })
  await sharp(sheet, { raw: { width: sheetWidth, height: sheetHeight, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(target)
  const reference = figures[GARDENER_REFERENCE_FRAME]
  return {
    columns,
    rows,
    frameWidth: layout.frameWidth,
    frameHeight: layout.frameHeight,
    anchorX: layout.anchorX,
    baseline: layout.baseline,
    referenceWidth: reference.right - reference.left + 1,
  }
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest

  // Rebuild from scratch, so a removed approval doesn't linger.
  rmSync(OUT, { recursive: true, force: true })
  for (const dir of ['plants', 'icons', 'textures', 'characters']) mkdirSync(join(OUT, dir), { recursive: true })

  for (const [kind, entries] of [['plants', manifest.plants], ['icons', manifest.icons]] as const) {
    for (const [id, { file }] of Object.entries(entries)) {
      await buildAsset(file, join(OUT, kind, `${id}.png`))
    }
    console.log(`• ${Object.keys(entries).length} ${kind}`)
  }

  await writeRgba(groundTile(PALETTES.soil, 11, 'speckles'), TILE_SIZE, join(OUT, 'textures', 'soil.png'))
  await writeRgba(groundTile(PALETTES.bedSoil, 23, 'speckles'), TILE_SIZE, join(OUT, 'textures', 'bed-soil.png'))
  await writeRgba(groundTile(PALETTES.grass, 37, 'blades'), TILE_SIZE, join(OUT, 'textures', 'grass.png'))
  await buildBedFrame(manifest.bed.plank.file, manifest.bed.corner.file, join(OUT, 'textures', 'bed-frame.png'))
  console.log('• 4 textures')

  const gardener = await buildGardenerSheet(
    manifest.characters.gardener.file,
    join(OUT, 'characters', 'gardener.png'),
  )
  console.log(`• gardener sheet (${gardener.frameWidth}×${gardener.frameHeight} frames)`)

  const ids = (entries: Record<string, unknown>) => JSON.stringify(Object.keys(entries).sort())
  writeFileSync(
    GENERATED_MODULE,
    `// Generated by scripts/build-art.ts (npm run art:build). Do not edit by hand.\n` +
      `// Which plants have approved art in public/art/; others fall back to the\n` +
      `// placeholder disc.\n\n` +
      `export const SPRITE_PLANT_IDS: ReadonlySet<string> = new Set(${ids(manifest.plants)})\n\n` +
      `export const ICON_PLANT_IDS: ReadonlySet<string> = new Set(${ids(manifest.icons)})\n\n` +
      `// The gardener sheet (public/art/characters/gardener.png): a grid of\n` +
      `// equal frames, in pixels. Each figure's head center is at anchorX and its\n` +
      `// feet at baseline; referenceWidth is the idle figure's width.\n` +
      `export const GARDENER_SHEET = ${JSON.stringify(gardener)} as const\n`,
  )
  console.log(`• ${GENERATED_MODULE}`)
}

await main()
