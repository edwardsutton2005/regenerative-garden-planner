import type { EcologicalRole } from '../domain/plant'
import type { SourceId } from '../domain/source'

export type RoleInfo = {
  /** Short display name, e.g. in garden composition. */
  label: string
  /** The suggestion card's invitation. */
  suggestion: string
  /** What the role does for the garden, paraphrasing sourceIds. */
  why: string
  sourceIds: SourceId[]
}

export const roleInfo: Record<EcologicalRole, RoleInfo> = {
  'pollinator-support': {
    label: 'Pollinator support',
    suggestion: 'Add a pollinator plant',
    why: 'Flowers feed bees and other pollinators, which raise yields of crops like squash, melons, and berries.',
    sourceIds: ['clemson-hgic-plant-partners'],
  },
  'nitrogen-fixation': {
    label: 'Nitrogen fixing',
    suggestion: 'Add a nitrogen fixer',
    why: 'Legumes host soil bacteria that turn nitrogen from the air into a form plants can use.',
    sourceIds: ['ucanr-contra-costa-companion-planting', 'clemson-hgic-plant-partners'],
  },
  'beneficial-insects': {
    label: 'Beneficial insects',
    suggestion: 'Invite beneficial insects',
    why: 'Their flowers draw ladybugs, lacewings, and parasitic wasps that prey on aphids and caterpillars.',
    sourceIds: ['pennstate-extension-herb-companions', 'ucanr-contra-costa-companion-planting'],
  },
}
