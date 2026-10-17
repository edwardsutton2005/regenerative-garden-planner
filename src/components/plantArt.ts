import { ICON_PLANT_IDS, SPRITE_PLANT_IDS } from './artAssets'

// URLs for the built plant art in public/art/ (see scripts/build-art.ts).
// Undefined means no approved art yet: callers fall back to a placeholder.

const BASE = `${import.meta.env.BASE_URL}art`

export function plantSpriteUrl(plantId: string): string | undefined {
  return SPRITE_PLANT_IDS.has(plantId) ? `${BASE}/plants/${plantId}.png` : undefined
}

export function plantIconUrl(plantId: string): string | undefined {
  return ICON_PLANT_IDS.has(plantId) ? `${BASE}/icons/${plantId}.png` : undefined
}
