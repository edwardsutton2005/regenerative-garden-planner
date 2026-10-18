import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  ComponentProps,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import type { GardenState, PlacedPlant, Position } from '../domain/garden'
import { cellAt, getAllPlacements, getBedAt } from '../domain/garden'
import type { GardenIssue } from '../domain/issues'
import type { Plant } from '../domain/plant'
import { footprintRadius } from '../domain/plant'
import type { PlantRelationshipRule } from '../domain/relationships'
import { clientToGarden, percentCircle, percentPoint, percentRect, toPlantPosition } from './canvasGeometry'
import { PLANT_DRAG_MIME_TYPE, isPlantDragPayload } from './dragPayload'
import GardenBeds from './GardenBeds'
import Gardener from './Gardener'
import Icon from './Icon'
import { candidateFeedback, inspectedEnvelope } from './spacingPreview'
import type { DragCandidate } from './spacingPreview'
import { plantSpriteUrl } from './plantArt'
import { formatLength } from './units'

/** Pointer travel, in pixels, before a press on a plant becomes a drag. */
const DRAG_THRESHOLD_PX = 3

const ARROW_DELTAS: Record<string, Position> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

export type CanvasMode = 'select' | 'plant' | 'eraser' | 'sunlight' | 'beds'

type PlantDrag = {
  placementId: string
  plantId: string
  pointerId: number
  startClient: { x: number; y: number }
  /** Pointer position minus plant position at grab time, in inches, so the
   * grabbed point stays under the pointer. */
  offset: Position
  position: Position
  active: boolean
}

export type CanvasHighlight = { bedIds: string[]; placementIds: string[] }

type GardenCanvasProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  rules: PlantRelationshipRule[]
  mode: CanvasMode
  /** The selected (inspected) plant, if any. */
  selectedPlacementId: string | null
  /** The plant type currently being dragged from the inventory, for live
   * preview (the browser hides drag data until drop). */
  draggedPlantTypeId: string | null
  /** A click on empty canvas, at a whole-inch plant position. */
  onCanvasClick: (position: Position) => void
  onPlantClick: (placementId: string) => void
  onMovePlant: (placementId: string, position: Position) => void
  onRemovePlant: (placementId: string) => void
  onPlantTypeDrop: (plantId: string, position: Position) => void
  onPaint: (row: number, col: number) => void
  /** A sunlight stroke is starting (one undo step for the whole stroke). */
  onPaintStart: () => void
  /** Keyboard placement; returns the new placement id, to focus it. */
  onPlaceAtCenter: () => string | null
  /** Props for the planting-bed layers, minus garden and highlight. */
  beds: Omit<ComponentProps<typeof GardenBeds>, 'garden' | 'highlightedBedId' | 'glowBedIds'>
  /** The decorative gardener, or null when hidden. */
  gardener: { lastPlacementIds: string[] } | null
  /** Issues to mark on the garden, or null while the overlay is off. */
  issues: GardenIssue[] | null
  /** Beds and plants an inspector card points at; the rest is dimmed. */
  highlight: CanvasHighlight | null
}

/**
 * The garden as a continuous physical canvas. Everything is drawn in
 * percentages of the garden's size; pointer input converts to inches through
 * canvasGeometry at event time. Layers, bottom to top: ground and grid lines
 * (CSS background), beds, sunlight wash, spacing envelopes, the gardener,
 * plant markers, the selected bed's tab and handles. See ARCHITECTURE.md "Coordinate Spaces
 * and the Canvas".
 */
function GardenCanvas({
  garden,
  plantsById,
  rules,
  mode,
  selectedPlacementId,
  draggedPlantTypeId,
  onCanvasClick,
  onPlantClick,
  onMovePlant,
  onRemovePlant,
  onPlantTypeDrop,
  onPaint,
  onPaintStart,
  onPlaceAtCenter,
  beds,
  gardener,
  issues,
  highlight,
}: GardenCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [plantDrag, setPlantDrag] = useState<PlantDrag | null>(null)
  const [dropPreview, setDropPreview] = useState<Position | null>(null)
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)
  // A drag ends with a click event on the marker; it must not count as one.
  const suppressClickRef = useRef(false)
  // A press that starts on a plant and is released over empty ground fires
  // its click on the canvas; that must not place a plant or change the
  // selection there.
  const pressOnMarkerRef = useRef(false)
  // Last cell painted in the current sunlight stroke (null: not painting).
  const paintStrokeRef = useRef<string | null>(null)

  const plantsInteractive = mode === 'select' || mode === 'plant' || mode === 'eraser'
  // Moving existing plants is Select-only, so with a plant brush armed a
  // click on a plant has one meaning (inspect) and never starts a move.
  const plantsDraggable = mode === 'select'

  // Focus a plant just placed from the keyboard, once it has rendered.
  useEffect(() => {
    if (!pendingFocusId) return
    const marker = canvasRef.current?.querySelector<HTMLElement>(
      `[data-placement-id="${pendingFocusId}"]`,
    )
    if (marker) {
      marker.focus()
      setPendingFocusId(null)
    }
  }, [pendingFocusId, garden])

  function pointerToGarden(e: { clientX: number; clientY: number }): Position {
    return clientToGarden(e.clientX, e.clientY, canvasRef.current!.getBoundingClientRect(), garden)
  }

  // --- empty-canvas clicks and sunlight painting ---------------------------

  function handleCanvasClick(e: ReactMouseEvent) {
    if (pressOnMarkerRef.current) {
      pressOnMarkerRef.current = false
      return
    }
    onCanvasClick(toPlantPosition(pointerToGarden(e), garden))
  }

  function paintAt(e: ReactPointerEvent) {
    const cell = cellAt(garden, toPlantPosition(pointerToGarden(e), garden))
    if (!cell) return
    const key = `${cell.row},${cell.col}`
    if (key === paintStrokeRef.current) return
    paintStrokeRef.current = key
    onPaint(cell.row, cell.col)
  }

  // --- plant dragging (pointer events with capture) ------------------------

  function handleMarkerPointerDown(e: ReactPointerEvent, placement: PlacedPlant) {
    // A new press starts fresh, even if a previous drag ended without the
    // click event that would normally clear this.
    suppressClickRef.current = false
    pressOnMarkerRef.current = true
    if (!plantsDraggable || e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const pointer = pointerToGarden(e)
    setPlantDrag({
      placementId: placement.id,
      plantId: placement.plantId,
      pointerId: e.pointerId,
      startClient: { x: e.clientX, y: e.clientY },
      offset: { x: pointer.x - placement.position.x, y: pointer.y - placement.position.y },
      position: placement.position,
      active: false,
    })
  }

  function dragPosition(e: ReactPointerEvent, drag: PlantDrag): Position {
    const pointer = pointerToGarden(e)
    return toPlantPosition({ x: pointer.x - drag.offset.x, y: pointer.y - drag.offset.y }, garden)
  }

  function pastThreshold(e: ReactPointerEvent, drag: PlantDrag): boolean {
    const moved = Math.hypot(e.clientX - drag.startClient.x, e.clientY - drag.startClient.y)
    return moved >= DRAG_THRESHOLD_PX
  }

  function handleMarkerPointerMove(e: ReactPointerEvent) {
    if (!plantDrag || e.pointerId !== plantDrag.pointerId) return
    if (!plantDrag.active && !pastThreshold(e, plantDrag)) return
    const position = dragPosition(e, plantDrag)
    if (
      plantDrag.active &&
      position.x === plantDrag.position.x &&
      position.y === plantDrag.position.y
    )
      return
    setPlantDrag({ ...plantDrag, active: true, position })
  }

  // Uses the release position too: pointerup can land somewhere the last
  // pointermove didn't report, or arrive with no pointermove at all.
  function handleMarkerPointerUp(e: ReactPointerEvent) {
    if (!plantDrag || e.pointerId !== plantDrag.pointerId) return
    if (plantDrag.active || pastThreshold(e, plantDrag)) {
      suppressClickRef.current = true
      const position = dragPosition(e, plantDrag)
      const original = garden.placements[plantDrag.placementId]?.position
      if (!original || position.x !== original.x || position.y !== original.y) {
        onMovePlant(plantDrag.placementId, position)
      }
    }
    setPlantDrag(null)
  }

  function handleMarkerClick(e: ReactMouseEvent, placementId: string) {
    e.stopPropagation()
    pressOnMarkerRef.current = false
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onPlantClick(placementId)
  }

  function handleMarkerKeyDown(e: ReactKeyboardEvent, placement: PlacedPlant) {
    const delta = ARROW_DELTAS[e.key]
    if (delta && plantsDraggable) {
      e.preventDefault()
      e.stopPropagation()
      const step = e.shiftKey ? 12 : 1
      const { x, y } = placement.position
      onMovePlant(
        placement.id,
        toPlantPosition({ x: x + delta.x * step, y: y + delta.y * step }, garden),
      )
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      e.stopPropagation()
      onRemovePlant(placement.id)
      canvasRef.current?.focus()
    }
  }

  // --- plant-type drag and drop from the inventory (native, because it
  // crosses components) ------------------------------------------------------

  function acceptsPickerDrag(e: ReactDragEvent) {
    return plantsInteractive && e.dataTransfer.types.includes(PLANT_DRAG_MIME_TYPE)
  }

  function handleDragOver(e: ReactDragEvent) {
    if (!acceptsPickerDrag(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    const position = toPlantPosition(pointerToGarden(e), garden)
    if (dropPreview?.x !== position.x || dropPreview?.y !== position.y) {
      setDropPreview(position)
    }
  }

  function handleDragLeave(e: ReactDragEvent) {
    if (!canvasRef.current?.contains(e.relatedTarget as Node | null)) setDropPreview(null)
  }

  function handleDrop(e: ReactDragEvent) {
    if (!acceptsPickerDrag(e)) return
    e.preventDefault()
    setDropPreview(null)
    let payload: unknown
    try {
      payload = JSON.parse(e.dataTransfer.getData(PLANT_DRAG_MIME_TYPE))
    } catch {
      return
    }
    if (!isPlantDragPayload(payload)) return
    onPlantTypeDrop(payload.plantId, toPlantPosition(pointerToGarden(e), garden))
  }

  // --- derived drawing state ------------------------------------------------

  const candidate: DragCandidate | null = plantDrag?.active
    ? { placementId: plantDrag.placementId, plantId: plantDrag.plantId, position: plantDrag.position }
    : dropPreview && draggedPlantTypeId
      ? { placementId: null, plantId: draggedPlantTypeId, position: dropPreview }
      : null
  const feedback = candidate ? candidateFeedback(garden, plantsById, rules, candidate) : null
  const inspected =
    !feedback && selectedPlacementId && plantsInteractive
      ? inspectedEnvelope(garden, plantsById, selectedPlacementId)
      : null

  const envelopes = feedback?.envelopes ?? (inspected ? [inspected.envelope] : [])
  const spacingViolatorIds = new Set(
    feedback
      ? feedback.envelopes.filter((env) => !env.own && env.violated).map((env) => env.placementId)
      : (inspected?.violatorIds ?? []),
  )
  const candidatePlant = candidate ? plantsById[candidate.plantId] : undefined
  const envelopeCaptionPlant =
    candidatePlant ??
    (selectedPlacementId ? plantsById[garden.placements[selectedPlacementId]?.plantId] : undefined)

  // Issue marks, in garden inches (the overlay's viewBox is the garden): a
  // dashed line between plants that clash, and the footprints of plants
  // that are too close.
  const positionOf = (id: string) => garden.placements[id]?.position
  const issueMarks = (issue: GardenIssue, i: number) => {
    if (issue.kind === 'sunlight') return null
    const [a, b] = issue.placementIds.map(positionOf)
    if (!a || !b) return null
    if (issue.kind === 'incompatible') {
      return (
        <line key={i} className="garden-issues__clash" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      )
    }
    const radii =
      issue.kind === 'spacing'
        ? [issue.requiredDistance / 2, issue.requiredDistance / 2]
        : issue.plants.map(footprintRadius)
    return (
      <g key={i} className="garden-issues__crowd">
        <circle cx={a.x} cy={a.y} r={radii[0]} />
        <circle cx={b.x} cy={b.y} r={radii[1]} />
      </g>
    )
  }

  // Top-to-bottom, then left-to-right: a predictable keyboard order, and
  // lower plants draw over higher ones.
  const placements = getAllPlacements(garden).sort(
    (a, b) => a.position.y - b.position.y || a.position.x - b.position.x,
  )
  const { cellSize } = garden.environment
  // Fit-to-screen size times the viewport's zoom (see CanvasViewport).
  const canvasWidth = `calc(min(100cqw, ${garden.width / garden.height} * 100cqh) * var(--zoom, 1))`

  // A plant's look on the canvas: its approved sprite, or the placeholder
  // dot when it has no art yet. Fixed on-screen size; never a footprint.
  const plantVisual = (plant: Plant) => {
    const sprite = plantSpriteUrl(plant.id)
    return sprite ? (
      <img className="plant-marker__sprite" src={sprite} alt="" draggable={false} />
    ) : (
      <span className="plant-marker__dot" />
    )
  }

  return (
    <div
      ref={canvasRef}
      className={`garden-canvas garden-canvas--${mode}${
        highlight ? ' garden-canvas--highlighting' : ''
      }`}
      style={{
        aspectRatio: `${garden.width} / ${garden.height}`,
        // Fit the available space in both directions (the viewport is a
        // size container): as wide as possible without exceeding its height.
        width: canvasWidth,
        // One physical inch on screen, for CSS sized in real units (bed
        // boards, bed-soil tiles). Recomputed by CSS as the canvas resizes.
        '--in': `calc(${canvasWidth} / ${garden.width})`,
        // Soil tiles and grid lines both repeat once per environmental cell (12").
        backgroundSize: `${(cellSize / garden.width) * 100}% ${(cellSize / garden.height) * 100}%`,
      } as CSSProperties}
      tabIndex={0}
      aria-label={`Garden, ${formatLength(garden.width)} by ${formatLength(garden.height)}.${
        mode === 'plant' ? ' Press Enter to place the selected plant at the center.' : ''
      }`}
      onClick={handleCanvasClick}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' || e.target !== e.currentTarget || mode !== 'plant') return
        e.preventDefault()
        const id = onPlaceAtCenter()
        if (id) setPendingFocusId(id)
      }}
      onPointerDown={(e) => {
        // A fresh press on empty canvas clears a stale "press began on a
        // plant" flag (e.g. from a press released outside the canvas).
        if (!(e.target as Element).closest('.plant-marker')) pressOnMarkerRef.current = false
        if (mode !== 'sunlight' || e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        paintStrokeRef.current = ''
        onPaintStart()
        paintAt(e)
      }}
      onPointerMove={(e) => {
        if (paintStrokeRef.current !== null) paintAt(e)
      }}
      onPointerUp={() => (paintStrokeRef.current = null)}
      onPointerCancel={() => (paintStrokeRef.current = null)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <GardenBeds
        garden={garden}
        {...beds}
        highlightedBedId={feedback?.bedId}
        glowBedIds={highlight?.bedIds}
      />

      <div className="garden-sunlight" aria-hidden="true">
        {Object.entries(garden.environment.sunlightByCell).map(([key, level]) => {
          const [row, col] = key.split(',').map(Number)
          return (
            <div
              key={key}
              className={`garden-sunlight__cell garden-sunlight__cell--${level}`}
              style={percentRect(garden, {
                position: { x: col * cellSize, y: row * cellSize },
                width: cellSize,
                height: cellSize,
              })}
            />
          )
        })}
      </div>

      <div className="garden-envelopes" aria-hidden="true">
        {envelopes.map((env) => (
          <div
            key={env.placementId}
            className={`spacing-envelope${env.own ? ' spacing-envelope--own' : ''}${
              env.violated ? ' spacing-envelope--violated' : ''
            }`}
            style={percentCircle(garden, env.center, env.radius)}
          />
        ))}
      </div>

      {issues && issues.length > 0 && (
        <svg
          className="garden-issues"
          viewBox={`0 0 ${garden.width} ${garden.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {issues.map(issueMarks)}
        </svg>
      )}

      {gardener && (
        <Gardener
          garden={garden}
          plantsById={plantsById}
          rules={rules}
          canvasRef={canvasRef}
          selectedPlacementId={selectedPlacementId}
          lastPlacementIds={gardener.lastPlacementIds}
          draggable={mode === 'select'}
        />
      )}

      <div className="garden-plants">
        {placements.map((placement) => {
          const plant = plantsById[placement.plantId]
          if (!plant) return null
          const isDragged = plantDrag?.active && plantDrag.placementId === placement.id
          const position = isDragged ? plantDrag.position : placement.position
          const relationship = feedback?.relationshipById[placement.id]
          const bed = getBedAt(garden, placement.position)
          return (
            <button
              type="button"
              key={placement.id}
              data-placement-id={placement.id}
              tabIndex={plantsInteractive ? 0 : -1}
              aria-label={`${plant.name}, ${formatLength(position.x)} from left, ${formatLength(
                position.y,
              )} from top, ${bed ? `in ${bed.name}` : 'in open ground'}`}
              className={`plant-marker plant-marker--${plant.category}${
                plantSpriteUrl(plant.id) ? ' plant-marker--art' : ''
              }${
                placement.id === selectedPlacementId ? ' plant-marker--inspected' : ''
              }${isDragged ? ' plant-marker--dragging' : ''}${
                relationship ? ` plant-marker--${relationship}` : ''
              }${spacingViolatorIds.has(placement.id) ? ' plant-marker--spacing' : ''}${
                highlight?.placementIds.includes(placement.id) ? ' plant-marker--highlighted' : ''
              }`}
              style={percentPoint(garden, position)}
              onPointerDown={(e) => handleMarkerPointerDown(e, placement)}
              onPointerMove={handleMarkerPointerMove}
              onPointerUp={handleMarkerPointerUp}
              onPointerCancel={() => setPlantDrag(null)}
              onClick={(e) => handleMarkerClick(e, placement.id)}
              onKeyDown={(e) => handleMarkerKeyDown(e, placement)}
            >
              {plantVisual(plant)}
              <span className="plant-marker__label">{plant.name}</span>
            </button>
          )
        })}
        {candidate?.placementId === null && candidatePlant && (
          <div
            className={`plant-marker plant-marker--${candidatePlant.category} plant-marker--ghost${
              plantSpriteUrl(candidatePlant.id) ? ' plant-marker--art' : ''
            }`}
            style={percentPoint(garden, candidate.position)}
            aria-hidden="true"
          >
            {plantVisual(candidatePlant)}
            <span className="plant-marker__label">{candidatePlant.name}</span>
          </div>
        )}
      </div>

      {issues
        ?.filter((issue) => issue.kind === 'sunlight')
        .map((issue) => {
          const position = positionOf(issue.placementIds[0])
          return position ? (
            <span
              key={`sun-${issue.placementIds[0]}`}
              className="garden-issues__sun"
              style={percentPoint(garden, position)}
              aria-hidden="true"
            >
              <Icon name="sun" size={12} />
            </span>
          ) : null
        })}

      {/* The own envelope's caption sits just above the circle (anchored no
          higher than the garden's top edge), drawn after the plants and
          unclipped, so it doesn't cover the plant or nearby labels. */}
      {envelopes
        .filter((env) => env.own && envelopeCaptionPlant)
        .map((env) => (
          <span
            key={env.placementId}
            className="spacing-envelope__caption"
            aria-hidden="true"
            style={percentPoint(garden, {
              x: env.center.x,
              y: Math.max(env.center.y - env.radius, 0),
            })}
          >
            {`${envelopeCaptionPlant!.name} spacing: ${env.radius} in minimum — not plant size`}
          </span>
        ))}
    </div>
  )
}

export default GardenCanvas
