import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { authActions } from '../lib/auth'
import { profileDisplayName, saveProfileName } from '../lib/profileName'
import type { CallbackOutcome } from '../lib/authCallback'
import { supabase } from '../lib/supabase'
import { selectedWorld, THEMES } from '../design/worlds'
import { getLearningTheme } from '../themes/catalog'
import type { AuthPage as AuthMode } from '../navigation'
import type { UserPreferences } from '../types'
import { CompanionArt } from './CompanionArt'

interface Props {
  mode: AuthMode
  preferences: UserPreferences
  session: Session | null
  authReady: boolean
  callbackStatus: CallbackOutcome['status'] | 'idle' | 'ready' | 'pending'
  onVerifyLink: () => void
  pendingEmail: string
  client?: Pick<SupabaseClient, 'auth'> | null
  onPendingEmail: (email: string) => void
  onNavigate: (mode: AuthMode) => void
  onGuest: () => void
  onUserUpdated?: (user: User) => void
  canImport?: boolean
  onImport?: () => void
  syncStatus?: string
}

const titles: Record<AuthMode, string> = {
  signup: 'Create your MOSAIC account', login: 'Welcome back', forgot: 'Reset your password', reset: 'Choose a new password',
  'check-email': 'Check your email', confirmed: 'Confirming your email', account: 'Your account',
}

const callbackProblem: Record<Exclude<CallbackOutcome['status'], 'success' | 'already-authenticated'>, string> = {
  expired: 'This link has expired. Request a new link and use the newest email.',
  used: 'This link has already been used. Sign in if you confirmed your email, or request a new link.',
  invalid: 'This link is invalid or does not match this action. Request a new link.',
  missing: 'This link is missing its verification information. Open the full link from the email or request a new one.',
  legacy: 'This link uses an older confirmation format. Request a new link after the email template has been updated.',
  network: 'We could not reach Supabase to finish verification. Check your connection, then sign in or request a new link.',
  unverified: 'A session was returned, but Supabase has not confirmed this email. Please request a new link.',
}

function AccountNameForm({ session, client, onUserUpdated }: { session: Session; client: Pick<SupabaseClient, 'auth'>; onUserUpdated?: (user: User) => void }) {
  const savedName = profileDisplayName(session.user)
  const [name, setName] = useState(savedName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const submitName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const user = await saveProfileName(client.auth, session, name)
      setName(profileDisplayName(user))
      onUserUpdated?.(user)
      setMessage('Your name was saved to your account.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your name. Please try again.')
    } finally { setBusy(false) }
  }
  return <section className="auth-name-prompt" aria-labelledby="auth-name-heading">
    <h2 id="auth-name-heading">{savedName ? `Hi, ${savedName}!` : 'What should we call you?'}</h2>
    <p>Use your first name or a nickname. We’ll show it by Profile on your home page. You can change it later.</p>
    <form className="auth-form" onSubmit={(event) => { void submitName(event) }}>
      <label className="auth-field">Name or nickname<input type="text" name="display-name" autoComplete="nickname" required maxLength={40} value={name} onChange={(event) => { setName(event.target.value); setError(''); setMessage('') }} /></label>
      <button className="button button-primary" type="submit" disabled={busy || name.trim() === savedName}>{busy ? 'Saving…' : savedName ? 'Update name' : 'Save name'}</button>
    </form>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {message && <p className="auth-success" role="status">{message}</p>}
  </section>
}

export function AuthPage({ mode, preferences, session, authReady, callbackStatus, onVerifyLink, pendingEmail, onPendingEmail, onNavigate, onGuest, onUserUpdated, canImport = false, onImport, syncStatus, client = supabase }: Props) {
  const [email, setEmail] = useState(pendingEmail)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const world = selectedWorld(preferences)
  const theme = getLearningTheme(preferences)
  const configured = client !== null
  const callbackComplete = authReady && callbackStatus === 'success' && !!session
  const callbackPending = callbackStatus === 'pending' || !authReady
  const callbackText = callbackStatus in callbackProblem ? callbackProblem[callbackStatus as keyof typeof callbackProblem] : callbackProblem.missing
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!client || busy) return
    setError('')
    setMessage('')
    if (mode === 'signup' || mode === 'reset') {
      if (password !== confirmation) { setError('The passwords do not match. Please try again.'); return }
      if (password.length < 8) { setError('Use at least 8 characters for your password.'); return }
    }
    setBusy(true)
    try {
      const actions = authActions(client.auth, window.location)
      if (mode === 'signup') {
        const result = await actions.signUp(email.trim(), password)
        if (result.error) setError(result.error.message)
        else {
          onPendingEmail(email.trim())
          setPassword(''); setConfirmation('')
          onNavigate(result.data.session ? 'account' : 'check-email')
        }
      } else if (mode === 'login') {
        const result = await actions.signIn(email.trim(), password)
        if (result.error) setError(result.error.message)
        else { setPassword(''); onNavigate('account') }
      } else if (mode === 'forgot') {
        const result = await actions.forgotPassword(email.trim())
        if (result.error) setError(result.error.message)
        else setMessage('If this email has an account, a password reset link will arrive. Check your inbox and spam folder.')
      } else if (mode === 'check-email') {
        const result = await actions.resendConfirmation(email.trim())
        if (result.error) setError(result.error.message)
        else setMessage('If confirmation is still needed, a new link will arrive. Check your inbox and spam folder.')
      } else if (mode === 'reset') {
        const result = await actions.updatePassword(password)
        if (result.error) setError(result.error.message)
        else { setPassword(''); setConfirmation(''); setMessage('Your password has been updated. You can continue learning.') }
      }
    } catch {
      setError('Could not connect to authentication. Please check your connection and try again.')
    } finally { setBusy(false) }
  }
  const emailField = <label className="auth-field">Email address<input type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
  const passwordField = (newPassword: boolean) => <label className="auth-field">{newPassword ? 'New password' : 'Password'}<input type="password" name="password" autoComplete={newPassword ? 'new-password' : 'current-password'} required minLength={newPassword ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
  const confirmField = <label className="auth-field">Confirm password<input type="password" name="confirm-password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
  const formMode = mode === 'signup' || mode === 'login' || mode === 'forgot' || mode === 'check-email' || mode === 'reset' && callbackComplete && !message
  return <section className="auth-page page" aria-labelledby="auth-heading">
    <div className="auth-card">
      <div className="auth-form-side"><span className="eyebrow">YOUR MOSAIC ACCOUNT · OPTIONAL</span><h1 id="auth-heading">{mode === 'confirmed' && callbackComplete ? 'Email confirmed' : mode === 'confirmed' && callbackStatus === 'ready' ? 'Confirm your email' : titles[mode]}</h1>
        {mode === 'signup' && <p>Create an account to save lessons, code, and preferences across devices. You can import work from guest mode afterward.</p>}
        {mode === 'login' && <p>Sign in with your email and password, or keep learning as a guest.</p>}
        {mode === 'forgot' && <p>Enter your email and we’ll send a link if there’s an account for it.</p>}
        {mode === 'check-email' && <p>If confirmation is enabled for your account, open the link in your email to finish signing up. You can keep learning while you wait.</p>}
        {mode === 'confirmed' && <p role={callbackPending || callbackComplete || callbackStatus === 'already-authenticated' || callbackStatus === 'ready' ? 'status' : 'alert'}>{callbackPending ? 'Checking your confirmation link…' : callbackComplete ? 'Your email is confirmed and you are signed in.' : callbackStatus === 'ready' ? 'Choose Confirm email to finish signing up. Your link will be used only when you press the button.' : callbackStatus === 'already-authenticated' ? 'A confirmed account is already signed in. This link was not verified again.' : callbackText}</p>}
        {mode === 'reset' && <p role={callbackPending || callbackComplete || callbackStatus === 'ready' ? 'status' : 'alert'}>{callbackPending ? 'Checking your password reset link…' : callbackComplete ? 'Enter a new password for your account.' : callbackStatus === 'ready' ? 'Choose Verify reset link to continue. Your link will be used only when you press the button.' : callbackStatus === 'already-authenticated' ? 'A confirmed account is signed in, but this reset link was not verified. Request a new reset link to change your password.' : callbackText}</p>}
        {(mode === 'confirmed' || mode === 'reset') && callbackStatus === 'ready' && <button type="button" className="button button-primary" onClick={onVerifyLink} disabled={!authReady}>{mode === 'confirmed' ? 'Confirm email' : 'Verify reset link'}</button>}
        {mode === 'confirmed' && (callbackComplete || callbackStatus === 'already-authenticated') && <button type="button" className="button button-primary" onClick={onGuest}>Continue learning</button>}
        {mode === 'account' && <><p>{session ? `Signed in as ${session.user.email ?? 'your MOSAIC account'}.` : 'You are learning as a guest.'}</p><p>{session ? `Cloud progress: ${syncStatus === 'saved' ? 'Saved' : syncStatus === 'saving' ? 'Saving' : syncStatus === 'failed' ? 'Sync Failed' : syncStatus === 'conflict' ? 'Needs review' : syncStatus === 'ready' ? 'Ready' : 'Checking'}. Guest work stays on this device unless you choose to import it.` : 'Your work is saved on this device. An account is optional.'}</p>{session && canImport && onImport && <button type="button" className="button button-secondary" onClick={onImport}>Import guest progress</button>}</>}
        {session && client && (mode === 'account' || mode === 'confirmed' && callbackComplete) && <AccountNameForm key={session.user.id} session={session} client={client} onUserUpdated={onUserUpdated} />}
        {!configured && <p role="alert" className="auth-error">Authentication is unavailable in this build. You can still use all lessons without an account.</p>}
        {configured && formMode && <form className="auth-form" onSubmit={(event) => { void submit(event) }}>
          {mode !== 'reset' && emailField}
          {(mode === 'signup' || mode === 'login' || mode === 'reset') && passwordField(mode !== 'login')}
          {(mode === 'signup' || mode === 'reset') && confirmField}
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'login' ? 'Log in' : mode === 'forgot' ? 'Send reset link' : mode === 'check-email' ? 'Resend confirmation link' : 'Update password'}</button>
        </form>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}
        <div className="auth-links">
          {mode !== 'login' && <button type="button" className="text-button" onClick={() => onNavigate('login')}>Log in</button>}
          {mode !== 'signup' && <button type="button" className="text-button" onClick={() => onNavigate('signup')}>Create account</button>}
          {mode === 'login' && <button type="button" className="text-button" onClick={() => onNavigate('forgot')}>Forgot password?</button>}
          {(mode === 'reset' || mode === 'confirmed') && !callbackPending && !callbackComplete && callbackStatus !== 'ready' && <button type="button" className="text-button" onClick={() => onNavigate(mode === 'reset' ? 'forgot' : 'check-email')}>{mode === 'reset' ? 'Request a new reset link' : 'Resend confirmation'}</button>}
          {mode !== 'confirmed' || !callbackComplete && callbackStatus !== 'already-authenticated' ? <button type="button" className="text-button" onClick={onGuest}>{session ? 'Continue learning' : 'Continue learning without an account'}</button> : null}
        </div>
      </div>
      <aside className="auth-world" aria-label={`${theme?.name ?? 'MOSAIC'} learning world`}><span className="auth-world-wordmark" aria-hidden="true">{THEMES[world].wordmark}</span><CompanionArt preferences={preferences} label={`${theme?.name ?? 'MOSAIC'} companion`} className="auth-world-mascot" state="welcoming" /><h2>{theme?.name ?? 'Your world. Your code.'}</h2><p>Learn real Python through a world you choose.</p></aside>
    </div>
  </section>
}
