import type { GardenState, Position } from '../domain/garden'
import { getAllPlacements, getBedAt, movePlant, placePlant } from '../domain/garden'
import type { Plant } from '../domain/plant'
import { evaluateNeighbors } from '../domain/relationships'
import type { PlantRelationshipRule } from '../domain/relationships'
import { evaluateSpacing } from '../domain/spacing'

// UI-side visualization of existing domain rules. A spacing "envelope" is a
// dashed circle of radius spacingInches.min drawn to show the sourced
// same-species minimum-spacing rule: another plant of the same species whose
// center lies inside it violates that minimum. It is NOT a plant size or
// footprint. All violations and relationships come from the domain
// evaluators; nothing here re-implements a rule. See ARCHITECTURE.md
// "Coordinate Spaces and the Canvas".

/** Placement id used for a not-yet-placed plant being dragged from the picker. */
export const PREVIEW_PLACEMENT_ID = '__preview__'

export type SpacingEnvelope = {
  placementId: string
  center: Position
  radius: number
  /** For another plant's envelope: the candidate breaks it. For the
   * candidate's/inspected plant's own envelope: any same-species plant is
   * inside it. */
  violated: boolean
  /** The dragged or inspected plant's own envelope (drawn dashed). */
  own: boolean
}

export type CandidateFeedback = {
  envelopes: SpacingEnvelope[]
  /** Plants within the interaction distance with a non-neutral relationship. */
  relationshipById: Record<string, 'companion' | 'incompatible'>
  /** The bed the candidate position falls in, if any. */
  bedId: string | undefined
}

export type DragCandidate = {
  /** The placement being moved, or null for a new plant from the picker. */
  placementId: string | null
  plantId: string
  position: Position
}

const NO_FEEDBACK: CandidateFeedback = { envelopes: [], relationshipById: {}, bedId: undefined }

/**
 * What would be true if the candidate were dropped here: evaluated by
 * applying the candidate to a copy of the garden with the same pure domain
 * operations a real drop uses, then running the existing evaluators.
 */
export function candidateFeedback(
  garden: GardenState,
  plantsById: Record<string, Plant>,
  rules: PlantRelationshipRule[],
  candidate: DragCandidate,
): CandidateFeedback {
  const plant = plantsById[candidate.plantId]
  const id = candidate.placementId ?? PREVIEW_PLACEMENT_ID
  const hypothetical = candidate.placementId
    ? movePlant(garden, id, candidate.position)
    : placePlant(garden, id, candidate.plantId, candidate.position)
  if (!plant || hypothetical.placements[id]?.plantId !== plant.id) return NO_FEEDBACK

  const violatedIds = new Set(evaluateSpacing(hypothetical, id, plantsById).map((v) => v.placementId))
  const radius = plant.spacingInches.min
  const envelopes: SpacingEnvelope[] = getAllPlacements(hypothetical)
    .filter((p) => p.id !== id && p.plantId === plant.id)
    .map((p) => ({
      placementId: p.id,
      center: p.position,
      radius,
      violated: violatedIds.has(p.id),
      own: false,
    }))
  envelopes.push({
    placementId: id,
    center: candidate.position,
    radius,
    violated: violatedIds.size > 0,
    own: true,
  })

  const relationshipById: CandidateFeedback['relationshipById'] = {}
  for (const n of evaluateNeighbors(hypothetical, id, plantsById, rules)) {
    if (n.relationship !== 'neutral') relationshipById[n.placementId] = n.relationship
  }

  return { envelopes, relationshipById, bedId: getBedAt(hypothetical, candidate.position)?.id }
}

/**
 * The inspected plant's own envelope, and which same-species plants are
 * inside it (from evaluateSpacing). Null for an unknown placement or plant.
 */
export function inspectedEnvelope(
  garden: GardenState,
  plantsById: Record<string, Plant>,
  placementId: string,
): { envelope: SpacingEnvelope; violatorIds: string[] } | null {
  const placement = garden.placements[placementId]
  const plant = placement ? plantsById[placement.plantId] : undefined
  if (!placement || !plant) return null

  const violatorIds = evaluateSpacing(garden, placementId, plantsById).map((v) => v.placementId)
  return {
    envelope: {
      placementId,
      center: placement.position,
      radius: plant.spacingInches.min,
      violated: violatorIds.length > 0,
      own: true,
    },
    violatorIds,
  }
}
