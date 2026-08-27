import type { PlantRelationshipRule } from '../domain/relationships'

// Relationships below are limited to pairings supported by a credible
// research/extension source, or by multiple reputable gardening sources
// (The Old Farmer's Almanac companion planting chart and individual plant
// guides, Farmers' Almanac's companion planting guide, university extension
// guidance where relevant) without a material contradiction. Pairs that were
// disputed across sources (e.g. tomato/carrot) or only weakly supported were
// left neutral rather than guessed at. Incompatible pairings are held to the
// same bar and kept deliberately conservative — a relationship enters this
// production data only when it clears that policy, not merely because one
// chart lists it.
export const relationshipRules: PlantRelationshipRule[] = [
  { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
  { plantAId: 'tomato', plantBId: 'marigold', relationship: 'companion' },
  { plantAId: 'carrot', plantBId: 'rosemary', relationship: 'companion' },
  { plantAId: 'lettuce', plantBId: 'marigold', relationship: 'companion' },
  { plantAId: 'lettuce', plantBId: 'mint', relationship: 'companion' },
  { plantAId: 'tomato', plantBId: 'onion', relationship: 'companion' },
  { plantAId: 'bell-pepper', plantBId: 'basil', relationship: 'companion' },
  { plantAId: 'bell-pepper', plantBId: 'onion', relationship: 'companion' },
  { plantAId: 'cucumber', plantBId: 'bush-bean', relationship: 'companion' },
  { plantAId: 'cucumber', plantBId: 'dill', relationship: 'companion' },
  { plantAId: 'onion', plantBId: 'carrot', relationship: 'companion' },
  { plantAId: 'onion', plantBId: 'lettuce', relationship: 'companion' },
  { plantAId: 'onion', plantBId: 'cabbage', relationship: 'companion' },
  { plantAId: 'pea', plantBId: 'carrot', relationship: 'companion' },
  { plantAId: 'pea', plantBId: 'lettuce', relationship: 'companion' },
  { plantAId: 'pea', plantBId: 'mint', relationship: 'companion' },
  { plantAId: 'potato', plantBId: 'basil', relationship: 'companion' },
  { plantAId: 'potato', plantBId: 'bush-bean', relationship: 'companion' },
  { plantAId: 'potato', plantBId: 'pea', relationship: 'companion' },
  { plantAId: 'cabbage', plantBId: 'dill', relationship: 'companion' },
  { plantAId: 'bush-bean', plantBId: 'rosemary', relationship: 'companion' },
  { plantAId: 'tomato', plantBId: 'potato', relationship: 'incompatible' },
  { plantAId: 'onion', plantBId: 'bush-bean', relationship: 'incompatible' },
  { plantAId: 'onion', plantBId: 'pea', relationship: 'incompatible' },
  { plantAId: 'carrot', plantBId: 'dill', relationship: 'incompatible' },
  { plantAId: 'cucumber', plantBId: 'potato', relationship: 'incompatible' },
]
