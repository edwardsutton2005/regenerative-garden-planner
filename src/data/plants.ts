import type { Plant } from '../domain/plant'

// minimumSpacingCells is a relative tier (1 = least room needed, 4 = most),
// informed by the real spacing-apart guidance noted per plant below — not a
// stated inches-per-cell conversion. It governs spacing between two
// placements of the SAME plant only (V1 does not apply it across species —
// see domain/plant.ts and domain/spacing.ts). Where guidance varies by
// variety, a representative common-garden variety was used. Sources: UMN
// Extension (https://extension.umn.edu/flowers/sunflowers) where available,
// otherwise cross-checked spacing charts (Gardening Know How, Blooming
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
]
