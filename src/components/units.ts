// Display formatting for physical lengths (the domain stores inches).

export function formatLength(inches: number): string {
  const feet = Math.floor(inches / 12)
  const rest = Math.round((inches - feet * 12) * 10) / 10
  if (rest === 0) return `${feet} ft`
  if (feet === 0) return `${rest} in`
  return `${feet} ft ${rest} in`
}

export function formatSize(width: number, height: number): string {
  return `${formatLength(width)} × ${formatLength(height)}`
}
