import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthCallback = 'confirm' | 'reset'
export type AuthMethods = Pick<SupabaseClient['auth'], 'signUp' | 'signInWithPassword' | 'resetPasswordForEmail' | 'updateUser' | 'resend' | 'signOut'>

export function readAuthCallback(search: string): { kind: AuthCallback; hadCode: boolean } | null {
  const params = new URLSearchParams(search)
  const kind = params.get('mosaic_auth')
  return kind === 'confirm' || kind === 'reset' ? { kind, hadCode: params.has('code') } : null
}

/** Use a query marker so Supabase's PKCE code never conflicts with MOSAIC's hash routes. */
export function authRedirectUrl(location: Pick<Location, 'origin' | 'pathname'>, kind: AuthCallback): string {
  const url = new URL(location.pathname, location.origin)
  url.searchParams.set('mosaic_auth', kind)
  return url.toString()
}

export function authActions(auth: AuthMethods, location: Pick<Location, 'origin' | 'pathname'>) {
  return {
    signUp: (email: string, password: string) => auth.signUp({ email, password, options: { emailRedirectTo: authRedirectUrl(location, 'confirm') } }),
    signIn: (email: string, password: string) => auth.signInWithPassword({ email, password }),
    forgotPassword: (email: string) => auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl(location, 'reset') }),
    updatePassword: (password: string) => auth.updateUser({ password }),
    resendConfirmation: (email: string) => auth.resend({ type: 'signup', email, options: { emailRedirectTo: authRedirectUrl(location, 'confirm') } }),
    signOut: () => auth.signOut(),
  }
}
