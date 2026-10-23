import test from 'node:test'
import assert from 'node:assert/strict'
import { executePythonCases } from './python-harness.mjs'
import { basketballScoreAt, basketballScoreHistory, basketballScoreVariable, clampTraceStep, traceLine } from '../src/executionTrace.ts'

const lesson = { checkSource: 'def check(ns, output):\n    return output.strip() == "7", "Print 7."' }
const run = (code) => executePythonCases([{ lesson, code }])[0]

test('real Python traces assignments, loop iterations, and the 7-point basketball score', () => {
  const result = run('scores = [2, 3, 2]\ntotal = 0\nfor score in scores:\n    total += score\nprint(total)')
  assert.equal(result.output, '7\n')
  assert.equal(result.passed, true)
  assert.deepEqual(basketballScoreHistory(result.trace, 'total'), [0, 2, 5, 7])
  assert.deepEqual(result.trace.events.filter((event) => event.loopIteration).map((event) => event.loopIteration.count), [1, 2, 3])
  const finalChange = result.trace.events.find((event) => event.changes.total === 7)
  assert.equal(finalChange.executedLine, 4)
  assert.equal(traceLine(finalChange), 4)
})

test('changing actual Python input changes the basketball score to 9', () => {
  const result = run('scores = [3, 3, 3]\ntotal = 0\nfor score in scores:\n    total += score\nprint(total)')
  assert.equal(result.output, '9\n')
  assert.equal(result.passed, false) // Lesson validation remains independent of simulation.
  assert.deepEqual(basketballScoreHistory(result.trace, 'total'), [0, 3, 6, 9])
})

test('actual conditional branches and function returns appear in the trace', () => {
  const result = run('def points(value):\n    if value > 2:\n        return value + 1\n    else:\n        return value\ntotal = points(3)\nprint(total)')
  assert.equal(result.error, '')
  assert.ok(result.trace.events.some((event) => event.kind === 'call' && event.scope === 'points'))
  assert.ok(result.trace.events.some((event) => event.decision?.branch === 'if'))
  assert.ok(result.trace.events.some((event) => event.kind === 'return' && event.returnValue === 4))
  assert.equal(basketballScoreHistory(result.trace, 'total').at(-1), 4)
  assert.equal(result.trace.events.find((event) => event.changes.total === 4)?.executedLine, 6)
  const falseBranch = run('if False:\n    print("yes")\nelse:\n    print("no")')
  assert.ok(falseBranch.trace.events.some((event) => event.decision?.branch === 'else'))
})

test('syntax errors stay errors and never pass the lesson', () => {
  const result = run('if True print(7)')
  assert.match(result.error, /SyntaxError/)
  assert.equal(result.passed, false)
  assert.deepEqual(result.trace.events, [])
})

test('runtime errors retain the actual Python exception in the trace', () => {
  const result = run('total = 0\nprint(missing_score)')
  assert.match(result.error, /NameError/)
  assert.equal(result.passed, false)
  assert.ok(result.trace.events.some((event) => event.error?.includes('NameError')))
})

test('trace size and output are bounded without fabricating final states', () => {
  const result = run('total = 0\nfor score in range(500):\n    total += 1\nprint(total)')
  assert.equal(result.output, '500\n')
  assert.equal(result.trace.events.length, 400)
  assert.equal(result.trace.truncated, true)
  assert.notEqual(basketballScoreHistory(result.trace, 'total').at(-1), 500)
  const largeOutput = run('print("x" * 22000)')
  assert.equal(largeOutput.output.length, 20000)
  assert.equal(largeOutput.trace.outputTruncated, true)
})

test('unsupported score values fall back clearly, and step controls clamp recorded events', () => {
  const result = run('message = "hello"\nprint(message)')
  assert.deepEqual(basketballScoreHistory(result.trace, 'total'), [])
  assert.equal(basketballScoreAt(result.trace.events.at(-1), 'total'), null)
  assert.equal(clampTraceStep(-3, result.trace), 0)
  assert.equal(clampTraceStep(999, result.trace), result.trace.events.length - 1)
  assert.equal(basketballScoreVariable('loops', result.trace), 'total')
  const themed = run('season_points = 24\nprint(season_points)')
  assert.equal(basketballScoreVariable('loops', themed.trace), 'season_points')
})
