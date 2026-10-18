import { sources } from '../data/sources'
import type { SourceId } from '../domain/source'

const sourcesById = new Map(sources.map((source) => [source.id, source]))

/** "Source: Penn State Extension, …" with each publisher linking to the page. */
function SourceLinks({ ids }: { ids: SourceId[] | undefined }) {
  const found = (ids ?? []).flatMap((id) => sourcesById.get(id) ?? [])
  if (found.length === 0) return null
  return (
    <span className="source-links">
      {found.length === 1 ? 'Source: ' : 'Sources: '}
      {found.map((source, i) => (
        <span key={source.id}>
          {i > 0 && ', '}
          <a href={source.url} target="_blank" rel="noreferrer" title={source.title}>
            {source.publisher}
          </a>
        </span>
      ))}
    </span>
  )
}

export default SourceLinks
