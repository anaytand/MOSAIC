import type { UserPreferences } from './types.ts'
import { updateSensoryPreferences } from './sensory.ts'

/** Curated sensory presets. Audio levels are silent until the learner separately unmutes. */
export const immersionPresets = [
  { level: 0, name: 'Chill', motionIntensity: 0, colorLevel: 0, soundVolume: 0, musicVolume: 0 },
  { level: 25, name: 'Relaxed', motionIntensity: 25, colorLevel: 25, soundVolume: 0, musicVolume: 0 },
  { level: 50, name: 'Balanced', motionIntensity: 50, colorLevel: 50, soundVolume: 35, musicVolume: 20 },
  { level: 75, name: 'Engaging', motionIntensity: 75, colorLevel: 75, soundVolume: 60, musicVolume: 45 },
  { level: 100, name: 'Fully Immersed', motionIntensity: 100, colorLevel: 100, soundVolume: 85, musicVolume: 70 },
] as const

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50)))

/** Interpolate between anchors so each slider step changes the same shared visual/audio state. */
export function immersionValues(level: number) {
  const at = clamp(level)
  const upper = immersionPresets.findIndex((preset) => preset.level >= at)
  const high = immersionPresets[upper]
  const low = immersionPresets[Math.max(0, upper - 1)]
  const fraction = high.level === low.level ? 0 : (at - low.level) / (high.level - low.level)
  const interpolate = (key: 'motionIntensity' | 'colorLevel' | 'soundVolume' | 'musicVolume') => Math.round(low[key] + (high[key] - low[key]) * fraction)
  return { motionIntensity: interpolate('motionIntensity'), colorLevel: interpolate('colorLevel'), soundVolume: interpolate('soundVolume'), musicVolume: interpolate('musicVolume') }
}

/** Mute, optional effects, playback, theme, text and layout are independent of immersion. */
export function applyMasterImmersion(preferences: UserPreferences, level: number): UserPreferences {
  const at = clamp(level)
  const next = updateSensoryPreferences(preferences, { ...immersionValues(at), masterImmersion: at })
  // A master choice must not silently override the device reduced-motion setting.
  return { ...next, motionPreference: preferences.motionPreference, reducedMotion: at === 0 }
}

export function immersionDescription(preferences: UserPreferences): string {
  const values = immersionValues(preferences.masterImmersion)
  const customized = (Object.keys(values) as (keyof typeof values)[]).some((key) => preferences[key] !== values[key])
  if (customized) return 'Custom'
  return immersionPresets.find((preset) => preset.level === preferences.masterImmersion)?.name ?? 'Between presets'
}
