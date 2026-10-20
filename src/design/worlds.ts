import { THEMES, themeStyle } from './referenceWorlds.ts'
import type { ThemeId } from '../themes/types'
import { getLearningTheme } from '../themes/catalog.ts'
import type { UserPreferences } from '../types'

export type MosaicWorld = 'mosaic' | ThemeId

/** Visual worlds reuse the teammate's palette. Curriculum IDs and saved data stay separate. */
export function selectedWorld(preferences: Pick<UserPreferences, 'interest' | 'customTopic'>): MosaicWorld {
  if (!preferences.interest) return 'mosaic'
  return getLearningTheme(preferences)?.id ?? 'mosaic'
}
export const availableWorlds: MosaicWorld[] = ['mosaic', 'basketball', 'space', 'ocean', 'trains', 'animals', 'music']
export { THEMES, themeStyle }
