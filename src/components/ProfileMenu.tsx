import { useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthPage } from '../navigation'
import { profileDisplayName } from '../lib/profileName'

interface Props { session: Session | null; authReady: boolean; showGreeting?: boolean; onNavigate: (mode: AuthPage) => void; onSignOut: () => Promise<void> }
export function ProfileMenu({ session, authReady, showGreeting = false, onNavigate, onSignOut }: Props) {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const label = !authReady ? 'Account' : session ? 'Profile' : 'Guest'
  const name = session ? profileDisplayName(session.user) : ''
  const go = (mode: AuthPage) => { menuRef.current?.removeAttribute('open'); onNavigate(mode) }
  return <details ref={menuRef} className="profile-menu"><summary aria-label={name && showGreeting ? `Profile menu for ${name}` : `${label} menu`}><span className="profile-menu-avatar" aria-hidden="true">{name[0]?.toUpperCase() ?? session?.user.email?.[0]?.toUpperCase() ?? 'M'}</span><span>{label}</span>{showGreeting && name && <span className="profile-greeting">Hello, <strong>{name}</strong></span>}</summary><div className="profile-menu-panel">
    {!authReady ? <span role="status">Checking account…</span> : session ? <><strong className="profile-menu-email" title={session.user.email}>{session.user.email ?? 'Signed in'}</strong><button type="button" onClick={() => go('account')}>Your account</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onSignOut(); menuRef.current?.removeAttribute('open') } catch { setError('Could not sign out. Please try again.') } finally { setBusy(false) } }}>{busy ? 'Signing out…' : 'Sign out'}</button></> : <><span>Learning without an account</span><button type="button" onClick={() => go('login')}>Log in</button><button type="button" onClick={() => go('signup')}>Create account</button></>}
    {error && <small role="alert">{error}</small>}
  </div></details>
}
