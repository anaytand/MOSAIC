import { ambientEngine, ambientTrack } from '../ambient'
import { applyMasterImmersion, immersionDescription } from '../immersion'
import { soundEngine } from '../sound'
import type { UserPreferences } from '../types'
import { SensoryRange } from './SensoryRange'

interface Props { preferences: UserPreferences; onChange: (next: UserPreferences) => void }

export function MasterImmersionControl({ preferences, onChange }: Props) {
  const description = immersionDescription(preferences)
  const update = (level: number) => {
    const next = applyMasterImmersion(preferences, level)
    // A silent preset must cancel previous playback intent, so raising immersion later
    // cannot start music without another explicit press of Play.
    if (next.musicVolume === 0) ambientEngine.pause()
    soundEngine.configure(next)
    ambientEngine.configure(next, ambientTrack(next))
    onChange(next)
  }
  return <section className="master-immersion" aria-label="Master sensory immersion">
    <div className="master-immersion__heading"><strong>Master Immersion</strong><span className="status-tag">{description}</span></div>
    <SensoryRange label="Master immersion level" value={preferences.masterImmersion} valueText={`${preferences.masterImmersion}% · ${description}`} description="Adjusts motion, decorative color, sound effect volume, and optional music volume. Audio stays muted until you enable it. Individual controls remain available below." onChange={update} />
    <div className="master-immersion__ends"><span><strong>0% · Chill Mode</strong><small>Calm and minimal</small></span><span><strong>100% · Immersive Mode</strong><small>Colorful and engaging</small></span></div>
  </section>
}
