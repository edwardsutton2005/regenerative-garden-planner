import type { SunlightLevel } from '../domain/garden'

export type SunlightBrush = SunlightLevel | 'clear'

/** The tools a toolbar button can select. The plant tool is armed by
 * choosing a plant (catalog or inventory), not from here. */
export type RailTool = 'select' | 'beds' | 'sunlight' | 'eraser'

type ToolRailProps = {
  /** The active tool, or 'plant' when a plant brush is armed. */
  activeTool: RailTool | 'plant'
  sunlightBrush: SunlightBrush
  onSelectTool: (tool: RailTool) => void
  onSelectSunlightBrush: (brush: SunlightBrush) => void
}

const TOOLS: { id: RailTool; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: 'Select' },
  { id: 'beds', icon: '▭', label: 'Beds' },
  { id: 'sunlight', icon: '☀', label: 'Sunlight' },
  { id: 'eraser', icon: '⌫', label: 'Eraser' },
]

// Short labels fit the narrow rail; the full name is the accessible label.
const BRUSHES: { id: SunlightBrush; label: string; name: string }[] = [
  { id: 'full-sun', label: 'Full', name: 'Full sun' },
  { id: 'partial-sun', label: 'Partial', name: 'Partial sun' },
  { id: 'shade', label: 'Shade', name: 'Shade' },
  { id: 'clear', label: 'Clear', name: 'Clear sunlight' },
]

/**
 * Compact mode buttons. Every tool is a persistent brush: it stays active
 * until another tool or plant is chosen, or Escape returns to Select. The
 * sunlight tool shows its Full / Partial / Shade / Clear brush while active.
 */
function ToolRail({ activeTool, sunlightBrush, onSelectTool, onSelectSunlightBrush }: ToolRailProps) {
  return (
    <nav className="tool-rail" aria-label="Tools">
      {TOOLS.map((tool) => (
        <button
          type="button"
          key={tool.id}
          className={`tool-rail__tool${activeTool === tool.id ? ' tool-rail__tool--active' : ''}`}
          aria-pressed={activeTool === tool.id}
          onClick={() => onSelectTool(tool.id)}
        >
          <span className="tool-rail__icon" aria-hidden="true">
            {tool.icon}
          </span>
          <span className="tool-rail__label">{tool.label}</span>
        </button>
      ))}
      {activeTool === 'sunlight' && (
        <div className="tool-rail__brushes" role="group" aria-label="Sunlight brush">
          {BRUSHES.map((brush) => (
            <button
              type="button"
              key={brush.id}
              className={`tool-rail__brush tool-rail__brush--${brush.id}${
                brush.id === sunlightBrush ? ' tool-rail__brush--active' : ''
              }`}
              aria-pressed={brush.id === sunlightBrush}
              aria-label={brush.name}
              title={brush.name}
              onClick={() => onSelectSunlightBrush(brush.id)}
            >
              <span className="tool-rail__swatch" aria-hidden="true" />
              {brush.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}

export default ToolRail
