import Icon from './components/Icon'
import { plantIconUrl, plantSpriteUrl } from './components/plantArt'
import { plants } from './data/plants'
import './Landing.css'

const PLANNER_URL = '/plan/'

// The hero garden: a still picture of the planner, positioned in percent of
// the scene. The notes repeat the planner's own wording for these pairs
// (Tomato + Basil companion, Tomato + Potato incompatible in data/).
const SCENE_PLANTS = [
  { id: 'tomato', x: 33, y: 36 },
  { id: 'basil', x: 47, y: 38 },
  { id: 'marigold', x: 60, y: 32 },
  { id: 'lettuce', x: 24, y: 40 },
  { id: 'sunflower', x: 80, y: 22 },
  { id: 'potato', x: 36, y: 61 },
  { id: 'bush-bean', x: 76, y: 66 },
  { id: 'pea', x: 60, y: 63 },
]

const STEPS = [
  {
    title: 'Place',
    text: 'Draw raised beds and drop plants anywhere on a plot measured in real feet and inches.',
  },
  {
    title: 'Observe',
    text: 'Notes appear as you go: good pairings, poor pairings, and plants packed too close.',
  },
  {
    title: 'Improve',
    text: 'Move things around, undo, try again. Every note says why, so you learn while you design.',
  },
]

const FEATURES = [
  {
    icons: ['tomato', 'basil'],
    title: 'Companions',
    text: 'Spots good and poor pairings, like Tomato and Basil, planted within a foot of each other.',
  },
  {
    icons: ['cabbage'],
    title: 'Spacing',
    text: 'Warns when two of the same plant are too close, using spacing from university extension guides.',
  },
  {
    icons: [],
    title: 'Sunlight',
    text: 'Paint full sun, partial sun, and shade onto your plot, then check whether each plant suits its spot.',
  },
  {
    icons: ['sunflower', 'pea'],
    title: 'Ecological roles',
    text: 'Shows which plants in your garden support pollinators or fix nitrogen.',
  },
]

function PlannerLink({ className }: { className: string }) {
  return (
    <a className={className} href={PLANNER_URL}>
      Start planning
    </a>
  )
}

function GardenScene() {
  return (
    <div className="scene" role="img" aria-label="A garden plot with a raised bed of tomato, basil, marigold, and lettuce, and notes about which plants pair well.">
      <div className="scene__plot" />
      <div className="scene__bed" />
      {SCENE_PLANTS.map(({ id, x, y }) => (
        <img
          key={id}
          className="scene__plant"
          src={plantSpriteUrl(id)}
          alt=""
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
      <p className="scene__note scene__note--good" style={{ left: '50%', top: '15%' }}>
        Great pairing: Tomato + Basil
      </p>
      <p className="scene__note scene__note--issue" style={{ left: '50%', top: '80%' }}>
        Tomato and Potato may not grow well together.
      </p>
    </div>
  )
}

function Landing() {
  return (
    <div className="landing">
      <header className="landing__header">
        <a className="landing__brand" href="/">
          <img src={plantIconUrl('tomato')} alt="" width={32} height={32} />
          Regenerative Garden Planner
        </a>
        <a className="landing__header-link" href={PLANNER_URL}>
          Open the planner
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <h1>Design a garden where plants work together.</h1>
            <p className="hero__lede">
              Lay out beds and plants on a plot drawn to scale. The planner tells you which plants help
              each other, which clash, and which are too close, as you place them.
            </p>
            <PlannerLink className="button button--primary" />
            <p className="hero__small">Free · No account needed · Best in a desktop browser</p>
          </div>
          <GardenScene />
        </section>

        <section className="section" aria-labelledby="how-heading">
          <h2 id="how-heading">How it works</h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card steps__item">
                <span className="steps__number">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="knows-heading">
          <h2 id="knows-heading">What the garden understands</h2>
          <ul className="features">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="card features__item">
                <span className="features__art">
                  {feature.icons.length === 0 ? (
                    <span className="features__sun">
                      <Icon name="sun" size={30} />
                    </span>
                  ) : (
                    feature.icons.map((id) => (
                      <img key={id} src={plantIconUrl(id)} alt="" width={40} height={40} />
                    ))
                  )}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section principle">
          <h2>No scores. No guesswork.</h2>
          <p>
            Feedback comes from curated plant data and clear rules, not AI guesses. Each note names
            the plants and the reason. When the planner doesn&rsquo;t know something, it says so.
          </p>
        </section>

        <section className="section" aria-labelledby="plants-heading">
          <h2 id="plants-heading">{plants.length} garden plants to start</h2>
          <ul className="shelf">
            {plants.filter((plant) => plantIconUrl(plant.id)).map((plant) => (
              <li key={plant.id} className="shelf__item">
                <img src={plantIconUrl(plant.id)} alt="" width={56} height={56} />
                {plant.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="closing">
          <h2>Your plot is waiting.</h2>
          <PlannerLink className="button button--primary" />
        </section>
      </main>

      <footer className="landing__footer">Regenerative Garden Planner</footer>
    </div>
  )
}

export default Landing
