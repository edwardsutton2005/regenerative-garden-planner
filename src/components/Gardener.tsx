import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { GardenState, Position } from '../domain/garden'
import { getPlacement } from '../domain/garden'
import type { Plant } from '../domain/plant'
import type { PlantRelationshipRule } from '../domain/relationships'
import { GARDENER_SHEET } from './artAssets'
import { clientToGarden, percentPoint } from './canvasGeometry'
import { findPath, isWalkable, nearestWalkable, randomWalkable, reactionTo, walkGrid } from './gardenerPath'
import type { Reaction, WalkGrid } from './gardenerPath'

/** The gardener's width in garden inches (about an adult's shoulders, or
 * the hat's brim), so it scales with the garden. Plant sprites, by
 * contrast, keep a fixed on-screen size. */
const GARDENER_WIDTH_IN = 20
/** Walking speed, inches per second: an unhurried stroll. */
const WALK_SPEED = 30
/** Speed of the hop off a bed after being dropped on one. */
const HOP_SPEED = 140
const IDLE_MS: [number, number] = [3000, 8000]
/** How far beside a plant the gardener kneels, in inches. */
const KNEEL_OFFSET = 14

const SHEET_URL = `${import.meta.env.BASE_URL}art/characters/gardener.png`
// Sheet rows (art/STYLE.md "Character: the Gardener").
const ROW = { walkDown: 0, walkUp: 1, walkLeft: 2, idle: 3, kneel: 4, react: 5 }

type Facing = 'down' | 'up' | 'left' | 'right'
type Action =
  | { kind: 'idle'; until: number }
  | { kind: 'walk'; path: Position[]; speed: number; kneelBy?: string }
  | { kind: 'kneel'; started: number; placementId: string }
  | { kind: 'stand'; started: number }
  | { kind: 'react'; reaction: Reaction; started: number }
  | { kind: 'drag'; pointerId: number; offset: Position }

type Sim = { position: Position; facing: Facing; action: Action; walked: number }

type GardenerProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  rules: PlantRelationshipRule[]
  canvasRef: RefObject<HTMLDivElement | null>
  /** The selected plant: the gardener walks over and kneels beside it. */
  selectedPlacementId: string | null
  /** The plants just placed or moved, to react to. */
  lastPlacementIds: string[]
  /** Whether it can be dragged. Off while a tool (planting, painting,
   * drawing beds) owns clicks on the canvas. */
  draggable: boolean
}

const idleFor = (now: number): Action => ({
  kind: 'idle',
  until: now + IDLE_MS[0] + Math.random() * (IDLE_MS[1] - IDLE_MS[0]),
})

/**
 * A decorative gardener who wanders the open ground, steps around beds,
 * kneels beside the selected plant, and reacts to new placements. Not part
 * of the garden: never saved and never an input to reasoning. It moves in
 * an animation loop that writes styles directly, so walking doesn't
 * re-render the canvas. Drawn below the plants, so it never blocks them.
 */
function Gardener({
  garden,
  plantsById,
  rules,
  canvasRef,
  selectedPlacementId,
  lastPlacementIds,
  draggable,
}: GardenerProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const spriteRef = useRef<HTMLDivElement>(null)
  const gardenRef = useRef(garden)
  const gridRef = useRef<WalkGrid>(walkGrid(garden))
  const simRef = useRef<Sim | null>(null)
  const reducedMotion = useRef(
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  // The walking grid follows the garden; a new bed under the gardener sends
  // it hopping off.
  useEffect(() => {
    gardenRef.current = garden
    const grid = walkGrid(garden)
    gridRef.current = grid
    const sim = simRef.current
    if (!sim) {
      const start = randomWalkable(grid)
      if (start) simRef.current = { position: start, facing: 'down', action: idleFor(performance.now()), walked: 0 }
      return
    }
    if (sim.action.kind !== 'drag' && sim.action.kind !== 'walk' && !isWalkable(grid, sim.position)) {
      const spot = nearestWalkable(grid, sim.position)
      if (spot) sim.action = { kind: 'walk', path: [spot], speed: HOP_SPEED }
    }
  }, [garden])

  // Selecting a plant sends the gardener to kneel beside it; deselecting
  // stands it back up.
  useEffect(() => {
    const sim = simRef.current
    if (!sim || sim.action.kind === 'drag') return
    const placement = selectedPlacementId ? getPlacement(gardenRef.current, selectedPlacementId) : undefined
    if (!placement) {
      if (sim.action.kind === 'kneel') sim.action = { kind: 'stand', started: performance.now() }
      else if (sim.action.kind === 'walk' && sim.action.kneelBy) sim.action = idleFor(performance.now())
      return
    }
    if (reducedMotion.current) return
    const side = sim.position.x < placement.position.x ? -1 : 1
    const grid = gridRef.current
    const spot = nearestWalkable(grid, {
      x: placement.position.x + side * KNEEL_OFFSET,
      y: placement.position.y + 4,
    })
    const path = spot && findPath(grid, sim.position, spot)
    if (path) sim.action = { kind: 'walk', path, speed: WALK_SPEED, kneelBy: placement.id }
  }, [selectedPlacementId])

  // A new placement or move gets a reaction, from the domain's findings.
  useEffect(() => {
    const sim = simRef.current
    if (!sim || reducedMotion.current || sim.action.kind === 'drag' || sim.action.kind === 'kneel') return
    const reaction = reactionTo(gardenRef.current, lastPlacementIds, plantsById, rules)
    if (reaction) sim.action = { kind: 'react', reaction, started: performance.now() }
  }, [lastPlacementIds, plantsById, rules])

  // The animation loop.
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const sim = simRef.current
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (sim) {
        step(sim, gridRef.current, now, dt, reducedMotion.current)
        draw(sim, gardenRef.current, now, elRef.current, spriteRef.current)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  function pointerPosition(e: ReactPointerEvent): Position {
    return clientToGarden(e.clientX, e.clientY, canvasRef.current!.getBoundingClientRect(), gardenRef.current)
  }

  const { frameWidth, frameHeight, anchorX, baseline, referenceWidth, columns, rows } = GARDENER_SHEET
  return (
    <div
      ref={elRef}
      className={`gardener${draggable ? ' gardener--draggable' : ''}`}
      aria-hidden="true"
      style={{
        // One frame's box, scaled so the figure is GARDENER_WIDTH_IN wide,
        // positioned so the feet sit on the gardener's position.
        width: `calc(var(--in) * ${(GARDENER_WIDTH_IN * frameWidth) / referenceWidth})`,
        aspectRatio: `${frameWidth} / ${frameHeight}`,
        translate: `${(-anchorX / frameWidth) * 100}% ${(-baseline / frameHeight) * 100}%`,
        display: 'none',
      }}
      onPointerDown={(e) => {
        const sim = simRef.current
        if (!draggable || !sim || e.button !== 0) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        const p = pointerPosition(e)
        sim.action = {
          kind: 'drag',
          pointerId: e.pointerId,
          offset: { x: p.x - sim.position.x, y: p.y - sim.position.y },
        }
      }}
      onPointerMove={(e) => {
        const sim = simRef.current
        if (sim?.action.kind !== 'drag' || sim.action.pointerId !== e.pointerId) return
        const p = pointerPosition(e)
        const g = gardenRef.current
        sim.position = {
          x: Math.min(Math.max(p.x - sim.action.offset.x, 0), g.width),
          y: Math.min(Math.max(p.y - sim.action.offset.y, 0), g.height),
        }
      }}
      onPointerUp={(e) => drop(e.pointerId)}
      onPointerCancel={(e) => drop(e.pointerId)}
      onLostPointerCapture={(e) => drop(e.pointerId)}
      // A click on the gardener isn't a click on the garden.
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={spriteRef}
        className="gardener__sprite"
        style={{
          backgroundImage: `url(${SHEET_URL})`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
        }}
      />
    </div>
  )

  function drop(pointerId: number) {
    const sim = simRef.current
    if (sim?.action.kind !== 'drag' || sim.action.pointerId !== pointerId) return
    const grid = gridRef.current
    const spot = nearestWalkable(grid, sim.position)
    sim.action =
      spot && spot !== sim.position
        ? { kind: 'walk', path: [spot], speed: HOP_SPEED }
        : idleFor(performance.now())
  }
}

/** Advances the gardener by one animation frame. */
function step(sim: Sim, grid: WalkGrid, now: number, dt: number, reducedMotion: boolean) {
  const action = sim.action
  switch (action.kind) {
    case 'idle': {
      if (reducedMotion || now < action.until) return
      const target = randomWalkable(grid)
      const path = target && findPath(grid, sim.position, target)
      sim.action = path ? { kind: 'walk', path, speed: WALK_SPEED } : idleFor(now)
      return
    }
    case 'walk': {
      let budget = action.speed * dt
      while (budget > 0 && action.path.length) {
        const target = action.path[0]
        const dx = target.x - sim.position.x
        const dy = target.y - sim.position.y
        const distance = Math.hypot(dx, dy)
        if (distance > 0.01) {
          sim.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'
        }
        if (distance <= budget) {
          sim.position = target
          action.path.shift()
          budget -= distance
        } else {
          sim.position = { x: sim.position.x + (dx / distance) * budget, y: sim.position.y + (dy / distance) * budget }
          budget = 0
        }
      }
      sim.walked += action.speed * dt
      if (!action.path.length) {
        sim.facing = 'down'
        sim.action = action.kneelBy
          ? { kind: 'kneel', started: now, placementId: action.kneelBy }
          : idleFor(now)
      }
      return
    }
    case 'stand':
      if (now - action.started > 300) sim.action = idleFor(now)
      return
    case 'react':
      if (now - action.started > 1400) sim.action = idleFor(now)
      return
    case 'kneel':
    case 'drag':
      return
  }
}

/** Which sheet frame shows now: [row, column, mirrored]. */
function frameOf(sim: Sim, now: number): [number, number, boolean] {
  const action = sim.action
  switch (action.kind) {
    case 'walk': {
      // Four frames per 40 inches walked, so the feet keep pace.
      const column = Math.floor(sim.walked / 10) % 4
      if (sim.facing === 'up') return [ROW.walkUp, column, false]
      if (sim.facing === 'down') return [ROW.walkDown, column, false]
      return [ROW.walkLeft, column, sim.facing === 'right']
    }
    case 'kneel': {
      const t = now - action.started
      return [ROW.kneel, t < 180 ? 0 : t < 360 ? 1 : 2, false]
    }
    case 'stand':
      return [ROW.kneel, 3, false]
    case 'react': {
      const t = now - action.started
      return action.reaction === 'happy'
        ? [ROW.react, Math.floor(t / 180) % 2, false]
        : [ROW.react, 2 + (Math.floor(t / 400) % 2), false]
    }
    case 'drag':
      return [ROW.react, 0, false]
    case 'idle': {
      // Mostly still, a slow breath, and a blink every few seconds.
      const beat = Math.floor(now / 500)
      return [ROW.idle, beat % 9 === 8 ? 1 : beat % 4 === 3 ? 2 : 0, false]
    }
  }
}

/** Writes the gardener's position and frame to the page. */
function draw(sim: Sim, garden: GardenState, now: number, el: HTMLDivElement | null, sprite: HTMLDivElement | null) {
  if (!el || !sprite) return
  const { left, top } = percentPoint(garden, sim.position)
  el.style.display = ''
  el.style.left = left
  el.style.top = top
  const [row, column, mirrored] = frameOf(sim, now)
  const { columns, rows } = GARDENER_SHEET
  sprite.style.backgroundPosition = `${(column / (columns - 1)) * 100}% ${(row / (rows - 1)) * 100}%`
  sprite.style.transform = mirrored ? 'scaleX(-1)' : ''
}

export default Gardener
