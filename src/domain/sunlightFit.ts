import type { GardenState, SunlightLevel } from './garden'
import { cellAt, getPlacement, getSunlightAt } from './garden'
import type { Plant } from './plant'

/**
 * `fit` / `mismatch` require both the cell's sunlight and the plant's
 * requirement to be modeled. `unmodeled-cell` and `unmodeled-requirement`
 * are both "we don't know," never conflated with `mismatch` — see
 * PRODUCT.md Part 3B and docs/data-sources.md.
 */
export type SunlightFitStatus = 'fit' | 'mismatch' | 'unmodeled-cell' | 'unmodeled-requirement'

export type SunlightFitResult = {
  placementId: string
  plant: Plant
  cellSunlight: SunlightLevel | undefined
  status: SunlightFitStatus
}

/**
 * Whether the given placement's plant fits the sunlight modeled for the
 * environmental cell containing its position. The plant is looked up from
 * GardenState + plantsById rather than
 * accepted as a separate argument, so it can never disagree with what's
 * actually placed there (same reasoning as
 * evaluateCompanionOpportunityForPlacement).
 *
 * Categorical set membership only — SunlightLevel is not treated as an
 * ordered scale, so there is no "too much" or "too little," only "accepted"
 * or "not accepted." When the cell's sunlight or the plant's requirement
 * isn't modeled yet, that is reported as its own status, never folded into
 * `mismatch`. If both are unmodeled, unmodeled-requirement takes priority:
 * without a modeled requirement no comparison is possible regardless of the
 * cell, and it is a data-curation gap on our side rather than something the
 * user can resolve by painting the cell.
 *
 * Returns null for an unknown placement or plant id — nothing to report, matching the rest of this module's
 * null-for-nothing-to-say convention.
 */
export function evaluateSunlightFit(
  garden: GardenState,
  placementId: string,
  plantsById: Record<string, Plant>,
): SunlightFitResult | null {
  const placement = getPlacement(garden, placementId)
  const plant = placement ? plantsById[placement.plantId] : undefined
  const cell = placement ? cellAt(garden, placement.position) : undefined
  if (!plant || !cell) return null

  const cellSunlight = getSunlightAt(garden, cell.row, cell.col)
  const requirement = plant.sunlightRequirement

  const status: SunlightFitStatus = !requirement
    ? 'unmodeled-requirement'
    : cellSunlight === undefined
      ? 'unmodeled-cell'
      : requirement.includes(cellSunlight)
        ? 'fit'
        : 'mismatch'

  return { placementId, plant, cellSunlight, status }
}
