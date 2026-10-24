import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

type ProfileAuth = Pick<SupabaseClient['auth'], 'getUser' | 'updateUser'>

/** A display name belongs to the authenticated account, never to guest progress. */
export function profileDisplayName(user: Pick<User, 'user_metadata'> | null | undefined): string {
  const value = user?.user_metadata?.display_name
  return typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ').slice(0, 40) : ''
}

export function normalizeProfileName(value: string): string {
  const name = value.trim().replace(/\s+/gu, ' ')
  if (!name) throw new Error('Enter a name or nickname to use in MOSAIC.')
  if (name.length > 40) throw new Error('Use 40 characters or fewer for your name.')
  for (const character of name) {
    const code = character.codePointAt(0) ?? 0
    if (code < 32 || code === 127) throw new Error('Use a name without control characters.')
  }
  return name
}

export async function saveProfileName(auth: ProfileAuth, session: Session, value: string): Promise<User> {
  const name = normalizeProfileName(value)
  const current = await auth.getUser()
  if (current.error || current.data.user?.id !== session.user.id) throw new Error('Your account changed. Please sign in again before saving your name.')
  const result = await auth.updateUser({ data: { display_name: name } })
  if (result.error) throw new Error(result.error.message || 'Could not save your name. Please try again.')
  if (result.data.user?.id !== session.user.id) throw new Error('Your account changed before the name could be confirmed.')
  return result.data.user
}
