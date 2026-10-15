import type { Plant, PlantCategory } from '../domain/plant'

// Catalog filtering and inventory list helpers. UI-only: the inventory is a
// palette of plant types in use, never an input to reasoning.

export type CatalogCategory = 'all' | PlantCategory

const CATEGORY_LABELS: Record<PlantCategory, string> = {
  vegetable: 'Vegetables',
  herb: 'Herbs',
  flower: 'Flowers',
}

/** "All" plus each category present in the data, in first-seen order. */
export function catalogCategories(plants: Plant[]): { id: CatalogCategory; label: string }[] {
  const present = [...new Set(plants.map((p) => p.category))]
  return [{ id: 'all', label: 'All' }, ...present.map((id) => ({ id, label: CATEGORY_LABELS[id] }))]
}

/** Plants matching a case-insensitive name search and a category, in data order. */
export function filterCatalog(plants: Plant[], query: string, category: CatalogCategory): Plant[] {
  const q = query.trim().toLowerCase()
  return plants.filter(
    (p) => (category === 'all' || p.category === category) && p.name.toLowerCase().includes(q),
  )
}

/** Adds a plant type to the end of the inventory, unless it's already there. */
export function addToInventory(inventory: string[], plantId: string): string[] {
  return inventory.includes(plantId) ? inventory : [...inventory, plantId]
}

export function removeFromInventory(inventory: string[], plantId: string): string[] {
  return inventory.filter((id) => id !== plantId)
}
