import type { KnowledgeSource } from '../domain/source'

// Registered only when actually attached to a specific curated claim
// elsewhere (currently: every plant's spacingGuidance and
// sunlightRequirement, in data/plants.ts) — not merely because a source is
// named in an existing dataset-wide sourcing comment. Dataset-wide
// vetting-policy sources (e.g. the companion-planting source pool described
// in data/relationships.ts) are
// deliberately not registered here until a specific claim can be honestly
// attributed to one of them.
//
// The spacingGuidance and sunlightRequirement sources below are the
// machine-readable source of truth for their provenance; see
// docs/data-sources.md "Spacing" and "Sunlight" for a
// human-readable table cross-referencing each plant, its normalized
// sunlightRequirement, and exactly what each source below does and does not
// explicitly state (kept in sync by hand — this file is not generated from
// that table, or vice versa).
export const sources: KnowledgeSource[] = [
  {
    id: 'umn-extension-sunflowers',
    title: 'Sunflowers',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/flowers/sunflowers',
  },
  {
    id: 'umn-extension-tomatoes',
    title: 'Growing tomatoes in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/vegetables/growing-tomatoes',
  },
  {
    id: 'umn-extension-herbs',
    title: 'Growing herbs in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-herbs',
  },
  {
    id: 'pennstate-extension-basil',
    title: 'Basil, A Summer Favorite',
    publisher: 'Penn State Extension',
    url: 'https://extension.psu.edu/basil-a-summer-favorite',
  },
  {
    id: 'umn-extension-marigolds',
    title: 'Marigolds',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/gardening-minnesota/marigolds',
  },
  {
    id: 'illinois-extension-get-started',
    title: 'Get Started',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/gardening/get-started',
  },
  {
    id: 'illinois-extension-rosemary',
    title: 'Rosemary',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/herbs/rosemary',
  },
  {
    id: 'illinois-extension-salad-in-the-shade',
    title: 'Use the whole garden and grow a salad in the shade',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2022-06-24-use-whole-garden-and-grow-salad-shade',
  },
  {
    id: 'illinois-extension-lettuce',
    title: 'Lettuce',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/gardening/lettuce',
  },
  {
    id: 'usu-extension-mint',
    title: 'How to Grow Mint in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/mint-in-the-garden',
  },
  {
    id: 'illinois-extension-sunflowers',
    title: 'Plant Sunflowers in Mid-May for Summer Beauty and Pollinator Power',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/news-releases/plant-sunflowers-mid-may-summer-beauty-and-pollinator-power',
  },
  {
    id: 'umn-extension-onions',
    title: 'Growing onions in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/vegetables/growing-onions',
  },
  {
    id: 'usu-extension-beans',
    title: 'How to Grow Beans in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/beans-in-the-garden',
  },
  {
    id: 'umn-extension-peas',
    title: 'Growing peas in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/vegetables/growing-peas',
  },
  {
    id: 'umn-extension-raised-bed-gardens',
    title: 'Raised bed gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/raised-bed-gardens',
  },
  {
    id: 'umn-extension-potatoes',
    title: 'Growing potatoes in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/vegetables/growing-potatoes',
  },
  {
    id: 'illinois-extension-dill',
    title: 'Dill',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/herbs/dill',
  },
  {
    id: 'usu-extension-cabbage',
    title: 'How to Grow Cabbage in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/cabbage-in-the-garden',
  },
  {
    id: 'illinois-extension-basil',
    title: 'Basil',
    publisher: 'Illinois Extension',
    url: 'https://extension.illinois.edu/herbs/basil',
  },
  {
    id: 'usu-extension-carrots',
    title: 'How to Grow Carrots in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/carrots-in-the-garden',
  },
  {
    id: 'umn-extension-basil',
    title: 'Growing basil in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/vegetables/growing-basil',
  },
  {
    id: 'ncsu-extension-peppermint',
    title: 'Mentha x piperita',
    publisher: 'North Carolina State Extension Plant Toolbox',
    url: 'https://plants.ces.ncsu.edu/plants/mentha-x-piperita/',
  },
  {
    id: 'pennstate-extension-rosemary',
    title: 'Herb Garden Plants: Rosemary',
    publisher: 'Penn State Extension',
    url: 'https://extension.psu.edu/herb-garden-plants-rosemary',
  },
  {
    id: 'clemson-hgic-marigolds',
    title: 'How to Grow and Care for Marigolds in South Carolina',
    publisher: 'Clemson Cooperative Extension Home & Garden Information Center',
    url: 'https://hgic.clemson.edu/factsheet/how-to-grow-and-care-for-marigolds-in-south-carolina/',
  },
  {
    id: 'usu-extension-peas',
    title: 'How to Grow Peas in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/peas-in-the-garden',
  },
  {
    id: 'usu-extension-peppers',
    title: 'How to Grow Peppers in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/peppers-in-the-garden',
  },
  {
    id: 'usu-extension-cucumber',
    title: 'How to Grow Cucumber in Your Garden',
    publisher: 'Utah State University Extension',
    url: 'https://extension.usu.edu/yardandgarden/research/cucumber-in-the-garden',
  },
  {
    id: 'umn-extension-dill',
    title: 'Growing dill in home gardens',
    publisher: 'University of Minnesota Extension',
    url: 'https://extension.umn.edu/vegetables/growing-dill',
  },
]
