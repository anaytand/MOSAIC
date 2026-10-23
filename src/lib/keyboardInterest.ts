import type { SupabaseClient } from '@supabase/supabase-js'
import { validateKeyboardInterest } from '../keyboardProduct.ts'
import type { KeyboardInterestInput } from '../keyboardProduct.ts'

export class KeyboardInterestError extends Error {}

export async function submitKeyboardInterest(client: SupabaseClient | null, userId: string | null, input: KeyboardInterestInput): Promise<void> {
  const invalid = validateKeyboardInterest(input)
  if (invalid) throw new KeyboardInterestError(invalid)
  if (!client || !userId) throw new KeyboardInterestError('Sign in to send a keyboard interest request. No information was saved.')
  let user
  try {
    const response = await client.auth.getUser()
    user = response.error ? null : response.data.user
  } catch { throw new KeyboardInterestError('Could not verify your account. No information was saved. Please try again.') }
  if (!user || user.id !== userId || user.is_anonymous) throw new KeyboardInterestError('Your account session changed. Sign in again before sending a request.')
  try {
    const { data, error } = await client.from('keyboard_interest_requests').insert({
      user_id: userId,
      full_name: input.fullName.trim(),
      email: input.email.trim(),
      quantity: input.quantity,
      preferred_color: input.preferredColor,
      comments: input.comments.trim(),
      interest_acknowledged: true,
    }).select('id,user_id').single()
    if (error?.code === '23505') throw new KeyboardInterestError('This account already sent a request. No second request was saved.')
    if (error?.code === '42P01' || error?.code === '42501' || error?.code === 'PGRST205') throw new KeyboardInterestError('Keyboard requests are not available yet. The database setup may still be pending. No information was saved.')
    if (error || typeof data?.id !== 'string' || data.user_id !== userId) throw new KeyboardInterestError('The request could not be confirmed as saved. Please try again later.')
  } catch (error) {
    if (error instanceof KeyboardInterestError) throw error
    throw new KeyboardInterestError('Could not connect to save your request. No success was recorded. Please try again.')
  }
}
