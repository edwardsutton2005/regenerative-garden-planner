import { describe, expect, it } from 'vitest'
import { addBed, createGarden, movePlant, placePlant } from '../domain/garden'
import type { Plant } from '../domain/plant'
import type { PlantRelationshipRule } from '../domain/relationships'
import { evaluateNeighbors } from '../domain/relationships'
import { evaluateSpacing } from '../domain/spacing'
import { PREVIEW_PLACEMENT_ID, candidateFeedback, inspectedEnvelope } from './spacingPreview'

const tomato: Plant = {
  id: 'tomato',
  name: 'Tomato',
  category: 'vegetable',
  spacingInches: { min: 24, max: 36 },
  lifecycle: 'tender-perennial',
  ecologicalRoles: [],
}
const basil: Plant = {
  id: 'basil',
  name: 'Basil',
  category: 'herb',
  spacingInches: { min: 6, max: 12 },
  lifecycle: 'annual',
  ecologicalRoles: [],
}
const potato: Plant = {
  id: 'potato',
  name: 'Potato',
  category: 'vegetable',
  spacingInches: { min: 10, max: 12 },
  lifecycle: 'tender-perennial',
  ecologicalRoles: [],
}
const plantsById = { tomato, basil, potato }
const rules: PlantRelationshipRule[] = [
  { plantAId: 'tomato', plantBId: 'basil', relationship: 'companion' },
  { plantAId: 'tomato', plantBId: 'potato', relationship: 'incompatible' },
]

function garden() {
  let g = placePlant(createGarden(), 't1', 'tomato', { x: 20, y: 20 })
  g = placePlant(g, 't2', 'tomato', { x: 80, y: 20 })
  g = placePlant(g, 'b1', 'basil', { x: 60, y: 60 })
  g = placePlant(g, 'p1', 'potato', { x: 70, y: 70 })
  return g
}

describe('candidateFeedback', () => {
  it('draws envelopes of radius spacingInches.min (not max, not halved) around other same-species plants only', () => {
    const fb = candidateFeedback(garden(), plantsById, rules, {
      placementId: 't1',
      plantId: 'tomato',
      position: { x: 30, y: 100 },
    })
    const others = fb.envelopes.filter((e) => !e.own)
    expect(others).toEqual([
      { placementId: 't2', center: { x: 80, y: 20 }, radius: 24, violated: false, own: false },
    ])
    expect(fb.envelopes.find((e) => e.own)).toMatchObject({ placementId: 't1', radius: 24 })
  })

  it('marks a broken envelope, but exactly the minimum is not a violation', () => {
    const atMin = candidateFeedback(garden(), plantsById, rules, {
      placementId: 't1',
      plantId: 'tomato',
      position: { x: 56, y: 20 }, // 24" from t2
    })
    expect(atMin.envelopes.every((e) => !e.violated)).toBe(true)

    const inside = candidateFeedback(garden(), plantsById, rules, {
      placementId: 't1',
      plantId: 'tomato',
      position: { x: 57, y: 20 }, // 23"
    })
    expect(inside.envelopes.find((e) => e.placementId === 't2')?.violated).toBe(true)
    expect(inside.envelopes.find((e) => e.own)?.violated).toBe(true)
  })

  it('agrees with evaluateSpacing and evaluateNeighbors after an actual move', () => {
    const position = { x: 66, y: 66 }
    const fb = candidateFeedback(garden(), plantsById, rules, { placementId: 't1', plantId: 'tomato', position })
    const moved = movePlant(garden(), 't1', position)

    const violated = fb.envelopes.filter((e) => !e.own && e.violated).map((e) => e.placementId)
    expect(violated).toEqual(evaluateSpacing(moved, 't1', plantsById).map((v) => v.placementId))
    const notable = evaluateNeighbors(moved, 't1', plantsById, rules).filter((n) => n.relationship !== 'neutral')
    expect(Object.keys(fb.relationshipById).sort()).toEqual(notable.map((n) => n.placementId).sort())
  })

  it('outlines companion and incompatible plants within 12", never neutral or distant ones', () => {
    const fb = candidateFeedback(garden(), plantsById, rules, {
      placementId: 't1',
      plantId: 'tomato',
      position: { x: 65, y: 65 }, // ~7.1" from basil, ~7.1" from potato
    })
    expect(fb.relationshipById).toEqual({ b1: 'companion', p1: 'incompatible' })
  })

  it('never gives a different species an envelope or a cross-species violation', () => {
    const fb = candidateFeedback(garden(), plantsById, rules, {
      placementId: 'b1',
      plantId: 'basil',
      position: { x: 20, y: 21 }, // 1" from a tomato
    })
    expect(fb.envelopes).toEqual([
      { placementId: 'b1', center: { x: 20, y: 21 }, radius: 6, violated: false, own: true },
    ])
  })

  it('previews a new plant from the picker under a temporary id', () => {
    const fb = candidateFeedback(garden(), plantsById, rules, {
      placementId: null,
      plantId: 'tomato',
      position: { x: 30, y: 20 },
    })
    expect(fb.envelopes.find((e) => e.own)?.placementId).toBe(PREVIEW_PLACEMENT_ID)
    expect(fb.envelopes.find((e) => e.placementId === 't1')?.violated).toBe(true)
  })

  it('reports the bed under the candidate position', () => {
    const g = addBed(garden(), 'bed', 'Bed 1', { position: { x: 0, y: 90 }, width: 48, height: 24 })
    const fb = candidateFeedback(g, plantsById, rules, { placementId: 't1', plantId: 'tomato', position: { x: 10, y: 100 } })
    expect(fb.bedId).toBe('bed')
  })

  it('returns nothing for an unknown plant', () => {
    const fb = candidateFeedback(garden(), plantsById, rules, { placementId: null, plantId: 'kale', position: { x: 1, y: 1 } })
    expect(fb.envelopes).toEqual([])
  })
})

describe('inspectedEnvelope', () => {
  it('shows only the inspected plant\'s envelope, with violators from evaluateSpacing', () => {
    let g = garden()
    expect(inspectedEnvelope(g, plantsById, 't1')).toEqual({
      envelope: { placementId: 't1', center: { x: 20, y: 20 }, radius: 24, violated: false, own: true },
      violatorIds: [],
    })
    g = movePlant(g, 't2', { x: 30, y: 20 })
    expect(inspectedEnvelope(g, plantsById, 't1')?.violatorIds).toEqual(['t2'])
    expect(inspectedEnvelope(g, plantsById, 'missing')).toBeNull()
  })
})
