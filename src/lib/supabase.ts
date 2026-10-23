import { createClient } from '@supabase/supabase-js'
import { readAuthCallback } from './auth.ts'

const url = import.meta.env?.VITE_SUPABASE_URL?.trim()
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
// Capture the email link before the app clears its one-time token from the URL.
export const initialAuthCallback = typeof window === 'undefined' ? null : readAuthCallback(window.location.search, window.location.hash)

// An unconfigured build stays usable for guests. Never put a service-role key here.
export const supabaseAuthOptions = {
  // Email links use token_hash + verifyOtp in one guarded callback handler.
  // Sign-up does not create a browser-bound PKCE verifier for this flow.
  flowType: 'implicit',
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
} as const
export const supabase = url && key ? createClient(url, key, {
  auth: supabaseAuthOptions,
}) : null
