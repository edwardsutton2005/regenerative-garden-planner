// Cleans up a generated character sprite sheet so it can be animated:
// removes a painted background, finds each figure, and re-packs the figures
// into an even grid. Generators rarely keep to their own grid (figures drift
// a few pixels between cells, or cross into the next row), and a drifting
// frame makes a walk cycle wobble. Pure functions on raw pixels; build-art.ts
// does the file input and output.

export type Box = { left: number; top: number; right: number; bottom: number }

/**
 * Background removal for a painted, gradually shaded background (ChatGPT
 * ignores a flat key color). Flood-fills from the image border, stepping
 * only between neighboring pixels whose colors differ by less than `step`:
 * the background changes gradually, while a figure's dark outline is a sharp
 * jump, so the fill stops there. RGB in, one alpha byte per pixel out
 * (0 background, 255 figure).
 */
export function cutOutBackground(rgb: Uint8Array, width: number, height: number, step: number): Uint8Array {
  const count = width * height
  const background = new Uint8Array(count)
  const stack: number[] = []
  const seed = (i: number) => {
    if (!background[i]) {
      background[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < width; x++) {
    seed(x)
    seed((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    seed(y * width)
    seed(y * width + width - 1)
  }
  const close = (a: number, b: number) =>
    Math.hypot(rgb[a * 3] - rgb[b * 3], rgb[a * 3 + 1] - rgb[b * 3 + 1], rgb[a * 3 + 2] - rgb[b * 3 + 2]) < step
  while (stack.length) {
    const i = stack.pop()!
    const x = i % width
    if (x > 0 && close(i, i - 1)) seed(i - 1)
    if (x < width - 1 && close(i, i + 1)) seed(i + 1)
    if (i >= width && close(i, i - width)) seed(i - width)
    if (i < count - width && close(i, i + width)) seed(i + width)
  }
  const alpha = new Uint8Array(count)
  for (let i = 0; i < count; i++) alpha[i] = background[i] ? 0 : 255
  return alpha
}

export type Figure = Box & { id: number }

/**
 * The figures: connected opaque regions (touching diagonally counts) of at
 * least `minPixels`, with their bounding boxes. Smaller specks are merged
 * into a figure whose box (grown by `reach`) contains them, or dropped.
 * `owner` gives each pixel's figure id (-1 for none), since one figure's box
 * can overlap a neighbor's pixels.
 */
export function findFigures(
  alpha: Uint8Array,
  width: number,
  height: number,
  minPixels: number,
  reach = 6,
): { figures: Figure[]; owner: Int32Array } {
  const label = new Int32Array(width * height).fill(-1)
  const regions: { box: Box; pixels: number }[] = []
  for (let start = 0; start < alpha.length; start++) {
    if (!alpha[start] || label[start] !== -1) continue
    const id = regions.length
    const box = { left: width, top: height, right: -1, bottom: -1 }
    let pixels = 0
    const stack = [start]
    label[start] = id
    while (stack.length) {
      const i = stack.pop()!
      const x = i % width
      const y = (i - x) / width
      pixels++
      box.left = Math.min(box.left, x)
      box.right = Math.max(box.right, x)
      box.top = Math.min(box.top, y)
      box.bottom = Math.max(box.bottom, y)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const j = ny * width + nx
          if (alpha[j] && label[j] === -1) {
            label[j] = id
            stack.push(j)
          }
        }
      }
    }
    regions.push({ box, pixels })
  }

  // Region id → figure id (its own id for a figure, its owner's for a merged
  // speck, -1 for a dropped one).
  const regionToFigure = regions.map((r, id) => (r.pixels >= minPixels ? id : -1))
  const figures: Figure[] = regions.flatMap((r, id) => (r.pixels >= minPixels ? [{ ...r.box, id }] : []))
  for (const [id, speck] of regions.entries()) {
    if (speck.pixels >= minPixels) continue
    const owner = figures.find(
      (f) =>
        speck.box.left >= f.left - reach &&
        speck.box.right <= f.right + reach &&
        speck.box.top >= f.top - reach &&
        speck.box.bottom <= f.bottom + reach,
    )
    if (!owner) continue
    regionToFigure[id] = owner.id
    owner.left = Math.min(owner.left, speck.box.left)
    owner.right = Math.max(owner.right, speck.box.right)
    owner.top = Math.min(owner.top, speck.box.top)
    owner.bottom = Math.max(owner.bottom, speck.box.bottom)
  }
  const owner = label.map((region) => (region === -1 ? -1 : regionToFigure[region]))
  return { figures, owner }
}

/** Figures in reading order: grouped into rows of `columns` by vertical
 * center, then left to right. */
export function readingOrder<T extends Box>(figures: T[], columns: number): T[] {
  const byY = [...figures].sort((a, b) => a.top + a.bottom - (b.top + b.bottom))
  const rows: T[] = []
  for (let i = 0; i < byY.length; i += columns) {
    rows.push(...byY.slice(i, i + columns).sort((a, b) => a.left - b.left))
  }
  return rows
}

/**
 * A figure's horizontal anchor: the center of its top `share` (hat and
 * head). Steadier than the box center, which shifts with every stride.
 */
export function headCenter(alpha: Uint8Array, width: number, box: Box, share = 0.35): number {
  const bottom = box.top + Math.round((box.bottom - box.top) * share)
  let left = box.right
  let right = box.left
  for (let y = box.top; y <= bottom; y++) {
    for (let x = box.left; x <= box.right; x++) {
      if (alpha[y * width + x]) {
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
    }
  }
  return (left + right) / 2
}

export type FrameLayout = {
  frameWidth: number
  frameHeight: number
  /** Where each figure's head center sits, in pixels from the frame's left. */
  anchorX: number
  /** Where each figure's feet sit, in pixels from the frame's top. */
  baseline: number
  /** Per figure: where its box's top-left goes inside its frame. */
  offsets: { x: number; y: number }[]
}

/**
 * One frame size for every figure, with each figure's head center on the
 * same vertical line and its feet on the same baseline, `pad` pixels clear
 * of the frame's edges.
 */
export function layoutFrames(figures: Box[], anchors: number[], pad: number): FrameLayout {
  let leftReach = 0
  let rightReach = 0
  let tallest = 0
  figures.forEach((f, i) => {
    leftReach = Math.max(leftReach, anchors[i] - f.left)
    rightReach = Math.max(rightReach, f.right - anchors[i])
    tallest = Math.max(tallest, f.bottom - f.top)
  })
  const anchorX = Math.ceil(Math.max(leftReach, rightReach)) + pad
  const baseline = tallest + pad
  return {
    frameWidth: anchorX * 2 + 1,
    frameHeight: baseline + pad + 1,
    anchorX,
    baseline,
    offsets: figures.map((f, i) => ({
      x: Math.round(anchorX - (anchors[i] - f.left)),
      y: baseline - (f.bottom - f.top),
    })),
  }
}
