import type { AttemptRecord, ColorTheme, Difficulty, FontSize, HintRecord, Interest, LessonProgress, UserPreferences } from './types.ts'
import { parseProjectSnapshot } from './themes/projects.ts'
import type { ProjectSnapshot, ThemeId } from './themes/types.ts'
import { conceptOrder, emptyProgress, isConceptId, isDifficulty, recommend } from './adaptive.ts'

export const PREFERENCES_KEY = 'mosaic-preferences'
export const LESSON_PROGRESS_KEY = 'mosaic-lesson-progress'
export const LEARNING_DATA_KEY = 'mosaic-learning-v1'
export const defaultPreferences: UserPreferences = { musicVolume: 20, musicDuringExecution: false, companionEnabled: true, avatarId: null, sensoryVersion: 2, masterImmersion: 50, colorLevel: 50, motionIntensity: 50, motionPreference: 'system', visualDensity: 'balanced', soundVolume: 35, soundMuted: true, interactionSounds: false, executionSounds: false, interest: null, customTopic: '', colorIntensity: 'balanced', soundEffects: false, reducedMotion: false, highContrast: false, fontSize: 'standard', colorTheme: 'light', editorFontSize: null, simplifiedInterface: false, layoutDensity: 'spacious', focusMode: false, onboardingComplete: false, literalMode: false, readingSpacing: 'standard', readingGuide: false, warmTint: 0, breakReminderMinutes: 0 }
const interests: Interest[] = ['basketball', 'ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom']

export function loadPreferences(): UserPreferences {
  try { return parsePreferences(localStorage.getItem(PREFERENCES_KEY)) } catch { return defaultPreferences }
}
export function parsePreferences(saved: string | null): UserPreferences {
  try {
    if (!saved) return defaultPreferences
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return defaultPreferences
    const value = parsed as Record<string, unknown>
    const interest = interests.includes(value.interest as Interest) ? value.interest as Interest : null
    const fontSize: FontSize = ['large', 'extra-large'].includes(String(value.fontSize)) ? value.fontSize as FontSize : 'standard'
    const colorTheme: ColorTheme = value.colorTheme === 'dark' ? 'dark' : 'light'
    const editorFontSize = typeof value.editorFontSize === 'number' && Number.isFinite(value.editorFontSize) ? Math.max(12, Math.min(28, value.editorFontSize)) : null
    const percent = (input: unknown, fallback: number) => typeof input === 'number' && Number.isFinite(input) ? Math.round(Math.max(0, Math.min(100, input))) : fallback
    const legacyColor = value.colorIntensity === 'calm' ? 0 : value.colorIntensity === 'vibrant' ? 100 : 50
    const modern = value.sensoryVersion === 2
    const sensory = {
      masterImmersion: percent(value.masterImmersion, 50),
      musicVolume: percent(value.musicVolume, 20),
      musicDuringExecution: value.musicDuringExecution === true,
      colorLevel: percent(value.colorLevel, legacyColor),
      motionIntensity: percent(value.motionIntensity, value.reducedMotion === true ? 0 : 50),
      motionPreference: value.motionPreference === 'custom' || !modern && value.reducedMotion === true ? 'custom' as const : 'system' as const,
      visualDensity: value.visualDensity === 'minimal' || value.visualDensity === 'detailed' ? value.visualDensity : !modern && (value.colorIntensity === 'calm' || value.simplifiedInterface === true) ? 'minimal' : 'balanced',
      soundVolume: percent(value.soundVolume, 35),
      soundMuted: typeof value.soundMuted === 'boolean' ? value.soundMuted : value.soundEffects !== true,
      interactionSounds: value.interactionSounds === true,
      executionSounds: value.executionSounds === true,
    } satisfies Partial<UserPreferences>
    return { ...defaultPreferences, ...sensory, companionEnabled: value.companionEnabled !== false, avatarId: ['robot', 'shark', 'basketball', 'astronaut', 'train', 'fox', 'dinosaur', 'music'].includes(String(value.avatarId)) ? value.avatarId as UserPreferences['avatarId'] : null, interest, customTopic: typeof value.customTopic === 'string' ? value.customTopic.slice(0, 48) : '', colorIntensity: value.colorIntensity === 'calm' || value.colorIntensity === 'vibrant' ? value.colorIntensity : 'balanced', soundEffects: value.soundEffects === true, reducedMotion: value.reducedMotion === true, highContrast: value.highContrast === true, fontSize, colorTheme, editorFontSize, simplifiedInterface: value.simplifiedInterface === true, layoutDensity: value.layoutDensity === 'compact' ? 'compact' : 'spacious', focusMode: value.focusMode === true, onboardingComplete: value.onboardingComplete === true, literalMode: value.literalMode === true, readingSpacing: value.readingSpacing === 'wide' ? 'wide' : 'standard', readingGuide: value.readingGuide === true, warmTint: percent(value.warmTint, 0), breakReminderMinutes: [20, 30, 45].includes(Number(value.breakReminderMinutes)) ? Number(value.breakReminderMinutes) : 0 }
  } catch { return defaultPreferences }
}
export function savePreferences(preferences: UserPreferences): void { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)) }

const safeStrings = (value: unknown, max = 1000): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length <= 600).slice(0, max) : []
function safeAttempts(value: unknown): AttemptRecord[] {
  if (!Array.isArray(value)) return []
  return value.slice(-500).filter((item): item is AttemptRecord => {
    if (!item || typeof item !== 'object') return false
    const a = item as Record<string, unknown>
    return typeof a.id === 'string' && a.id.length < 100 && isConceptId(a.conceptId) && typeof a.exerciseId === 'string' && a.exerciseId.length < 600 && isDifficulty(a.difficulty) && typeof a.passed === 'boolean' && (a.errorCategory === null || ['syntax', 'indentation', 'name', 'type', 'timeout', 'runtime', 'check', 'worker'].includes(String(a.errorCategory))) && Number.isInteger(a.hintsUsed) && Number(a.hintsUsed) >= 0 && Number(a.hintsUsed) <= 3 && typeof a.at === 'number' && Number.isFinite(a.at)
  })
}
function safeHints(value: unknown): HintRecord[] {
  if (!Array.isArray(value)) return []
  return value.slice(-1000).filter((item): item is HintRecord => {
    if (!item || typeof item !== 'object') return false
    const h = item as Record<string, unknown>
    return isConceptId(h.conceptId) && typeof h.exerciseId === 'string' && h.exerciseId.length < 600 && [1, 2, 3].includes(Number(h.level)) && typeof h.at === 'number' && Number.isFinite(h.at)
  })
}
function safeDrafts(value: unknown): Record<string, string> {
  const drafts: Record<string, string> = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return drafts
  for (const [key, draft] of Object.entries(value).slice(0, 300)) if (key.length < 600 && typeof draft === 'string' && draft.length <= 100_000) drafts[key] = draft
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
      const projectSnapshots: Partial<Record<ThemeId, ProjectSnapshot>> = {}
      if (data.projectSnapshots && typeof data.projectSnapshots === 'object') for (const item of Object.values(data.projectSnapshots)) {
        const snapshot = parseProjectSnapshot(item)
        if (snapshot) projectSnapshots[snapshot.themeId] = snapshot
      }
      const attempts = safeAttempts(data.attempts)
      const completedLessonIds = safeStrings(data.completedLessonIds).filter(isConceptId)
      const progress: LessonProgress = { ...base, currentLessonId: isConceptId(data.currentLessonId) ? data.currentLessonId : base.currentLessonId,
        drafts: safeDrafts(data.drafts), inputDrafts: safeDrafts(data.inputDrafts), completedLessonIds: [...new Set(completedLessonIds)], completedExerciseIds: safeStrings(data.completedExerciseIds),
        attempts, projectSnapshots, hints: safeHints(data.hints), timeSpentMs, difficultyOverride: isDifficulty(data.difficultyOverride) ? data.difficultyOverride as Difficulty : null,
        lastCompletedExerciseId: typeof data.lastCompletedExerciseId === 'string' && data.lastCompletedExerciseId.length < 600 ? data.lastCompletedExerciseId : null }
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
