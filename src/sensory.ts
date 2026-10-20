import type { UserPreferences } from './types.ts'
import { effectiveMotion } from './motion.ts'
// Sensory controls never receive attempts or alter mastery.
export function sensoryAttributes(preferences: UserPreferences, systemReducedMotion = false): Record<string, string> {
  return {
    companionEnabled: String(preferences.companionEnabled),
    contrast: preferences.highContrast ? 'high' : 'standard', fontSize: preferences.fontSize,
    motion: effectiveMotion(preferences, systemReducedMotion) === 0 ? 'reduced' : 'standard', theme: preferences.colorTheme,
    motionPreference: preferences.motionPreference, motionLevel: String(effectiveMotion(preferences, systemReducedMotion)),
    simplified: String(preferences.simplifiedInterface || preferences.visualDensity === 'minimal'), density: preferences.layoutDensity,
    visualDensity: preferences.visualDensity,
    focus: String(preferences.focusMode), intensity: preferences.colorIntensity,
  }
}
export function editorTextSize(preferences: UserPreferences): number {
  return preferences.editorFontSize ?? (preferences.fontSize === 'extra-large' ? 20 : preferences.fontSize === 'large' ? 18 : 16)
}
/** Keep older controls/data compatible while numeric sensory preferences are authoritative. */
export function updateSensoryPreferences(preferences: UserPreferences, changes: Partial<UserPreferences>): UserPreferences {
  const next = { ...preferences, ...changes, sensoryVersion: 2 as const }
  if (changes.colorLevel !== undefined) next.colorIntensity = next.colorLevel <= 25 ? 'calm' : next.colorLevel >= 75 ? 'vibrant' : 'balanced'
  if (changes.soundMuted !== undefined) next.soundEffects = !next.soundMuted
  if (changes.motionIntensity !== undefined) { next.motionPreference = 'custom'; next.reducedMotion = next.motionIntensity === 0 }
  if (changes.reducedMotion !== undefined) {
    next.motionIntensity = next.reducedMotion ? 0 : Math.max(next.motionIntensity, 50)
    next.motionPreference = next.reducedMotion ? 'custom' : 'system'
  }
  return next
}
