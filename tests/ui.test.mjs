import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const { defaultPreferences, loadPreferences, savePreferences } = await import('../src/preferences.ts')
const { emptyProgress, recordAttempt, setDifficultyOverride } = await import('../src/adaptive.ts')
const { parseRoute, routeHash } = await import('../src/navigation.ts')
const { HomePage, LearningPath, ProgressPage } = await import('../src/components/LearningPages.tsx')
const { Onboarding } = await import('../src/components/Onboarding.tsx')
const { ExecutionFeedback } = await import('../src/components/ExecutionFeedback.tsx')
const { Workspace } = await import('../src/components/Workspace.tsx')
const { default: App } = await import('../src/App.tsx')
const values = new Map()
const sessionValues = new Map()
globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
globalThis.sessionStorage = { getItem: (key) => sessionValues.get(key) ?? null, setItem: (key, value) => sessionValues.set(key, value) }
globalThis.window = { location: { hash: '#home' } }
const noop = () => {}
const render = (component, props) => renderToStaticMarkup(createElement(component, props))
const successfulAttempt = { id: 'first', conceptId: 'hello-python', exerciseId: 'hello-python:guided:custom:basketball', difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 0, at: 1 }

test('existing preferences migrate with compatible defaults for new view settings', () => {
  values.clear()
  values.set('mosaic-preferences', JSON.stringify({ interest: 'custom', customTopic: 'basketball', colorTheme: 'dark', highContrast: true, reducedMotion: true, fontSize: 'large', onboardingComplete: true }))
  const preferences = loadPreferences()
  assert.equal(preferences.customTopic, 'basketball')
  assert.equal(preferences.colorTheme, 'dark')
  assert.equal(preferences.highContrast, true)
  assert.equal(preferences.layoutDensity, 'spacious')
  assert.equal(preferences.focusMode, false)
  assert.equal(preferences.colorIntensity, 'balanced')
  assert.equal(preferences.soundEffects, false)
  savePreferences({ ...preferences, simplifiedInterface: true, focusMode: true, layoutDensity: 'compact' })
  assert.equal(loadPreferences().simplifiedInterface, true)
  assert.equal(loadPreferences().focusMode, true)
  assert.equal(loadPreferences().layoutDensity, 'compact')
})

test('hash navigation restores the workspace and dedicated pages on refresh', () => {
  for (const hash of ['#home', '#learn', '#learn/workspace', '#progress', '#settings', '#setup', '#sensory']) assert.equal(routeHash(parseRoute(hash)), hash)
  assert.equal(parseRoute('#unknown').page, 'Home')
  assert.equal(parseRoute('#learn/workspace').workspace, true)
})

test('setup welcomes the learner and includes an immediate Skip Setup control', () => {
  sessionValues.clear()
  const html = render(Onboarding, { preferences: defaultPreferences, progress: emptyProgress(), onChange: noop, onDifficulty: noop, onFinish: noop, onBack: noop })
  assert.match(html, /Let&#x27;s make coding work for you/)
  assert.match(html, /Step 1 of 4/)
  assert.match(html, /Get Started/)
  assert.match(html, /Skip Setup/)
  assert.doesNotMatch(html, /name="interest"/)
})

test('setup renders one focused question at each saved step and a real summary', () => {
  const preferences = { ...defaultPreferences, interest: 'custom', customTopic: 'basketball', colorTheme: 'dark' }
  const progress = setDifficultyOverride(emptyProgress(), 'independent')
  for (const [step, expected] of [[1, 'What do you enjoy learning about'], [2, 'How much guidance would you like'], [3, 'How colorful would you like your workspace'], [4, 'You&#x27;re ready to start']]) {
    sessionValues.set('mosaic-setup-step', String(step))
    const html = render(Onboarding, { preferences, progress, onChange: noop, onDifficulty: noop, onFinish: noop, onBack: noop })
    assert.ok(html.includes(expected))
    assert.match(html, /Back/)
    if (step === 4) { assert.match(html, /basketball/); assert.match(html, /Balanced/); assert.match(html, /Start My First Lesson/) }
  }
  sessionValues.clear()
})

test('new learner home and Progress show useful starting actions without invented scores', () => {
  const progress = emptyProgress()
  const home = render(HomePage, { preferences: defaultPreferences, progress, onSelectLesson: noop, onStart: noop, onPath: noop, onSetup: noop })
  assert.match(home, /Start Coding/)
  assert.match(home, /The MOSAIC robot guide/); assert.match(home, /Code that fits/)
  assert.doesNotMatch(home, /Welcome back/)
  const analytics = render(ProgressPage, { progress, onSelectLesson: noop })
  assert.match(analytics, /Your first step is waiting/)
  assert.doesNotMatch(analytics, /aria-valuenow/)
})

test('roadmap uses completed, current, and upcoming labels from actual progress', () => {
  const progress = { ...recordAttempt(emptyProgress(), successfulAttempt), currentLessonId: 'variables' }
  const html = render(LearningPath, { preferences: defaultPreferences, progress, onSelectLesson: noop })
  assert.match(html, /Python concept completed/)
  assert.match(html, /Current lesson/)
  assert.match(html, /Upcoming/)
  assert.match(html, /Review Print Statements/)
  assert.match(html, /Continue Variables/)
})

test('success feedback presents saved completion and the next recommended concept', () => {
  const progress = recordAttempt(emptyProgress(), successfulAttempt)
  const html = render(ExecutionFeedback, { passed: true, feedback: '', alreadyCompleted: false, progress, onContinue: noop, onReviewTask: noop, onHint: noop })
  assert.match(html, /Lesson Complete/)
  assert.match(html, /1 of 12 concepts completed/)
  assert.match(html, /Continue to Variables/)
  assert.match(html, /role="status"/)
})

test('incomplete feedback distinguishes successful execution from lesson completion', () => {
  const html = render(ExecutionFeedback, { passed: false, feedback: 'Print the required message as its own output line.', alreadyCompleted: false, progress: emptyProgress(), onContinue: noop, onReviewTask: noop, onHint: noop })
  assert.match(html, /Your code ran/)
  assert.match(html, /Task not complete yet/)
  assert.match(html, /Review Task/)
  assert.doesNotMatch(html, /Lesson Complete/)
})

test('workspace retains three named tabs, code saving, reset confirmation, and guidance choices', () => {
  const html = render(Workspace, { preferences: { ...defaultPreferences, simplifiedInterface: true, focusMode: true }, progress: emptyProgress(), onProgressChange: noop, onPreferencesChange: noop, onBackToPath: noop, onOpenSettings: noop })
  assert.equal((html.match(/role="tab"/g) ?? []).length, 3)
  assert.match(html, /workspace-tab-instructions/)
  assert.ok(html.indexOf('THE GOAL') < html.indexOf('aria-label="Learning companion"'))
  assert.ok(html.indexOf('Your task') < html.indexOf('aria-label="Learning companion"'))
  assert.doesNotMatch(html, /class="lesson-details"|class="text-button task-hint"/)
  assert.match(html, /Run Code/)
  assert.match(html, /aria-keyshortcuts="Control\+Enter Meta\+Enter"/)
  assert.match(html, /Save Progress/)
  assert.match(html, /Restore the starter code/)
  assert.match(html, /Step by Step/)
  assert.match(html, /Balanced/)
  assert.match(html, /Explore/)
})

test('application renders consistent navigation and saved settings routes', () => {
  values.clear()
  window.location.hash = '#settings'
  const html = render(App, {})
  assert.match(html, /aria-label="Main navigation"/)
  assert.match(html, />Progress<\/button>/)
  assert.match(html, /Opening your learning space/)
  assert.match(html, /Open accessibility and learning preferences/)
  window.location.hash = '#home'
})

test('core theme tokens meet AA text contrast and visible control contrast', async () => {
  const { readFileSync } = await import('node:fs')
  const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
  const parse = (selector) => Object.fromEntries([...css.slice(css.indexOf(selector)).split('}')[0].matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((match) => [match[1], match[2]]))
  const base = parse(':root')
  const lightHigh = parse("html[data-contrast='high']")
  const dark = parse("html[data-theme='dark']")
  const darkHigh = parse("html[data-theme='dark'][data-contrast='high']")
  const luminance = (hex) => {
    const values = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722
  }
  const contrast = (a, b) => { const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (high + .05) / (low + .05) }
  for (const theme of [base, { ...base, ...dark }, { ...base, ...lightHigh }, { ...base, ...dark, ...lightHigh, ...darkHigh }]) {
    for (const surface of ['--paper', '--surface', '--surface-soft']) {
      assert.ok(contrast(theme['--text'], theme[surface]) >= 4.5)
      assert.ok(contrast(theme['--text-muted'], theme[surface]) >= 4.5)
    }
    assert.ok(contrast(theme['--primary-text'], theme['--teal']) >= 4.5)
    assert.ok(contrast(theme['--control-line'], theme['--surface']) >= 3)
    assert.ok(contrast(theme['--focus'], theme['--paper']) >= 3)
  }
})

test('basketball and space change the visible academy, lessons, and stories without inventing milestones', () => {
  const basketball = render(LearningPath, { preferences: { ...defaultPreferences, interest: 'basketball' }, progress: emptyProgress(), onSelectLesson: noop })
  const space = render(LearningPath, { preferences: { ...defaultPreferences, interest: 'space' }, progress: emptyProgress(), onSelectLesson: noop })
  assert.match(basketball, /Basketball Coding Academy/)
  assert.match(basketball, /Build a Scoreboard/)
  assert.match(basketball, /Mosaic Falcons/)
  assert.match(space, /Space Exploration Mission/)
  assert.match(space, /Build Mission Control/)
  assert.match(space, /Aurora/)
  assert.doesNotMatch(basketball, /Built in this journey/)
})

test('sensory matcher renders exactly one live preference question at each step', async () => {
  const { SensoryMatcher } = await import('../src/components/SensoryMatcher.tsx')
  const questions = ['How colorful would you like your workspace?', 'Which display feels most comfortable?', 'What text size is easiest to read?', 'How much motion and sound would you like?', 'How would you like your learning space organized?']
  for (let step = 0; step < questions.length; step++) {
    sessionValues.set('mosaic-sensory-step', String(step))
    const html = render(SensoryMatcher, { preferences: { ...defaultPreferences, interest: 'basketball' }, onChange: noop, onFinish: noop, onExit: noop })
    assert.match(html, new RegExp(`Preference ${step + 1} of 5`))
    assert.ok(html.includes(questions[step]))
    assert.match(html, /LIVE STYLE PREVIEW/)
    assert.match(html, /Skip sensory setup/)
    if (step === 3) assert.match(html, /disabled=""/)
    for (let other = 0; other < questions.length; other++) if (step !== other) assert.equal(html.includes(questions[other]), false)
  }
  sessionValues.clear()
})

test('project preview shows only a valid contract and labels it as the last validated run', async () => {
  const { ProjectPreview } = await import('../src/components/ProjectPreview.tsx')
  const { themeCatalog } = await import('../src/themes/catalog.ts')
  const theme = themeCatalog.basketball
  const snapshot = { version: 1, themeId: 'basketball', values: Object.fromEntries(theme.fields.map((field) => [field.key, field.value])) }
  const html = render(ProjectPreview, { theme, snapshot })
  assert.match(html, /Last validated Python run/)
  assert.match(html, /Mosaic Falcons/)
  assert.match(html, /Harbor Hawks/)
  assert.match(html, /<strong>24<\/strong>/)
  const invalid = render(ProjectPreview, { theme, snapshot: { ...snapshot, values: { ...snapshot.values, team_score: 999 } } })
  assert.doesNotMatch(invalid, /Last validated Python run/)
  assert.doesNotMatch(invalid, />999</)
})
