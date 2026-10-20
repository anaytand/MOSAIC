import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { applyMasterImmersion, immersionDescription, immersionPresets, immersionValues } from '../src/immersion.ts'
import { defaultPreferences, loadPreferences, PREFERENCES_KEY, savePreferences } from '../src/preferences.ts'
import { updateSensoryPreferences } from '../src/sensory.ts'
import { effectiveMotion } from '../src/motion.ts'
import { sensoryVisualVariables } from '../src/sensoryVisuals.ts'
import { AmbientEngine } from '../src/ambient.ts'
import { themeCatalog } from '../src/themes/catalog.ts'
import { THEMES } from '../src/design/referenceWorlds.ts'
const { SensoryControls } = await import('../src/components/SensoryControls.tsx')
const { SensoryMatcher } = await import('../src/components/SensoryMatcher.tsx')
const { SensoryPreview } = await import('../src/components/SensoryPreview.tsx')

test('five anchors and intermediate values update the existing individual sliders', () => {
  for (const preset of immersionPresets) {
    const next = applyMasterImmersion(defaultPreferences, preset.level)
    for (const key of ['motionIntensity', 'colorLevel', 'soundVolume', 'musicVolume']) assert.equal(next[key], preset[key], `${preset.name} ${key}`)
    assert.equal(next.masterImmersion, preset.level)
    assert.equal(immersionDescription(next), preset.name)
    assert.equal(next.soundMuted, true)
    assert.equal(next.musicDuringExecution, false)
  }
  const intermediate = applyMasterImmersion(defaultPreferences, 63)
  assert.equal(intermediate.motionIntensity, 63)
  assert.equal(intermediate.colorLevel, 63)
  assert.ok(intermediate.soundVolume > 35 && intermediate.soundVolume < 60)
  assert.equal(immersionDescription(intermediate), 'Between presets')
  assert.deepEqual(immersionValues(0), { motionIntensity: 0, colorLevel: 0, soundVolume: 0, musicVolume: 0 })
})

test('manual overrides mark Custom without changing other sliders, and master can be reapplied', () => {
  const base = applyMasterImmersion({ ...defaultPreferences, interest: 'space', highContrast: true, visualDensity: 'minimal' }, 75)
  const changed = updateSensoryPreferences(base, { colorLevel: 12 })
  assert.equal(immersionDescription(changed), 'Custom')
  assert.equal(changed.masterImmersion, 75)
  assert.equal(changed.motionIntensity, 75)
  assert.equal(changed.soundVolume, 60)
  assert.equal(changed.musicVolume, 45)
  assert.equal(changed.interest, 'space')
  assert.equal(changed.highContrast, true)
  assert.equal(changed.visualDensity, 'minimal')
  assert.equal(immersionDescription({ ...changed, musicVolume: 12 }), 'Custom')
  const reapplied = applyMasterImmersion(changed, 75)
  assert.equal(immersionDescription(reapplied), 'Engaging')
  assert.equal(reapplied.colorLevel, 75)
})

test('chill stops decorative motion and audio; device motion choice stays respected', () => {
  const chill = applyMasterImmersion(defaultPreferences, 0)
  assert.equal(effectiveMotion(chill, false), 0)
  assert.equal(chill.soundVolume, 0)
  assert.equal(chill.musicVolume, 0)
  assert.equal(chill.soundMuted, true)
  const immersive = applyMasterImmersion(chill, 100)
  assert.equal(immersive.motionPreference, 'system')
  assert.equal(effectiveMotion(immersive, true), 0)
  assert.equal(effectiveMotion(immersive, false), 100)
  const optedIn = applyMasterImmersion({ ...defaultPreferences, motionPreference: 'custom' }, 100)
  assert.equal(effectiveMotion(optedIn, true), 100)
  const calmPaint = sensoryVisualVariables({ ...chill, interest: 'ocean' })
  const vividPaint = sensoryVisualVariables({ ...immersive, interest: 'ocean' })
  assert.notEqual(calmPaint['--sky1'], vividPaint['--sky1'])
  assert.equal(calmPaint['--text'], undefined)
})

test('every immersion percentage preserves heading and lesson text contrast across themes', () => {
  const luminance = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
  const contrast = (first, second) => { const [low, high] = [luminance(first), luminance(second)].sort((a, b) => a - b); return (high + .05) / (low + .05) }
  for (const theme of Object.values(themeCatalog)) for (const colorTheme of ['light', 'dark']) for (let level = 0; level <= 100; level++) {
    const preferences = applyMasterImmersion({ ...defaultPreferences, interest: theme.id, colorTheme }, level)
    const variables = sensoryVisualVariables(preferences)
    for (const key of ['sky1', 'sky2', 'sky3']) {
      const background = colorTheme === 'dark' ? variables[`--decor-dark-${key}`] : variables[`--${key}`]
      assert.ok(contrast(colorTheme === 'dark' ? '#FFFFFF' : THEMES[theme.id].vars.hdr, background) >= 4.5, `${theme.id} ${colorTheme} ${level}% ${key}`)
    }
    assert.ok(contrast(variables['--theme-ink'], variables['--theme-soft']) >= 4.5, `${theme.id} ${colorTheme} ${level}% lesson`)
  }
})

test('the master never creates audio or unmutes it, even when a higher level is selected', () => {
  let creations = 0
  const engine = new AmbientEngine(() => { creations++; throw new Error('Audio should not start') })
  for (const level of [0, 25, 50, 75, 100]) {
    const next = applyMasterImmersion(defaultPreferences, level)
    engine.configure(next)
    assert.equal(next.soundMuted, true)
    assert.equal(engine.snapshot(), 'Paused')
  }
  assert.equal(creations, 0)
})

test('master and custom slider values survive refresh while older preferences remain intact', () => {
  const previous = globalThis.localStorage
  const values = new Map()
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  try {
    const customized = updateSensoryPreferences(applyMasterImmersion({ ...defaultPreferences, interest: 'basketball', colorTheme: 'dark' }, 75), { soundVolume: 10 })
    savePreferences(customized)
    assert.deepEqual(loadPreferences(), customized)
    assert.equal(immersionDescription(loadPreferences()), 'Custom')
    values.set(PREFERENCES_KEY, JSON.stringify({ interest: 'ocean', colorLevel: 22, motionIntensity: 0, reducedMotion: true, soundMuted: false, musicVolume: 12, colorTheme: 'dark' }))
    const legacy = loadPreferences()
    assert.equal(legacy.masterImmersion, 50)
    assert.equal(legacy.interest, 'ocean')
    assert.equal(legacy.colorLevel, 22)
    assert.equal(legacy.motionIntensity, 0)
    assert.equal(legacy.soundMuted, false)
    assert.equal(legacy.musicVolume, 12)
    assert.equal(legacy.colorTheme, 'dark')
    assert.equal(immersionDescription(legacy), 'Custom')
    values.set(PREFERENCES_KEY, JSON.stringify({ masterImmersion: 900 }))
    assert.equal(loadPreferences().masterImmersion, 100)
  } finally { globalThis.localStorage = previous }
})

test('the master appears before individual sliders in settings and the guided matcher, with live preview feedback', () => {
  const controls = renderToStaticMarkup(createElement(SensoryControls, { preferences: defaultPreferences, onChange() {} }))
  assert.ok(controls.indexOf('Master Immersion') < controls.indexOf('Color intensity'))
  assert.match(controls, /0% · Chill Mode/)
  assert.match(controls, /100% · Immersive Mode/)
  assert.match(controls, /Sound volume/)
  assert.match(controls, /Motion intensity/)
  const matcher = renderToStaticMarkup(createElement(SensoryMatcher, { preferences: defaultPreferences, onChange() {}, onFinish() {}, onExit() {} }))
  assert.ok(matcher.indexOf('Master Immersion') < matcher.indexOf('How colorful'))
  const preview = renderToStaticMarkup(createElement(SensoryPreview, { preferences: applyMasterImmersion(defaultPreferences, 0) }))
  assert.match(preview, /preview-typography/)
  assert.match(preview, /preview-robot/)
  assert.match(preview, /Optional sound/)
  assert.match(preview, /Muted until you choose Unmute/)
})
