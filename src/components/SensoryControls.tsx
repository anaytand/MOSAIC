import { ambientEngine, ambientTrack } from '../ambient'
import { useState } from 'react'
import type { FontSize, UserPreferences, VisualDensity } from '../types'
import { updateSensoryPreferences } from '../sensory'
import { soundEngine } from '../sound'
import { MasterImmersionControl } from './MasterImmersionControl'
import { SensoryRange } from './SensoryRange'
export { SensoryRange } from './SensoryRange'
interface Props { preferences: UserPreferences; onChange: (value: UserPreferences) => void; section?: 'all' | 'color' | 'audio-motion' | 'density' }
const densities: VisualDensity[] = ['minimal', 'balanced', 'detailed']
function AudioControls({ preferences, update }: { preferences: UserPreferences; update: (changes: Partial<UserPreferences>) => void }) {
  const [soundNotice, setSoundNotice] = useState('')
  return       <fieldset className="audio-controls"><legend>Sound</legend><SensoryRange label="Sound volume" value={preferences.soundVolume} description="0% is silent. Changing this slider never plays a sound." onChange={(soundVolume) => update({ soundVolume })} /><div className="sound-actions"><button type="button" className="button button-secondary" aria-pressed={preferences.soundMuted} onClick={() => update({ soundMuted: !preferences.soundMuted })}>{preferences.soundMuted ? 'Unmute sound' : 'Mute sound'}</button><button type="button" className="button button-secondary" disabled={preferences.soundMuted || preferences.soundVolume === 0} onClick={async () => { soundEngine.configure(preferences); setSoundNotice(await soundEngine.test() ? 'Test sound played at your selected volume.' : 'Audio is unavailable. All lessons work without sound.') }}>Test Sound</button></div><small>{preferences.soundMuted ? 'Muted. No effects will play.' : preferences.soundVolume === 0 ? 'Volume is 0%. No effects will play.' : 'A gentle tone marks a newly completed challenge.'}</small><label className="reference-toggle"><span>Optional button sounds</span><input type="checkbox" checked={preferences.interactionSounds} onChange={(event) => update({ interactionSounds: event.target.checked })} /></label><label className="reference-toggle"><span>Optional successful-run sound</span><input type="checkbox" checked={preferences.executionSounds} onChange={(event) => update({ executionSounds: event.target.checked })} /></label><p role="status" className="sound-notice">{soundNotice}</p></fieldset>
}
export function SensoryControls({ preferences, onChange, section = 'all' }: Props) {
  const update = (changes: Partial<UserPreferences>) => {
    const next = updateSensoryPreferences(preferences, changes)
    // Changing/muting sound takes effect immediately, including any note still playing.
    soundEngine.configure(next)
    ambientEngine.configure(next, ambientTrack(next))
    onChange(next)
  }
  const all = section === 'all'
  const sizes: FontSize[] = ['standard', 'large', 'extra-large']
  return <div className="sensory-controls" data-sound-control="true">
    {all && <MasterImmersionControl preferences={preferences} onChange={onChange} />}
    {(all || section === 'color') && <SensoryRange label="Color intensity" value={preferences.colorLevel} description="0% is muted, 50% balanced, and 100% full theme color. Text contrast stays clear." onChange={(colorLevel) => update({ colorLevel })} />}
    {(all || section === 'audio-motion') && <>
      <AudioControls preferences={preferences} update={update} />
      <SensoryRange label="Motion intensity" value={preferences.motionIntensity} description="0% is static. Higher values allow more gentle decorative movement." onChange={(motionIntensity) => update({ motionIntensity })} />
      <label className="reference-toggle"><span>Follow device reduced-motion setting</span><input type="checkbox" checked={preferences.motionPreference === 'system'} onChange={(event) => update({ motionPreference: event.target.checked ? 'system' : 'custom' })} /></label><small>{preferences.motionPreference === 'system' ? 'Device reduced motion pauses animation. Move the slider to make an explicit choice.' : 'Using your chosen motion level. Set 0% for a completely static view.'}</small>
    </>}
    {(all || section === 'density') && <SensoryRange label="Visual density" max={2} value={densities.indexOf(preferences.visualDensity)} valueText={preferences.visualDensity[0].toUpperCase() + preferences.visualDensity.slice(1)} description="Minimal hides decoration and uses one workspace panel at a time. Balanced is the normal layout. Detailed keeps optional explanations open." onChange={(value) => update({ visualDensity: densities[value] })} />}
    {all && <><SensoryRange label="Text size" max={2} value={sizes.indexOf(preferences.fontSize)} valueText={preferences.fontSize === 'standard' ? 'Small' : preferences.fontSize === 'large' ? 'Medium' : 'Large'} onChange={(value) => update({ fontSize: sizes[value], editorFontSize: null })} /><label className="field-label">Display<select value={preferences.highContrast ? 'contrast' : preferences.colorTheme} onChange={(event) => update(event.target.value === 'contrast' ? { highContrast: true } : { colorTheme: event.target.value as 'light' | 'dark', highContrast: false })}><option value="light">Light</option><option value="dark">Dark</option><option value="contrast">High Contrast</option></select></label></>}
  </div>
}
