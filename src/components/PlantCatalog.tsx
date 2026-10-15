import { useEffect, useRef, useState } from 'react'
import type { Plant } from '../domain/plant'
import PlantSwatch from './PlantSwatch'
import { catalogCategories, filterCatalog } from './plantChoice'
import type { CatalogCategory } from './plantChoice'

type PlantCatalogProps = {
  plants: Plant[]
  inventory: string[]
  /** Choosing a plant: the caller arms it, adds it to the inventory, and
   * closes the catalog. */
  onChoose: (plantId: string) => void
  onClose: () => void
}

/**
 * A centered popup for fast plant discovery and choosing: a dense grid of
 * plant tiles (visual + name only) with search and category filters. The
 * garden stays visible, dimmed, behind it. Details live in the inspector,
 * not on tiles. See PRODUCT.md "Catalog, Inventory, Canvas, Inspector".
 */
function PlantCatalog({ plants, inventory, onChoose, onClose }: PlantCatalogProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CatalogCategory>('all')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => searchRef.current?.focus(), [])

  const results = filterCatalog(plants, query, category)

  return (
    <div
      className="catalog-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="catalog"
        role="dialog"
        aria-modal="true"
        aria-label="Plant catalog"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        <div className="catalog__header">
          <input
            ref={searchRef}
            className="catalog__search"
            type="search"
            placeholder="Search plants"
            aria-label="Search plants"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter chooses the only match, so search-then-plant is quick.
              if (e.key === 'Enter' && results.length === 1) onChoose(results[0].id)
            }}
          />
          <button type="button" className="catalog__close" onClick={onClose} aria-label="Close catalog">
            ×
          </button>
        </div>

        <div className="catalog__filters" role="group" aria-label="Plant category">
          {catalogCategories(plants).map((c) => (
            <button
              type="button"
              key={c.id}
              className={`catalog__filter${c.id === category ? ' catalog__filter--active' : ''}`}
              aria-pressed={c.id === category}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <p className="catalog__empty">No plants match “{query.trim()}”.</p>
        ) : (
          <ul className="catalog__grid">
            {results.map((plant) => {
              const inInventory = inventory.includes(plant.id)
              return (
                <li key={plant.id}>
                  <button
                    type="button"
                    className="catalog__tile"
                    onClick={() => onChoose(plant.id)}
                    aria-label={`${plant.name}${inInventory ? ' (in your plants)' : ''}`}
                  >
                    <PlantSwatch plant={plant} />
                    <span className="catalog__name">{plant.name}</span>
                    {inInventory && <span className="catalog__in-inventory" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PlantCatalog
