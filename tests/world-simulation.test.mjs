import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { executePythonCases } from './python-harness.mjs'
import { conceptOrder } from '../src/adaptive.ts'
import { themeCatalog } from '../src/themes/catalog.ts'
import { oceanDepthPosition, signalMeterPercent, simulationContract, simulationFrames, worldStateAt } from '../src/worldSimulation.ts'

const themeIds = ['basketball', 'space', 'ocean', 'trains', 'animals', 'music']
const checkSource = 'def check(ns, output):\n    return False, "Simulation does not award lesson completion."'
const { WorldSimulation } = await import('../src/components/WorldSimulation.tsx')
const { defaultPreferences } = await import('../src/preferences.ts')

function probe(theme, conceptId, values = [2, 3, 2]) {
  const metric = theme.fields[2].key
  const list = JSON.stringify(values)
  switch (conceptId) {
    case 'hello-python': return { code: `print(${JSON.stringify(theme.introduction[0])})\nprint(${JSON.stringify(theme.introduction[1])})`, expected: theme.introduction.join('\n') }
    case 'variables': return { code: `${metric} = 2\n${metric} += 5\nprint(${metric})`, expected: 7 }
    case 'conditions': return { code: 'status = "Waiting"\nif 7 > 3:\n    status = "Ready"\nelse:\n    status = "Wait"\nprint(status)', expected: 'Ready' }
    case 'loops': return { code: `${theme.series.key} = ${list}\n${theme.series.totalKey} = 0\nfor value in ${theme.series.key}:\n    ${theme.series.totalKey} += value\nprint(${theme.series.totalKey})`, expected: values.reduce((a, b) => a + b, 0) }
    case 'functions': return { code: `def ${theme.calculator.name}(values):\n    return sum(values) / len(values)\nprint(${theme.calculator.name}(${list}))`, expected: values.reduce((a, b) => a + b, 0) / values.length }
    case 'lists': return { code: 'def extend_collection(items, new_item):\n    return items + [new_item]\nprint(extend_collection(["A"], "B"))', expected: ['A', 'B'] }
    case 'strings': return { code: 'def clean_label(text):\n    return text.strip().title()\nprint(clean_label("  ocean base  "))', expected: 'Ocean Base' }
    case 'dictionaries': return { code: `def make_record(name, value):\n    return {${JSON.stringify(theme.fields[0].key)}: name, ${JSON.stringify(metric)}: value}\nprint(make_record("A", 7))`, expected: { [theme.fields[0].key]: 'A', [metric]: 7 } }
    case 'user-input': return { code: 'def read_entry():\n    return input()\nprint(read_entry())', inputLines: ['A'], expected: 'A' }
    case 'numbers': return { code: `def calculate_average(values):\n    return sum(values) / len(values)\nprint(calculate_average(${list}))`, expected: values.reduce((a, b) => a + b, 0) / values.length }
    case 'combining-concepts': return { code: `def analyze(records):\n    return {"total": sum(record[${JSON.stringify(metric)}] for record in records), "selected": ["A"]}\nprint(analyze([{${JSON.stringify(metric)}: 7}]))`, expected: { total: 7, selected: ['A'] } }
    case 'final-project': return { code: `def build_report(records):\n    return {"total": sum(record[${JSON.stringify(metric)}] for record in records), "selected": ["A"]}\nprint(build_report([{${JSON.stringify(metric)}: 7}]))`, expected: { total: 7, selected: ['A'] } }
  }
}

test('all six themes and twelve lessons map to values produced by actual Python runs', () => {
  const cases = themeIds.flatMap((themeId) => conceptOrder.map((conceptId) => {
    const theme = themeCatalog[themeId]
    const example = probe(theme, conceptId)
    return { themeId, conceptId, example, lesson: { checkSource }, code: example.code, inputLines: example.inputLines ?? [] }
  }))
  const results = executePythonCases(cases)
  assert.equal(results.length, 72)
  cases.forEach(({ themeId, conceptId, example }, index) => {
    const theme = themeCatalog[themeId]
    const result = results[index]
    assert.equal(result.error, '', `${themeId}/${conceptId}: ${result.error}`)
    assert.equal(result.passed, false, 'A simulation must not award completion')
    const contract = simulationContract(theme, conceptId)
    assert.ok(contract.label, `${themeId}/${conceptId} has a named contract`)
    const state = worldStateAt(result.trace, result.trace.events.length - 1, theme, conceptId)
    assert.equal(state.available, true, `${themeId}/${conceptId} should have real scene data`)
    assert.deepEqual(state.value, example.expected, `${themeId}/${conceptId} must reflect Python behavior`)
  })
})

test('changing loop data changes each world without changing the Python contract', () => {
  const cases = themeIds.flatMap((themeId) => [[2, 3, 2], [3, 3, 3]].map((values) => {
    const theme = themeCatalog[themeId]
    const example = probe(theme, 'loops', values)
    return { themeId, example, lesson: { checkSource }, code: example.code }
  }))
  const results = executePythonCases(cases)
  results.forEach((result, index) => {
    const theme = themeCatalog[cases[index].themeId]
    const state = worldStateAt(result.trace, result.trace.events.length - 1, theme, 'loops')
    assert.equal(state.value, index % 2 === 0 ? 7 : 9)
    assert.equal(state.recordedIterations, 3)
  })
})

test('the same traced program keeps its behavior when the displayed interest changes', () => {
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'scores = [2, 3, 2]\ntotal = 0\nfor score in scores:\n    total += score\nprint(total)' }])
  for (const themeId of themeIds) {
    const state = worldStateAt(result.trace, result.trace.events.length - 1, themeCatalog[themeId], 'loops')
    assert.equal(state.value, 7, themeId)
    assert.equal(state.sourceName, 'module variable total')
  }
})

test('conditional scenes reflect the branch and status that actually executed', () => {
  const codes = [true, false].map((ready) => `signal = ${ready ? 1 : 0}\nif signal == 1:\n    status = "Ready"\nelse:\n    status = "Wait"\nprint(status)`)
  const results = executePythonCases(codes.map((code) => ({ lesson: { checkSource }, code })))
  for (const themeId of themeIds) {
    assert.equal(worldStateAt(results[0].trace, results[0].trace.events.length - 1, themeCatalog[themeId], 'conditions').value, 'Ready')
    assert.equal(worldStateAt(results[1].trace, results[1].trace.events.length - 1, themeCatalog[themeId], 'conditions').value, 'Wait')
  }
  assert.ok(results[0].trace.events.some((event) => event.decision?.branch === 'if'))
  assert.ok(results[1].trace.events.some((event) => event.decision?.branch === 'else'))
})

test('missing lesson values remain unavailable rather than invented', () => {
  const theme = themeCatalog.space
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'print("Hello")' }])
  for (const conceptId of ['variables', 'conditions', 'functions', 'lists', 'strings', 'dictionaries', 'user-input', 'numbers', 'combining-concepts', 'final-project']) {
    const state = worldStateAt(result.trace, result.trace.events.length - 1, theme, conceptId)
    assert.equal(state.available, false, conceptId)
  }
  const output = worldStateAt(result.trace, result.trace.events.length - 1, theme, 'hello-python')
  assert.equal(output.value, 'Hello')
})

test('oversized collections are labeled as unavailable instead of reporting a false item count', () => {
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'def extend_collection(items, new_item):\n    return list(range(13))\nprint(extend_collection([], 0))' }])
  const state = worldStateAt(result.trace, result.trace.events.length - 1, themeCatalog.animals, 'lists')
  assert.equal(state.available, false)
  assert.equal(state.value, '<collection too large to show>')
})

test('all six themed scenes render one Play button without debugger controls', () => {
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'total = 7\nprint(total)' }])
  for (const themeId of themeIds) {
    const html = renderToStaticMarkup(createElement(WorldSimulation, { trace: result.trace, conceptId: 'loops', theme: themeCatalog[themeId], preferences: { ...defaultPreferences, interest: themeId }, onHighlightLine: () => {} }))
    assert.match(html, new RegExp(`world-art--${themeId}`))
    assert.match(html, /See Your Code Come to Life/)
    assert.match(html, /▶ Play Simulation/)
    assert.doesNotMatch(html, /Previous Step|Next Step|Restart|Execution step|Variables at this step|Step \d+ of|Line \d+/)
    assert.equal((html.match(/<button/g) ?? []).length, 1)
    assert.match(html, /Press Play to watch this run from the beginning/)
  }
})

test('guided Space loops turn actual signal readings into playback frames', () => {
  const theme = themeCatalog.space
  const readings = [72, 66, 60]
  const code = `signal_readings = ${JSON.stringify(readings)}\nfor signal in signal_readings:\n    print(signal)`
  const [result] = executePythonCases([{ lesson: { checkSource }, code }])
  const iterations = result.trace.events.filter((event) => event.loopIteration)
  assert.deepEqual(iterations.map((event) => [event.loopIteration.source, event.loopIteration.item, event.variables.signal]), [['signal_readings', 'signal', 72], ['signal_readings', 'signal', 66], ['signal_readings', 'signal', 60]])
  const frames = simulationFrames(result.trace, theme, 'loops')
  assert.deepEqual(frames.filter((frame) => frame.state.event.loopIteration).map((frame) => frame.reading), readings)
  assert.equal(frames.at(-1).state.value, 3)
  assert.equal(frames.at(-1).state.label, 'Signal readings processed')
  assert.equal(frames.at(-1).progress, 1)
})

test('all six guided worlds use their own recorded loop values', () => {
  const cases = themeIds.map((themeId) => {
    const theme = themeCatalog[themeId]
    const code = `${theme.series.key} = [3, 5, 8]\nfor observation in ${theme.series.key}:\n    print(observation)`
    return { themeId, lesson: { checkSource }, code }
  })
  const results = executePythonCases(cases)
  cases.forEach(({ themeId }, index) => {
    const frames = simulationFrames(results[index].trace, themeCatalog[themeId], 'loops')
    assert.deepEqual(frames.filter((frame) => frame.state.event.loopIteration).map((frame) => frame.reading), [3, 5, 8], themeId)
    assert.equal(frames.at(-1).state.recordedIterations, 3)
  })
})

test('changed code changes playback readings and final result without invented data', () => {
  const theme = themeCatalog.basketball
  const codes = [[2, 3, 2], [3, 3, 3]].map((scores) => `game_scores = ${JSON.stringify(scores)}\nseason_points = 0\nfor score in game_scores:\n    season_points += score\nprint(season_points)`)
  const results = executePythonCases(codes.map((code) => ({ lesson: { checkSource }, code })))
  const frames = results.map((result) => simulationFrames(result.trace, theme, 'loops'))
  assert.deepEqual(frames[0].filter((frame) => frame.state.event.loopIteration).map((frame) => frame.reading), [2, 3, 2])
  assert.deepEqual(frames[1].filter((frame) => frame.state.event.loopIteration).map((frame) => frame.reading), [3, 3, 3])
  assert.deepEqual(frames.map((sequence) => sequence.at(-1).state.value), [7, 9])
  assert.deepEqual(frames[0].filter((frame) => (frame.scoreDelta ?? 0) > 0).map((frame) => frame.scoreDelta), [2, 3, 2])
  assert.deepEqual(frames[1].filter((frame) => (frame.scoreDelta ?? 0) > 0).map((frame) => frame.scoreDelta), [3, 3, 3])
  assert.ok(frames.every((sequence) => sequence.every((frame) => results.some((result) => result.trace.events[frame.eventIndex] === frame.state.event))))
})

test('unsupported code has no simulated result', () => {
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'print("Hello")' }])
  assert.deepEqual(simulationFrames(result.trace, themeCatalog.space, 'loops'), [])
  const html = renderToStaticMarkup(createElement(WorldSimulation, { trace: result.trace, conceptId: 'loops', theme: themeCatalog.space, preferences: defaultPreferences, onHighlightLine: () => {} }))
  assert.match(html, /This run did not record/)
  assert.match(html, /disabled=""/)
  assert.doesNotMatch(html, /Waiting for a recorded value/)
})

test('a Python error after recorded data ends playback with the real error event', () => {
  const code = 'signal_readings = [72]\nfor signal in signal_readings:\n    print(signal)\n1 / 0'
  const [result] = executePythonCases([{ lesson: { checkSource }, code }])
  const frames = simulationFrames(result.trace, themeCatalog.space, 'loops')
  assert.match(result.error, /ZeroDivisionError/)
  assert.match(frames.at(-1).state.event.error, /ZeroDivisionError/)
})

test('long real loops are sampled to a bounded playback and retain the final result', () => {
  const code = 'game_scores = list(range(60))\nseason_points = 0\nfor score in game_scores:\n    season_points += score\nprint(season_points)'
  const [result] = executePythonCases([{ lesson: { checkSource }, code }])
  const frames = simulationFrames(result.trace, themeCatalog.basketball, 'loops')
  assert.ok(frames.length > 1 && frames.length <= 28)
  assert.equal(frames.at(-1).state.value, 1770)
  assert.equal(frames.at(-1).progress, 1)
})

test('reduced motion keeps the scene and text while disabling visual transitions', () => {
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'signal_readings = [72]\nfor signal in signal_readings:\n    print(signal)' }])
  const html = renderToStaticMarkup(createElement(WorldSimulation, { trace: result.trace, conceptId: 'loops', theme: themeCatalog.space, preferences: { ...defaultPreferences, reducedMotion: true, motionIntensity: 0 }, onHighlightLine: () => {} }))
  assert.match(html, /world-art--space/)
  assert.match(html, /data-animate="false"/)
  assert.match(html, /▶ Play Simulation/)
})

test('signal and depth visuals change with actual readings while keeping bounded display scales', () => {
  assert.equal(signalMeterPercent(72), 72)
  assert.equal(signalMeterPercent(9), 9)
  assert.equal(signalMeterPercent(130), 100)
  assert.equal(signalMeterPercent('not a signal'), null)
  assert.ok(oceanDepthPosition(24) > oceanDepthPosition(12))
  assert.equal(oceanDepthPosition(100), oceanDepthPosition(30))
})
