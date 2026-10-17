import type { BedRect, GardenState, Position } from '../domain/garden'

// Conversion between rendering/input space (pixels, pointer events) and
// physical garden space (inches). UI-only: nothing here is stored. See
// ARCHITECTURE.md "Coordinate Spaces and the Canvas".

/** The canvas's on-screen rectangle, read at event time (a DOMRect fits). */
export type CanvasBox = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>

/**
 * A client-space pointer position → continuous inches, clamped to the
 * garden's closed bounds [0, width] × [0, height]. Closed because bed edges
 * may lie on the far edge; plant positions additionally go through
 * toPlantPosition.
 */
export function clientToGarden(
  clientX: number,
  clientY: number,
  box: CanvasBox,
  garden: GardenState,
): Position {
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max)
  return {
    x: clamp(((clientX - box.left) / box.width) * garden.width, garden.width),
    y: clamp(((clientY - box.top) / box.height) * garden.height, garden.height),
  }
}

/** The largest whole number strictly less than `size`. */
function largestWholeInchBelow(size: number): number {
  return Math.ceil(size) - 1
}

/**
 * Plant input precision: the nearest whole inch that is a valid position.
 * The domain range is half-open (0 ≤ x < width), so a value that would round
 * onto the excluded far edge lands on the largest whole inch strictly inside
 * it. This quantizes input only; it does not change the garden's bounds or
 * what the domain accepts.
 */
export function toPlantPosition(position: Position, garden: GardenState): Position {
  const quantize = (v: number, size: number) =>
    Math.min(Math.max(Math.round(v), 0), largestWholeInchBelow(size))
  return { x: quantize(position.x, garden.width), y: quantize(position.y, garden.height) }
}

export function snapTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/** CSS position of a point, as percentages of the garden's size. */
export function percentPoint(garden: GardenState, position: Position) {
  return {
    left: `${(position.x / garden.width) * 100}%`,
    top: `${(position.y / garden.height) * 100}%`,
  }
}

/** CSS box of a rectangle, as percentages of the garden's size. */
export function percentRect(garden: GardenState, rect: BedRect) {
  return {
    ...percentPoint(garden, rect.position),
    width: `${(rect.width / garden.width) * 100}%`,
    height: `${(rect.height / garden.height) * 100}%`,
  }
}

/**
 * CSS box of a circle centered on a point. The canvas's aspect ratio matches
 * the garden, so equal percentages of width and height stay a circle.
 */
export function percentCircle(garden: GardenState, center: Position, radius: number) {
  return percentRect(garden, {
    position: { x: center.x - radius, y: center.y - radius },
    width: radius * 2,
    height: radius * 2,
  })
}

/** Round lengths a scale bar can show, in inches. */
const SCALE_BAR_LENGTHS = [1, 3, 6, 12, 24, 36, 60, 120, 240, 600, 1200]

/**
 * The longest round length whose bar fits within `maxPx` at this on-screen
 * scale (or the shortest, if none fits), in inches.
 */
export function scaleBarLength(pxPerInch: number, maxPx: number): number {
  return SCALE_BAR_LENGTHS.findLast((inches) => inches * pxPerInch <= maxPx) ?? SCALE_BAR_LENGTHS[0]
}
