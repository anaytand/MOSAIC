import type { SupabaseClient } from '@supabase/supabase-js'
import { conceptOrder, emptyProgress, masteryFor, recommend } from '../adaptive.ts'
import { defaultPreferences, parseLearningData, parsePreferences } from '../preferences.ts'
import type { AttemptRecord, HintRecord, LessonProgress, UserPreferences } from '../types.ts'

export interface LearningData { preferences: UserPreferences; progress: LessonProgress }
type TableName = 'profiles' | 'lesson_progress' | 'code_saves'
type StoredRow = Record<string, unknown> & { updated_at: string }
type RowEntry = { data: Record<string, unknown>; updatedAt: string }
const pendingPrefix = 'mosaic-cloud-pending-v1:'

export class CloudConflictError extends Error { constructor() { super('Newer cloud data was found. Your changes are kept on this device until you choose what to do.') } }

export function pendingKey(userId: string): string { return `${pendingPrefix}${userId}` }
export function readPending(userId: string): LearningData | null {
  try {
    const raw = localStorage.getItem(pendingKey(userId))
    if (!raw) return null
    const value = JSON.parse(raw) as { preferences?: unknown; progress?: unknown }
    if (!value || typeof value !== 'object' || !value.preferences || typeof value.preferences !== 'object' ||
      !value.progress || typeof value.progress !== 'object' || (value.progress as { version?: unknown }).version !== 1) return null
    return { preferences: parsePreferences(JSON.stringify(value.preferences)), progress: parseLearningData(JSON.stringify(value.progress)) }
  } catch { return null }
}
export function writePending(userId: string, data: LearningData): boolean {
  try { localStorage.setItem(pendingKey(userId), JSON.stringify(data)); return true } catch { return false }
}
export function clearPending(userId: string, expected?: LearningData): void {
  try {
    if (expected && localStorage.getItem(pendingKey(userId)) !== JSON.stringify(expected)) return
    localStorage.removeItem(pendingKey(userId))
  } catch { /* Storage may be unavailable. */ }
}

function profileRow(userId: string, data: LearningData): Record<string, unknown> {
  const { interest, customTopic, avatarId, ...preferences } = data.preferences
  return { user_id: userId, interest_id: interest, custom_topic: customTopic, avatar_id: avatarId ?? null,
    preferences, current_lesson_id: data.progress.currentLessonId, difficulty_override: data.progress.difficultyOverride,
    last_completed_exercise_id: data.progress.lastCompletedExerciseId, project_snapshots: data.progress.projectSnapshots,
    progress_format_version: 1 }
}
function progressRows(userId: string, progress: LessonProgress): Map<string, Record<string, unknown>> {
  const rows = new Map<string, Record<string, unknown>>()
  for (const conceptId of conceptOrder) {
    const attempts = progress.attempts.filter((item) => item.conceptId === conceptId)
    const hints = progress.hints.filter((item) => item.conceptId === conceptId)
    const completedExerciseIds = progress.completedExerciseIds.filter((id) => id === conceptId || id.startsWith(`${conceptId}:`) || id.includes(`:${conceptId}:`))
    const completed = progress.completedLessonIds.includes(conceptId)
    const timeSpent = progress.timeSpentMs[conceptId] ?? 0
    if (!completed && !completedExerciseIds.length && !attempts.length && !hints.length && !timeSpent) continue
    rows.set(conceptId, { user_id: userId, concept_id: conceptId, completed, completed_exercise_ids: completedExerciseIds,
      attempts, hints, time_spent_ms: timeSpent, mastery_score: attempts.length ? masteryFor(progress.attempts, conceptId) : null,
      mastery_model_version: attempts.length ? 1 : null })
  }
  return rows
}
function draftRows(userId: string, progress: LessonProgress): Map<string, Record<string, unknown>> {
  const rows = new Map<string, Record<string, unknown>>()
  for (const key of new Set([...Object.keys(progress.drafts), ...Object.keys(progress.inputDrafts)])) {
    if (key.length >= 600) continue
    const match = conceptOrder.find((id) => key === id || key.startsWith(`${id}:`) || key.includes(`:${id}:`))
    const interest = ['basketball', 'ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom'].find((id) => key.includes(`:${id}:`)) ?? null
    rows.set(key, { user_id: userId, draft_key: key, concept_id: match ?? null, interest_id: interest,
      code: Object.hasOwn(progress.drafts, key) ? progress.drafts[key] : null,
      input_draft: Object.hasOwn(progress.inputDrafts, key) ? progress.inputDrafts[key] : null })
  }
  return rows
}
function equalData(a: Record<string, unknown>, b: Record<string, unknown>): boolean { return JSON.stringify(a) === JSON.stringify(b) }
function rowVersion(previous?: RowEntry): string {
  const past = previous ? Date.parse(previous.updatedAt) : 0
  return new Date(Math.max(Date.now(), Number.isFinite(past) ? past + 1 : 0)).toISOString()
}
function cloudError(error: { message?: string } | null): void { if (error) throw new Error(error.message || 'Cloud save failed.') }

export class CloudProgressStore {
  private baseline = new Map<string, RowEntry>()
  private loaded = false
  hasProfile = false
  private client: SupabaseClient
  readonly userId: string
  constructor(client: SupabaseClient, userId: string) { this.client = client; this.userId = userId }
  private async checkAccount(): Promise<void> {
    const { data, error } = await this.client.auth.getSession()
    if (error || data.session?.user.id !== this.userId) throw new Error('Your account changed. Sign in again before saving.')
  }
  private key(table: TableName, id: string): string { return `${table}:${id}` }
  async load(): Promise<{ data: LearningData; hasProfile: boolean; hasCloudData: boolean }> {
    await this.checkAccount()
    const [profileResult, lessonsResult, draftsResult] = await Promise.all([
      this.client.from('profiles').select('*').eq('user_id', this.userId).maybeSingle(),
      this.client.from('lesson_progress').select('*').eq('user_id', this.userId),
      this.client.from('code_saves').select('*').eq('user_id', this.userId),
    ])
    cloudError(profileResult.error); cloudError(lessonsResult.error); cloudError(draftsResult.error)
    this.baseline.clear()
    const profile = profileResult.data as StoredRow | null
    const lessons = (lessonsResult.data ?? []) as StoredRow[]
    const drafts = (draftsResult.data ?? []) as StoredRow[]
    this.hasProfile = !!profile
    const prefs = profile ? parsePreferences(JSON.stringify({ ...(profile.preferences as object), interest: profile.interest_id, customTopic: profile.custom_topic, avatarId: profile.avatar_id })) : defaultPreferences
    const raw = { ...emptyProgress(), currentLessonId: profile?.current_lesson_id, difficultyOverride: profile?.difficulty_override,
      lastCompletedExerciseId: profile?.last_completed_exercise_id, projectSnapshots: profile?.project_snapshots,
      completedLessonIds: lessons.filter((row) => row.completed === true).map((row) => row.concept_id),
      completedExerciseIds: lessons.flatMap((row) => Array.isArray(row.completed_exercise_ids) ? row.completed_exercise_ids : []),
      attempts: lessons.flatMap((row) => Array.isArray(row.attempts) ? row.attempts : []).sort((a, b) => Number(a.at) - Number(b.at)),
      hints: lessons.flatMap((row) => Array.isArray(row.hints) ? row.hints : []).sort((a, b) => Number(a.at) - Number(b.at)),
      timeSpentMs: Object.fromEntries(lessons.map((row) => [row.concept_id, row.time_spent_ms])),
      drafts: Object.fromEntries(drafts.filter((row) => typeof row.code === 'string').map((row) => [row.draft_key, row.code])),
      inputDrafts: Object.fromEntries(drafts.filter((row) => typeof row.input_draft === 'string').map((row) => [row.draft_key, row.input_draft])),
    }
    const progress = parseLearningData(JSON.stringify(raw))
    const data = { preferences: prefs, progress }
    // Baselines use the exact database payload; a no-op load must not write back.
    if (profile) this.baseline.set(this.key('profiles', this.userId), { data: profileRow(this.userId, data), updatedAt: profile.updated_at })
    for (const row of lessons) {
      const id = String(row.concept_id)
      this.baseline.set(this.key('lesson_progress', id), { data: progressRows(this.userId, progress).get(id) ?? {}, updatedAt: row.updated_at })
    }
    for (const row of drafts) {
      const id = String(row.draft_key)
      this.baseline.set(this.key('code_saves', id), { data: draftRows(this.userId, progress).get(id) ?? {}, updatedAt: row.updated_at })
    }
    this.loaded = true
    return { data, hasProfile: !!profile, hasCloudData: !!profile || lessons.length > 0 || drafts.length > 0 }
  }
  private async put(table: TableName, idColumn: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.checkAccount()
    const key = this.key(table, id)
    const previous = this.baseline.get(key)
    if (previous && equalData(previous.data, data)) return
    const updatedAt = rowVersion(previous)
    const payload = { ...data, updated_at: updatedAt }
    if (previous) {
      const { data: rows, error } = await this.client.from(table).update(payload).eq('user_id', this.userId)
        .eq(idColumn, id).eq('updated_at', previous.updatedAt).select('updated_at')
      cloudError(error)
      if (!Array.isArray(rows) || rows.length !== 1) throw new CloudConflictError()
    } else {
      const { data: rows, error } = await this.client.from(table).insert(payload).select('updated_at')
      if (error?.code === '23505') throw new CloudConflictError()
      cloudError(error)
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Cloud save was not confirmed.')
    }
    this.baseline.set(key, { data, updatedAt })
  }
  async save(data: LearningData): Promise<void> {
    if (!this.loaded) throw new Error('Cloud progress has not finished loading.')
    await this.put('profiles', 'user_id', this.userId, profileRow(this.userId, data))
    for (const [id, row] of progressRows(this.userId, data.progress)) await this.put('lesson_progress', 'concept_id', id, row)
    for (const [id, row] of draftRows(this.userId, data.progress)) await this.put('code_saves', 'draft_key', id, row)
  }
}

export function hasGuestWork(data: LearningData): boolean {
  const { progress, preferences } = data
  return progress.completedLessonIds.length > 0 || progress.attempts.length > 0 || progress.hints.length > 0 ||
    Object.keys(progress.drafts).length > 0 || Object.keys(progress.inputDrafts).length > 0 ||
    preferences.onboardingComplete || preferences.interest !== null
}
function alternateDraftKey(key: string, target: Record<string, string>, value: string): string {
  const concept = conceptOrder.find((id) => key === id || key.includes(`:${id}:`) || key.startsWith(`${id}:`)) ?? 'hello-python'
  const base = `${concept}:guest-import:${key}`
  for (let number = 1; number < 1000; number++) {
    const suffix = number === 1 ? '' : `:${number}`
    const candidate = `${base.slice(0, 599 - suffix.length)}${suffix}`
    if (!(candidate in target) || target[candidate] === value) return candidate
  }
  throw new Error('Too many copies of this draft. Please remove an older copy before importing again.')
}
export function mergeGuestProgress(cloud: LearningData, guest: LearningData, cloudHasProfile: boolean): LearningData {
  const attempts = [...new Map([...guest.progress.attempts, ...cloud.progress.attempts].map((item: AttemptRecord) => [item.id, item])).values()]
    .sort((a, b) => a.at - b.at).slice(-500)
  const hints = [...new Map([...cloud.progress.hints, ...guest.progress.hints].map((item: HintRecord) => [`${item.exerciseId}:${item.level}:${item.at}`, item])).values()]
    .sort((a, b) => a.at - b.at).slice(-1000)
  const drafts = { ...cloud.progress.drafts }
  const inputDrafts = { ...cloud.progress.inputDrafts }
  const preserve = (target: Record<string, string>, key: string, value: string) => {
    if (!(key in target) || target[key] === value) { target[key] = value; return }
    target[alternateDraftKey(key, target, value)] = value
  }
  for (const [key, value] of Object.entries(guest.progress.drafts)) preserve(drafts, key, value)
  for (const [key, value] of Object.entries(guest.progress.inputDrafts)) preserve(inputDrafts, key, value)
  const progress = parseLearningData(JSON.stringify({ ...cloud.progress,
    currentLessonId: cloudHasProfile ? cloud.progress.currentLessonId : guest.progress.currentLessonId,
    difficultyOverride: cloudHasProfile ? cloud.progress.difficultyOverride : guest.progress.difficultyOverride,
    lastCompletedExerciseId: cloud.progress.lastCompletedExerciseId ?? guest.progress.lastCompletedExerciseId,
    completedLessonIds: [...new Set([...cloud.progress.completedLessonIds, ...guest.progress.completedLessonIds])],
    completedExerciseIds: [...new Set([...cloud.progress.completedExerciseIds, ...guest.progress.completedExerciseIds])],
    timeSpentMs: Object.fromEntries(conceptOrder.map((id) => [id, Math.max(cloud.progress.timeSpentMs[id] ?? 0, guest.progress.timeSpentMs[id] ?? 0)])),
    attempts, hints, drafts, inputDrafts,
    projectSnapshots: { ...guest.progress.projectSnapshots, ...cloud.progress.projectSnapshots },
  }))
  return { preferences: cloudHasProfile ? cloud.preferences : guest.preferences, progress: { ...progress, recommendation: recommend(progress) } }
}

export function mergeAccountCopies(cloud: LearningData, device: LearningData): LearningData {
  const merged = mergeGuestProgress(cloud, device, false)
  const drafts = { ...merged.progress.drafts }
  const inputDrafts = { ...merged.progress.inputDrafts }
  for (const [key, value] of Object.entries(device.progress.drafts)) if (key in cloud.progress.drafts && cloud.progress.drafts[key] !== value) { drafts[alternateDraftKey(key, drafts, cloud.progress.drafts[key])] = cloud.progress.drafts[key]; drafts[key] = value }
  for (const [key, value] of Object.entries(device.progress.inputDrafts)) if (key in cloud.progress.inputDrafts && cloud.progress.inputDrafts[key] !== value) { inputDrafts[alternateDraftKey(key, inputDrafts, cloud.progress.inputDrafts[key])] = cloud.progress.inputDrafts[key]; inputDrafts[key] = value }
  return { ...merged, progress: { ...merged.progress, drafts, inputDrafts } }
}

