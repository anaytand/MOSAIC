import type { AttemptRecord, ColorTheme, Difficulty, FontSize, HintRecord, Interest, LessonProgress, UserPreferences } from './types.ts'
import { conceptOrder, emptyProgress, isConceptId, isDifficulty, recommend } from './adaptive.ts'

export const PREFERENCES_KEY = 'mosaic-preferences'
export const LESSON_PROGRESS_KEY = 'mosaic-lesson-progress'
export const LEARNING_DATA_KEY = 'mosaic-learning-v1'
export const defaultPreferences: UserPreferences = { interest: null, customTopic: '', reducedMotion: false, highContrast: false, fontSize: 'standard', colorTheme: 'light', editorFontSize: null, simplifiedInterface: false, onboardingComplete: false }
const interests: Interest[] = ['ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom']

export function loadPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY)
    if (!saved) return defaultPreferences
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return defaultPreferences
    const value = parsed as Record<string, unknown>
    const interest = interests.includes(value.interest as Interest) ? value.interest as Interest : null
    const fontSize: FontSize = ['large', 'extra-large'].includes(String(value.fontSize)) ? value.fontSize as FontSize : 'standard'
    const colorTheme: ColorTheme = value.colorTheme === 'dark' ? 'dark' : 'light'
    const editorFontSize = typeof value.editorFontSize === 'number' && Number.isFinite(value.editorFontSize) ? Math.max(12, Math.min(28, value.editorFontSize)) : null
    return { ...defaultPreferences, interest, customTopic: typeof value.customTopic === 'string' ? value.customTopic.slice(0, 48) : '', reducedMotion: value.reducedMotion === true, highContrast: value.highContrast === true, fontSize, colorTheme, editorFontSize, simplifiedInterface: value.simplifiedInterface === true, onboardingComplete: value.onboardingComplete === true }
  } catch { return defaultPreferences }
}
export function savePreferences(preferences: UserPreferences): void { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)) }

const safeStrings = (value: unknown, max = 1000): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length <= 200).slice(0, max) : []
function safeAttempts(value: unknown): AttemptRecord[] {
  if (!Array.isArray(value)) return []
  return value.slice(-500).filter((item): item is AttemptRecord => {
    if (!item || typeof item !== 'object') return false
    const a = item as Record<string, unknown>
    return typeof a.id === 'string' && a.id.length < 100 && isConceptId(a.conceptId) && typeof a.exerciseId === 'string' && a.exerciseId.length < 200 && isDifficulty(a.difficulty) && typeof a.passed === 'boolean' && (a.errorCategory === null || ['syntax', 'indentation', 'name', 'type', 'timeout', 'runtime', 'check', 'worker'].includes(String(a.errorCategory))) && Number.isInteger(a.hintsUsed) && Number(a.hintsUsed) >= 0 && Number(a.hintsUsed) <= 3 && typeof a.at === 'number' && Number.isFinite(a.at)
  })
}
function safeHints(value: unknown): HintRecord[] {
  if (!Array.isArray(value)) return []
  return value.slice(-1000).filter((item): item is HintRecord => {
    if (!item || typeof item !== 'object') return false
    const h = item as Record<string, unknown>
    return isConceptId(h.conceptId) && typeof h.exerciseId === 'string' && h.exerciseId.length < 200 && [1, 2, 3].includes(Number(h.level)) && typeof h.at === 'number' && Number.isFinite(h.at)
  })
}
function safeDrafts(value: unknown): Record<string, string> {
  const drafts: Record<string, string> = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return drafts
  for (const [key, draft] of Object.entries(value).slice(0, 100)) if (key.length < 200 && typeof draft === 'string' && draft.length <= 100_000) drafts[key] = draft
  return drafts
}
export function parseLearningData(raw: string | null, legacyRaw: string | null = null): LessonProgress {
  const base = emptyProgress()
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).version === 1) {
      const data = parsed as Record<string, unknown>
      const timeSpentMs = { ...base.timeSpentMs }
      if (data.timeSpentMs && typeof data.timeSpentMs === 'object') for (const id of conceptOrder) {
        const value = (data.timeSpentMs as Record<string, unknown>)[id]
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) timeSpentMs[id] = Math.min(value, 1_000_000_000)
      }
      const attempts = safeAttempts(data.attempts)
      const completedLessonIds = safeStrings(data.completedLessonIds).filter(isConceptId)
      const progress: LessonProgress = { ...base, currentLessonId: isConceptId(data.currentLessonId) ? data.currentLessonId : base.currentLessonId,
        drafts: safeDrafts(data.drafts), completedLessonIds: [...new Set(completedLessonIds)], completedExerciseIds: safeStrings(data.completedExerciseIds),
        attempts, hints: safeHints(data.hints), timeSpentMs, difficultyOverride: isDifficulty(data.difficultyOverride) ? data.difficultyOverride as Difficulty : null,
        lastCompletedExerciseId: typeof data.lastCompletedExerciseId === 'string' && data.lastCompletedExerciseId.length < 200 ? data.lastCompletedExerciseId : null }
      // Recompute derived recommendation; never trust a stale or malformed saved estimate.
      return { ...progress, recommendation: recommend(progress) }
    }
  } catch { /* Use legacy data or a safe empty record. */ }
  try {
    const legacy: unknown = legacyRaw ? JSON.parse(legacyRaw) : null
    if (!legacy || typeof legacy !== 'object') return base
    const old = legacy as Record<string, unknown>
    const drafts = safeDrafts(old.drafts)
    if (typeof old.codeDraft === 'string' && old.codeDraft.length <= 100_000 && !drafts['hello-python']) drafts['hello-python'] = old.codeDraft
    const progress: LessonProgress = { ...base, currentLessonId: isConceptId(old.currentLessonId) ? old.currentLessonId : base.currentLessonId,
      drafts, completedLessonIds: safeStrings(old.completedLessonIds).filter(isConceptId) }
    // Legacy completions are retained; their historical attempts cannot be reconstructed.
    return { ...progress, recommendation: recommend(progress) }
  } catch { return base }
}
export function loadLessonProgress(): LessonProgress {
  try { return parseLearningData(localStorage.getItem(LEARNING_DATA_KEY), localStorage.getItem(LESSON_PROGRESS_KEY)) } catch { return emptyProgress() }
}
export function saveLessonProgress(progress: LessonProgress): void { localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(progress)) }
