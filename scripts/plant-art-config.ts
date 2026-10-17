// Central art direction and model settings for the plant-art pipeline.
// Tune the look here; scripts/generate-plant-assets.ts only orchestrates.
// See art/STYLE.md for the locked visual direction this encodes.

/** Gemini image model. Nano Banana Pro is the current model documented to
 * accept style reference images; swap here (e.g. 'gemini-nano-banana-2.1'
 * for cheaper, faster drafts) without touching generation logic. */
export const MODEL = 'gemini-3-pro-image'

/**
 * Published standard-tier prices in USD per 1M tokens (Gemini API pricing
 * page, checked 2026-10-16), used to estimate run cost from the token
 * counts the API reports. Update when Google's pricing changes.
 */
export const PRICING: Record<
  string,
  { input: number; textOutput: number; imageOutput: number; tokensPerImage: number }
> = {
  // tokensPerImage: image output tokens per image at IMAGE_CONFIG.imageSize
  // (2K), for the up-front estimate only; actual usage comes from responses.
  'gemini-3-pro-image': { input: 2.0, textOutput: 12.0, imageOutput: 120.0, tokensPerImage: 1120 },
  'gemini-nano-banana-2.1': { input: 1.5, textOutput: 7.5, imageOutput: 30.0, tokensPerImage: 1680 },
}

/** Upper bound on --variants per asset, to keep a typo from becoming a bill. */
export const MAX_VARIANTS = 4

/** Square output, large enough to downscale cleanly for the canvas and UI. */
export const IMAGE_CONFIG = { aspectRatio: '1:1', imageSize: '2K' } as const

/**
 * Background the model is asked to paint. Gemini does not return alpha, and
 * asking for "transparent" tends to produce a fake checkerboard. A flat key
 * color can be removed by a separate, optional post-processing step later.
 * Magenta suits plants (rarely magenta) and avoids greens and yellows.
 */
export const BACKGROUND = {
  description: 'a perfectly flat, uniform, solid pure magenta (#FF00FF) background',
  hex: '#FF00FF',
}

export type AssetKind = 'plant' | 'icon'

type AssetSpec = {
  /** Reference images (paths from the repo root), sent as image inputs in
   * order. Add approved assets here to strengthen consistency over time. */
  references: string[]
  /** What this asset is, independent of plant. */
  brief: string
  /** Rules shared by every plant of this kind. */
  rules: string[]
}

const SHARED_STYLE = [
  'chunky, cozy garden-game aesthetic',
  'pixel-art-inspired but relatively high resolution, with visible blocky pixel clusters',
  'simplified botanical forms with a strong, recognizable silhouette',
  'saturated natural colors, crisp blocky edges, selective highlights',
  'minimal micro-detail; recognizable at small sizes',
  'match the reference images exactly in pixel scale, saturation, lighting, outline darkness, and edge treatment',
  'render the entire subject completely, with the same sharpness and finished pixel detail all the way to every edge; no blurred, faded, smeared, or unfinished areas anywhere',
]

const SHARED_EXCLUSIONS = [
  'no soil, dirt, ground tile, grass, or terrain',
  'no pot, planter, or container',
  'no environment or scenery',
  'no text, letters, labels, or watermark',
  'no border, frame, or UI elements',
  'no checkerboard or fake transparency pattern',
  'no drop shadow on the background',
]

export const ASSETS: Record<AssetKind, AssetSpec> = {
  plant: {
    references: ['art/references/tomato-plant-reference.png'],
    brief:
      'a single mature plant seen from directly overhead (top-down), as a sprite for a garden-planner canvas',
    rules: [
      'consistent straight-down overhead perspective, like the reference plant',
      'the whole plant visible and centered, filling most of the square with even margins',
      'isolated plant only',
    ],
  },
  icon: {
    references: ['art/references/tomato-icon-reference.png'],
    brief:
      "a large, immediately recognizable inventory/catalog icon of the plant's most recognizable part (its crop, leaf, or flower)",
    rules: [
      'use the reference icon as the primary style guide: same pixel/detail scale and rendering',
      'a single centered isolated subject filling most of the square with even margins',
    ],
  },
}

/**
 * Optional per-plant subject hints, keyed by plant id, for plants whose name
 * alone is ambiguous or whose top-down form needs describing. Deliberately
 * visual only: no horticultural claims.
 */
export const SUBJECT_HINTS: Partial<Record<string, Partial<Record<AssetKind, string>>>> = {
  basil: {
    plant: 'a bushy sweet basil plant: dense clusters of glossy, rounded, bright green leaves',
    icon: 'a small bunch of glossy, rounded sweet basil leaves on a short stem',
  },
  sunflower: {
    plant:
      'a branching sunflower plant seen from above: several golden-yellow flower heads with dark brown centers among large green leaves',
    icon: 'a single sunflower head, golden-yellow petals around a dark brown seed center',
  },
  carrot: {
    plant: 'a carrot plant seen from above: a dense rosette of feathery, finely divided bright green leaves',
    icon: 'a single orange carrot root with its leafy green top',
  },
  lettuce: {
    plant: 'a loose-leaf lettuce plant seen from above: a rosette of ruffled, frilly light green leaves',
    icon: 'a fresh head of ruffled light green leaf lettuce',
  },
  mint: {
    plant: 'a spreading mint plant seen from above: many upright stems with paired, oval, toothed bright green leaves',
    icon: 'a sprig of fresh mint: a short stem with paired oval, toothed green leaves (the herb, not candy)',
  },
  rosemary: {
    plant: 'a rosemary shrub seen from above: many woody stems covered in short, narrow, needle-like dark green leaves',
    icon: 'a sprig of rosemary: a woody stem lined with narrow needle-like dark green leaves',
  },
  onion: {
    plant: 'an onion plant seen from above: a fan of tall, hollow, tubular blue-green leaves rising from the center',
    icon: 'a single golden-brown onion bulb with papery skin and a short green top',
  },
  'bush-bean': {
    plant:
      'a bush bean plant seen from above: a compact mound of broad, heart-shaped trifoliate green leaves with slender green bean pods',
    icon: 'a small bunch of slender, smooth green bean pods',
  },
  pea: {
    plant:
      'a pea plant seen from above: soft blue-green rounded leaflets with curling tendrils, small white flowers, and plump green pea pods',
    icon: 'a plump green pea pod, partly open to show round green peas inside',
  },
  'bell-pepper': {
    plant: 'a bell pepper plant seen from above: glossy green leaves with several blocky bell peppers',
    icon: 'a single glossy red bell pepper with a green stem',
  },
  cucumber: {
    plant:
      'a sprawling cucumber vine seen from above: large lobed, rough green leaves, small yellow flowers, and long green cucumbers',
    icon: 'a single long dark green cucumber with subtle bumps and a short stem',
  },
  cabbage: {
    plant:
      'a cabbage plant seen from above: a round, tightly packed pale green head surrounded by broad, cupped, blue-green outer leaves',
    icon: 'a round head of green cabbage with a few loose outer leaves',
  },
  potato: {
    plant: 'a potato plant seen from above: a bushy mound of dark green compound leaves with a few small white flowers',
    icon: 'a single brown potato tuber with a few small eyes',
  },
  dill: {
    plant: 'a dill plant seen from above: airy, thread-like feathery blue-green fronds with flat yellow flower umbels',
    icon: 'a sprig of dill: feathery thread-like green fronds on a thin stem',
  },
  marigold: {
    plant: 'a bushy French marigold plant seen from above: ruffled orange-gold pompom flowers among finely divided dark green leaves',
    icon: 'a single ruffled orange-gold marigold flower head',
  },
}

/** The full prompt for one asset. Pure and deterministic: same inputs, same prompt. */
export function buildPrompt(kind: AssetKind, plantName: string, plantId: string): string {
  const spec = ASSETS[kind]
  const subject = SUBJECT_HINTS[plantId]?.[kind] ?? `${plantName.toLowerCase()} plant`
  return [
    `Create ${spec.brief}.`,
    `Subject: ${subject} (${plantName}).`,
    'The attached reference image(s) define the art style. Reproduce that style precisely; do not copy their subject.',
    `Style: ${SHARED_STYLE.join('; ')}.`,
    `Composition: ${spec.rules.join('; ')}.`,
    `Background: ${BACKGROUND.description}.`,
    `Exclusions: ${SHARED_EXCLUSIONS.join('; ')}.`,
  ].join('\n')
}
