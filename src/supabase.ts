import { createClient } from '@supabase/supabase-js'

// Public by design (see README "Accounts"): the publishable key only lets a
// browser act as its signed-in user, and row level security limits each user
// to their own gardens.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** Null when accounts aren't configured; the planner then saves only in the
 * browser. */
export const supabase = url && key ? createClient(url, key) : null
