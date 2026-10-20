import test from 'node:test'
import assert from 'node:assert/strict'
import { sensoryAttributes, editorTextSize } from '../src/sensory.ts'
import { defaultPreferences, loadPreferences, savePreferences } from '../src/preferences.ts'

test('sensory choices produce app-wide attributes with system reduced motion taking priority', () => {
  const preferences = { ...defaultPreferences, colorIntensity: 'vibrant', colorTheme: 'dark', highContrast: true, simplifiedInterface: true, fontSize: 'extra-large' }
  const attributes = sensoryAttributes(preferences, true)
  assert.equal(attributes.intensity, 'vibrant')
  assert.equal(attributes.theme, 'dark')
  assert.equal(attributes.contrast, 'high')
  assert.equal(attributes.simplified, 'true')
  assert.equal(attributes.motion, 'reduced')
  assert.equal(attributes.fontSize, 'extra-large')
  assert.equal(sensoryAttributes({ ...defaultPreferences, reducedMotion: true }, false).motion, 'reduced')
  assert.equal(sensoryAttributes(defaultPreferences, false).motion, 'standard')
})

test('text-size settings reach the actual editor while preserving explicit legacy editor sizes', () => {
  assert.equal(editorTextSize({ ...defaultPreferences, fontSize: 'standard' }), 16)
  assert.equal(editorTextSize({ ...defaultPreferences, fontSize: 'large' }), 18)
  assert.equal(editorTextSize({ ...defaultPreferences, fontSize: 'extra-large' }), 20)
  assert.equal(editorTextSize({ ...defaultPreferences, editorFontSize: 24 }), 24)
})

test('new sensory choices survive refresh and do not overwrite existing interests or visual preferences', () => {
  const data = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  try {
    savePreferences({ ...defaultPreferences, interest: 'basketball', colorIntensity: 'calm', soundEffects: true, highContrast: true, colorTheme: 'dark', simplifiedInterface: true, reducedMotion: true })
    const loaded = loadPreferences()
    assert.equal(loaded.interest, 'basketball')
    assert.equal(loaded.colorIntensity, 'calm')
    assert.equal(loaded.soundEffects, true)
    assert.equal(loaded.highContrast, true)
    assert.equal(loaded.colorTheme, 'dark')
    assert.equal(loaded.simplifiedInterface, true)
    data.set('mosaic-preferences', JSON.stringify({ interest: 'ocean', colorIntensity: 'invalid', soundEffects: 'yes', fontSize: 'large' }))
    assert.equal(loadPreferences().colorIntensity, 'balanced')
    assert.equal(loadPreferences().soundEffects, false)
    assert.equal(loadPreferences().fontSize, 'large')
  } finally { globalThis.localStorage = previous }
})
