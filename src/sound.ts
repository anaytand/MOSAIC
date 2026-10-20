import type { UserPreferences } from './types.ts'
export type SoundEffect = 'completion' | 'success' | 'interaction' | 'test'
type AudioPreferences = Pick<UserPreferences, 'soundMuted' | 'soundVolume' | 'interactionSounds' | 'executionSounds'>
const quietPeak = .035

/** One lazy context and master gain. Configuration never creates/resumes audio. */
export class SoundEngine {
  private context: AudioContext | undefined
  private master: GainNode | undefined
  private active = new Set<OscillatorNode>()
  private preferences: AudioPreferences = { soundMuted: true, soundVolume: 35, interactionSounds: false, executionSounds: false }
  private createContext: () => AudioContext
  constructor(createContext: () => AudioContext = () => new AudioContext()) { this.createContext = createContext }

  configure(preferences: AudioPreferences): void {
    this.preferences = { ...preferences }
    if (!this.context || !this.master) return
    const time = this.context.currentTime
    this.master.gain.cancelScheduledValues(time)
    if (this.volume === 0) {
      this.master.gain.setValueAtTime(0, time)
      for (const tone of this.active) { try { tone.stop() } catch { /* It may already have ended. */ } }
    } else this.master.gain.setTargetAtTime(this.volume * quietPeak, time, .02)
  }
  get volume(): number { return this.preferences.soundMuted ? 0 : Math.max(0, Math.min(100, this.preferences.soundVolume)) / 100 }
  private enabled(effect: SoundEffect): boolean {
    return this.volume > 0 && (effect !== 'interaction' || this.preferences.interactionSounds) && (effect !== 'success' || this.preferences.executionSounds)
  }
  async unlock(): Promise<boolean> {
    if (this.volume === 0) return false
    try {
      if (!this.context) {
        this.context = this.createContext()
        this.master = this.context.createGain()
        this.master.gain.setValueAtTime(this.volume * quietPeak, this.context.currentTime)
        this.master.connect(this.context.destination)
      }
      await this.context.resume()
      return this.context.state === 'running' && this.volume > 0
    } catch { return false }
  }
  play(effect: SoundEffect): boolean {
    if (!this.enabled(effect) || !this.context || !this.master || this.context.state !== 'running') return false
    try {
      const notes = effect === 'completion' ? [523.25, 659.25] : [effect === 'interaction' ? 392 : effect === 'success' ? 440 : 523.25]
      // Coalesce rapid repeated requests rather than stacking tones into a loud chord.
      if (this.active.size + notes.length > 2) return true
      const length = effect === 'interaction' ? .08 : .2
      notes.forEach((frequency, index) => {
        const tone = this.context!.createOscillator()
        const envelope = this.context!.createGain()
        const time = this.context!.currentTime + index * .13
        tone.type = 'sine'
        tone.frequency.value = frequency
        envelope.gain.setValueAtTime(0, time)
        envelope.gain.linearRampToValueAtTime(effect === 'interaction' ? .45 : 1, time + .025)
        envelope.gain.linearRampToValueAtTime(0, time + length)
        tone.connect(envelope)
        envelope.connect(this.master!)
        this.active.add(tone)
        tone.onended = () => { this.active.delete(tone); tone.disconnect(); envelope.disconnect() }
        tone.start(time)
        tone.stop(time + length + .01)
      })
      return true
    } catch { return false }
  }
  async test(): Promise<boolean> { return await this.unlock() && this.play('test') }
  async interaction(): Promise<boolean> { return this.enabled('interaction') && await this.unlock() && this.play('interaction') }
  dispose(): void {
    for (const tone of this.active) { try { tone.stop() } catch { /* Already stopped. */ } }
    this.active.clear()
    this.master?.disconnect()
    void this.context?.close().catch(() => {})
    this.context = undefined
    this.master = undefined
  }
}
export const soundEngine = new SoundEngine()
export function executionSound(error: string, passed: boolean, alreadyComplete: boolean): SoundEffect | null {
  if (error) return null
  return passed && !alreadyComplete ? 'completion' : 'success'
}
