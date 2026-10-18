import type { ChangeEvent } from 'react'
import type { ColorTheme, FontSize, Interest, UserPreferences } from '../types'

interface PreferenceFormProps {
  preferences: UserPreferences
  onChange: (next: UserPreferences) => void
}

const interests: { value: Interest; label: string; icon: string; detail: string }[] = [
  { value: 'ocean', label: 'Ocean', icon: '🌊', detail: 'Waves, reefs & sea life' },
  { value: 'space', label: 'Space', icon: '🪐', detail: 'Planets, stars & missions' },
  { value: 'trains', label: 'Trains', icon: '🚂', detail: 'Tracks, routes & engines' },
  { value: 'animals', label: 'Animals', icon: '🦊', detail: 'Creatures & habitats' },
  { value: 'music', label: 'Music', icon: '♫', detail: 'Songs & instruments' },
  { value: 'sports', label: 'Sports', icon: '⚽', detail: 'Teams & games' },
  { value: 'custom', label: 'My own topic', icon: '✦', detail: 'Choose something you love' },
]

export function PreferenceForm({ preferences, onChange }: PreferenceFormProps) {
  const update = (changes: Partial<UserPreferences>) => onChange({ ...preferences, ...changes })
  const changeInterest = (event: ChangeEvent<HTMLInputElement>) => update({ interest: event.target.value as Interest })

  return (
    <div className="preference-form">
      <fieldset className="interest-fieldset">
        <legend>What are you curious about?</legend>
        <p className="field-hint">Choose a theme for examples. You can change it anytime.</p>
        <div className="interest-grid">
          {interests.map((item) => (
            <label key={item.value} className={`interest-card${preferences.interest === item.value ? ' is-selected' : ''}`}>
              <input type="radio" name="interest" value={item.value} checked={preferences.interest === item.value} onChange={changeInterest} />
              <span className="interest-icon" aria-hidden="true">{item.icon}</span>
              <span className="interest-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
              <span className="radio-mark" aria-hidden="true" />
            </label>
          ))}
        </div>
        {preferences.interest === 'custom' && (
          <label className="field-label custom-topic">Your topic
            <input value={preferences.customTopic} onChange={(event) => update({ customTopic: event.target.value })} placeholder="e.g. baking, birds, basketball" maxLength={48} />
          </label>
        )}
      </fieldset>

      <fieldset className="visual-fieldset">
        <legend>Make it comfortable for you</legend>
        <p className="field-hint">These choices only change how this page looks.</p>
        <label className="toggle-row"><span><strong>Reduced motion</strong><small>Keep movement and transitions to a minimum</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /><span className="toggle" aria-hidden="true" /></label>
        <label className="toggle-row"><span><strong>Higher contrast</strong><small>Make text and controls stand out more</small></span><input type="checkbox" checked={preferences.highContrast} onChange={(event) => update({ highContrast: event.target.checked })} /><span className="toggle" aria-hidden="true" /></label>
        <label className="toggle-row"><span><strong>Simpler workspace</strong><small>Hide optional details while you work</small></span><input type="checkbox" checked={preferences.simplifiedInterface} onChange={(event) => update({ simplifiedInterface: event.target.checked })} /><span className="toggle" aria-hidden="true" /></label>
        <label className="field-label font-choice">Text size
          <select value={preferences.fontSize} onChange={(event) => update({ fontSize: event.target.value as FontSize, editorFontSize: null })}>
            <option value="standard">Standard</option><option value="large">Large</option><option value="extra-large">Extra large</option>
          </select>
        </label>
        <label className="field-label font-choice">Color theme
          <select value={preferences.colorTheme} onChange={(event) => update({ colorTheme: event.target.value as ColorTheme })}>
            <option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
      </fieldset>
    </div>
  )
}
