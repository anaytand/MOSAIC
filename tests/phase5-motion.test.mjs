import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const { observeMotionRegion } = await import('../src/motionActivity.ts')
const { RobotMascot } = await import('../src/components/RobotMascot.tsx')
const { SensoryPreview } = await import('../src/components/SensoryPreview.tsx')
const { defaultPreferences } = await import('../src/preferences.ts')
const { effectiveMotion, motionVariables } = await import('../src/motion.ts')

test('offscreen and hidden-tab decorative animation pauses without React renders, and observers clean up', () => {
  const element = { dataset: {} }
  const listeners = new Set()
  const visibility = { hidden: false, addEventListener(name, callback) { assert.equal(name, 'visibilitychange'); listeners.add(callback) }, removeEventListener(name, callback) { listeners.delete(callback) } }
  let changed, disconnected = false
  const stop = observeMotionRegion(element, visibility, (callback) => { changed = callback; return { observe(target) { assert.equal(target, element) }, disconnect() { disconnected = true } } })
  assert.equal(element.dataset.motionActive, 'false')
  changed(true)
  assert.equal(element.dataset.motionActive, 'true')
  visibility.hidden = true
  for (const listener of listeners) listener()
  assert.equal(element.dataset.motionActive, 'false')
  visibility.hidden = false
  for (const listener of listeners) listener()
  assert.equal(element.dataset.motionActive, 'true')
  changed(false)
  assert.equal(element.dataset.motionActive, 'false')
  stop()
  assert.equal(disconnected, true)
  assert.equal(listeners.size, 0)
  changed(true)
  assert.equal(element.dataset.motionActive, 'false')
})

test('browsers without an animation observer get a usable static fallback', () => {
  const element = { dataset: {} }
  const stop = observeMotionRegion(element, { hidden: false, addEventListener() {}, removeEventListener() {} }, undefined)
  assert.equal(element.dataset.motionActive, 'false')
  stop()
})

test('robot retains the reference geometry and colors with isolated optional motion groups', () => {
  const reference = readFileSync(new URL('../public/brand/mosaic-robot.svg', import.meta.url), 'utf8')
  const html = renderToStaticMarkup(createElement(RobotMascot, { label: 'MOSAIC robot', reaction: 'welcome', floating: true }))
  // All original paths and geometric attributes survive the animation wrapper migration.
  for (const match of reference.matchAll(/\b(d|cx|cy|rx|ry|r|x|y|width|height|x1|x2|y1|y2)="([^"]+)"/g)) {
    if (['width', 'height'].includes(match[1]) && ['920', '680'].includes(match[2])) continue // standalone export dimensions
    assert.ok(html.includes(`${match[1]}="${match[2]}"`), `${match[1]}=${match[2]}`)
  }
  for (const color of ['#1E3A5F', '#3B8FBF', '#EBA25E', '#EFFFFA']) assert.ok(html.includes(color))
  assert.match(html, /robot-antenna/)
  assert.match(html, /robot-eyes/)
  assert.match(html, /robot-wave-arm/)
  assert.match(html, /data-motion-active="false"/)
  const pair = renderToStaticMarkup(createElement('div', null, createElement(RobotMascot), createElement(RobotMascot)))
  const gradientIds = [...pair.matchAll(/id="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(gradientIds).size, gradientIds.length)
})

test('zero motion resolves to zero amplitude, with explicit static CSS states and no editor animation targets', () => {
  const preferences = { ...defaultPreferences, motionIntensity: 0, motionPreference: 'custom' }
  assert.equal(effectiveMotion(preferences, false), 0)
  assert.equal(motionVariables(preferences, false)['--motion-float'], '0px')
  const css = readFileSync(new URL('../src/styles/motion.css', import.meta.url), 'utf8')
  assert.match(css, /animation-play-state: paused !important/)
  assert.match(css, /data-motion='reduced'/)
  assert.doesNotMatch(css, /\.monaco|\.code-editor|\.editor-panel|@keyframes[^}]*width:/)
  const global = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(global, /html\[data-motion='reduced'\].*animation: none !important/)
  assert.match(global, /html:not\(\[data-motion-preference='custom'\]\)/)
})

test('live preview uses the same palette and mascot with repeated, clipped decorative typography', () => {
  const html = renderToStaticMarkup(createElement(SensoryPreview, { preferences: defaultPreferences }))
  assert.match(html, /LIVE STYLE PREVIEW/)
  assert.match(html, /--decor-strength:50%/)
  assert.equal((html.match(/YOUR WORLD · YOUR WORLD ·/g) ?? []).length, 2)
  assert.match(html, /robot-floating/)
  assert.match(html, /data-motion-active="false"/)
  const css = readFileSync(new URL('../src/styles/sensory.css', import.meta.url), 'utf8')
  assert.match(css, /sensory-preview-scene[^}]*overflow: hidden/)
})
