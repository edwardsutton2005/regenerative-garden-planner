import type { GardenOpportunity } from '../domain/opportunities'

type GardenOpportunitiesProps = {
  opportunities: GardenOpportunity[]
}

function opportunityMessage(opportunity: GardenOpportunity): string {
  switch (opportunity.type) {
    case 'pollinator-support-absent':
      return 'Pollinator support is not currently represented. Consider adding a plant with pollinator-support.'
  }
}

function GardenOpportunities({ opportunities }: GardenOpportunitiesProps) {
  if (opportunities.length === 0) return null

  return (
    <div className="garden-opportunities">
      <h3 className="garden-opportunities__title">Opportunities</h3>
      <ul className="garden-opportunities__list">
        {opportunities.map((opportunity) => (
          <li key={opportunity.type} className="garden-opportunities__item">
            {opportunityMessage(opportunity)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GardenOpportunities
