import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_GARDEN_NAME, PLAN_SCHEMA_VERSION, parsePlanData } from './gardenPlan'
import type { GardenPlan, LoadedPlan } from './gardenPlan'

/**
 * Gardens saved to an account: rows in the `gardens` table (see
 * supabase/migrations). A row's `plan` holds the same shape as the browser
 * save, minus the name, which has its own column. Every call throws on
 * failure; callers decide what to tell the user.
 */

export type GardenSummary = {
  id: string
  name: string
  width: number
  height: number
  updatedAt: string
}

export async function listGardens(client: SupabaseClient): Promise<GardenSummary[]> {
  const { data, error } = await client
    .from('gardens')
    .select('id, name, updated_at, width:plan->garden->width, height:plan->garden->height')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    width: Number(row.width),
    height: Number(row.height),
    updatedAt: row.updated_at,
  }))
}

/** Null if the garden no longer exists. Throws if it exists but can't be
 * read (for example, saved by a newer version of the app), so it's never
 * mistaken for missing and overwritten. */
export async function loadGarden(client: SupabaseClient, id: string): Promise<LoadedPlan | null> {
  const { data, error } = await client.from('gardens').select('name, plan').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const loaded = parsePlanData({ ...data.plan, name: data.name })
  if (!loaded) throw new Error('This garden could not be read.')
  return loaded
}

/** Creates the garden on its first save, then updates it. */
export async function saveGarden(client: SupabaseClient, id: string, plan: GardenPlan): Promise<void> {
  const { error } = await client.from('gardens').upsert({
    id,
    name: plan.name.trim() || DEFAULT_GARDEN_NAME,
    plan: { schemaVersion: PLAN_SCHEMA_VERSION, garden: plan.garden, inventory: plan.inventory },
  })
  if (error) throw error
}

export async function deleteGarden(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('gardens').delete().eq('id', id)
  if (error) throw error
}

/** Which saved garden to open: the one last open in this browser if it
 * still exists, otherwise the most recently edited (the list is newest
 * first), or none. */
export function chooseGardenToOpen(
  gardens: GardenSummary[],
  lastOpenedId: string | null,
): string | null {
  if (lastOpenedId && gardens.some((g) => g.id === lastOpenedId)) return lastOpenedId
  return gardens[0]?.id ?? null
}

// The last garden open in this browser, so a reload reopens it.
const LAST_OPENED_KEY = 'regenerative-garden:last-cloud-garden'

export function loadLastOpenedId(): string | null {
  try {
    return localStorage.getItem(LAST_OPENED_KEY)
  } catch {
    return null
  }
}

export function setLastOpenedId(id: string | null): void {
  try {
    if (id) localStorage.setItem(LAST_OPENED_KEY, id)
    else localStorage.removeItem(LAST_OPENED_KEY)
  } catch {
    // Without storage, a reload opens the most recently edited garden.
  }
}
