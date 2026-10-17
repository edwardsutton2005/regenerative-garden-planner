import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import Icon from './Icon'
import { scaleBarLength } from './canvasGeometry'
import { isTyping } from './useWorkspaceShortcuts'
import { formatLength } from './units'

/** Zoom is relative to fit-to-screen (1). View only: garden positions stay
 * physical inches, and canvasGeometry reads the canvas box at event time. */
const MIN_ZOOM = 1
const MAX_ZOOM = 8
const ZOOM_STEP = 1.25
/** Longest the scale bar may be, in screen pixels. */
const SCALE_BAR_MAX_PX = 120
/** Movement before a press becomes a pan; less stays a click. */
const PAN_THRESHOLD_PX = 4
/** Things that keep their own drag (or click) even when drag-to-pan is on. */
const OWN_DRAG = '.plant-marker, .garden-bed-selection__tab, .garden-bed__handle'

type Anchor = { fx: number; fy: number; clientX: number; clientY: number }
type Pan = { pointerId: number; x: number; y: number; left: number; top: number; active: boolean }

/** Swallow the click that follows a pan, so it doesn't select or deselect. */
function suppressNextClick() {
  const swallow = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }
  window.addEventListener('click', swallow, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
}

const canvasIn = (viewport: HTMLElement | null) => viewport?.querySelector<HTMLElement>('.garden-canvas') ?? null

type CanvasViewportProps = {
  gardenWidth: number
  /** Drag on open ground or grass pans (Select tool). Space+drag and
   * middle-button drag pan with any tool. */
  dragToPan: boolean
  children: ReactNode
}

/**
 * The scrolling area around the garden canvas, with a map-style scale bar
 * and zoom controls. Zooming keeps the point under the pointer (or the view's
 * center, for buttons and keys) in place; scrolling or dragging pans.
 */
function CanvasViewport({ gardenWidth, dragToPan, children }: CanvasViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const anchorRef = useRef<Anchor | null>(null)
  const [pxPerInch, setPxPerInch] = useState(0)
  const panRef = useRef<Pan | null>(null)
  const [panning, setPanning] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)

  const zoomTo = useCallback((target: number, clientX?: number, clientY?: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target))
    const viewport = viewportRef.current
    const canvas = canvasIn(viewportRef.current)
    if (next === zoomRef.current || !viewport || !canvas) return
    const view = viewport.getBoundingClientRect()
    const box = canvas.getBoundingClientRect()
    const x = clientX ?? view.left + view.width / 2
    const y = clientY ?? view.top + view.height / 2
    anchorRef.current = {
      fx: (x - box.left) / box.width,
      fy: (y - box.top) / box.height,
      clientX: x,
      clientY: y,
    }
    zoomRef.current = next
    setZoom(next)
  }, [])

  // After a zoom renders, scroll so the anchored garden point is back under
  // the same screen point.
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const viewport = viewportRef.current
    const canvas = canvasIn(viewportRef.current)
    if (!anchor || !viewport || !canvas) return
    anchorRef.current = null
    const box = canvas.getBoundingClientRect()
    viewport.scrollLeft += box.left + anchor.fx * box.width - anchor.clientX
    viewport.scrollTop += box.top + anchor.fy * box.height - anchor.clientY
  }, [zoom])

  // Scale bar: track the canvas's on-screen size (window resizes and zoom).
  useEffect(() => {
    const canvas = canvasIn(viewportRef.current)
    if (!canvas) return
    const observer = new ResizeObserver(() => setPxPerInch(canvas.getBoundingClientRect().width / gardenWidth))
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [gardenWidth])

  // Pinch (trackpad) or Ctrl+wheel zooms at the pointer; plain wheel scrolls.
  // Non-passive, so the browser's page zoom can be prevented.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey) return
      e.preventDefault()
      zoomTo(zoomRef.current * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY)
    }
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [zoomTo])

  // Cmd/Ctrl + = / − / 0, as in design tools (instead of page zoom).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || isTyping(e.target)) return
      if (e.key === '=' || e.key === '+') zoomTo(zoomRef.current * ZOOM_STEP)
      else if (e.key === '-') zoomTo(zoomRef.current / ZOOM_STEP)
      else if (e.key === '0') zoomTo(MIN_ZOOM)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomTo])

  // Space held: the next drag pans, whatever the tool. Prevents the page from
  // scrolling and a focused button from activating.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code !== 'Space' || isTyping(e.target)) return
      e.preventDefault()
      setSpaceHeld(e.type === 'keydown')
    }
    const release = () => setSpaceHeld(false)
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKey)
      window.removeEventListener('blur', release)
    }
  }, [])

  // Capture phase, so a forced pan (Space or middle button) reaches here
  // before the canvas starts painting, drawing, or placing.
  function handlePointerDownCapture(e: ReactPointerEvent<HTMLDivElement>) {
    const forced = e.button === 1 || (e.button === 0 && spaceHeld)
    const onOpenGround = e.button === 0 && dragToPan && !(e.target as Element).closest(OWN_DRAG)
    if (!forced && !onOpenGround) return
    if (forced) {
      e.stopPropagation()
      e.preventDefault()
    }
    const viewport = e.currentTarget
    panRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      active: false,
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (!pan || e.pointerId !== pan.pointerId) return
    const dx = e.clientX - pan.x
    const dy = e.clientY - pan.y
    if (!pan.active) {
      if (Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return
      pan.active = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setPanning(true)
    }
    e.currentTarget.scrollLeft = pan.left - dx
    e.currentTarget.scrollTop = pan.top - dy
  }

  function endPan(e: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (!pan || e.pointerId !== pan.pointerId) return
    if (pan.active) suppressNextClick()
    panRef.current = null
    setPanning(false)
  }

  const scale = pxPerInch > 0 ? scaleBarLength(pxPerInch, SCALE_BAR_MAX_PX) : null

  return (
    <div className="canvas-viewport">
      <div
        ref={viewportRef}
        className={`garden-canvas-viewport${dragToPan || spaceHeld ? ' garden-canvas-viewport--grab' : ''}${
          spaceHeld ? ' garden-canvas-viewport--space' : ''
        }${panning ? ' garden-canvas-viewport--panning' : ''}`}
        style={{ '--zoom': zoom } as CSSProperties}
        onPointerDownCapture={handlePointerDownCapture}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        {children}
      </div>
      {scale && (
        <div className="scale-bar" aria-label={`Scale: this bar is ${formatLength(scale)}`}>
          <span className="scale-bar__bar" style={{ width: scale * pxPerInch }} />
          <span className="scale-bar__label">{formatLength(scale)}</span>
        </div>
      )}
      <div className="zoom-controls" role="group" aria-label="Zoom">
        <button
          type="button"
          onClick={() => zoomTo(zoomRef.current / ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out (⌘/Ctrl −)"
        >
          <Icon name="minus" size={16} />
        </button>
        <button
          type="button"
          className="zoom-controls__fit"
          onClick={() => zoomTo(MIN_ZOOM)}
          disabled={zoom <= MIN_ZOOM}
          title="Fit garden to screen (⌘/Ctrl 0)"
        >
          {zoom <= MIN_ZOOM ? 'Fit' : `${Math.round(zoom * 100)}%`}
        </button>
        <button
          type="button"
          onClick={() => zoomTo(zoomRef.current * ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in (⌘/Ctrl +)"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  )
}

export default CanvasViewport
