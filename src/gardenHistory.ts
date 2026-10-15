import type { GardenState } from './domain/garden'

// Undo/redo for garden changes, as pure state transitions on one value, so
// recording history stays a pure React state update. Inventory and tool
// state deliberately live outside it. See ARCHITECTURE.md "Interaction State".

/** How many earlier garden states are kept for undo. */
export const UNDO_LIMIT = 100

export type GardenHistory = {
  /** Null on the setup screen, before a garden exists. */
  garden: GardenState | null
  /** Earlier states, newest last. */
  past: GardenState[]
  /** Undone states, most recently undone last. */
  future: GardenState[]
}

export const EMPTY_HISTORY: GardenHistory = { garden: null, past: [], future: [] }

export function startHistory(garden: GardenState | null): GardenHistory {
  return { garden, past: [], future: [] }
}

/**
 * Applies a change as one undo step, and clears redo. Domain operations
 * return the same object when nothing changes, so a no-op records nothing.
 */
export function applyChange(
  history: GardenHistory,
  change: (garden: GardenState) => GardenState,
): GardenHistory {
  if (!history.garden) return history
  const next = change(history.garden)
  if (next === history.garden) return history
  return {
    garden: next,
    past: [...history.past, history.garden].slice(-UNDO_LIMIT),
    future: [],
  }
}

/**
 * Records the current garden as an undo step without changing it. Used at
 * the start of a multi-part change (a sunlight stroke), whose parts are then
 * applied with applyWithoutRecording, so the whole change undoes at once.
 */
export function recordCheckpoint(history: GardenHistory): GardenHistory {
  if (!history.garden) return history
  return {
    garden: history.garden,
    past: [...history.past, history.garden].slice(-UNDO_LIMIT),
    future: [],
  }
}

export function applyWithoutRecording(
  history: GardenHistory,
  change: (garden: GardenState) => GardenState,
): GardenHistory {
  return history.garden ? { ...history, garden: change(history.garden) } : history
}

export function undo(history: GardenHistory): GardenHistory {
  if (history.past.length === 0 || !history.garden) return history
  return {
    garden: history.past[history.past.length - 1],
    past: history.past.slice(0, -1),
    future: [...history.future, history.garden],
  }
}

export function redo(history: GardenHistory): GardenHistory {
  if (history.future.length === 0 || !history.garden) return history
  return {
    garden: history.future[history.future.length - 1],
    past: [...history.past, history.garden],
    future: history.future.slice(0, -1),
  }
}
