import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { authActions, authRedirectUrl, readAuthCallback } from '../src/lib/auth.ts'
import { supabaseAuthOptions } from '../src/lib/supabase.ts'
import { initialRoute, parseRoute, routeHash } from '../src/navigation.ts'
import { defaultPreferences } from '../src/preferences.ts'
const { AuthPage } = await import('../src/components/AuthPage.tsx')
const { ProfileMenu } = await import('../src/components/ProfileMenu.tsx')

const location = { origin: 'http://localhost:5173', pathname: '/mosaic/' }
const noop = () => {}
const fakeClient = { auth: {} }
const view = (mode, extra = {}) => renderToStaticMarkup(createElement(AuthPage, {
  mode, preferences: defaultPreferences, session: null, authReady: true, callbackStatus: 'idle', pendingEmail: '', onPendingEmail: noop, onNavigate: noop, onGuest: noop, client: fakeClient, ...extra,
}))

test('the client is configured for persistent PKCE sessions and URL callback handling', () => {
  assert.deepEqual(supabaseAuthOptions, { flowType: 'pkce', autoRefreshToken: true, persistSession: true, detectSessionInUrl: true })
  assert.equal(authRedirectUrl(location, 'confirm'), 'http://localhost:5173/mosaic/?mosaic_auth=confirm')
  assert.equal(authRedirectUrl(location, 'reset'), 'http://localhost:5173/mosaic/?mosaic_auth=reset')
  assert.deepEqual(readAuthCallback('?mosaic_auth=confirm&code=one-time'), { kind: 'confirm', hadCode: true })
  assert.deepEqual(readAuthCallback('?mosaic_auth=reset'), { kind: 'reset', hadCode: false })
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
  assert.match(view('confirmed', { session, callbackStatus: 'pending' }), /Checking your confirmation link/)
  assert.match(view('confirmed', { session, callbackStatus: 'error' }), /could not be completed/)
  assert.match(view('confirmed', { session, callbackStatus: 'success' }), /email is confirmed/)
  assert.doesNotMatch(view('reset', { session, callbackStatus: 'error' }), /type="password"/)
  assert.equal((view('reset', { session, callbackStatus: 'success' }).match(/type="password"/g) ?? []).length, 2)
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
