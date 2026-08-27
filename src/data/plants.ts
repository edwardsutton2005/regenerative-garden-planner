import type { Plant } from '../domain/plant'

// minimumSpacingCells is a relative tier (1 = least room needed, 4 = most),
// informed by the real spacing-apart guidance noted per plant below — not a
// stated inches-per-cell conversion. It governs spacing between two
// placements of the SAME plant only (V1 does not apply it across species —
// see domain/plant.ts and domain/spacing.ts). Where guidance varies by
// variety or planting method, a representative common-garden figure was
// used. Sources: UMN Extension (https://extension.umn.edu/flowers/sunflowers)
// where available, otherwise The Old Farmer's Almanac plant guides, Farmers'
// Almanac, or cross-checked spacing charts (Gardening Know How, Blooming
// Expert).
export const plants: Plant[] = [
  // ~24-36 in apart.
  { id: 'tomato', name: 'Tomato', category: 'vegetable', minimumSpacingCells: 4 },
  // ~2-3 in apart — by far the tightest-packed of the seed plants.
  { id: 'carrot', name: 'Carrot', category: 'vegetable', minimumSpacingCells: 1 },
  // ~4-8 in apart (leaf lettuce).
  { id: 'lettuce', name: 'Lettuce', category: 'vegetable', minimumSpacingCells: 2 },
  // ~10-12 in apart.
  { id: 'basil', name: 'Basil', category: 'herb', minimumSpacingCells: 2 },
  // ~18 in apart.
  { id: 'mint', name: 'Mint', category: 'herb', minimumSpacingCells: 3 },
  // ~24-36 in apart (mature shrub spacing).
  { id: 'rosemary', name: 'Rosemary', category: 'herb', minimumSpacingCells: 4 },
  // ~6-10 in apart (French marigold, a common garden variety).
  { id: 'marigold', name: 'Marigold', category: 'flower', minimumSpacingCells: 2 },
  // ~18 in apart (typical branching garden variety, per UMN Extension).
  { id: 'sunflower', name: 'Sunflower', category: 'flower', minimumSpacingCells: 3 },
  // ~3-6 in apart.
  { id: 'onion', name: 'Onion', category: 'vegetable', minimumSpacingCells: 2 },
  // ~1-4 in apart, depending on planting method/source.
  { id: 'bush-bean', name: 'Bush Bean', category: 'vegetable', minimumSpacingCells: 1 },
  // ~2 in apart, per common garden guidance.
  { id: 'pea', name: 'Pea', category: 'vegetable', minimumSpacingCells: 1 },
  // ~12-18 in apart.
  { id: 'bell-pepper', name: 'Bell Pepper', category: 'vegetable', minimumSpacingCells: 3 },
  // ~12-18 in apart.
  { id: 'cucumber', name: 'Cucumber', category: 'vegetable', minimumSpacingCells: 3 },
  // ~15-18 in apart.
  { id: 'cabbage', name: 'Cabbage', category: 'vegetable', minimumSpacingCells: 3 },
  // ~12-18 in apart, depending on planting method/type.
  { id: 'potato', name: 'Potato', category: 'vegetable', minimumSpacingCells: 3 },
  // ~10-12 in apart.
  { id: 'dill', name: 'Dill', category: 'herb', minimumSpacingCells: 2 },
]
