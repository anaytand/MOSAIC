import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { executePythonCases } from './python-harness.mjs'
import { conceptOrder } from '../src/adaptive.ts'
import { themeCatalog } from '../src/themes/catalog.ts'
import { simulationContract, worldStateAt } from '../src/worldSimulation.ts'

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

test('all six themed scenes render from one accessible playback component', () => {
  const [result] = executePythonCases([{ lesson: { checkSource }, code: 'total = 7\nprint(total)' }])
  for (const themeId of themeIds) {
    const html = renderToStaticMarkup(createElement(WorldSimulation, { trace: result.trace, conceptId: 'loops', theme: themeCatalog[themeId], preferences: { ...defaultPreferences, interest: themeId }, onHighlightLine: () => {} }))
    assert.match(html, new RegExp(`world-art--${themeId}`))
    assert.match(html, /See Your Code Come to Life/)
    assert.match(html, /Previous Step/)
    assert.match(html, /Next Step/)
    assert.match(html, /Execution step/)
    assert.match(html, /It does not determine whether the lesson is complete/)
  }
})
