// A custom MIME type keeps drag/drop scoped to payloads this app itself
// wrote. External drags (page text, other tabs/apps) never populate this
// type, so they're inert on drop before any parsing happens.
export const PLANT_DRAG_MIME_TYPE = 'application/x-regenerative-garden-plant'

/**
 * What a plant-type drag (from the inventory bar) carries: a plant id,
 * validated against the plant data by the caller. Plants already in the
 * garden move with pointer events instead (see GardenCanvas), not native
 * drag and drop.
 */
export type PlantDragPayload = { kind: 'plant-type'; plantId: string }

export function isPlantDragPayload(value: unknown): value is PlantDragPayload {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>

  return v.kind === 'plant-type' && typeof v.plantId === 'string'
}
