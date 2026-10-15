export type CellKey = string

/**
 * A continuous physical position in the garden, in inches. Origin is the
 * garden's top-left corner; x increases rightward, y downward. Any finite
 * position inside the garden is valid — positions are not tied to the
 * environmental grid or to UI snapping (see ARCHITECTURE.md "State Model").
 */
export type Position = {
  x: number
  y: number
}

/**
 * One placed plant. Identity (`id`) is independent of position, so moving a
 * placement changes its position but never its identity. Nearby plants,
 * containing cell, and spacing status are derived, never stored here.
 */
export type PlacedPlant = {
  id: string
  plantId: string
  position: Position
}

/**
 * A planting bed: a rectangle in physical garden coordinates (inches),
 * positioned by its top-left corner. Plants never reference a bed —
 * membership is derived from position (see getBedAt). Not tied to the
 * environmental grid. See ARCHITECTURE.md "Beds".
 */
export type GardenBed = {
  id: string
  name: string
  position: Position
  width: number
  height: number
}

/** A bed's geometry, without identity. */
export type BedRect = Pick<GardenBed, 'position' | 'width' | 'height'>

/**
 * A user-modeled garden condition, not measured irradiance, exact direct-
 * sun hours, or simulated year-round exposure. The person planning this
 * garden is declaring "I consider this cell full sun" — there is no
 * horticultural source for that declaration, unlike a Plant's own sunlight
 * requirement (Part 3B), which is curated and eligible for the Part 2E
 * evidence treatment. See ARCHITECTURE.md.
 */
export type SunlightLevel = 'full-sun' | 'partial-sun' | 'shade'

/**
 * Site-level environmental state, separate from placements. Each field's
 * shape reflects the scope its condition actually has — sunlight is
 * per environmental cell, so it's a Record<CellKey, ...>; a future
 * site-wide condition (e.g. climate) would be a plain scalar field here
 * instead, not forced into the same per-cell shape. See ARCHITECTURE.md.
 */
export type GardenEnvironment = {
  /** Side length, in inches, of the square cells that hold cell-level
   * environmental data. An environmental resolution only — it does not
   * constrain where plants can be placed. */
  cellSize: number
  /** Absent key means sunlight is not modeled for that cell — never an
   * 'unknown' SunlightLevel. See ARCHITECTURE.md. */
  sunlightByCell: Record<CellKey, SunlightLevel>
}

/**
 * Facts about one physical garden. Width, height, and every position are in
 * inches. Placements are keyed by placement id.
 */
export type GardenState = {
  width: number
  height: number
  placements: Record<string, PlacedPlant>
  beds: Record<string, GardenBed>
  environment: GardenEnvironment
}

export const ENVIRONMENT_CELL_SIZE = 12

export const GARDEN_MIN_SIZE = 48
export const GARDEN_MAX_SIZE = 360
export const GARDEN_DEFAULT_SIZE = 120

export type CellCoordinate = {
  row: number
  col: number
}

function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`
}

/**
 * Whether a single value (width or height, in inches) is a valid garden
 * dimension: a whole multiple of ENVIRONMENT_CELL_SIZE from GARDEN_MIN_SIZE
 * through GARDEN_MAX_SIZE, so the environmental cells tile the garden
 * exactly. Shared by createGarden's validation and any UI that wants to
 * validate a dimension before submitting it, so the rule can't drift.
 */
export function isValidGardenDimension(value: number): boolean {
  return (
    Number.isInteger(value / ENVIRONMENT_CELL_SIZE) &&
    value >= GARDEN_MIN_SIZE &&
    value <= GARDEN_MAX_SIZE
  )
}

export function createGarden(
  width: number = GARDEN_DEFAULT_SIZE,
  height: number = GARDEN_DEFAULT_SIZE,
): GardenState {
  if (!isValidGardenDimension(width) || !isValidGardenDimension(height)) {
    throw new Error(
      `Garden dimensions must be multiples of ${ENVIRONMENT_CELL_SIZE} inches between ${GARDEN_MIN_SIZE} and ${GARDEN_MAX_SIZE} (got ${width}x${height}).`,
    )
  }

  return {
    width,
    height,
    placements: {},
    beds: {},
    environment: { cellSize: ENVIRONMENT_CELL_SIZE, sunlightByCell: {} },
  }
}

/**
 * Whether a position lies inside the garden: finite, with 0 ≤ x < width and
 * 0 ≤ y < height. Half-open so every valid position maps to exactly one
 * environmental cell.
 */
export function isValidPosition(garden: GardenState, position: Position): boolean {
  const { x, y } = position
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x < garden.width &&
    y >= 0 &&
    y < garden.height
  )
}

export function getEnvironmentRows(garden: GardenState): number {
  return garden.height / garden.environment.cellSize
}

export function getEnvironmentColumns(garden: GardenState): number {
  return garden.width / garden.environment.cellSize
}

/**
 * Whether (row, col) is an addressable environmental cell in this garden.
 * Every environment operation below treats an invalid cell as a no-op (or
 * returns "nothing there"), rather than throwing.
 */
export function isValidCell(garden: GardenState, row: number, col: number): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < getEnvironmentRows(garden) &&
    col >= 0 &&
    col < getEnvironmentColumns(garden)
  )
}

/**
 * The environmental cell containing a position. Cells are half-open, so a
 * position exactly on a shared boundary belongs to the cell below/right.
 * Returns undefined for a position outside the garden.
 */
export function cellAt(garden: GardenState, position: Position): CellCoordinate | undefined {
  if (!isValidPosition(garden, position)) return undefined
  const { cellSize } = garden.environment
  return { row: Math.floor(position.y / cellSize), col: Math.floor(position.x / cellSize) }
}

/**
 * Adds a new placement. A no-op if the position is outside the garden or the
 * id is already in use — placement ids are identities, never overwritten.
 * The domain does not enforce exclusive occupancy: two placements may share
 * a position (see ARCHITECTURE.md "Placements").
 */
export function placePlant(
  garden: GardenState,
  id: string,
  plantId: string,
  position: Position,
): GardenState {
  if (!isValidPosition(garden, position) || garden.placements[id]) return garden

  return {
    ...garden,
    placements: { ...garden.placements, [id]: { id, plantId, position } },
  }
}

export function getPlacement(garden: GardenState, id: string): PlacedPlant | undefined {
  return garden.placements[id]
}

/**
 * Removes the placement with this id, if any. Removing an unknown id is a
 * safe no-op.
 */
export function removePlant(garden: GardenState, id: string): GardenState {
  if (!garden.placements[id]) return garden
  const placements = { ...garden.placements }
  delete placements[id]
  return { ...garden, placements }
}

/**
 * Moves an existing placement to a new position, keeping its id. Moving an
 * unknown id, or to a position outside the garden, is a safe no-op.
 */
export function movePlant(garden: GardenState, id: string, position: Position): GardenState {
  const placement = garden.placements[id]
  if (!placement || !isValidPosition(garden, position)) return garden

  return {
    ...garden,
    placements: { ...garden.placements, [id]: { ...placement, position } },
  }
}

/**
 * Sets the modeled sunlight condition at environmental cell (row, col).
 * Always assigns — painting the same level repeatedly is idempotent, never a
 * toggle. Calling this on an out-of-bounds cell is a safe no-op.
 */
export function setSunlightAt(
  garden: GardenState,
  row: number,
  col: number,
  level: SunlightLevel,
): GardenState {
  if (!isValidCell(garden, row, col)) return garden

  return {
    ...garden,
    environment: {
      ...garden.environment,
      sunlightByCell: { ...garden.environment.sunlightByCell, [cellKey(row, col)]: level },
    },
  }
}

/**
 * Clears the modeled sunlight condition at (row, col), if any — the cell
 * returns to "not modeled" rather than any particular SunlightLevel.
 * Calling this on an already-unmodeled or out-of-bounds cell is a safe
 * no-op.
 */
export function clearSunlightAt(garden: GardenState, row: number, col: number): GardenState {
  if (!isValidCell(garden, row, col)) return garden

  const sunlightByCell = { ...garden.environment.sunlightByCell }
  delete sunlightByCell[cellKey(row, col)]
  return { ...garden, environment: { ...garden.environment, sunlightByCell } }
}

export function getSunlightAt(
  garden: GardenState,
  row: number,
  col: number,
): SunlightLevel | undefined {
  if (!isValidCell(garden, row, col)) return undefined
  return garden.environment.sunlightByCell[cellKey(row, col)]
}

/**
 * Removes all placements while preserving the garden's dimensions, beds, and
 * environmental state (e.g. modeled sunlight) — Clear Garden resets the
 * planting design, not the site layout. Starting a New Garden instead discards the
 * whole GardenState, resetting environment along with everything else.
 */
export function clearGarden(garden: GardenState): GardenState {
  if (!hasPlacements(garden)) return garden // nothing to clear: unchanged
  return { ...garden, placements: {} }
}

/**
 * Whether the garden has at least one placed plant. Used to decide, for
 * example, whether starting a new garden needs confirmation.
 */
export function hasPlacements(garden: GardenState): boolean {
  return Object.keys(garden.placements).length > 0
}

export function getAllPlacements(garden: GardenState): PlacedPlant[] {
  return Object.values(garden.placements)
}

/** Euclidean distance between two positions, in inches. */
export function distance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function rectContains(rect: BedRect, position: Position): boolean {
  return (
    position.x >= rect.position.x &&
    position.x < rect.position.x + rect.width &&
    position.y >= rect.position.y &&
    position.y < rect.position.y + rect.height
  )
}

function rectsOverlap(a: BedRect, b: BedRect): boolean {
  // Strict, so beds that only share an edge don't overlap.
  return (
    a.position.x < b.position.x + b.width &&
    b.position.x < a.position.x + a.width &&
    a.position.y < b.position.y + b.height &&
    b.position.y < a.position.y + a.height
  )
}

/**
 * Whether a rectangle is a valid bed in this garden: finite, positive size,
 * entirely inside the garden, and not overlapping any other bed (touching
 * edges is fine). `ignoreBedId` excludes a bed being moved/resized from the
 * overlap check against itself. Exported so the UI can preview validity.
 */
export function isValidBedRect(garden: GardenState, rect: BedRect, ignoreBedId?: string): boolean {
  const { position, width, height } = rect
  const values = [position.x, position.y, width, height]
  if (!values.every(Number.isFinite) || width <= 0 || height <= 0) return false
  if (position.x < 0 || position.y < 0) return false
  if (position.x + width > garden.width || position.y + height > garden.height) return false

  return Object.values(garden.beds).every(
    (bed) => bed.id === ignoreBedId || !rectsOverlap(bed, rect),
  )
}

/** "Bed N" with the lowest N not already used by a bed's name. */
export function nextBedName(garden: GardenState): string {
  const names = new Set(Object.values(garden.beds).map((bed) => bed.name))
  let n = 1
  while (names.has(`Bed ${n}`)) n++
  return `Bed ${n}`
}

/** Adds a bed. A no-op if the id is in use or the rectangle is invalid. */
export function addBed(garden: GardenState, id: string, name: string, rect: BedRect): GardenState {
  if (garden.beds[id] || !isValidBedRect(garden, rect)) return garden
  return { ...garden, beds: { ...garden.beds, [id]: { id, name, ...rect } } }
}

export function getBed(garden: GardenState, id: string): GardenBed | undefined {
  return garden.beds[id]
}

export function getAllBeds(garden: GardenState): GardenBed[] {
  return Object.values(garden.beds)
}

/** Renames a bed. Whitespace is trimmed; an empty name or unknown id is a no-op. */
export function renameBed(garden: GardenState, id: string, name: string): GardenState {
  const bed = garden.beds[id]
  const trimmed = name.trim()
  if (!bed || trimmed === '') return garden
  return { ...garden, beds: { ...garden.beds, [id]: { ...bed, name: trimmed } } }
}

/**
 * Changes a bed's rectangle without moving any plants — a plant left outside
 * the new rectangle is simply in open ground. A no-op for an unknown id or
 * an invalid rectangle.
 */
export function resizeBed(garden: GardenState, id: string, rect: BedRect): GardenState {
  const bed = garden.beds[id]
  if (!bed || !isValidBedRect(garden, rect, id)) return garden
  return { ...garden, beds: { ...garden.beds, [id]: { ...bed, ...rect } } }
}

/**
 * Moves a bed to a new top-left position and moves every placement inside
 * it by the same distance, so a planted bed moves as one unit (a product
 * rule — plants still don't reference beds). A no-op for an unknown id or
 * an invalid destination.
 */
export function moveBed(garden: GardenState, id: string, position: Position): GardenState {
  const bed = garden.beds[id]
  if (!bed) return garden
  const rect = { position, width: bed.width, height: bed.height }
  if (!isValidBedRect(garden, rect, id)) return garden

  const dx = position.x - bed.position.x
  const dy = position.y - bed.position.y
  const placements = { ...garden.placements }
  for (const placement of getPlacementsInBed(garden, id)) {
    const moved = { x: placement.position.x + dx, y: placement.position.y + dy }
    placements[placement.id] = { ...placement, position: moved }
  }

  return { ...garden, placements, beds: { ...garden.beds, [id]: { ...bed, position } } }
}

/** Removes a bed. Its plants stay where they are, in open ground. */
export function removeBed(garden: GardenState, id: string): GardenState {
  if (!garden.beds[id]) return garden
  const beds = { ...garden.beds }
  delete beds[id]
  return { ...garden, beds }
}

/**
 * The bed containing a position, if any (half-open, like cells). Beds can't
 * overlap, so there is at most one.
 */
export function getBedAt(garden: GardenState, position: Position): GardenBed | undefined {
  return getAllBeds(garden).find((bed) => rectContains(bed, position))
}

/** Placements whose position lies inside the bed — derived, never stored. */
export function getPlacementsInBed(garden: GardenState, bedId: string): PlacedPlant[] {
  const bed = garden.beds[bedId]
  if (!bed) return []
  return getAllPlacements(garden).filter((placement) => rectContains(bed, placement.position))
}
