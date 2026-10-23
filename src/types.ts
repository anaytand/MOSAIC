import type { ProjectSnapshot, ThemeId } from './themes/types.ts'
export type Interest = 'basketball' | 'ocean' | 'space' | 'trains' | 'animals' | 'music' | 'sports' | 'custom'
export type ColorIntensity = 'calm' | 'balanced' | 'vibrant'
export type VisualDensity = 'minimal' | 'balanced' | 'detailed'
export type MotionPreference = 'system' | 'custom'
export type FontSize = 'standard' | 'large' | 'extra-large'
export type ColorTheme = 'light' | 'dark'
export type Difficulty = 'guided' | 'independent' | 'challenge'
export type IntroConceptId = 'hello-python' | 'variables' | 'conditions' | 'loops' | 'functions'
export type ExtendedConceptId = 'lists' | 'strings' | 'dictionaries' | 'user-input' | 'numbers' | 'combining-concepts' | 'final-project'
export type ConceptId = IntroConceptId | ExtendedConceptId
export type ValidationMode = 'required-line' | 'exact-output' | 'behavior'
export type ErrorCategory = 'syntax' | 'indentation' | 'name' | 'type' | 'timeout' | 'runtime' | 'check' | 'worker'

export interface UserPreferences {
  musicVolume: number
  musicDuringExecution: boolean
  companionEnabled: boolean
  avatarId: 'robot' | 'shark' | 'basketball' | 'astronaut' | 'train' | 'fox' | 'music' | null
  sensoryVersion: 2
  masterImmersion: number
  colorLevel: number
  motionIntensity: number
  motionPreference: MotionPreference
  visualDensity: VisualDensity
  soundVolume: number
  soundMuted: boolean
  interactionSounds: boolean
  executionSounds: boolean
  interest: Interest | null
  customTopic: string
  colorIntensity: ColorIntensity
  soundEffects: boolean
  reducedMotion: boolean
  highContrast: boolean
  fontSize: FontSize
  colorTheme: ColorTheme
  editorFontSize: number | null
  simplifiedInterface: boolean
  layoutDensity: 'compact' | 'spacious'
  focusMode: boolean
  onboardingComplete: boolean
}
export type AppPage = 'Home' | 'Learn' | 'Progress' | 'Settings' | 'Keyboard'

export interface AttemptRecord {
  id: string
  conceptId: ConceptId
  exerciseId: string
  difficulty: Difficulty
  passed: boolean
  errorCategory: ErrorCategory | null
  hintsUsed: number
  at: number
}
export interface HintRecord { conceptId: ConceptId; exerciseId: string; level: 1 | 2 | 3; at: number }
export interface ConceptStats {
  attempts: number
  successes: number
  failures: number
  errorCategories: Partial<Record<ErrorCategory, number>>
  hintsRequested: number
  timeSpentMs: number
  mastery: number
}
export interface Recommendation { conceptId: ConceptId; difficulty: Difficulty; reason: string }
export interface LessonProgress {
  version: 1
  currentLessonId: ConceptId
  drafts: Record<string, string>
  inputDrafts: Record<string, string>
  completedLessonIds: ConceptId[]
  completedExerciseIds: string[]
  attempts: AttemptRecord[]
  hints: HintRecord[]
  timeSpentMs: Record<ConceptId, number>
  difficultyOverride: Difficulty | null
  lastCompletedExerciseId: string | null
  recommendation: Recommendation
  projectSnapshots: Partial<Record<ThemeId, ProjectSnapshot>>
}
export interface PythonLesson {
  id: ConceptId
  exerciseId: string
  difficulty: Difficulty
  interest: Interest
  title: string
  objective: string
  concept: string
  instructions: string[]
  sample: string
  challenge: string
  starterCode: string
  hints: [string, string, string]
  expectedBehavior: string
  validationMode: ValidationMode
  checkSource: string
  defaultInputs?: string[]
  themeId?: ThemeId
  narrative?: string
  completionMessage?: string
}
