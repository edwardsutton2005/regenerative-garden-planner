import type { KnowledgeSource } from '../domain/source'

// Registered only when actually attached to a specific curated claim
// elsewhere (currently: sunflower's spacingGuidance in data/plants.ts) — not
// merely because a source is named in an existing dataset-wide sourcing
// comment. Dataset-wide vetting-policy sources (e.g. the general spacing or
// companion-planting source pools described in data/plants.ts and
// data/relationships.ts) are deliberately not registered here until a
// specific claim can be honestly attributed to one of them.
export const sources: KnowledgeSource[] = [
  {
    id: 'umn-extension-sunflowers',
    title: 'Sunflowers',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/flowers/sunflowers',
  },
]
