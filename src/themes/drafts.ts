import type { LessonProgress, PythonLesson } from '../types.ts'
export function lessonDraft(progress: LessonProgress, lesson: PythonLesson): string {
  return progress.drafts[lesson.exerciseId] ?? (!lesson.themeId ? progress.drafts[lesson.id] : undefined) ?? lesson.starterCode
}
export function previousDrafts(progress: LessonProgress, lesson: PythonLesson): [string, string][] {
  return Object.entries(progress.drafts).filter(([key]) => key !== lesson.exerciseId && (key === lesson.id || key.startsWith(`${lesson.id}:`) || key.includes(`:${lesson.id}:`)))
}
