import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { authActions, authRedirectUrl, readAuthCallback } from '../src/lib/auth.ts'
import { normalizeProfileName, profileDisplayName, saveProfileName } from '../src/lib/profileName.ts'
import { completeAuthCallbackOnce } from '../src/lib/authCallback.ts'
import { supabaseAuthOptions } from '../src/lib/supabase.ts'
import { initialRoute, parseRoute, routeHash } from '../src/navigation.ts'
import { defaultPreferences } from '../src/preferences.ts'
const { AuthPage } = await import('../src/components/AuthPage.tsx')
const { ProfileMenu } = await import('../src/components/ProfileMenu.tsx')

const location = { origin: 'http://localhost:5173', pathname: '/mosaic/' }
const noop = () => {}
const fakeClient = { auth: {} }
const view = (mode, extra = {}) => renderToStaticMarkup(createElement(AuthPage, {
  mode, preferences: defaultPreferences, session: null, authReady: true, callbackStatus: 'idle', pendingEmail: '', onVerifyLink: noop, onPendingEmail: noop, onNavigate: noop, onGuest: noop, client: fakeClient, ...extra,
}))

test('the client persists sessions but leaves token-hash callbacks to one explicit handler', () => {
  assert.deepEqual(supabaseAuthOptions, { flowType: 'implicit', autoRefreshToken: true, persistSession: true, detectSessionInUrl: false })
  assert.equal(authRedirectUrl(location, 'confirm'), 'http://localhost:5173/mosaic/?mosaic_auth=confirm')
  assert.equal(authRedirectUrl(location, 'reset'), 'http://localhost:5173/mosaic/?mosaic_auth=reset')
  assert.deepEqual(readAuthCallback('?mosaic_auth=confirm&token_hash=one-time&type=email'), { kind: 'confirm', tokenHash: 'one-time', type: 'email', errorCode: null, errorDescription: null, legacyCode: false })
  assert.deepEqual(readAuthCallback('?mosaic_auth=reset'), { kind: 'reset', tokenHash: null, type: null, errorCode: null, errorDescription: null, legacyCode: false })
  assert.equal(readAuthCallback('?mosaic_auth=confirm&code=old-code')?.legacyCode, true)
  assert.equal(readAuthCallback('?mosaic_auth=confirm', '#error=access_denied&error_code=otp_expired')?.errorCode, 'otp_expired')
  assert.equal(readAuthCallback(''), null)
})

test('signup, login, recovery, confirmation resend, password update and logout call Supabase Auth', async () => {
  const calls = []
  const auth = Object.fromEntries(['signUp', 'signInWithPassword', 'resetPasswordForEmail', 'updateUser', 'resend', 'signOut'].map((name) => [name, async (...args) => { calls.push([name, ...args]); return { data: name === 'signUp' ? { user: { id: 'test' }, session: null } : {}, error: null } }]))
  const actions = authActions(auth, location)
  await actions.signUp('learner@example.test', 'not-a-real-password')
  await actions.signIn('learner@example.test', 'not-a-real-password')
  await actions.forgotPassword('learner@example.test')
  await actions.resendConfirmation('learner@example.test')
  await actions.updatePassword('a-new-password')
  await actions.signOut()
  assert.deepEqual(calls.map(([name]) => name), ['signUp', 'signInWithPassword', 'resetPasswordForEmail', 'resend', 'updateUser', 'signOut'])
  assert.deepEqual(calls[0][1], { email: 'learner@example.test', password: 'not-a-real-password', options: { emailRedirectTo: 'http://localhost:5173/mosaic/?mosaic_auth=confirm' } })
  assert.deepEqual(calls[1][1], { email: 'learner@example.test', password: 'not-a-real-password' })
  assert.deepEqual(calls[2].slice(1), ['learner@example.test', { redirectTo: 'http://localhost:5173/mosaic/?mosaic_auth=reset' }])
  assert.deepEqual(calls[3][1], { type: 'signup', email: 'learner@example.test', options: { emailRedirectTo: 'http://localhost:5173/mosaic/?mosaic_auth=confirm' } })
  assert.deepEqual(calls[4][1], { password: 'a-new-password' })
})

test('account routes and callback markers coexist with existing learning routes', () => {
  for (const mode of ['signup', 'login', 'forgot', 'reset', 'check-email', 'confirmed', 'account']) assert.equal(routeHash(parseRoute(`#auth/${mode}`)), `#auth/${mode}`)
  assert.equal(initialRoute('#learn/workspace', '?mosaic_auth=confirm&code=temporary').auth, 'confirmed')
  assert.equal(initialRoute('#learn/workspace', '?mosaic_auth=reset&code=temporary').auth, 'reset')
  assert.equal(initialRoute('#learn/workspace', '').workspace, true)
  assert.equal(routeHash(parseRoute('#learn/workspace')), '#learn/workspace')
})

test('forms expose real email/password controls and an account-free path', () => {
  const signup = view('signup', { preferences: { ...defaultPreferences, interest: 'ocean' } })
  assert.match(signup, /Create your MOSAIC account/)
  assert.match(signup, /type="email"/)
  assert.equal((signup.match(/type="password"/g) ?? []).length, 2)
  assert.match(signup, /Create account/)
  assert.match(signup, /Continue learning without an account/)
  assert.match(signup, /Ocean/)
  const login = view('login')
  assert.match(login, /Log in/)
  assert.match(login, /Forgot password/)
  assert.match(view('forgot'), /Send reset link/)
  assert.match(view('check-email', { pendingEmail: 'learner@example.test' }), /Resend confirmation link/)
})

test('confirmation and password changes require a completed callback, even if another session exists', () => {
  const session = { user: { email: 'learner@example.test' } }
  assert.match(view('confirmed', { callbackStatus: 'ready' }), /Confirm email/)
  assert.match(view('reset', { callbackStatus: 'ready' }), /Verify reset link/)
  assert.match(view('confirmed', { session, callbackStatus: 'pending' }), /Checking your confirmation link/)
  assert.match(view('confirmed', { session, callbackStatus: 'expired' }), /link has expired/)
  assert.match(view('confirmed', { session, callbackStatus: 'success' }), /email is confirmed/)
  assert.match(view('confirmed', { session, callbackStatus: 'success' }), /Continue learning/)
  assert.match(view('confirmed', { session, callbackStatus: 'already-authenticated' }), /link was not verified again/)
  assert.doesNotMatch(view('reset', { session, callbackStatus: 'expired' }), /type="password"/)
  assert.equal((view('reset', { session, callbackStatus: 'success' }).match(/type="password"/g) ?? []).length, 2)
})

test('confirmation verifies the token once and checks the confirmed user before success', async () => {
  const user = { id: 'learner', email_confirmed_at: '2026-10-22T00:00:00Z' }
  const session = { user }
  let calls = 0
  const auth = {
    verifyOtp: async (params) => { calls++; assert.deepEqual(params, { token_hash: 'hash', type: 'email' }); return { data: { user, session }, error: null } },
    getUser: async () => ({ data: { user }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  }
  const link = readAuthCallback('?mosaic_auth=confirm&token_hash=hash&type=email')
  const [first, second] = await Promise.all([completeAuthCallbackOnce(auth, link), completeAuthCallbackOnce(auth, link)])
  assert.deepEqual(first, { status: 'success', session })
  assert.equal(first, second)
  assert.equal(calls, 1)
})

test('an unconfirmed account is not reported as confirmed', async () => {
  const user = { id: 'learner', email_confirmed_at: null }
  const session = { user }
  const auth = {
    verifyOtp: async () => ({ data: { user, session }, error: null }),
    getUser: async () => ({ data: { user }, error: null }),
    getSession: async () => ({ data: { session }, error: null }),
  }
  assert.deepEqual(await completeAuthCallbackOnce(auth, readAuthCallback('?mosaic_auth=confirm&token_hash=hash&type=email')), { status: 'unverified', session: null })
})

test('expired or used links only fall back to an independently confirmed existing session', async () => {
  for (const [confirmed, expected] of [[false, 'expired'], [true, 'already-authenticated']]) {
    const user = { id: 'learner', email_confirmed_at: confirmed ? '2026-10-22' : null }
    const session = { user }
    const auth = {
      verifyOtp: async () => ({ data: { user: null, session: null }, error: { code: 'otp_expired', message: 'Token has expired' } }),
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session }, error: null }),
    }
    const result = await completeAuthCallbackOnce(auth, readAuthCallback('?mosaic_auth=confirm&token_hash=hash&type=email'))
    assert.equal(result.status, expected)
  }
  const usedAuth = {
    verifyOtp: async () => ({ data: { user: null, session: null }, error: { code: 'token_used', message: 'Token already used' } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  }
  assert.equal((await completeAuthCallbackOnce(usedAuth, readAuthCallback('?mosaic_auth=confirm&token_hash=hash&type=email'))).status, 'used')
})

test('missing, mismatched, and old-format links never call verification', async () => {
  let calls = 0
  const makeAuth = () => ({ verifyOtp: async () => { calls++; throw Error('should not verify') }, getUser: async () => ({ data: { user: null }, error: null }), getSession: async () => ({ data: { session: null }, error: null }) })
  assert.equal((await completeAuthCallbackOnce(makeAuth(), readAuthCallback('?mosaic_auth=confirm'))).status, 'missing')
  assert.equal((await completeAuthCallbackOnce(makeAuth(), readAuthCallback('?mosaic_auth=confirm&token_hash=hash&type=recovery'))).status, 'invalid')
  assert.equal((await completeAuthCallbackOnce(makeAuth(), readAuthCallback('?mosaic_auth=confirm&code=old'))).status, 'legacy')
  assert.equal(calls, 0)
})

test('password recovery uses the recovery token and only then permits password entry', async () => {
  const user = { id: 'learner' }
  const session = { user }
  const auth = {
    verifyOtp: async (params) => { assert.deepEqual(params, { token_hash: 'reset-hash', type: 'recovery' }); return { data: { user, session }, error: null } },
    getUser: async () => ({ data: { user }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  }
  assert.equal((await completeAuthCallbackOnce(auth, readAuthCallback('?mosaic_auth=reset&token_hash=reset-hash&type=recovery'))).status, 'success')
})

test('profile menu offers guest sign-in and signed-in sign-out while local learning remains separate', () => {
  const guest = renderToStaticMarkup(createElement(ProfileMenu, { session: null, authReady: true, onNavigate: noop, onSignOut: async () => {} }))
  assert.match(guest, /Guest menu/)
  assert.match(guest, /Create account/)
  const signed = renderToStaticMarkup(createElement(ProfileMenu, { session: { user: { email: 'learner@example.test' } }, authReady: true, onNavigate: noop, onSignOut: async () => {} }))
  assert.match(signed, /Profile menu/)
  assert.match(signed, /Sign out/)
  assert.match(view('account', { session: { user: { email: 'learner@example.test' } } }), /Guest work stays on this device unless you choose to import it/)
  assert.match(view('account', { session: { user: { email: 'learner@example.test' } }, canImport: true, onImport: noop, syncStatus: 'saved' }), /Import guest progress/)
})

test('a signed-in learner is prompted for a name and the home profile greets the saved name', () => {
  const unnamed = { user: { id: 'account-a', email: 'learner@example.test', user_metadata: {} } }
  assert.match(view('account', { session: unnamed }), /What should we call you\?/)
  assert.match(view('account', { session: unnamed }), /Name or nickname/)
  assert.match(view('confirmed', { session: unnamed, callbackStatus: 'success' }), /What should we call you\?/)
  const named = { user: { ...unnamed.user, user_metadata: { display_name: 'Alex' } } }
  const home = renderToStaticMarkup(createElement(ProfileMenu, { session: named, authReady: true, showGreeting: true, onNavigate: noop, onSignOut: async () => {} }))
  assert.match(home, /Hello, <strong>Alex<\/strong>/)
  assert.match(home, /Profile menu for Alex/)
  const elsewhere = renderToStaticMarkup(createElement(ProfileMenu, { session: named, authReady: true, showGreeting: false, onNavigate: noop, onSignOut: async () => {} }))
  assert.doesNotMatch(elsewhere, /Hello, /)
  assert.doesNotMatch(renderToStaticMarkup(createElement(ProfileMenu, { session: null, authReady: true, showGreeting: true, onNavigate: noop, onSignOut: async () => {} })), /Hello, /)
})

test('names save to the active Supabase Auth account only after confirmation', async () => {
  assert.equal(normalizeProfileName('  Alex   Rivera  '), 'Alex Rivera')
  assert.equal(profileDisplayName({ user_metadata: { display_name: ' Alex Rivera ' } }), 'Alex Rivera')
  assert.throws(() => normalizeProfileName('   '), /Enter a name/)
  assert.throws(() => normalizeProfileName('A'.repeat(41)), /40 characters/)
  const session = { user: { id: 'account-a' } }
  const calls = []
  const auth = { getUser: async () => ({ data: { user: { id: 'account-a' } }, error: null }), updateUser: async (value) => { calls.push(value); return { data: { user: { id: 'account-a', user_metadata: value.data } }, error: null } } }
  const user = await saveProfileName(auth, session, '  Alex   Rivera  ')
  assert.deepEqual(calls, [{ data: { display_name: 'Alex Rivera' } }])
  assert.equal(profileDisplayName(user), 'Alex Rivera')
  await assert.rejects(saveProfileName({ ...auth, getUser: async () => ({ data: { user: { id: 'account-b' } }, error: null }) }, session, 'Alex'), /account changed/i)
  assert.equal(calls.length, 1)
  await assert.rejects(saveProfileName({ ...auth, updateUser: async () => ({ data: { user: null }, error: { message: 'Network failed' } }) }, session, 'Alex'), /Network failed/)
})
