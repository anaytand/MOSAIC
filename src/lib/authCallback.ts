import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { AuthCallbackLink } from './auth.ts'

type Auth = Pick<SupabaseClient['auth'], 'verifyOtp' | 'getUser' | 'getSession'>

export type CallbackOutcome =
  | { status: 'success'; session: Session }
  | { status: 'already-authenticated'; session: Session }
  | { status: 'expired' | 'used' | 'invalid' | 'missing' | 'legacy' | 'network' | 'unverified'; session: null }

const attempts = new WeakMap<Auth, Promise<CallbackOutcome>>()

/** One verification request per page load, even when React StrictMode remounts effects. */
export function completeAuthCallbackOnce(auth: Auth, link: AuthCallbackLink): Promise<CallbackOutcome> {
  const existing = attempts.get(auth)
  if (existing) return existing
  const attempt = completeAuthCallback(auth, link)
  attempts.set(auth, attempt)
  return attempt
}

function classifyError(error: { code?: string; message?: string; status?: number } | null): 'expired' | 'used' | 'invalid' | 'network' {
  const code = error?.code?.toLowerCase() ?? ''
  const message = error?.message?.toLowerCase() ?? ''
  if (code.includes('expired') || message.includes('expired')) return 'expired'
  if (code.includes('used') || message.includes('already used') || message.includes('consumed')) return 'used'
  if (code === 'network_error' || (error?.status ?? 0) >= 500 || message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('network')) return 'network'
  return 'invalid'
}

async function confirmedExistingSession(auth: Auth): Promise<Session | null> {
  try {
    const current = await auth.getSession()
    if (current.error || !current.data.session) return null
    const user = await auth.getUser()
    if (user.error || !user.data.user?.email_confirmed_at || user.data.user.id !== current.data.session.user.id) return null
    return current.data.session
  } catch {
    return null
  }
}

async function completeAuthCallback(auth: Auth, link: AuthCallbackLink): Promise<CallbackOutcome> {
  if (link.errorCode) {
    const existing = await confirmedExistingSession(auth)
    return existing ? { status: 'already-authenticated', session: existing } : { status: classifyError({ code: link.errorCode, message: link.errorDescription ?? undefined }), session: null }
  }
  if (link.legacyCode) return { status: 'legacy', session: null }
  const expectedType = link.kind === 'confirm' ? 'email' : 'recovery'
  if (!link.tokenHash || !link.type) return { status: 'missing', session: null }
  if (link.type !== expectedType) return { status: 'invalid', session: null }
  try {
    const result = await auth.verifyOtp({ token_hash: link.tokenHash, type: expectedType })
    if (result.error || !result.data.session || !result.data.user) {
      const existing = await confirmedExistingSession(auth)
      return existing ? { status: 'already-authenticated', session: existing } : { status: classifyError(result.error), session: null }
    }
    // verifyOtp returns the authenticated user and session directly from Supabase.
    // Match them rather than trusting an unrelated session already in local storage.
    if (result.data.session.user.id !== result.data.user.id) return { status: 'invalid', session: null }
    if (link.kind === 'confirm' && !result.data.user.email_confirmed_at) return { status: 'unverified', session: null }
    return { status: 'success', session: result.data.session }
  } catch {
    const existing = await confirmedExistingSession(auth)
    return existing ? { status: 'already-authenticated', session: existing } : { status: 'network', session: null }
  }
}
