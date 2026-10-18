import { useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { BedRect, GardenBed, GardenState, Position } from '../domain/garden'
import { getAllBeds, isValidBedRect } from '../domain/garden'
import { clientToGarden, percentRect, snapTo } from './canvasGeometry'
import { formatSize } from './units'

// UI snap increment for bed edges, in inches. A UI choice only — the domain
// accepts any position and size.
const BED_SNAP = 6

const ARROW_DELTAS: Record<string, Position> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se']

type Drag =
  | { kind: 'draw'; start: Position; current: Position }
  | { kind: 'move'; bed: GardenBed; start: Position; current: Position }
  | { kind: 'resize'; bed: GardenBed; corner: Corner; current: Position }

type GardenBedsProps = {
  garden: GardenState
  /** Whether the Beds tool is active: the whole layer takes pointer input,
   * so drawing new beds and dragging bed bodies work. Otherwise only the
   * selected bed's tab and corner handles are interactive. */
  editing: boolean
  /** Null when no bed is selected, or bed selection isn't available in the
   * current tool. */
  selectedBedId: string | null
  onSelectBed: (bedId: string | null) => void
  onCreateBed: (rect: BedRect) => void
  onMoveBed: (bedId: string, position: Position) => void
  onResizeBed: (bedId: string, rect: BedRect) => void
  /** A bed to highlight, e.g. the one under a plant being dragged. */
  highlightedBedId?: string
  /** Beds an inspector card points at, given a soft glow. */
  glowBedIds?: string[]
}

const snap = (value: number) => snapTo(value, BED_SNAP)

function rectBetween(a: Position, b: Position): BedRect {
  return {
    position: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

/** The rectangle a drag would produce if released now, snapped. */
function previewRect(drag: Drag): BedRect {
  switch (drag.kind) {
    case 'draw':
      return rectBetween(
        { x: snap(drag.start.x), y: snap(drag.start.y) },
        { x: snap(drag.current.x), y: snap(drag.current.y) },
      )
    case 'move': {
      const { bed } = drag
      return {
        position: {
          x: bed.position.x + snap(drag.current.x - drag.start.x),
          y: bed.position.y + snap(drag.current.y - drag.start.y),
        },
        width: bed.width,
        height: bed.height,
      }
    }
    case 'resize': {
      const { bed, corner } = drag
      // The corner opposite the handle stays fixed.
      const fixed = {
        x: corner.includes('w') ? bed.position.x + bed.width : bed.position.x,
        y: corner.includes('n') ? bed.position.y + bed.height : bed.position.y,
      }
      return rectBetween(fixed, { x: snap(drag.current.x), y: snap(drag.current.y) })
    }
  }
}

/**
 * The planting-bed layers, positioned over the garden in physical
 * coordinates (percentages of the garden's size).
 *
 * - The base layer draws beds under the plants. While the Beds tool is
 *   active it moves on top and handles drawing and dragging bed bodies.
 * - The selection layer always sits above the plants and holds only the
 *   selected bed's outline, a name tab (drag to move), and corner handles
 *   (drag to resize). Plants inside a selected bed stay clickable, so beds
 *   can be selected and edited without the Beds tool.
 *
 * Changes preview live and are committed once, on release; a preview that
 * would be invalid shows in red and is discarded. Native pointer events only.
 */
function GardenBeds({
  garden,
  editing,
  selectedBedId,
  onSelectBed,
  onCreateBed,
  onMoveBed,
  onResizeBed,
  highlightedBedId,
  glowBedIds,
}: GardenBedsProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)

  function toGarden(e: ReactPointerEvent): Position {
    return clientToGarden(e.clientX, e.clientY, layerRef.current!.getBoundingClientRect(), garden)
  }

  // Arrow keys on the focused name tab move the bed by one snap step. An
  // invalid destination is a domain no-op.
  function handleTabKeyDown(e: ReactKeyboardEvent, bed: GardenBed) {
    const delta = ARROW_DELTAS[e.key]
    if (!delta) return
    e.preventDefault()
    e.stopPropagation()
    onMoveBed(bed.id, {
      x: bed.position.x + delta.x * BED_SNAP,
      y: bed.position.y + delta.y * BED_SNAP,
    })
  }

  function startDrag(e: ReactPointerEvent, next: Drag) {
    e.stopPropagation()
    e.preventDefault()
    // Captured events still bubble to the layer's move/up handlers.
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag(next)
  }

  // Uses the release position too: pointerup can land somewhere the last
  // pointermove didn't report.
  function finishDrag(e: ReactPointerEvent) {
    if (!drag) return
    const rect = previewRect({ ...drag, current: toGarden(e) })
    setDrag(null)
    if (drag.kind === 'draw') {
      if (rect.width > 0 && rect.height > 0 && isValidBedRect(garden, rect)) onCreateBed(rect)
    } else {
      const { bed } = drag
      const unchanged =
        rect.position.x === bed.position.x &&
        rect.position.y === bed.position.y &&
        rect.width === bed.width &&
        rect.height === bed.height
      // A plain click (no change) just selects; it isn't a move.
      if (unchanged || !isValidBedRect(garden, rect, bed.id)) return
      if (drag.kind === 'move') onMoveBed(bed.id, rect.position)
      else onResizeBed(bed.id, rect)
    }
  }

  const preview = drag ? previewRect(drag) : null
  const draggedBedId = drag && drag.kind !== 'draw' ? drag.bed.id : null
  const previewInvalid =
    preview !== null &&
    preview.width > 0 &&
    preview.height > 0 &&
    !isValidBedRect(garden, preview, draggedBedId ?? undefined)

  const selectedBed = selectedBedId ? garden.beds[selectedBedId] : undefined
  const selectedRect =
    selectedBed && draggedBedId === selectedBed.id && preview ? preview : selectedBed
  const dragHandlers = {
    onPointerMove: (e: ReactPointerEvent) => {
      if (drag) setDrag({ ...drag, current: toGarden(e) })
    },
    onPointerUp: finishDrag,
    onPointerCancel: () => setDrag(null),
  }

  return (
    <>
      <div
        ref={layerRef}
        className={`garden-beds${editing ? ' garden-beds--editing' : ''}`}
        // Bed interactions never count as a click on empty canvas.
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (!editing) return
          onSelectBed(null)
          const start = toGarden(e)
          startDrag(e, { kind: 'draw', start, current: start })
        }}
        {...dragHandlers}
      >
        {getAllBeds(garden).map((bed) => {
          const isDragged = bed.id === draggedBedId
          const rect = isDragged && preview ? preview : bed
          return (
            <div
              key={bed.id}
              role={editing ? 'button' : undefined}
              aria-label={editing ? `${bed.name}, ${formatSize(bed.width, bed.height)}` : undefined}
              className={`garden-bed${isDragged && previewInvalid ? ' garden-bed--invalid' : ''}${
                bed.id === highlightedBedId ? ' garden-bed--highlighted' : ''
              }${glowBedIds?.includes(bed.id) ? ' garden-bed--glow' : ''}`}
              style={percentRect(garden, rect)}
              onPointerDown={(e) => {
                if (!editing) return
                onSelectBed(bed.id)
                const start = toGarden(e)
                startDrag(e, { kind: 'move', bed, start, current: start })
              }}
            >
              <span className="garden-bed__label">
                {bed.name}
                {isDragged && <> · {formatSize(rect.width, rect.height)}</>}
              </span>
            </div>
          )
        })}
        {drag?.kind === 'draw' && preview && preview.width > 0 && preview.height > 0 && (
          <div
            className={`garden-bed garden-bed--draft${previewInvalid ? ' garden-bed--invalid' : ''}`}
            style={percentRect(garden, preview)}
          >
            <span className="garden-bed__label">{formatSize(preview.width, preview.height)}</span>
          </div>
        )}
      </div>

      {selectedBed && selectedRect && (
        <div
          className="garden-bed-selection"
          onClick={(e) => e.stopPropagation()}
          {...dragHandlers}
        >
          <div className="garden-bed-selection__frame" style={percentRect(garden, selectedRect)}>
            <span
              className="garden-bed-selection__tab"
              role="button"
              tabIndex={0}
              aria-label={`Move ${selectedBed.name} (arrow keys move 6 inches)`}
              title="Drag to move this bed"
              onKeyDown={(e) => handleTabKeyDown(e, selectedBed)}
              onPointerDown={(e) => {
                const start = toGarden(e)
                startDrag(e, { kind: 'move', bed: selectedBed, start, current: start })
              }}
            >
              ⠿ {selectedBed.name}
            </span>
            {CORNERS.map((corner) => (
              <span
                key={corner}
                className={`garden-bed__handle garden-bed__handle--${corner}`}
                onPointerDown={(e) =>
                  startDrag(e, { kind: 'resize', bed: selectedBed, corner, current: toGarden(e) })
                }
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default GardenBeds
