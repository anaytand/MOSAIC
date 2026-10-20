import './render-support.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { CloudConflictError, CloudProgressStore, clearPending, hasGuestWork, mergeAccountCopies, mergeGuestProgress, pendingKey, readPending, writePending } from '../src/lib/cloudProgress.ts'
import { emptyProgress, recordAttempt, recordHint } from '../src/adaptive.ts'
import { defaultPreferences } from '../src/preferences.ts'

const accountA = '11111111-1111-4111-8111-111111111111'
const accountB = '22222222-2222-4222-8222-222222222222'
const draftKey = 'journey-v1:basketball:hello-python:guided'
const blank = () => ({ preferences: { ...defaultPreferences }, progress: emptyProgress() })

function fakeDatabase() {
  const tables = { profiles: [], lesson_progress: [], code_saves: [] }
  let failWrites = false
  function client(initialId) {
    let currentId = initialId
    const api = {
      auth: { getSession: async () => ({ data: { session: currentId ? { user: { id: currentId } } : null }, error: null }) },
      setUser(id) { currentId = id },
      from(table) {
        let operation = 'select'
        let payload = null
        const filters = []
        const query = {
          select() { return query },
          eq(column, value) { filters.push([column, value]); return query },
          insert(value) { operation = 'insert'; payload = value; return query },
          update(value) { operation = 'update'; payload = value; return query },
          maybeSingle() { return Promise.resolve(execute(true)) },
          then(resolve, reject) { return Promise.resolve(execute(false)).then(resolve, reject) },
        }
        function execute(single) {
          const visible = tables[table].filter((row) => row.user_id === currentId && filters.every(([key, value]) => row[key] === value))
          if (operation === 'select') return { data: single ? visible[0] ?? null : structuredClone(visible), error: null }
          if (failWrites) return { data: null, error: { message: 'Network unavailable' } }
          if (!currentId || payload.user_id !== currentId) return { data: null, error: { message: 'RLS denied' } }
          if (operation === 'insert') {
            const key = table === 'profiles' ? ['user_id'] : table === 'lesson_progress' ? ['user_id', 'concept_id'] : ['user_id', 'draft_key']
            if (tables[table].some((row) => key.every((field) => row[field] === payload[field]))) return { data: null, error: { code: '23505', message: 'duplicate key' } }
            tables[table].push(structuredClone(payload))
            return { data: [{ updated_at: payload.updated_at }], error: null }
          }
          for (const row of visible) Object.assign(row, structuredClone(payload))
          return { data: visible.map((row) => ({ updated_at: row.updated_at })), error: null }
        }
        return query
      },
    }
    return api
  }
  return { tables, client, setFailWrites(value) { failWrites = value } }
}

test('login restores completed lessons, mastery evidence, preferences, avatar, hints, and themed drafts on another device', async () => {
  const db = fakeDatabase()
  const first = new CloudProgressStore(db.client(accountA), accountA)
  await first.load()
  const data = blank()
  data.preferences = { ...data.preferences, interest: 'basketball', avatarId: 'basketball', soundMuted: true, colorTheme: 'dark' }
  data.progress = recordAttempt(data.progress, { id: 'attempt-1', conceptId: 'hello-python', exerciseId: draftKey, difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 1, at: 1000 })
  data.progress = recordHint(data.progress, { conceptId: 'hello-python', exerciseId: draftKey, level: 1, at: 900 })
  data.progress.drafts[draftKey] = 'print("Falcons")'
  await first.save(data)
  const second = new CloudProgressStore(db.client(accountA), accountA)
  const restored = (await second.load()).data
  assert.equal(restored.preferences.interest, 'basketball')
  assert.equal(restored.preferences.avatarId, 'basketball')
  assert.equal(restored.preferences.colorTheme, 'dark')
  assert.deepEqual(restored.progress.completedLessonIds, ['hello-python'])
  assert.equal(restored.progress.drafts[draftKey], 'print("Falcons")')
  assert.equal(restored.progress.hints.length, 1)
  assert.equal(db.tables.lesson_progress[0].mastery_score > 0, true)
})

test('logout stops account writes and a different login cannot read or replace the first account', async () => {
  const db = fakeDatabase()
  const clientA = db.client(accountA)
  const storeA = new CloudProgressStore(clientA, accountA)
  await storeA.load()
  const dataA = blank()
  dataA.progress.drafts[draftKey] = 'print("A")'
  await storeA.save(dataA)
  clientA.setUser(null)
  await assert.rejects(storeA.save({ ...dataA, preferences: { ...dataA.preferences, interest: 'ocean' } }), /account changed/i)
  const storeB = new CloudProgressStore(db.client(accountB), accountB)
  const dataB = (await storeB.load()).data
  assert.equal(dataB.progress.drafts[draftKey], undefined)
  dataB.progress.drafts[draftKey] = 'print("B")'
  await storeB.save(dataB)
  assert.equal(db.tables.code_saves.find((row) => row.user_id === accountA).code, 'print("A")')
  assert.equal(db.tables.code_saves.find((row) => row.user_id === accountB).code, 'print("B")')
})

test('guest import retains cloud completions and both conflicting code drafts', () => {
  const cloud = blank()
  cloud.progress = recordAttempt(cloud.progress, { id: 'cloud', conceptId: 'hello-python', exerciseId: draftKey, difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 0, at: 1000 })
  cloud.progress.drafts[draftKey] = 'print("Cloud")'
  const guest = blank()
  guest.preferences.interest = 'ocean'
  guest.progress = recordAttempt(guest.progress, { id: 'guest', conceptId: 'variables', exerciseId: 'journey-v1:ocean:variables:guided', difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 0, at: 2000 })
  guest.progress.drafts[draftKey] = 'print("Guest")'
  const merged = mergeGuestProgress(cloud, guest, true)
  assert.deepEqual(new Set(merged.progress.completedLessonIds), new Set(['hello-python', 'variables']))
  assert.equal(merged.progress.drafts[draftKey], 'print("Cloud")')
  assert.ok(Object.values(merged.progress.drafts).includes('print("Guest")'))
  assert.equal(merged.preferences.interest, null)
  assert.equal(hasGuestWork(guest), true)
})

test('a stale second device cannot silently overwrite newer cloud data', async () => {
  const db = fakeDatabase()
  const first = new CloudProgressStore(db.client(accountA), accountA)
  const second = new CloudProgressStore(db.client(accountA), accountA)
  await first.load(); await second.load()
  const original = blank()
  await first.save(original)
  await assert.rejects(second.save({ ...original, preferences: { ...original.preferences, interest: 'ocean' } }), CloudConflictError)
  const refreshed = new CloudProgressStore(db.client(accountA), accountA)
  const newer = (await refreshed.load()).data
  newer.preferences.interest = 'space'
  await refreshed.save(newer)
  await assert.rejects(first.save({ ...original, preferences: { ...original.preferences, interest: 'trains' } }), CloudConflictError)
  assert.equal(db.tables.profiles[0].interest_id, 'space')
})

test('network failure cannot confirm a save, and an account-scoped backup remains available', async () => {
  const db = fakeDatabase()
  const store = new CloudProgressStore(db.client(accountA), accountA)
  await store.load()
  const data = blank()
  data.progress.drafts[draftKey] = 'print("offline")'
  const storage = new Map()
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) }
  writePending(accountA, data)
  db.setFailWrites(true)
  await assert.rejects(store.save(data), /Network unavailable/)
  assert.equal(readPending(accountA).progress.drafts[draftKey], 'print("offline")')
  assert.equal(readPending(accountB), null)
  assert.notEqual(pendingKey(accountA), pendingKey(accountB))
  db.setFailWrites(false)
  await store.save(data)
  clearPending(accountA)
  assert.equal(readPending(accountA), null)
})

test('choosing an unsynced device copy preserves the newer cloud draft as a separate copy', () => {
  const cloud = blank()
  cloud.progress.drafts[draftKey] = 'print("Newer cloud")'
  const device = blank()
  device.progress.drafts[draftKey] = 'print("Device")'
  const merged = mergeAccountCopies(cloud, device)
  assert.equal(merged.progress.drafts[draftKey], 'print("Device")')
  assert.ok(Object.values(merged.progress.drafts).includes('print("Newer cloud")'))
})

test('legacy completion IDs without attempt history and queued input drafts survive cloud restoration', async () => {
  const db = fakeDatabase()
  const store = new CloudProgressStore(db.client(accountA), accountA)
  await store.load()
  const data = blank()
  data.progress.completedLessonIds = ['variables']
  data.progress.completedExerciseIds = ['variables:guided:ocean']
  data.progress.inputDrafts['journey-v1:ocean:user-input:guided'] = 'Reef\n3'
  await store.save(data)
  const restored = (await new CloudProgressStore(db.client(accountA), accountA).load()).data.progress
  assert.deepEqual(restored.completedLessonIds, ['variables'])
  assert.deepEqual(restored.completedExerciseIds, ['variables:guided:ocean'])
  assert.equal(restored.inputDrafts['journey-v1:ocean:user-input:guided'], 'Reef\n3')
  assert.equal(db.tables.lesson_progress[0].mastery_score, null)
})
