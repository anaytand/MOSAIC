import type { UserPreferences } from './types.ts'
import { THEMES, selectedWorld, themeStyle } from './design/worlds.ts'
import { getLearningTheme } from './themes/catalog.ts'

/** Blend decorative paints only. Text, controls, focus rings and code colors stay fixed. */
export function mixColor(color: string, neutral: string, amount: number): string {
  const fraction = Math.max(0, Math.min(100, amount)) / 100
  return '#' + [1, 3, 5].map((offset) => Math.round(parseInt(color.slice(offset, offset + 2), 16) * fraction + parseInt(neutral.slice(offset, offset + 2), 16) * (1 - fraction)).toString(16).padStart(2, '0')).join('')
}
export function sensoryVisualVariables(preferences: UserPreferences): Record<string, string> {
  const world = THEMES[selectedWorld(preferences)]
  const palette = world.vars
  const theme = getLearningTheme(preferences)?.palette
  const level = preferences.colorLevel
  const dark = preferences.colorTheme === 'dark'
  const neutral = dark || palette.hdr === '#FFFFFF' ? '#252d40' : '#e9edef'
  const result = Object.fromEntries(Object.entries(themeStyle(selectedWorld(preferences))).map(([key, value]) => [key, String(value)]))
  for (const key of ['sky1', 'sky2', 'sky3', 'h1a', 'h1b', 'h2a', 'h2b', 'h3a', 'h3b'] as const) result[`--${key}`] = mixColor(palette[key], neutral, level)
  result['--decor-accent'] = mixColor(palette.acc, neutral, level)
  result['--decor-secondary'] = mixColor(palette.acc2, neutral, level)
  result['--decor-deep'] = mixColor(palette.deep, neutral, level)
  result['--decor-wordmark'] = `color-mix(in srgb, ${palette.wm} ${level}%, ${neutral})`
  result['--decor-neutral'] = dark ? '#899398' : '#a7b4b7'
  result['--decor-strength'] = `${level}%`
  result['--decor-dark-sky1'] = mixColor('#202441', '#232c34', level)
  result['--decor-dark-sky2'] = mixColor('#32395c', '#2b343d', level)
  result['--decor-dark-sky3'] = mixColor('#3b3f72', '#354048', level)
  result['--theme-accent'] = preferences.highContrast ? 'var(--teal)' : theme ? dark ? theme.darkAccent : theme.accent : 'var(--teal)'
  result['--theme-soft'] = preferences.highContrast ? 'var(--surface-soft)' : theme ? mixColor(dark ? theme.darkSoft : theme.soft, dark ? '#27323b' : '#edf0f1', level) : 'var(--mint)'
  result['--theme-ink'] = preferences.highContrast ? 'var(--text)' : theme ? dark ? theme.darkInk : theme.ink : 'var(--teal-dark)'
  result['--decor-progress'] = preferences.highContrast ? 'var(--teal)' : mixColor(theme ? dark ? theme.darkAccent : theme.accent : dark ? '#86d6c9' : '#2a6e96', dark ? '#acb9bf' : '#566b7b', level)
  return result
}
