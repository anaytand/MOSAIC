import { conceptOrder } from '../adaptive'
import type { LessonProgress } from '../types'
import type { LearningTheme } from '../themes/types'
import { ThemeArt } from './ThemeArt'
export function ThemeJourney({ theme, progress }: { theme: LearningTheme; progress: LessonProgress }) {
  return <section className="theme-journey"><div><span className="eyebrow">YOUR CODING ADVENTURE</span><h2>{theme.name}</h2><p>{theme.description}</p><ol className="theme-milestones" aria-label={`${theme.name} project milestones`}>{conceptOrder.map((id, index) => { const done = progress.completedExerciseIds.some((key) => key.startsWith(`journey-v1:${theme.id}:${id}:`)); return <li key={id} data-completed={done}><span aria-hidden="true">{done ? '✓' : index + 1}</span><small>{theme.chapters[id].milestone}<em>{done ? 'Built in this journey' : 'To build'}</em></small></li> })}</ol></div><ThemeArt theme={theme.illustration} /></section>
}
