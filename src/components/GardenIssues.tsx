import type { GardenIssue } from '../domain/issues'
import type { CanvasHighlight } from './GardenCanvas'
import SourceLinks from './SourceLinks'

// Turns a kebab-case literal like 'full-sun' into "Full sun" for display.
// Duplicated from PlacementFeedback's identical helper.
function formatEnumLabel(value: string): string {
  const spaced = value.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function issueText(issue: GardenIssue): string {
  switch (issue.kind) {
    case 'incompatible':
      return `${issue.plants[0].name} and ${issue.plants[1].name} may not grow well together.`
    case 'spacing':
      return `Two ${issue.plants[0].name} plants are too close — keep at least ${issue.requiredDistance} inches apart.`
    case 'crowding':
      return `${issue.plants[0].name} and ${issue.plants[1].name} may crowd each other.`
    case 'sunlight':
      return `${issue.plant.name} may not suit the sunlight here (${formatEnumLabel(issue.cellSunlight)}).`
  }
}

type GardenIssuesProps = {
  issues: GardenIssue[]
  show: boolean
  onToggle: () => void
  onSelectPlant: (placementId: string) => void
  onHighlight: (highlight: CanvasHighlight | null) => void
}

/**
 * Every current issue in the garden. The count always shows; the list, and
 * the marks on the canvas, only while switched on.
 */
function GardenIssues({ issues, show, onToggle, onSelectPlant, onHighlight }: GardenIssuesProps) {
  return (
    <section className="garden-suggestions" aria-label="Issues">
      <div className="garden-suggestions__header">
        <h3 className="garden-suggestions__title" id="garden-issues-title">
          Issues
          {issues.length > 0 && <span className="garden-issues__count">{issues.length}</span>}
        </h3>
        <button
          type="button"
          role="switch"
          aria-checked={show}
          aria-labelledby="garden-issues-title"
          className="switch"
          onClick={onToggle}
        >
          <span className="switch__thumb" />
        </button>
      </div>
      {show && issues.length === 0 && (
        <p className="garden-suggestions__done">No issues right now.</p>
      )}
      {show && issues.length > 0 && (
        <ul className="garden-suggestions__list" onMouseLeave={() => onHighlight(null)}>
          {issues.map((issue, i) => {
            const point = () => onHighlight({ bedIds: [], placementIds: issue.placementIds })
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`garden-issues__item garden-issues__item--${issue.kind}`}
                  onMouseEnter={point}
                  onFocus={point}
                  onBlur={() => onHighlight(null)}
                  onClick={() => onSelectPlant(issue.placementIds[0])}
                >
                  {issueText(issue)}
                  {issue.kind === 'incompatible' && issue.rule?.reason && (
                    <span className="placement-feedback__reason">{issue.rule.reason}</span>
                  )}
                </button>
                {issue.kind === 'incompatible' && <SourceLinks ids={issue.rule?.sourceIds} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default GardenIssues
