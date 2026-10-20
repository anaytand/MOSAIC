import type { UserPreferences } from './types.ts'

export const motionTokens = {
  easing: 'cubic-bezier(.22,.61,.36,1)',
  // Increasing intensity expands gentle motion; nothing flashes or accelerates abruptly.
  maxFloatPx: 24,
  maxDriftPx: 40,
  marqueeSeconds: 50,
} as const

export function effectiveMotion(preferences: UserPreferences, systemReducedMotion: boolean): number {
  if (preferences.reducedMotion) return 0
  if (preferences.motionPreference === 'system' && systemReducedMotion) return 0
  return Math.max(0, Math.min(100, preferences.motionIntensity))
}
export function motionVariables(preferences: UserPreferences, systemReducedMotion: boolean): Record<string, string> {
  const amount = effectiveMotion(preferences, systemReducedMotion) / 100
  const amplitude = amount ** 1.5
  return {
    '--motion-float': `${motionTokens.maxFloatPx * amplitude}px`,
    '--motion-drift': `${motionTokens.maxDriftPx * amplitude}px`,
    '--motion-wave-angle': `${6 * amplitude}deg`,
    '--motion-loop': `${10 + (1 - amount) * 30}s`,
    '--motion-loop-base': '10s',
    '--motion-marquee-base': '50s',
    '--motion-marquee': `${motionTokens.marqueeSeconds + (1 - amount) * 480}s`,
    '--motion-reaction': `${1.8 + (1 - amount)}s`,
    '--motion-ease': motionTokens.easing,
  }
}
