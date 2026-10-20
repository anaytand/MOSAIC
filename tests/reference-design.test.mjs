import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const { defaultPreferences, loadPreferences, savePreferences } = await import('../src/preferences.ts')
const { emptyProgress, recordAttempt } = await import('../src/adaptive.ts')
const { selectedWorld, THEMES } = await import('../src/design/worlds.ts')
const { THEMES: referenceThemes } = await import('../mosaic-reference/src/data/themes.ts')
const { sensoryAttributes, editorTextSize } = await import('../src/sensory.ts')
const { WorldPicker } = await import('../src/components/reference/WorldPicker.tsx')
const { SensoryCards } = await import('../src/components/reference/SensoryCards.tsx')
const { SensoryControls } = await import('../src/components/SensoryControls.tsx')
const { StageRoadmap } = await import('../src/components/reference/StageRoadmap.tsx')
const { HomePage } = await import('../src/components/LearningPages.tsx')
const { getLearningLesson } = await import('../src/lessons.ts')
const noop = () => {}
const render = (component, props) => renderToStaticMarkup(createElement(component, props))
function controls(element) {
  if (!element || typeof element !== 'object') return []
  const children = Array.isArray(element.props?.children) ? element.props.children.flat(Infinity) : [element.props?.children]
  return [element, ...children.flatMap(controls)]
}

test('original mascot, logo, and favicon are preserved byte-for-byte', () => {
  for (const file of ['mosaic-logo.svg', 'mosaic-robot.svg']) assert.equal(readFileSync(new URL(`../public/brand/${file}`, import.meta.url), 'utf8'), readFileSync(new URL(`../mosaic-reference/assets/${file}`, import.meta.url), 'utf8'))
  assert.equal(readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8'), readFileSync(new URL('../mosaic-reference/public/favicon.svg', import.meta.url), 'utf8'))
})

test('original visual world palettes stay faithful to the reference', () => {
  for (const id of ['mosaic', 'space', 'ocean', 'trains', 'music']) assert.deepEqual(THEMES[id], referenceThemes[id])
  assert.equal(selectedWorld(defaultPreferences), 'mosaic')
  assert.equal(selectedWorld({ interest: 'custom', customTopic: 'basketball' }), 'basketball')
  assert.equal(selectedWorld({ interest: 'sports', customTopic: '' }), 'basketball')
  assert.equal(selectedWorld({ interest: 'custom', customTopic: 'baking' }), 'mosaic')
})

test('world picker updates interests while retaining sensory preferences and separate learning records', () => {
  const progress = recordAttempt(emptyProgress(), { id: 'first', conceptId: 'hello-python', exerciseId: 'journey-v1:basketball:hello-python:guided', difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 0, at: 1 })
  const before = structuredClone(progress)
  const preferences = { ...defaultPreferences, interest: 'basketball', colorTheme: 'dark', colorIntensity: 'calm', fontSize: 'large', customTopic: 'kept topic' }
  let changed
  const tree = WorldPicker({ preferences, onChange: (value) => { changed = value } })
  const buttons = controls(tree).filter((node) => node.type === 'button')
  for (const button of buttons) {
    button.props.onClick()
    const label = button.props.children[1]
    assert.equal(changed.interest, label === 'MOSAIC' ? null : label.toLowerCase())
    assert.deepEqual({ ...changed, interest: preferences.interest }, preferences)
  }
  assert.deepEqual(progress, before)
})

test('reference sensory sliders and switches affect persisted application and editor preferences', () => {
  const saved = new Map()
  globalThis.localStorage = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) }
  let preferences = { ...defaultPreferences, interest: 'space', editorFontSize: 13 }
  const change = (value) => { preferences = value; savePreferences(value) }
  const fields = () => controls(SensoryControls({ preferences, onChange: change }))
  fields().find((node) => node.props?.label === 'Color intensity').props.onChange(0)
  assert.equal(preferences.colorIntensity, 'calm')
  fields().find((node) => node.props?.label === 'Text size').props.onChange(2)
  assert.equal(editorTextSize(preferences), 20)
  assert.equal(preferences.editorFontSize, null)
  fields().find((node) => node.type === 'select').props.onChange({ target: { value: 'dark' } })
  fields().find((node) => node.props?.label === 'Motion intensity').props.onChange(0)
  fields().find((node) => node.props?.label === 'Visual density').props.onChange(0)
  const markup = render(SensoryCards, { preferences, progress: emptyProgress(), onChange: change, onSensory: noop, onResume: noop })
  for (const label of ['Sound volume', 'Color intensity', 'Motion intensity', 'Visual density', 'Test Sound']) assert.ok(markup.includes(label))
  const restored = loadPreferences()
  assert.equal(restored.interest, 'space')
  assert.equal(restored.colorTheme, 'dark')
  assert.equal(restored.reducedMotion, true)
  assert.equal(restored.visualDensity, 'minimal')
  assert.equal(restored.soundEffects, false)
  assert.equal(sensoryAttributes(restored, false).motion, 'reduced')
  assert.equal(sensoryAttributes(restored, false).intensity, 'calm')
  assert.equal(editorTextSize(restored), 20)
})

test('four-stage roadmap opens only the functional Python curriculum', () => {
  let opened = 0
  const tree = StageRoadmap({ onPython: () => { opened++ } })
  const html = render(StageRoadmap, { onPython: noop })
  for (const label of ['Blocks', 'Python', 'JavaScript', 'Portfolio']) assert.ok(html.includes(label))
  assert.equal((html.match(/Upcoming/g) ?? []).length, 3)
  const buttons = controls(tree).filter((node) => node.type === 'button')
  assert.equal(buttons.length, 1)
  buttons[0].props.onClick()
  assert.equal(opened, 1)
})

test('home uses actual saved code, accurate progress, and real-workspace actions', () => {
  const preferences = { ...defaultPreferences, interest: 'space' }
  const lesson = getLearningLesson('hello-python', 'guided', preferences)
  const progress = { ...emptyProgress(), completedLessonIds: ['hello-python'], drafts: { [lesson.exerciseId]: 'print("My saved mission")' } }
  const html = render(HomePage, { preferences, progress, onStart: noop, onSelectLesson: noop, onPath: noop, onSetup: noop, onSensory: noop, onPreferencesChange: noop })
  assert.match(html, /My saved mission/)
  assert.match(html, /Welcome back/)
  assert.match(html, /1 of 12/)
  assert.match(html, /Open coding workspace/)
  assert.match(html, /WORKSPACE PREVIEW/)
  assert.doesNotMatch(html, /18 min left|5 minutes until|Welcome, Alex|Practice Streak|Got it, fix line/)
})

test('reference world headings, captions, and text accents meet AA contrast', () => {
  const luminance = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
  const contrast = (a, b) => { const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (high + .05) / (low + .05) }
  for (const id of ['mosaic', 'basketball', 'space', 'ocean', 'trains', 'animals', 'music']) {
    const colors = THEMES[id].vars
    for (const sky of [colors.sky1, colors.sky2, colors.sky3]) assert.ok(contrast(colors.hdr, sky) >= 4.5, `${id} heading`)
    assert.ok(contrast('#B4C2C7', colors.card) >= 4.5, `${id} caption`)
    assert.ok(contrast(colors.acct, '#FFFFFF') >= 4.5, `${id} accent`)
  }
})
