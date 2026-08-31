import type { SunlightLevel } from '../domain/garden'

type SunlightPickerProps = {
  activeLevel: SunlightLevel | null
  clearSelected: boolean
  onSelectLevel: (level: SunlightLevel) => void
  onSelectClear: () => void
}

const SUNLIGHT_LEVELS: { level: SunlightLevel; label: string }[] = [
  { level: 'full-sun', label: 'Full Sun' },
  { level: 'partial-sun', label: 'Partial Sun' },
  { level: 'shade', label: 'Shade' },
]

function SunlightPicker({
  activeLevel,
  clearSelected,
  onSelectLevel,
  onSelectClear,
}: SunlightPickerProps) {
  return (
    <div className="sunlight-picker">
      <h2>Sunlight</h2>
      <ul>
        {SUNLIGHT_LEVELS.map(({ level, label }) => (
          <li key={level}>
            <button
              type="button"
              className={`plant-option sunlight-option sunlight-option--${level}${
                level === activeLevel ? ' plant-option--selected' : ''
              }`}
              aria-pressed={level === activeLevel}
              onClick={() => onSelectLevel(level)}
            >
              {label}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={`plant-option plant-option--eraser${
              clearSelected ? ' plant-option--selected' : ''
            }`}
            aria-pressed={clearSelected}
            onClick={onSelectClear}
          >
            Clear Sunlight
          </button>
        </li>
      </ul>
    </div>
  )
}

export default SunlightPicker
