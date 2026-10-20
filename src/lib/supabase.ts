import { createClient } from '@supabase/supabase-js'
import { readAuthCallback } from './auth.ts'

const url = import.meta.env?.VITE_SUPABASE_URL?.trim()
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
// Capture callback intent before Supabase exchanges and removes the one-time code.
export const initialAuthCallback = typeof window === 'undefined' ? null : readAuthCallback(window.location.search)

// An unconfigured build stays usable for guests. Never put a service-role key here.
export const supabaseAuthOptions = {
  flowType: 'pkce',
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
} as const
export const supabase = url && key ? createClient(url, key, {
  auth: supabaseAuthOptions,
}) : null
