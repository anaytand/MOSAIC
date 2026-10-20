import type { UserPreferences } from './types.ts'
import { getLearningTheme } from './themes/catalog.ts'
export const ambientTracks = {
  ocean: { title: 'Ocean Current · original filtered-noise ambience', src: '/audio/ocean-current.wav' },
  space: { title: 'Quiet Orbit · original ambient pad', src: '/audio/quiet-orbit.wav' },
  music: { title: 'Studio Air · original ambient pad', src: '/audio/studio-air.wav' },
} as const
export function ambientTrack(preferences: Pick<UserPreferences, 'interest' | 'customTopic'>) { const theme = getLearningTheme(preferences)?.id; return theme === 'ocean' ? ambientTracks.ocean : theme === 'music' ? ambientTracks.music : ambientTracks.space }
type AudioPreferences = Pick<UserPreferences, 'soundMuted' | 'musicVolume' | 'musicDuringExecution'>
export interface AmbientMedia { src: string; loop: boolean; volume: number; preload: string; play: () => Promise<void>; pause: () => void; addEventListener: (event: string, listener: () => void) => void; removeEventListener: (event: string, listener: () => void) => void }
export class AmbientEngine {
  private media: AmbientMedia | undefined
  private preferences: AudioPreferences = { soundMuted: true, musicVolume: 20, musicDuringExecution: false }
  private executing = false
  private requested = false
  private requestId = 0
  private state = 'Paused'
  private listeners = new Set<() => void>()
  private factory: () => AmbientMedia
  private track: { title: string; src: string } = ambientTracks.space
  constructor(factory: () => AmbientMedia = () => new Audio()) { this.factory = factory }
  subscribe = (callback: () => void) => { this.listeners.add(callback); return () => { this.listeners.delete(callback) } }
  snapshot = () => this.state
  private publish(state: string) { if (state === this.state) return; this.state = state; for (const listener of this.listeners) listener() }
  private fail = () => { this.requested = false; this.media?.pause(); this.publish('Audio unavailable. Check your connection or try again.') }
  private ended = () => { if (!this.requested) this.publish('Paused') }
  configure(preferences: AudioPreferences, track = this.track): void {
    const changed = track.src !== this.track.src
    const wasBlocked = this.preferences.soundMuted || this.preferences.musicVolume === 0 || this.executing && !this.preferences.musicDuringExecution
    this.preferences = { ...preferences }
    this.track = track
    if (this.media) this.media.volume = preferences.soundMuted ? 0 : Math.max(0, Math.min(100, preferences.musicVolume)) / 100
    if (changed && this.media) { this.media.pause(); this.media.src = track.src }
    const blocked = preferences.soundMuted || preferences.musicVolume === 0 || this.executing && !preferences.musicDuringExecution
    if (this.requested && (changed || blocked !== wasBlocked)) void this.sync()
  }
  setExecuting(value: boolean): void { if (value === this.executing) return; this.executing = value; if (this.requested) void this.sync() }
  private async sync(): Promise<void> {
    const id = ++this.requestId
    if (!this.requested) { this.media?.pause(); this.publish('Paused'); return }
    if (this.preferences.soundMuted || this.preferences.musicVolume === 0) { this.media?.pause(); this.publish('Muted'); return }
    if (this.executing && !this.preferences.musicDuringExecution) { this.media?.pause(); this.publish('Paused during Python execution'); return }
    try {
      if (!this.media) {
        this.media = this.factory()
        this.media.loop = true
        this.media.preload = 'none'
        this.media.src = this.track.src
        this.media.addEventListener('error', this.fail)
        this.media.addEventListener('pause', this.ended)
      }
      this.media.volume = this.preferences.musicVolume / 100
      this.publish('Loading')
      await this.media.play()
      if (id !== this.requestId) { if (!this.requested || this.preferences.soundMuted || this.executing && !this.preferences.musicDuringExecution) this.media.pause(); return }
      this.publish('Playing')
    } catch { if (id === this.requestId) this.fail() }
  }
  play(): Promise<void> { this.requested = true; return this.sync() }
  pause(): void { this.requested = false; this.requestId++; this.media?.pause(); this.publish('Paused') }
  toggle(): void { if (this.requested) this.pause(); else void this.play() }
  dispose(): void { this.pause(); this.media?.removeEventListener('error', this.fail); this.media?.removeEventListener('pause', this.ended); this.media = undefined }
}
export const ambientEngine = new AmbientEngine()
