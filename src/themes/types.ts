import type { ConceptId } from '../types.ts'
export type ThemeId = 'basketball' | 'space' | 'ocean' | 'trains' | 'animals' | 'music'
export interface ThemePalette { accent: string; soft: string; ink: string; darkAccent: string; darkSoft: string; darkInk: string }
export interface ThemeField { key: string; label: string; value: string | number }
export interface ThemeChapter { title: string; narrative: string; milestone: string; completion: string }
export interface LearningTheme {
  id: ThemeId
  name: string
  description: string
  projectName: string
  illustration: ThemeId
  palette: ThemePalette
  introduction: [string, string]
  fields: [ThemeField, ThemeField, ThemeField, ThemeField, ThemeField, ThemeField]
  decision: { ready: string; wait: string; extraReady: string; extraWait: string }
  series: { key: string; values: number[]; totalKey: string; totalLabel: string; countKey: string; countLabel: string; threshold: number; countTask: string }
  calculator: { name: string; label: string; inputKey?: string; values?: number[] }
  chapters: Record<ConceptId, ThemeChapter>
}
export interface ProjectSnapshot { version: 1; themeId: ThemeId; values: Record<string, string | number> }
