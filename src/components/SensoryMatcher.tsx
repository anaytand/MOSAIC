import { useEffect, useRef, useState } from 'react'
import type { FontSize, UserPreferences } from '../types'
import { SensoryControls } from './SensoryControls'
import { SensoryPreview } from './SensoryPreview'
import { updateSensoryPreferences } from '../sensory'
import { MasterImmersionControl } from './MasterImmersionControl'
interface Props { preferences: UserPreferences; onChange: (value: UserPreferences) => void; onFinish: () => void; onExit: () => void; embedded?: boolean }
const questions = ['How colorful would you like your workspace?', 'Which display feels most comfortable?', 'What text size is easiest to read?', 'How much motion and sound would you like?', 'How would you like your learning space organized?']
export function SensoryMatcher({ preferences, onChange, onFinish, onExit, embedded = false }: Props) {
  const [step, setStep] = useState(() => { try { const saved = Number(sessionStorage.getItem('mosaic-sensory-step')); return Number.isInteger(saved) && saved >= 0 && saved < 5 ? saved : 0 } catch { return 0 } })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const update = (changes: Partial<UserPreferences>) => onChange(updateSensoryPreferences(preferences, changes))
  useEffect(() => {
    headingRef.current?.focus()
    try { sessionStorage.setItem('mosaic-sensory-step', String(step)) } catch { /* Choices still save in preferences. */ }
  }, [step])
  const finish = (skip: boolean) => {
    try { sessionStorage.removeItem('mosaic-sensory-step') } catch { /* Session state is optional. */ }
    if (skip) onExit(); else onFinish()
  }
  const display = preferences.highContrast ? 'contrast' : preferences.colorTheme
  return <section className={embedded ? 'sensory-matcher embedded' : 'onboarding-page sensory-matcher'} aria-label="Sensory Profile Matcher">
    {!embedded && <header className="page-heading"><span className="eyebrow">SENSORY PROFILE MATCHER</span><h1>Find your comfortable space.</h1><p className="lede">Preview what feels useful. These choices apply across MOSAIC and can change at any time.</p></header>}
    <div className="onboarding-meta"><span>Preference {step + 1} of 5</span><span>Optional · saves as you choose</span></div>
    <MasterImmersionControl preferences={preferences} onChange={onChange} />
    <div className="setup-track sensory-track" aria-label={`Sensory setup step ${step + 1} of 5`}>{questions.map((question, index) => <span key={question} className={index <= step ? 'filled' : ''} />)}</div>
    <div className="sensory-layout"><div className="sensory-question"><h2 ref={headingRef} tabIndex={-1}>{questions[step]}</h2>
      {step === 0 && <SensoryControls preferences={preferences} onChange={onChange} section="color" />}
      {step === 1 && <fieldset><legend className="sr-only">Display theme</legend><div className="guidance-choices">{(['light', 'dark', 'contrast'] as const).map((value) => <label key={value} className={`choice-card${display === value ? ' is-selected' : ''}`}><input name="sensory-display" type="radio" checked={display === value} onChange={() => update(value === 'contrast' ? { highContrast: true } : { colorTheme: value, highContrast: false })} /><span><strong>{value === 'contrast' ? 'High Contrast' : value === 'light' ? 'Light' : 'Dark'}</strong><small>{value === 'contrast' ? 'Stronger text and boundaries on your current light or dark base.' : value === 'light' ? 'Warm, light surfaces and dark text.' : 'Dark surfaces with soft, readable text.'}</small></span></label>)}</div></fieldset>}
      {step === 2 && <fieldset><legend className="sr-only">Text size</legend><div className="guidance-choices">{([['standard', 'Small', '16px'], ['large', 'Medium', '18px'], ['extra-large', 'Large', '20px']] as [FontSize, string, string][]).map(([value, label, size]) => <label key={value} className={`choice-card${preferences.fontSize === value ? ' is-selected' : ''}`}><input name="sensory-text" type="radio" checked={preferences.fontSize === value} onChange={() => update({ fontSize: value, editorFontSize: null })} /><span><strong>{label} · {size}</strong><small>Applies to navigation, lessons, code, and feedback.</small></span></label>)}</div></fieldset>}
      {step === 3 && <SensoryControls preferences={preferences} onChange={onChange} section="audio-motion" />}
      {step === 4 && <SensoryControls preferences={preferences} onChange={onChange} section="density" />}
    </div><SensoryPreview preferences={preferences} /></div>
    <div className="onboarding-actions"><div className="sensory-navigation">{step > 0 && <button className="text-button" type="button" onClick={() => setStep(step - 1)}>← Previous preference</button>}<button className="text-button" type="button" onClick={() => finish(true)}>Skip sensory setup</button></div><button className="button button-primary" type="button" onClick={step === 4 ? () => finish(false) : () => setStep(step + 1)}>{step === 4 ? 'Save sensory profile' : 'Next preference'} →</button></div>
  </section>
}
