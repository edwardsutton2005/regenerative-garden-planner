import { describe, expect, it } from 'vitest'
import { cutOutBackground, findFigures, headCenter, layoutFrames, readingOrder } from './sprite-sheet.ts'

/** An RGB image whose background darkens smoothly left to right (like a
 * painted vignette), with rectangles drawn on top. */
function gradientImage(width: number, height: number, shapes: { box: [number, number, number, number]; outline: number; fill: number }[]) {
  const rgb = new Uint8Array(width * height * 3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const shade = 120 - Math.round((x / width) * 100) // 120 → 20, about 3 per pixel
      rgb.set([shade, Math.round(shade * 0.7), Math.round(shade * 0.3)], (y * width + x) * 3)
    }
  }
  for (const { box: [l, t, r, b], outline, fill } of shapes) {
    for (let y = t; y <= b; y++) {
      for (let x = l; x <= r; x++) {
        const edge = x === l || x === r || y === t || y === b
        const v = edge ? outline : fill
        rgb.set([v, v, v], (y * width + x) * 3)
      }
    }
  }
  return rgb
}

describe('cutOutBackground', () => {
  it('removes a smoothly shaded background up to a figure outline, even where the background is as dark as the outline', () => {
    // Background runs from 120 down to about 20; the outline is 10.
    const rgb = gradientImage(40, 10, [{ box: [30, 2, 37, 7], outline: 10, fill: 200 }])
    const alpha = cutOutBackground(rgb, 40, 10, 12)
    expect(alpha[0]).toBe(0)
    expect(alpha[5 * 40 + 39]).toBe(0) // darkest background, beside the figure
    expect(alpha[2 * 40 + 30]).toBe(255) // outline
    expect(alpha[4 * 40 + 33]).toBe(255) // fill inside the outline
  })
})

describe('findFigures', () => {
  it('finds each figure, merges nearby specks into it, and drops stray ones', () => {
    const w = 30
    const h = 12
    const alpha = new Uint8Array(w * h)
    const fill = (l: number, t: number, r: number, b: number) => {
      for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) alpha[y * w + x] = 255
    }
    fill(2, 2, 7, 9) // figure A
    fill(15, 1, 22, 10) // figure B
    alpha[2 * w + 9] = 255 // a speck just right of A: merged
    alpha[11 * w + 28] = 255 // a stray speck far from both: dropped

    const { figures, owner } = findFigures(alpha, w, h, 10, 3)
    const [a, b] = [...figures].sort((p, q) => p.left - q.left)
    expect(a).toMatchObject({ left: 2, top: 2, right: 9, bottom: 9 })
    expect(b).toMatchObject({ left: 15, top: 1, right: 22, bottom: 10 })
    expect(owner[2 * w + 9]).toBe(a.id) // the merged speck belongs to A
    expect(owner[11 * w + 28]).toBe(-1) // the dropped speck belongs to no one
  })
})

describe('readingOrder', () => {
  it('orders figures row by row, left to right, despite drifting a little between cells', () => {
    const box = (left: number, top: number) => ({ left, top, right: left + 10, bottom: top + 20 })
    const shuffled = [box(40, 52), box(1, 3), box(42, 0), box(0, 50)]
    expect(readingOrder(shuffled, 2)).toEqual([box(1, 3), box(42, 0), box(0, 50), box(40, 52)])
  })
})

describe('headCenter and layoutFrames', () => {
  it('puts every figure head over one vertical line and every pair of feet on one baseline', () => {
    const w = 20
    const alpha = new Uint8Array(w * 20)
    // A figure whose head is at x 4–6 but whose stride sticks out to x 12.
    for (let y = 0; y < 4; y++) for (let x = 4; x <= 6; x++) alpha[y * w + x] = 255
    for (let x = 2; x <= 12; x++) alpha[9 * w + x] = 255
    const striding = { left: 2, top: 0, right: 12, bottom: 9 }
    expect(headCenter(alpha, w, striding)).toBe(5)

    const short = { left: 0, top: 0, right: 4, bottom: 5 } // head center 2
    const layout = layoutFrames([striding, short], [5, 2], 1)
    expect(layout.anchorX).toBe(8) // the stride reaches 7 right of the head, plus padding
    expect(layout.baseline).toBe(10)
    // Head centers land on the anchor and feet on the baseline.
    expect(layout.offsets[0].x + (5 - striding.left)).toBe(layout.anchorX)
    expect(layout.offsets[1].x + (2 - short.left)).toBe(layout.anchorX)
    expect(layout.offsets[0].y + (striding.bottom - striding.top)).toBe(layout.baseline)
    expect(layout.offsets[1].y + (short.bottom - short.top)).toBe(layout.baseline)
  })
})
