import type { UserPreferences, PythonLesson, LessonProgress } from '../types.ts'
import { getLearningTheme } from '../themes/catalog.ts'
import { literalText } from '../literal.ts'
export type CompanionId = 'robot' | 'shark' | 'basketball' | 'astronaut' | 'train' | 'fox' | 'dinosaur' | 'music'
export type CompanionState = 'idle' | 'welcoming' | 'explaining' | 'thinking' | 'encouraging' | 'celebrating'
export const companions = {
  robot: { name: 'Bit', introduction: 'Let’s build something with Python.', description: 'The original MOSAIC robot guide' },
  shark: { name: 'Reef', introduction: 'Let’s explore with the research crew.', description: 'A friendly shark research companion' },
  basketball: { name: 'Bounce', introduction: 'Let’s build the Mosaic Falcons project.', description: 'A friendly basketball companion' },
  astronaut: { name: 'Nova', introduction: 'Mission control is ready when you are.', description: 'A friendly astronaut companion' },
  train: { name: 'Pip', introduction: 'Let’s work on our railway project.', description: 'A friendly train companion' },
  fox: { name: 'Scout', introduction: 'Let’s turn wildlife observations into code.', description: 'A friendly fox research companion' },
  dinosaur: { name: 'Rex', introduction: 'Let’s turn wildlife observations into code.', description: 'A friendly dinosaur companion' },
  music: { name: 'Tempo', introduction: 'Let’s build our music studio with Python.', description: 'A friendly music note companion' },
} satisfies Record<CompanionId, { name: string; introduction: string; description: string }>
export function companionId(preferences: Pick<UserPreferences, 'interest' | 'customTopic'> & { avatarId?: UserPreferences['avatarId'] }): CompanionId {
  if (preferences.avatarId && preferences.avatarId in companions) return preferences.avatarId
  if (!preferences.interest) return 'robot'
  const theme = getLearningTheme(preferences)?.id
  return theme ? ({ ocean: 'shark', basketball: 'basketball', space: 'astronaut', trains: 'train', animals: 'dinosaur', music: 'music' } as const)[theme] : 'robot'
}
export function companionGuidance(lesson: PythonLesson, progress: LessonProgress, result?: { passed: boolean; error: string; feedback: string }, literal = false) {
  if (literal) {
    if (result?.error) return { state: 'encouraging' as const, message: 'Python stopped with an error. The error type and line are shown below. Change that line, then select Run Code.' }
    if (result?.passed) return { state: 'celebrating' as const, message: `Task complete: ${lesson.title}. Goal met: ${literalText(lesson.objective)} Next: ${progress.recommendation.reason}` }
    if (result) return { state: 'encouraging' as const, message: `The code ran. The task is not complete yet. ${literalText(result.feedback)}` }
    return { state: 'explaining' as const, message: `Goal: ${literalText(lesson.objective)}` }
  }
  if (result?.error) return { state: 'encouraging' as const, message: 'Python stopped with an error. Check the actual Python detail and the explanation below before trying again.' }
  if (result?.passed) return { state: 'celebrating' as const, message: `You completed ${lesson.title}. You practiced this goal: ${lesson.objective} Next: ${progress.recommendation.reason}` }
  if (result) return { state: 'encouraging' as const, message: `Your code ran, but this task is not complete yet. ${result.feedback}` }
  return { state: 'explaining' as const, message: `${lesson.concept} Your goal: ${lesson.objective}` }
}
