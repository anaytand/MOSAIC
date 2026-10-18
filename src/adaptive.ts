import type { AttemptRecord, ConceptId, ConceptStats, Difficulty, ErrorCategory, HintRecord, LessonProgress, Recommendation } from './types.ts'

export const conceptOrder: ConceptId[] = ['hello-python', 'variables', 'conditions', 'loops', 'functions']
export const dependencies: Record<ConceptId, ConceptId[]> = {
  'hello-python': [], variables: ['hello-python'], conditions: ['variables'], loops: ['conditions'], functions: ['loops'],
}
export const conceptNames: Record<ConceptId, string> = {
  'hello-python': 'Print Statements', variables: 'Variables', conditions: 'Conditions', loops: 'Loops', functions: 'Functions',
}
const levels: Difficulty[] = ['guided', 'independent', 'challenge']
export const isConceptId = (value: unknown): value is ConceptId => typeof value === 'string' && conceptOrder.includes(value as ConceptId)
export const isDifficulty = (value: unknown): value is Difficulty => typeof value === 'string' && levels.includes(value as Difficulty)

export function emptyProgress(): LessonProgress {
  return { version: 1, currentLessonId: 'hello-python', drafts: {}, completedLessonIds: [], completedExerciseIds: [], attempts: [], hints: [],
    timeSpentMs: { 'hello-python': 0, variables: 0, conditions: 0, loops: 0, functions: 0 }, difficultyOverride: null,
    lastCompletedExerciseId: null, recommendation: { conceptId: 'hello-python', difficulty: 'guided', reason: 'Start with a short print statement.' } }
}

// Mastery is an estimate of performance on MOSAIC exercises. It never uses elapsed time.
// 40 points: overall success rate; 35: recency-weighted success (last 5);
// 15: successful work across distinct difficulty levels; 10: independence on successes.
// Evidence grows over the first three submissions, so one success cannot imply high mastery.
// With no attempts the score is 0. A single success cannot trigger a level change.
export function masteryFor(attempts: AttemptRecord[], conceptId: ConceptId): number {
  const relevant = attempts.filter((attempt) => attempt.conceptId === conceptId)
  if (!relevant.length) return 0
  const successes = relevant.filter((attempt) => attempt.passed)
  const recent = relevant.slice(-5)
  const weights = recent.map((_, index) => index + 1)
  const weightedSuccess = recent.reduce((sum, attempt, index) => sum + (attempt.passed ? weights[index] : 0), 0) / weights.reduce((sum, value) => sum + value, 0)
  const breadth = new Set(successes.map((attempt) => attempt.difficulty)).size / 3
  const independence = successes.length ? successes.reduce((sum, attempt) => sum + Math.max(0, 1 - attempt.hintsUsed / 3), 0) / successes.length : 0
  const evidence = Math.min(1, relevant.length / 3)
  return Math.round((40 * successes.length / relevant.length + 35 * weightedSuccess + 15 * breadth + 10 * independence) * evidence)
}
export function statsFor(progress: LessonProgress, conceptId: ConceptId): ConceptStats {
  const attempts = progress.attempts.filter((attempt) => attempt.conceptId === conceptId)
  const errors: Partial<Record<ErrorCategory, number>> = {}
  for (const attempt of attempts) if (attempt.errorCategory) errors[attempt.errorCategory] = (errors[attempt.errorCategory] ?? 0) + 1
  return { attempts: attempts.length, successes: attempts.filter((a) => a.passed).length, failures: attempts.filter((a) => !a.passed).length,
    errorCategories: errors, hintsRequested: progress.hints.filter((hint) => hint.conceptId === conceptId).length,
    timeSpentMs: progress.timeSpentMs[conceptId] ?? 0, mastery: masteryFor(progress.attempts, conceptId) }
}
export function suggestedDifficulty(progress: LessonProgress, conceptId: ConceptId): Difficulty {
  const attempts = progress.attempts.filter((a) => a.conceptId === conceptId)
  const successes = attempts.filter((a) => a.passed)
  if (attempts.length === 0) {
    const recentAcrossConcepts = progress.attempts.slice(-3)
    if (progress.completedLessonIds.length >= 3 && recentAcrossConcepts.length === 3 && recentAcrossConcepts.every((attempt) => attempt.passed) && recentAcrossConcepts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0) <= 1) return 'independent'
    return 'guided'
  }
  const lastThree = attempts.slice(-3)
  if (attempts.length >= 5 && successes.length >= 4 && lastThree.filter((a) => a.passed).length >= 2 && masteryFor(progress.attempts, conceptId) >= 70) return 'challenge'
  if (attempts.length >= 3 && successes.length >= 2 && lastThree.filter((a) => a.passed).length >= 2 && masteryFor(progress.attempts, conceptId) >= 55) return 'independent'
  return 'guided'
}
export function recommend(progress: LessonProgress): Recommendation {
  for (const conceptId of conceptOrder) {
    const recent = progress.attempts.filter((a) => a.conceptId === conceptId).slice(-2)
    if (recent.length === 2 && recent.every((a) => !a.passed)) return { conceptId, difficulty: progress.difficultyOverride ?? suggestedDifficulty(progress, conceptId), reason: `Let's practice ${conceptNames[conceptId].toLowerCase()} again. Your last two attempts suggest another example could help.` }
  }
  for (const conceptId of conceptOrder) {
    if (!progress.completedLessonIds.includes(conceptId) && dependencies[conceptId].every((prerequisite) => progress.completedLessonIds.includes(prerequisite))) {
      return { conceptId, difficulty: progress.difficultyOverride ?? suggestedDifficulty(progress, conceptId), reason: conceptId === 'hello-python' ? 'Start with a short print statement.' : `You completed the prerequisite. ${conceptNames[conceptId]} is a good next step.` }
    }
  }
  const conceptId = conceptOrder.find((id) => !progress.completedLessonIds.includes(id)) ?? progress.currentLessonId
  return { conceptId, difficulty: progress.difficultyOverride ?? suggestedDifficulty(progress, conceptId), reason: progress.completedLessonIds.length === conceptOrder.length ? 'All five concepts are complete. Choose one to revisit or try a new level.' : `Review ${conceptNames[conceptId].toLowerCase()} when you are ready.` }
}
function withRecommendation(progress: LessonProgress): LessonProgress { return { ...progress, recommendation: recommend(progress) } }
export function recordAttempt(progress: LessonProgress, attempt: AttemptRecord): LessonProgress {
  // Replaying a challenge that is already completed cannot add another mastery success.
  if (attempt.passed && progress.completedExerciseIds.includes(attempt.exerciseId)) return progress
  const attempts = [...progress.attempts, attempt].slice(-500)
  const completedLessonIds = attempt.passed ? [...new Set([...progress.completedLessonIds, attempt.conceptId])] : progress.completedLessonIds
  const completedExerciseIds = attempt.passed ? [...new Set([...progress.completedExerciseIds, attempt.exerciseId])] : progress.completedExerciseIds
  return withRecommendation({ ...progress, attempts, completedLessonIds, completedExerciseIds,
    lastCompletedExerciseId: attempt.passed ? attempt.exerciseId : progress.lastCompletedExerciseId })
}
export function recordHint(progress: LessonProgress, hint: HintRecord): LessonProgress {
  return { ...progress, hints: [...progress.hints, hint].slice(-1000) }
}
export function addTime(progress: LessonProgress, conceptId: ConceptId, milliseconds: number): LessonProgress {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return progress
  return { ...progress, timeSpentMs: { ...progress.timeSpentMs, [conceptId]: (progress.timeSpentMs[conceptId] ?? 0) + Math.min(milliseconds, 3_600_000) } }
}
export function setDifficultyOverride(progress: LessonProgress, difficulty: Difficulty | null): LessonProgress {
  return withRecommendation({ ...progress, difficultyOverride: difficulty })
}
export function categorizeError(error: string, passed: boolean): ErrorCategory | null {
  if (passed) return null
  if (!error) return 'check'
  if (error.includes('IndentationError')) return 'indentation'
  if (error.includes('SyntaxError')) return 'syntax'
  if (error.includes('NameError')) return 'name'
  if (error.includes('TypeError')) return 'type'
  if (error.includes('time limit')) return 'timeout'
  if (error.includes('worker') || error.includes('Python could not')) return 'worker'
  return 'runtime'
}
export function recentImprovement(progress: LessonProgress): number | null {
  const recent = progress.attempts.slice(-6)
  if (recent.length < 4) return null
  const half = Math.floor(recent.length / 2)
  const rate = (items: AttemptRecord[]) => Math.round(100 * items.filter((a) => a.passed).length / items.length)
  return rate(recent.slice(half)) - rate(recent.slice(0, half))
}
