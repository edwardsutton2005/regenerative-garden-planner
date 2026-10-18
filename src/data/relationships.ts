import type { PlantRelationshipRule } from '../domain/relationships'

// Relationships below are limited to pairings supported by a credible
// research/extension source, or by multiple reputable gardening sources
// without a material contradiction. Pairs that were disputed across sources
// (e.g. tomato/carrot) or only weakly supported were left neutral rather than
// guessed at. Incompatible pairings are held to the same bar and kept
// deliberately conservative.
//
// Each rule's sourceIds name the sources that list the pair; `reason` is
// written only where one of those sources states why, and paraphrases it.
// A pair a source lists without saying why has no reason rather than an
// invented one. Most companion-planting advice is traditional rather than
// tested, so reasons say "reported" or "said to" unless the source cites
// trials. See docs/data-sources.md "Relationships".
export const relationshipRules: PlantRelationshipRule[] = [
  {
    plantAId: 'tomato',
    plantBId: 'basil',
    relationship: 'companion',
    reason: 'Basil helps hide tomatoes from thrips and has been shown to cut hornworm egg-laying.',
    sourceIds: ['pennstate-extension-herb-companions', 'usu-extension-companion-planting'],
  },
  {
    plantAId: 'tomato',
    plantBId: 'marigold',
    relationship: 'companion',
    reason: 'Marigolds are reported to reduce whiteflies, and their roots release a compound that kills some nematodes.',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'carrot',
    plantBId: 'rosemary',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart'],
  },
  { plantAId: 'lettuce', plantBId: 'marigold', relationship: 'companion' },
  {
    plantAId: 'lettuce',
    plantBId: 'mint',
    relationship: 'companion',
    reason: 'Mint’s strong scent can help keep deer and other pests off lettuce.',
    sourceIds: ['usu-extension-companion-planting'],
  },
  {
    plantAId: 'tomato',
    plantBId: 'onion',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'bell-pepper',
    plantBId: 'basil',
    relationship: 'companion',
    reason: 'Basil is reported to improve pepper growth.',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'bell-pepper',
    plantBId: 'onion',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'cucumber',
    plantBId: 'bush-bean',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'cucumber',
    plantBId: 'dill',
    relationship: 'companion',
    reason: 'Dill attracts ladybugs and parasitic wasps that help keep cucumber pests down.',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'onion',
    plantBId: 'carrot',
    relationship: 'companion',
    reason: 'Onions deter carrot flies, and the two loosen the soil for each other.',
    sourceIds: [
      'usu-extension-companion-planting',
      'almanac-companion-chart',
      'clemson-hgic-plant-partners',
    ],
  },
  {
    plantAId: 'onion',
    plantBId: 'lettuce',
    relationship: 'companion',
    reason: 'Onions mask lettuce’s scent, which is said to help deter pests.',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'onion',
    plantBId: 'cabbage',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'pea',
    plantBId: 'carrot',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'pea',
    plantBId: 'lettuce',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'pea',
    plantBId: 'mint',
    relationship: 'companion',
    reason: 'Mint is reported to deter aphids and flea beetles.',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'potato',
    plantBId: 'basil',
    relationship: 'companion',
    reason: 'Basil is reported to deter Colorado potato beetles.',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'potato',
    plantBId: 'bush-bean',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'potato',
    plantBId: 'pea',
    relationship: 'companion',
    sourceIds: ['almanac-companion-chart'],
  },
  {
    plantAId: 'cabbage',
    plantBId: 'dill',
    relationship: 'companion',
    reason: 'Dill discourages cabbageworm moths from laying eggs and attracts wasps that prey on caterpillars.',
    sourceIds: ['pennstate-extension-herb-companions', 'almanac-companion-chart'],
  },
  {
    plantAId: 'bush-bean',
    plantBId: 'rosemary',
    relationship: 'companion',
    reason: 'Rosemary’s aromatic oils are reported to deter bean beetles.',
    sourceIds: ['almanac-companion-chart', 'uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'tomato',
    plantBId: 'potato',
    relationship: 'incompatible',
    reason: 'Both are nightshades that get the same blight and share pests, so problems spread between them.',
    sourceIds: ['uw-extension-kenosha-companion-plants', 'almanac-potato-companions'],
  },
  {
    plantAId: 'onion',
    plantBId: 'bush-bean',
    relationship: 'incompatible',
    reason: 'Onions are reported to stunt the growth of beans.',
    sourceIds: ['uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'onion',
    plantBId: 'pea',
    relationship: 'incompatible',
    reason: 'Onions are reported to stunt the growth of peas.',
    sourceIds: ['uw-extension-kenosha-companion-plants'],
  },
  {
    plantAId: 'carrot',
    plantBId: 'dill',
    relationship: 'incompatible',
    reason: 'Dill can stunt carrots, and as relatives they attract the same pests and can cross-pollinate.',
    sourceIds: ['clemson-hgic-plant-partners', 'ucanr-contra-costa-companion-planting'],
  },
  {
    plantAId: 'cucumber',
    plantBId: 'potato',
    relationship: 'incompatible',
    reason: 'Both are heavy feeders that compete for nutrients, and they share some pests.',
    sourceIds: ['almanac-potato-companions'],
  },
]
