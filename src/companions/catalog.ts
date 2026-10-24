import type { UserPreferences, PythonLesson, LessonProgress } from '../types.ts'
import { getLearningTheme } from '../themes/catalog.ts'
export type CompanionId = 'robot' | 'shark' | 'basketball' | 'astronaut' | 'train' | 'fox' | 'music'
export type CompanionState = 'idle' | 'welcoming' | 'explaining' | 'thinking' | 'encouraging' | 'celebrating'
export const companions = {
  robot: { name: 'Bit', introduction: 'Let’s build something with Python.', description: 'The original MOSAIC robot guide' },
  shark: { name: 'Reef', introduction: 'Let’s explore with the research crew.', description: 'A shark-inspired underwater explorer robot' },
  basketball: { name: 'Coach Bit', introduction: 'Let’s build the Mosaic Falcons project.', description: 'The Falcons basketball robot in its team uniform' },
  astronaut: { name: 'Orbit', introduction: 'Mission control is ready when you are.', description: 'A spacesuit-wearing explorer robot' },
  train: { name: 'Pip', introduction: 'Let’s work on our railway project.', description: 'A conductor robot with a route display and signal whistle' },
  fox: { name: 'Scout', introduction: 'Let’s turn wildlife observations into code.', description: 'A fox-inspired wildlife explorer robot with binoculars' },
  music: { name: 'Tempo', introduction: 'Let’s build our music studio with Python.', description: 'A music studio robot guide' },
} satisfies Record<CompanionId, { name: string; introduction: string; description: string }>
export function companionId(preferences: Pick<UserPreferences, 'interest' | 'customTopic'> & { avatarId?: UserPreferences['avatarId'] }): CompanionId {
  if (preferences.avatarId && preferences.avatarId in companions) return preferences.avatarId
  if (!preferences.interest) return 'robot'
  const theme = getLearningTheme(preferences)?.id
  return theme ? ({ ocean: 'shark', basketball: 'basketball', space: 'astronaut', trains: 'train', animals: 'fox', music: 'music' } as const)[theme] : 'robot'
}
export function companionGuidance(lesson: PythonLesson, progress: LessonProgress, result?: { passed: boolean; error: string; feedback: string }) {
  if (result?.error) return { state: 'encouraging' as const, message: 'Python stopped with an error. Check the actual Python detail and the explanation below before trying again.' }
  if (result?.passed) return { state: 'celebrating' as const, message: `You completed ${lesson.title}. You practiced this goal: ${lesson.objective} Next: ${progress.recommendation.reason}` }
  if (result) return { state: 'encouraging' as const, message: `Your code ran, but this task is not complete yet. ${result.feedback}` }
  return { state: 'explaining' as const, message: `${lesson.concept} Your goal: ${lesson.objective}` }
}
