import { describe, expect, it } from 'vitest'
import { plants } from '../data/plants'
import {
  addToInventory,
  catalogCategories,
  filterCatalog,
  removeFromInventory,
} from './plantChoice'

describe('catalog filtering', () => {
  it('offers All plus the categories present in the data', () => {
    expect(catalogCategories(plants).map((c) => c.label)).toEqual([
      'All',
      'Vegetables',
      'Herbs',
      'Flowers',
    ])
  })

  it('returns everything for an empty search in All', () => {
    expect(filterCatalog(plants, '', 'all')).toEqual(plants)
  })

  it('searches names case-insensitively, ignoring surrounding spaces', () => {
    expect(filterCatalog(plants, '  BEAN ', 'all').map((p) => p.id)).toEqual(['bush-bean'])
  })

  it('filters by category, combined with search', () => {
    expect(filterCatalog(plants, '', 'herb').every((p) => p.category === 'herb')).toBe(true)
    expect(filterCatalog(plants, 'mint', 'vegetable')).toEqual([])
  })

  it('returns no matches for an unknown name', () => {
    expect(filterCatalog(plants, 'kale', 'all')).toEqual([])
  })
})

describe('inventory', () => {
  it('adds once, keeping order', () => {
    let inv = addToInventory([], 'tomato')
    inv = addToInventory(inv, 'basil')
    inv = addToInventory(inv, 'tomato')
    expect(inv).toEqual(['tomato', 'basil'])
  })

  it('returns the same list when the type is already present', () => {
    const inv = ['tomato']
    expect(addToInventory(inv, 'tomato')).toBe(inv)
  })

  it('removes a type', () => {
    expect(removeFromInventory(['tomato', 'basil'], 'tomato')).toEqual(['basil'])
  })
})
