import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlaybackClock } from '../src/simulationPlayback.ts'

test('playback keeps only one timer and a fresh play cancels the old tick', () => {
  let nextId = 0
  const pending = new Map()
  const clock = createPlaybackClock({
    set(callback, delayMs) { assert.ok(delayMs > 0); const id = ++nextId; pending.set(id, () => { pending.delete(id); callback() }); return id },
    clear(id) { pending.delete(id) },
  })
  let calls = 0
  clock.schedule(() => { calls++ }, 500)
  clock.schedule(() => { calls += 10 }, 500)
  assert.equal(pending.size, 1)
  const tick = pending.values().next().value
  tick()
  assert.equal(calls, 10)
  clock.cancel()
  assert.equal(pending.size, 0)
})

test('closing or unmounting playback cancels pending animation work', () => {
  let pending = null
  const clock = createPlaybackClock({ set(callback) { pending = callback; return 1 }, clear() { pending = null } })
  let called = false
  clock.schedule(() => { called = true }, 800)
  clock.cancel()
  assert.equal(pending, null)
  assert.equal(called, false)
  clock.schedule(() => { called = true }, 800)
  const tick = pending
  tick()
  assert.equal(called, true)
})
