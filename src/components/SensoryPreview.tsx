import { MotionRegion } from './MotionRegion'
import { CompanionArt } from './CompanionArt'
import type { CSSProperties } from 'react'
import type { UserPreferences } from '../types'
import { sensoryVisualVariables } from '../sensoryVisuals'
import { getLearningTheme } from '../themes/catalog'
import { ThemeArt } from './ThemeArt'
import { effectiveMotion } from '../motion'
import { immersionDescription } from '../immersion'
export function SensoryPreview({ preferences }: { preferences: UserPreferences }) {
  const theme = getLearningTheme(preferences)
  const soundStatus = preferences.soundMuted ? 'Muted until you choose Unmute' : preferences.musicVolume === 0 && preferences.soundVolume === 0 ? 'Silent at 0% volume' : `Effects ${preferences.soundVolume}% · music ${preferences.musicVolume}% (press Play to start)`
  return <aside className="sensory-preview sensory-live" aria-label="Live sensory preview" style={sensoryVisualVariables(preferences) as CSSProperties} data-preview-density={preferences.visualDensity}><span className="eyebrow">LIVE STYLE PREVIEW</span><MotionRegion className="sensory-preview-scene"><div aria-hidden="true" className="preview-typography"><span>YOUR WORLD · YOUR WORLD · </span><span>YOUR WORLD · YOUR WORLD · </span></div><CompanionArt preferences={preferences} className="preview-robot" label="The MOSAIC robot guide" floating state="welcoming" /></MotionRegion><article className="sensory-preview-card"><h3>{theme?.chapters['hello-python'].title ?? 'Your Python workspace'}</h3><p>One clear task: display a welcome message.</p>{theme && <ThemeArt theme={theme.id} />}<pre><code>print("Ready to learn!")</code></pre><span className="status-tag">{preferences.visualDensity === 'minimal' || preferences.simplifiedInterface ? 'Lesson · Code · Output tabs' : 'Lesson + Code + optional Console'}</span></article><dl className="sensory-preview-levels"><div><dt>Immersion</dt><dd>{preferences.masterImmersion}% · {immersionDescription(preferences)}</dd></div><div><dt>Motion</dt><dd>{preferences.motionPreference === 'system' ? `${preferences.motionIntensity}% if device motion is allowed` : `${effectiveMotion(preferences, false)}%`}</dd></div><div><dt>Color</dt><dd>{preferences.colorLevel}%</dd></div><div><dt>Optional sound</dt><dd>{soundStatus}</dd></div></dl><small>This is a style preview. Run real Python in your lesson. Changes also apply throughout MOSAIC.</small></aside>
}
