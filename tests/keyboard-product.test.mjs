import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const { immersionLabel, macroKeys, validateKeyboardInterest } = await import('../src/keyboardProduct.ts')
const { submitKeyboardInterest } = await import('../src/lib/keyboardInterest.ts')
const { KeyboardPreview, VolumeKnob } = await import('../src/components/KeyboardPreview.tsx')
const { KeyboardProductPage } = await import('../src/components/KeyboardProductPage.tsx')
const { keyboardThemes, keyboardThemeOrder } = await import('../src/keyboardThemes.ts')

const valid = { fullName: 'Alex Learner', email: 'alex@example.test', quantity: 1, preferredColor: 'mint', comments: '', acknowledged: true }
const noop = () => {}

test('product preview exposes every proposed key and explicitly labels simulation', () => {
  assert.deepEqual(macroKeys.map((key) => key.key), ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'F1', 'F2', 'F3', 'F4'])
  assert.equal(macroKeys.find((key) => key.key === 'M1').preview, 'print(▏)')
  assert.match(macroKeys.find((key) => key.key === 'M3').preview, /for ▏item in items:/)
  assert.match(macroKeys.find((key) => key.key === 'F1').preview, /No Python runs/)
  const html = renderToStaticMarkup(createElement(KeyboardPreview, { color: 'mint', theme: 'mosaic', volume: 0, immersion: 50, feature: 'M1', onFeature: noop, onVolume: noop, onImmersion: noop, onColor: noop, onTheme: noop }))
  for (const key of macroKeys) assert.match(html, new RegExp(`aria-label="${key.key}:`))
  assert.match(html, /soft felt wrist rest/i)
  assert.match(html, /No hardware connected/)
  assert.match(html, /Preview physical volume knob position/)
  assert.equal(immersionLabel(0), 'Chill')
  assert.equal(immersionLabel(50), 'Balanced')
  assert.equal(immersionLabel(100), 'Immersive')
  const calm = renderToStaticMarkup(createElement(KeyboardPreview, { color: 'mint', theme: 'mosaic', volume: 0, immersion: 0, feature: 'sensory', onFeature: noop, onVolume: noop, onImmersion: noop, onColor: noop, onTheme: noop }))
  const rich = renderToStaticMarkup(createElement(KeyboardPreview, { color: 'peach', theme: 'mosaic', volume: 100, immersion: 100, feature: 'sensory', onFeature: noop, onVolume: noop, onImmersion: noop, onColor: noop, onTheme: noop }))
  assert.match(calm, /data-mode="chill"/)
  assert.match(calm, /aria-pressed="true"[^>]*>CALM/)
  assert.match(rich, /data-mode="immersive"/)
  assert.match(rich, /data-color="peach"/)
  assert.match(renderToStaticMarkup(createElement(VolumeKnob, { volume: 0, onFeature: noop })), /rotate\(-125deg\)/)
  assert.match(renderToStaticMarkup(createElement(VolumeKnob, { volume: 100, onFeature: noop })), /rotate\(125deg\)/)
})

test('CAD-inspired hardware arrangement stays identical across all seven themes', () => {
  assert.deepEqual(keyboardThemeOrder, ['mosaic', 'space', 'ocean', 'basketball', 'music', 'animals', 'trains'])
  const base = keyboardThemes.mosaic
  assert.equal(base.colors.macro.length, 6)
  const speakerMarks = new Set()
  for (const id of keyboardThemeOrder) {
    const theme = keyboardThemes[id]
    assert.equal(theme.id, id)
    assert.ok(theme.name && theme.edition && theme.description)
    assert.equal(theme.colors.macro.length, 6)
    const html = renderToStaticMarkup(createElement(KeyboardPreview, { color: 'mint', theme: id, volume: 0, immersion: 50, feature: 'M1', onFeature: noop, onVolume: noop, onImmersion: noop, onColor: noop, onTheme: noop }))
    assert.match(html, new RegExp(`data-theme="${id}"`))
    assert.match(html, /kb-control-deck/)
    assert.match(html, /kb-macro-strip/)
    assert.match(html, /kb-key-bed/)
    assert.match(html, /kb-wrist-rest/)
    assert.match(html, /kb-mosaic-tiles/)
    assert.equal((html.match(/class="kb-speaker"/g) ?? []).length, 2)
    assert.equal((html.match(/class="kb-speaker-grille"/g) ?? []).length, 2)
    assert.match(html, /class="kb-speaker"[^>]*><svg class="kb-speaker-mark"[^>]*>.*?<\/svg><span class="kb-speaker-grille"/s)
    assert.equal((html.match(/class="kb-product-callout"[^>]*>Built-in speaker/g) ?? []).length, 2)
    assert.match(html, /aria-label="Explore the proposed left speaker"/)
    assert.match(html, /aria-label="Explore the proposed right speaker"/)
    const mark = html.match(/<svg class="kb-speaker-mark"[^>]*>(.*?)<\/svg>/)?.[1]
    assert.ok(mark, `${id} should have a speaker accent`)
    speakerMarks.add(mark)
    assert.equal((html.match(/class="kb-key kb-macro/g) ?? []).length, 6)
    assert.equal((html.match(/class="kb-key kb-function/g) ?? []).length, 4)
    assert.match(html, /aria-label="Keyboard preview themes"/)
  }
  assert.equal(speakerMarks.size, keyboardThemeOrder.length)
  const css = readFileSync(new URL('../src/styles/keyboard-product.css', import.meta.url), 'utf8')
  assert.match(css, /\.kb-speaker-grille\s*\{[^}]*radial-gradient/s)
  assert.match(css, /\.kb-speaker-mark\s*\{[^}]*inset: 0; width: 100%; height: 100%;/s)
  assert.match(css, /\.kb-speaker-grille\s*\{[^}]*z-index: 1;/s)
  assert.match(css, /\.kb-product-callout::after\s*\{/)
  assert.notEqual(keyboardThemes.space.colors.shell, keyboardThemes.ocean.colors.shell)
  assert.notEqual(keyboardThemes.basketball.colors.wrist, keyboardThemes.music.colors.wrist)
})

test('purchase-interest validation requires meaningful fields and acknowledgment', () => {
  assert.equal(validateKeyboardInterest(valid), null)
  assert.match(validateKeyboardInterest({ ...valid, fullName: 'A' }), /full name/)
  assert.match(validateKeyboardInterest({ ...valid, email: 'bad' }), /valid email/)
  assert.match(validateKeyboardInterest({ ...valid, quantity: 11 }), /quantity/)
  assert.match(validateKeyboardInterest({ ...valid, comments: 'x'.repeat(1001) }), /1,000/)
  assert.match(validateKeyboardInterest({ ...valid, acknowledged: false }), /not a purchase/)
})

test('a request is considered saved only after Supabase returns its owner-scoped row', async () => {
  let inserted
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'account-a' } }, error: null }) }, from: (table) => {
    assert.equal(table, 'keyboard_interest_requests')
    return { insert: (row) => { inserted = row; return { select: (columns) => { assert.equal(columns, 'id,user_id'); return { single: async () => ({ data: { id: 'saved-id', user_id: 'account-a' }, error: null }) } } } } }
  } }
  await submitKeyboardInterest(client, 'account-a', valid)
  assert.deepEqual(inserted, { user_id: 'account-a', full_name: 'Alex Learner', email: 'alex@example.test', quantity: 1, preferred_color: 'mint', comments: '', interest_acknowledged: true })
})

test('missing migration, failed insert, guest access, and account changes never report success', async () => {
  await assert.rejects(submitKeyboardInterest(null, null, valid), /Sign in/)
  const makeClient = (id, result) => ({ auth: { getUser: async () => ({ data: { user: { id } }, error: null }) }, from: () => ({ insert: () => ({ select: () => ({ single: async () => result }) }) }) })
  await assert.rejects(submitKeyboardInterest(makeClient('account-b', null), 'account-a', valid), /session changed/)
  await assert.rejects(submitKeyboardInterest(makeClient('account-a', { data: null, error: { code: '42P01' } }), 'account-a', valid), /database setup may still be pending/)
  await assert.rejects(submitKeyboardInterest(makeClient('account-a', { data: null, error: { code: '23505' } }), 'account-a', valid), /already sent/)
  await assert.rejects(submitKeyboardInterest(makeClient('account-a', { data: null, error: null }), 'account-a', valid), /could not be confirmed as saved/)
})

test('SQL denies public reads and writes and limits accounts to their own one row', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261023000000_keyboard_interest_requests.sql', import.meta.url), 'utf8')
  assert.match(sql, /user_id uuid not null unique references auth\.users/)
  assert.match(sql, /enable row level security/)
  assert.match(sql, /revoke all on table public\.keyboard_interest_requests from public, anon, authenticated/)
  assert.match(sql, /grant select, insert on table public\.keyboard_interest_requests to authenticated/)
  assert.match(sql, /for select to authenticated using \(\(select auth\.uid\(\)\) = user_id\)/)
  assert.match(sql, /for insert to authenticated with check \(\(select auth\.uid\(\)\) = user_id\)/)
  assert.doesNotMatch(sql, /grant .* to anon|for select to anon/)
})

test('signed-in product page explains that the form is a request and shows no fake confirmation', () => {
  const session = { user: { id: 'account-a', email: 'alex@example.test' } }
  const html = renderToStaticMarkup(createElement(KeyboardProductPage, { session, onSignIn: noop, client: null }))
  assert.match(html, /One Connected Learning Experience/)
  assert.match(html, /Sound on Your Terms/)
  assert.match(html, /One Slider\. Your Ideal Environment/)
  assert.match(html, /This is a product-interest request, not a purchase/)
  assert.doesNotMatch(html, /Your request has been received/)
})
