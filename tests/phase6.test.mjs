import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const { defaultPreferences, savePreferences, loadPreferences } = await import('../src/preferences.ts')
const { emptyProgress } = await import('../src/adaptive.ts')
const { getLearningLesson } = await import('../src/lessons.ts')
const { companionId, companionGuidance } = await import('../src/companions/catalog.ts')
const { CompanionArt } = await import('../src/components/CompanionArt.tsx')
const { CompanionPanel } = await import('../src/components/CompanionPanel.tsx')
const noop = () => {}

test('each interest selects a consistent SVG companion and supports all six states', () => {
  for (const [interest, expected] of [[null, 'robot'], ['ocean', 'shark'], ['basketball', 'basketball'], ['space', 'astronaut'], ['trains', 'train'], ['animals', 'fox'], ['music', 'music']]) {
    const preferences = { ...defaultPreferences, interest }
    assert.equal(companionId(preferences), expected)
    for (const state of ['idle', 'welcoming', 'explaining', 'thinking', 'encouraging', 'celebrating']) {
      const html = renderToStaticMarkup(createElement(CompanionArt, { preferences, state }))
      assert.match(html, new RegExp(`data-companion="${expected}"`))
      assert.match(html, new RegExp(`data-companion-state="${state}"`))
      assert.match(html, /<svg/)
    }
  }
})
test('companion guidance uses active objectives, actual validation feedback, and real recommendation', () => {
  const preferences = { ...defaultPreferences, interest: 'basketball' }
  const lesson = getLearningLesson('variables', 'guided', preferences)
  const progress = emptyProgress()
  assert.ok(companionGuidance(lesson, progress).message.includes(lesson.objective))
  assert.ok(companionGuidance(lesson, progress, { passed: false, error: '', feedback: 'Set team_score to 24.' }).message.includes('Set team_score to 24.'))
  assert.equal(companionGuidance(lesson, progress, { passed: true, error: 'NameError', feedback: '' }).state, 'encouraging')
  const html = renderToStaticMarkup(createElement(CompanionPanel, { lesson, progress, preferences, running: false, onPreferencesChange: noop, onHint: noop, onStart: noop, onContinue: noop }))
  assert.ok(html.includes(lesson.title) || html.includes('scoreboard'))
  assert.match(html, /Let&#x27;s Start/)
  assert.match(html, /Hide companion/)
  assert.match(html, /<details/)
})
test('companion can be disabled and the preference persists without changing progress', () => {
  const values = new Map()
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const preferences = { ...defaultPreferences, companionEnabled: false }
  savePreferences(preferences)
  assert.equal(loadPreferences().companionEnabled, false)
  const html = renderToStaticMarkup(createElement(CompanionPanel, { lesson: getLearningLesson('variables', 'guided', preferences), progress: emptyProgress(), preferences, running: false, onPreferencesChange: noop, onHint: noop, onStart: noop, onContinue: noop }))
  assert.match(html, /Show learning companion/)
  assert.doesNotMatch(html, /Let&#x27;s Start/)
})

const { AmbientEngine } = await import('../src/ambient.ts')
const { motionRate, applyMotionRates } = await import('../src/motionPlayback.ts')
test('ambient audio is explicit, volume-controlled, paused for code, and stoppable', async () => {
  let creations = 0, plays = 0, pauses = 0
  const media = { src: '', volume: 0, loop: false, preload: '', async play() { plays++ }, pause() { pauses++ }, addEventListener() {}, removeEventListener() {} }
  const engine = new AmbientEngine(() => { creations++; return media })
  let preferences = { ...defaultPreferences }
  engine.configure(preferences)
  assert.equal(creations, 0)
  await engine.play()
  assert.equal(plays, 0)
  preferences = { ...preferences, soundMuted: false, musicVolume: 30 }
  engine.configure(preferences)
  await Promise.resolve()
  assert.equal(media.volume, .3)
  assert.equal(engine.snapshot(), 'Playing')
  const previousPlays = plays
  engine.configure({ ...preferences, musicVolume: 60 })
  assert.equal(media.volume, .6)
  assert.equal(plays, previousPlays)
  engine.setExecuting(true)
  assert.equal(engine.snapshot(), 'Paused during Python execution')
  engine.setExecuting(false)
  await Promise.resolve()
  assert.equal(engine.snapshot(), 'Playing')
  engine.pause()
  assert.equal(engine.snapshot(), 'Paused')
  assert.ok(pauses > 0)
  engine.dispose()
})
test('missing ambient assets produce an explicit unavailable state', async () => {
  const engine = new AmbientEngine(() => ({ src: '', volume: 0, loop: false, preload: '', play: async () => { throw Error('missing') }, pause() {}, addEventListener() {}, removeEventListener() {} }))
  engine.configure({ ...defaultPreferences, soundMuted: false })
  await engine.play()
  assert.match(engine.snapshot(), /unavailable/)
})
test('motion speed has a distinct range and updates without restarting animation', () => {
  assert.equal(motionRate(0), 0)
  assert.ok(motionRate(100) / motionRate(25) >= 8)
  const updates = []
  const animation = { animationName: 'mosaic-type-drift', currentTime: 1234, effect: { getTiming: () => ({ iterations: Infinity }) }, updatePlaybackRate(value) { updates.push(value) } }
  applyMotionRates({ getAnimations: () => [animation] }, 25)
  applyMotionRates({ getAnimations: () => [animation] }, 100)
  assert.equal(animation.currentTime, 1234)
  assert.deepEqual(updates, [motionRate(25), motionRate(100)])
})

const { KeyboardProductPage } = await import('../src/components/KeyboardProductPage.tsx')
const { parseRoute, routeHash } = await import('../src/navigation.ts')
test('keyboard concept route is stable and signed-out visitors cannot submit personal information', () => {
  assert.equal(routeHash(parseRoute('#keyboard')),'#keyboard')
  assert.equal(routeHash(parseRoute('#keyboards')),'#keyboard')
  const html=renderToStaticMarkup(createElement(KeyboardProductPage,{session:null,onSignIn:noop,client:null}))
  assert.match(html,/Meet the MOSAIC/)
  assert.match(html,/Adaptive Keyboard/)
  assert.match(html,/\$114\.99 per keyboard/)
  assert.match(html,/Availability to be announced/)
  assert.match(html,/Request to Buy/)
  assert.doesNotMatch(html,/name="email"|type="password"|credit-card/)
})
