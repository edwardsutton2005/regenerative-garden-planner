import { relationshipRules } from '../data/relationships'
import { evaluateGardenComposition } from '../domain/composition'
import type { GardenBed, GardenState } from '../domain/garden'
import { getBedAt, getPlacement, getPlacementsInBed } from '../domain/garden'
import {
  evaluateCompanionOpportunityForPlacement,
  evaluateGardenOpportunities,
} from '../domain/opportunities'
import type { Plant } from '../domain/plant'
import { evaluateNeighborsForFocuses } from '../domain/relationships'
import { evaluateSpacingForFocuses } from '../domain/spacing'
import { evaluateSunlightFit } from '../domain/sunlightFit'
import type { SunlightFitResult } from '../domain/sunlightFit'
import BedPanel from './BedPanel'
import GardenComposition from './GardenComposition'
import GardenInspector from './GardenInspector'
import GardenOpportunities from './GardenOpportunities'
import Icon from './Icon'
import PlacementFeedback from './PlacementFeedback'

type WorkspaceInspectorProps = {
  garden: GardenState
  plantsById: Record<string, Plant>
  open: boolean
  onToggleOpen: () => void
  /** The plants just placed or moved, for "what just happened?" feedback. */
  lastPlacementIds: string[]
  /** The selected plant, inspected in detail. */
  inspectedPlacementId: string | null
  selectedBed: GardenBed | undefined
  onRenameBed: (bedId: string, name: string) => void
  onDeleteBed: (bedId: string) => void
  onCloseSelection: () => void
}

/**
 * The collapsible right-hand panel: the selected bed or plant, feedback on
 * the last change, and garden-wide composition and opportunities. It asks the
 * domain for each of these; nothing here decides a gardening fact.
 */
function WorkspaceInspector({
  garden,
  plantsById,
  open,
  onToggleOpen,
  lastPlacementIds,
  inspectedPlacementId,
  selectedBed,
  onRenameBed,
  onDeleteBed,
  onCloseSelection,
}: WorkspaceInspectorProps) {
  return (
    <aside className="workspace__inspector" aria-label="Inspector">
      <button
        type="button"
        className="workspace__inspector-toggle"
        onClick={onToggleOpen}
        aria-expanded={open}
        aria-label={open ? 'Collapse inspector' : 'Expand inspector'}
      >
        <Icon name={open ? 'chevronRight' : 'chevronLeft'} size={16} />
      </button>
      {open && (
        <InspectorBody
          garden={garden}
          plantsById={plantsById}
          lastPlacementIds={lastPlacementIds}
          inspectedPlacementId={inspectedPlacementId}
          selectedBed={selectedBed}
          onRenameBed={onRenameBed}
          onDeleteBed={onDeleteBed}
          onCloseSelection={onCloseSelection}
        />
      )}
    </aside>
  )
}

// Evaluated only while the panel is open.
function InspectorBody({
  garden,
  plantsById,
  lastPlacementIds,
  inspectedPlacementId,
  selectedBed,
  onRenameBed,
  onDeleteBed,
  onCloseSelection,
}: Omit<WorkspaceInspectorProps, 'open' | 'onToggleOpen'>) {
  const neighbors = evaluateNeighborsForFocuses(
    garden,
    lastPlacementIds,
    plantsById,
    relationshipRules,
  )
  const spacingViolations = evaluateSpacingForFocuses(garden, lastPlacementIds, plantsById)
  const sunlightMismatches = lastPlacementIds
    .map((id) => evaluateSunlightFit(garden, id, plantsById))
    .filter((r): r is SunlightFitResult => r !== null && r.status === 'mismatch')

  const composition = evaluateGardenComposition(garden, plantsById)
  const gardenOpportunities = evaluateGardenOpportunities(garden, plantsById)

  const inspectedPlacement = inspectedPlacementId
    ? getPlacement(garden, inspectedPlacementId)
    : undefined
  const inspectedPlant = inspectedPlacement ? plantsById[inspectedPlacement.plantId] : undefined

  const selectedBedPlantNames = selectedBed
    ? getPlacementsInBed(garden, selectedBed.id)
        .map((p) => plantsById[p.plantId]?.name)
        .filter((name): name is string => name !== undefined)
    : []

  return (
    <div className="workspace__inspector-body">
      {selectedBed && (
        <BedPanel
          key={selectedBed.id}
          bed={selectedBed}
          plantNames={selectedBedPlantNames}
          onRename={(name) => onRenameBed(selectedBed.id, name)}
          onDelete={() => onDeleteBed(selectedBed.id)}
          onClose={onCloseSelection}
        />
      )}
      {inspectedPlacement && inspectedPlant && (
        <PlantInspection
          garden={garden}
          plantsById={plantsById}
          placementId={inspectedPlacement.id}
          plant={inspectedPlant}
          bedName={getBedAt(garden, inspectedPlacement.position)?.name}
          onClose={onCloseSelection}
        />
      )}
      {/* Temporary home for "what just happened?" feedback; Slice 2
          replaces it with short-lived messages on the canvas. */}
      <PlacementFeedback
        neighbors={neighbors}
        spacingViolations={spacingViolations}
        sunlightMismatches={sunlightMismatches}
      />
      <GardenComposition composition={composition} plantsById={plantsById} />
      <GardenOpportunities opportunities={gardenOpportunities} />
    </div>
  )
}

function PlantInspection({
  garden,
  plantsById,
  placementId,
  plant,
  bedName,
  onClose,
}: {
  garden: GardenState
  plantsById: Record<string, Plant>
  placementId: string
  plant: Plant
  bedName: string | undefined
  onClose: () => void
}) {
  const ids = [placementId]
  const companionOpportunity = evaluateCompanionOpportunityForPlacement(
    garden,
    placementId,
    plantsById,
    relationshipRules,
  )
  const companionCandidates = (companionOpportunity?.candidatePlantIds ?? [])
    .map((id) => plantsById[id])
    .filter((p): p is Plant => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <GardenInspector
      plant={plant}
      bedName={bedName}
      neighbors={evaluateNeighborsForFocuses(garden, ids, plantsById, relationshipRules)}
      spacingViolations={evaluateSpacingForFocuses(garden, ids, plantsById)}
      sunlightFit={evaluateSunlightFit(garden, placementId, plantsById)}
      companionCandidates={companionCandidates}
      onClose={onClose}
    />
  )
}

export default WorkspaceInspector
