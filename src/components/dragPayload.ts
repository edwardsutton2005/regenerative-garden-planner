// A custom MIME type keeps drag/drop scoped to payloads this app itself
// wrote. External drags (page text, other tabs/apps) never populate this
// type, so they're inert on drop before any parsing happens.
export const PLANT_DRAG_MIME_TYPE = 'application/x-regenerative-garden-plant'

/**
 * What a drag can carry: either a plant from the picker (identified by id,
 * validated against the plant catalogue by the caller), or an existing
 * garden placement (identified only by its cell — the caller derives the
 * actual plant from current garden state rather than trusting a
 * caller-supplied id).
 */
export type PlantDragPayload =
  | { kind: 'picker'; plantId: string }
  | { kind: 'garden'; source: { row: number; col: number } }

export function isPlantDragPayload(value: unknown): value is PlantDragPayload {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>

  if (v.kind === 'picker') {
    return typeof v.plantId === 'string'
  }

  if (v.kind === 'garden') {
    if (typeof v.source !== 'object' || v.source === null) return false
    const source = v.source as Record<string, unknown>
    return typeof source.row === 'number' && typeof source.col === 'number'
  }

  return false
}
