import { availableWorlds, selectedWorld, THEMES } from '../../design/worlds'
import type { UserPreferences } from '../../types'
export function WorldPicker({ preferences, onChange }: { preferences: UserPreferences; onChange: (preferences: UserPreferences) => void }) {
  const selected = selectedWorld(preferences)
  return <nav aria-label="Pick your world" className="lp-dock"><span className="lp-dock__label">Your world</span>{availableWorlds.map((world) => <button type="button" className={`lp-dock__btn${world === selected ? ' is-active' : ''}`} aria-pressed={world === selected} key={world} onClick={() => onChange({ ...preferences, interest: world === 'mosaic' ? null : world })}><span aria-hidden="true" className="lp-dock__dot" style={{ background: THEMES[world].dot }} />{THEMES[world].label}</button>)}</nav>
}
