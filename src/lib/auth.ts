import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthCallback = 'confirm' | 'reset'
export type AuthMethods = Pick<SupabaseClient['auth'], 'signUp' | 'signInWithPassword' | 'resetPasswordForEmail' | 'updateUser' | 'resend' | 'signOut'>

export interface AuthCallbackLink {
  kind: AuthCallback
  tokenHash: string | null
  type: string | null
  errorCode: string | null
  errorDescription: string | null
  legacyCode: boolean
}

export function readAuthCallback(search: string, hash = ''): AuthCallbackLink | null {
  const params = new URLSearchParams(search)
  const kind = params.get('mosaic_auth')
  if (kind !== 'confirm' && kind !== 'reset') return null
  const fragment = hash.startsWith('#error=') || hash.startsWith('#access_token=') ? new URLSearchParams(hash.slice(1)) : new URLSearchParams()
  return {
    kind,
    tokenHash: params.get('token_hash'),
    type: params.get('type'),
    errorCode: params.get('error_code') ?? fragment.get('error_code') ?? (params.has('error') || fragment.has('error') || params.has('error_description') || fragment.has('error_description') ? 'auth_error' : null),
    errorDescription: params.get('error_description') ?? fragment.get('error_description'),
    legacyCode: params.has('code') || fragment.has('access_token'),
  }
}

/** The email template appends token_hash and type to this same-origin callback URL. */
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
