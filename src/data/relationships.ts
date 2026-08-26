import type { PlantRelationshipRule } from '../domain/relationships'

// Companion pairings below are limited to relationships explicitly stated by
// Farmers' Almanac's companion planting guide
// (https://www.farmersalmanac.com/companion-planting-guide), cross-checked
// against Old Farmer's Almanac's companion planting chart
// (https://www.almanac.com/companion-planting-guide-vegetables). Pairs that
// were disputed across sources (e.g. tomato/carrot) or only weakly supported
// were left out rather than guessed at. No "incompatible" pairing among the
// current seed plants was well-corroborated, so none is listed yet — add one
// only once it is clearly supported by a reference, not inferred from a
// general caution (e.g. an invasive habit).
export const relationshipRules: PlantRelationshipRule[] = [
  { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
  { plantAId: 'tomato', plantBId: 'marigold', relationship: 'companion' },
  { plantAId: 'carrot', plantBId: 'rosemary', relationship: 'companion' },
  { plantAId: 'lettuce', plantBId: 'marigold', relationship: 'companion' },
  { plantAId: 'lettuce', plantBId: 'mint', relationship: 'companion' },
]
