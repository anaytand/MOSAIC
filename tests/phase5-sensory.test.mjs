import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultPreferences, loadPreferences, PREFERENCES_KEY, savePreferences } from '../src/preferences.ts'
import { updateSensoryPreferences, sensoryAttributes } from '../src/sensory.ts'
import { effectiveMotion, motionVariables } from '../src/motion.ts'
import { sensoryVisualVariables } from '../src/sensoryVisuals.ts'
import { SoundEngine, executionSound } from '../src/sound.ts'
import { themeCatalog } from '../src/themes/catalog.ts'
import { THEMES } from '../src/design/referenceWorlds.ts'

function storage(run) {
  const values = new Map()
  const original = globalThis.localStorage
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  try { run(values) } finally { globalThis.localStorage = original }
}

test('old sensory preferences migrate without losing topic, display, editor size, or reduced motion', () => storage((values) => {
  values.set(PREFERENCES_KEY, JSON.stringify({ interest: 'music', customTopic: 'my music', colorIntensity: 'calm', reducedMotion: true, soundEffects: true, colorTheme: 'dark', highContrast: true, editorFontSize: 24 }))
  const preferences = loadPreferences()
  assert.equal(preferences.sensoryVersion, 2)
  assert.equal(preferences.colorLevel, 0)
  assert.equal(preferences.motionIntensity, 0)
  assert.equal(preferences.motionPreference, 'custom')
  assert.equal(preferences.visualDensity, 'minimal')
  assert.equal(preferences.soundMuted, false)
  assert.equal(preferences.interest, 'music')
  assert.equal(preferences.customTopic, 'my music')
  assert.equal(preferences.highContrast, true)
  assert.equal(preferences.colorTheme, 'dark')
  assert.equal(preferences.editorFontSize, 24)
}))

test('numeric sensory choices persist after refresh and recover invalid values safely', () => storage((values) => {
  const preferences = updateSensoryPreferences(defaultPreferences, { soundVolume: 65, soundMuted: false, colorLevel: 23, motionIntensity: 25, visualDensity: 'detailed', interactionSounds: true, executionSounds: true })
  savePreferences(preferences)
  assert.deepEqual(loadPreferences(), preferences)
  values.set(PREFERENCES_KEY, JSON.stringify({ sensoryVersion: 2, soundVolume: 150, colorLevel: -10, motionIntensity: 'fast', visualDensity: 'invalid', soundMuted: 'no' }))
  const recovered = loadPreferences()
  assert.equal(recovered.soundVolume, 100)
  assert.equal(recovered.colorLevel, 0)
  assert.equal(recovered.motionIntensity, 50)
  assert.equal(recovered.visualDensity, 'balanced')
  assert.equal(recovered.soundMuted, true)
}))

test('system reduced motion is the default and explicit customization can override it', () => {
  assert.equal(effectiveMotion(defaultPreferences, true), 0)
  const explicit = updateSensoryPreferences(defaultPreferences, { motionIntensity: 25 })
  assert.equal(explicit.motionPreference, 'custom')
  assert.equal(effectiveMotion(explicit, true), 25)
  const still = updateSensoryPreferences(explicit, { motionIntensity: 0 })
  assert.equal(effectiveMotion(still, false), 0)
  assert.equal(sensoryAttributes(still, false).motion, 'reduced')
  assert.equal(sensoryAttributes({ ...defaultPreferences, visualDensity: 'minimal' }).simplified, 'true')
  const low = motionVariables({ ...explicit, motionIntensity: 25 }, false)
  const full = motionVariables({ ...explicit, motionIntensity: 100 }, false)
  assert.ok(parseFloat(low['--motion-float']) < parseFloat(full['--motion-float']))
  assert.ok(parseFloat(low['--motion-marquee']) > parseFloat(full['--motion-marquee']))
})

function luminance(hex) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
}
function contrast(a, b) { const [low, high] = [luminance(a), luminance(b)].sort((a, b) => a - b); return (high + .05) / (low + .05) }
test('decorative color changes retain AA heading and lesson-text contrast at every tested level', () => {
  for (const theme of Object.values(themeCatalog)) for (const colorLevel of [0, 25, 50, 75, 100]) for (const colorTheme of ['light', 'dark']) {
    const variables = sensoryVisualVariables({ ...defaultPreferences, interest: theme.id, colorLevel, colorTheme })
    for (const key of ['sky1', 'sky2', 'sky3']) {
      const background = colorTheme === 'dark' ? variables[`--decor-dark-${key}`] : variables[`--${key}`]
      assert.ok(contrast(colorTheme === 'dark' ? '#FFFFFF' : THEMES[theme.id].vars.hdr, background) >= 4.5, `${theme.id} ${colorLevel} ${colorTheme} heading`)
    }
    assert.ok(contrast(variables['--theme-ink'], variables['--theme-soft']) >= 4.5, `${theme.id} ${colorLevel} ${colorTheme} lesson`)
    assert.equal(variables['--acct'], THEMES[theme.id].vars.acct)
    assert.equal(variables['--text'], undefined)
  }
  const full = sensoryVisualVariables({ ...defaultPreferences, interest: 'ocean', colorLevel: 100 })
  const calm = sensoryVisualVariables({ ...defaultPreferences, interest: 'ocean', colorLevel: 0 })
  assert.equal(full['--sky1'].toLowerCase(), THEMES.ocean.vars.sky1.toLowerCase())
  assert.notEqual(full['--sky1'], calm['--sky1'])
})

function audioHarness() {
  const params = () => ({ events: [], setValueAtTime(value, time) { this.events.push(['set', value, time]) }, setTargetAtTime(value, time, ramp) { this.events.push(['target', value, time, ramp]) }, cancelScheduledValues(time) { this.events.push(['cancel', time]) }, linearRampToValueAtTime(value, time) { this.events.push(['ramp', value, time]) } })
  const gains = [], tones = []
  let contexts = 0
  const context = { state: 'suspended', currentTime: 10, destination: {}, async resume() { this.state = 'running' }, async close() { this.state = 'closed' }, createGain() { const gain = { gain: params(), disconnected: false, connect() {}, disconnect() { this.disconnected = true } }; gains.push(gain); return gain }, createOscillator() { const tone = { frequency: {}, stops: [], connect() {}, disconnect() { this.disconnected = true }, start(time) { this.started = time }, stop(time) { this.stops.push(time); if (time === undefined) this.onended?.() } }; tones.push(tone); return tone } }
  const engine = new SoundEngine(() => { contexts++; return context })
  return { engine, gains, tones, context, contexts: () => contexts }
}
test('sound is lazy and silent by default, including configuration and attempted playback', async () => {
  const { engine, tones, contexts } = audioHarness()
  engine.configure(defaultPreferences)
  assert.equal(engine.play('completion'), false)
  assert.equal(await engine.test(), false)
  assert.equal(contexts(), 0)
  assert.equal(tones.length, 0)
})

test('volume changes actual master gain for every effect and mute stops active audio', async () => {
  const { engine, gains, tones, contexts } = audioHarness()
  const preferences = { ...defaultPreferences, soundMuted: false, soundVolume: 50, interactionSounds: true, executionSounds: true }
  engine.configure(preferences)
  assert.equal(await engine.unlock(), true)
  assert.equal(gains[0].gain.events.at(-1)[1], .035 * .5)
  for (const effect of ['completion', 'success', 'interaction', 'test']) {
    assert.equal(engine.play(effect), true)
    for (const tone of tones) tone.onended?.()
  }
  assert.equal(engine.play('completion'), true)
  assert.equal(contexts(), 1)
  engine.configure({ ...preferences, soundVolume: 25 })
  assert.equal(gains[0].gain.events.at(-1)[1], .035 * .25)
  const playing = tones.slice(-2)
  engine.configure({ ...preferences, soundMuted: true })
  assert.equal(gains[0].gain.events.at(-1)[1], 0)
  assert.ok(playing.every((tone) => tone.stops.includes(undefined) && tone.disconnected))
  for (const effect of ['completion', 'success', 'interaction', 'test']) assert.equal(engine.play(effect), false)
  engine.configure({ ...preferences, soundVolume: 0 })
  assert.equal(await engine.test(), false)
  engine.dispose()
  assert.equal(gains[0].disconnected, true)
})

test('interaction and execution sounds are separately optional; errors never schedule effects', async () => {
  const { engine, tones } = audioHarness()
  engine.configure({ ...defaultPreferences, soundMuted: false })
  await engine.unlock()
  assert.equal(engine.play('interaction'), false)
  assert.equal(engine.play('success'), false)
  assert.equal(executionSound('SyntaxError', false, false), null)
  assert.equal(executionSound('RuntimeError', true, false), null)
  assert.equal(tones.length, 0)
  assert.equal(executionSound('', true, false), 'completion')
  assert.equal(executionSound('', true, true), 'success')
  assert.equal(engine.play('completion'), true)
  engine.dispose()
})


test('rapid repeated sound requests cannot stack unbounded voices', async () => {
  const { engine, tones } = audioHarness()
  engine.configure({ ...defaultPreferences, soundMuted: false, interactionSounds: true, executionSounds: true })
  await engine.unlock()
  for (let index = 0; index < 100; index++) engine.play(index % 2 ? 'interaction' : 'completion')
  assert.equal(tones.length, 2)
  for (const tone of tones) tone.onended?.()
  assert.equal(engine.play('test'), true)
  assert.equal(tones.length, 3)
  engine.dispose()
})
