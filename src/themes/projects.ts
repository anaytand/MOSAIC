import { themeCatalog } from './catalog.ts'
import type { ProjectSnapshot, ThemeId } from './types.ts'
export function parseProjectSnapshot(value: unknown, expectedTheme?: ThemeId): ProjectSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  if (data.version !== 1 || typeof data.themeId !== 'string' || (expectedTheme && data.themeId !== expectedTheme)) return null
  const theme = themeCatalog[data.themeId as ThemeId]
  if (!theme || !data.values || typeof data.values !== 'object' || Array.isArray(data.values)) return null
  const values = data.values as Record<string, unknown>
  if (Object.keys(values).length !== theme.fields.length || !theme.fields.every((field) => values[field.key] === field.value)) return null
  return { version: 1, themeId: theme.id, values: Object.fromEntries(theme.fields.map((field) => [field.key, values[field.key] as string | number])) }
}
