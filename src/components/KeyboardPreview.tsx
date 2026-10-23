import type { CSSProperties } from 'react'
import { immersionLabel, keyboardColors, macroKeys } from '../keyboardProduct.ts'
import type { KeyboardColor, MacroKey } from '../keyboardProduct.ts'
import { keyboardThemeOrder, keyboardThemes } from '../keyboardThemes.ts'
import type { KeyboardThemeId } from '../keyboardThemes.ts'

export type PreviewFeature = MacroKey | 'volume' | 'sensory' | 'speakers' | 'wrist' | 'calm' | 'led'

interface Props {
  color: KeyboardColor
  theme: KeyboardThemeId
  volume: number
  immersion: number
  feature: PreviewFeature
  onFeature: (feature: PreviewFeature) => void
  onVolume: (value: number) => void
  onImmersion: (value: number) => void
  onColor: (value: KeyboardColor) => void
  onTheme: (value: KeyboardThemeId) => void
}

const rows = [
  ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '↵'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl'],
]

const featureCopy: Record<Exclude<PreviewFeature, MacroKey>, string> = {
  volume: 'Concept preview: a rotary knob would control optional keyboard audio. The slider below rotates the preview knob; no sound plays.',
  sensory: 'Concept preview: the physical slider would send a sensory-profile setting to MOSAIC. This visualization changes only the product preview.',
  speakers: 'Concept preview: built-in speaker grilles for optional gentle feedback and future narration. Audio remains off in this demonstration.',
  wrist: 'Concept preview: a soft felt wrist rest along the front edge for comfortable hand placement.',
  calm: 'Concept preview: a dedicated Calm Mode control would quickly reduce stimulation. The preview is now set to Chill.',
  led: 'Concept preview: gentle LED lighting could be customized or switched off. The colors here are simulated.',
}

function ThemeMotif({ id }: { id: KeyboardThemeId }) {
  return <svg className="kb-theme-motif" viewBox="0 0 120 54" aria-hidden="true" focusable="false">
    {id === 'mosaic' && <><rect x="16" y="10" width="18" height="18" rx="4" /><rect x="39" y="10" width="18" height="18" rx="4" /><rect x="62" y="10" width="18" height="18" rx="4" /><rect x="39" y="33" width="18" height="12" rx="4" /></>}
    {id === 'space' && <><circle cx="51" cy="27" r="14" /><ellipse cx="51" cy="27" rx="29" ry="8" transform="rotate(-20 51 27)" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M95 7v10M90 12h10M97 37v8M93 41h8" fill="none" stroke="currentColor" strokeWidth="2" /></>}
    {id === 'ocean' && <><path d="M10 33q10-10 20 0t20 0t20 0t20 0t20 0M10 42q10-10 20 0t20 0t20 0t20 0t20 0" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M43 18q13-13 26 0q-13 13-26 0l-9 7V11z" /></>}
    {id === 'basketball' && <><circle cx="55" cy="27" r="20" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M35 27h40M55 7v40M41 12q14 15 0 30M69 12q-14 15 0 30" fill="none" stroke="currentColor" strokeWidth="2" /></>}
    {id === 'music' && <><path d="M37 33V10l31-5v22M37 12l31-5" fill="none" stroke="currentColor" strokeWidth="3" /><ellipse cx="30" cy="36" rx="8" ry="5" /><ellipse cx="61" cy="30" rx="8" ry="5" /><path d="M85 22v13M93 16v22M101 21v14" fill="none" stroke="currentColor" strokeWidth="3" /></>}
    {id === 'animals' && <><circle cx="47" cy="32" r="11" /><circle cx="30" cy="18" r="5" /><circle cx="43" cy="12" r="5" /><circle cx="57" cy="13" r="5" /><circle cx="70" cy="22" r="5" /><path d="M82 39q7-23 25-26q-1 21-25 26M82 39q8-11 21-16" fill="none" stroke="currentColor" strokeWidth="3" /></>}
    {id === 'trains' && <><rect x="38" y="8" width="39" height="31" rx="7" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M42 19h31M47 43h22M32 49h51M43 39l-6 10M72 39l6 10" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="48" cy="32" r="3" /><circle cx="67" cy="32" r="3" /></>}
  </svg>
}

function SpeakerMark({ id }: { id: KeyboardThemeId }) {
  return <svg className="kb-speaker-mark" viewBox="0 0 120 54" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {id === 'mosaic' && <><rect x="8" y="8" width="25" height="18" rx="4" /><rect x="39" y="8" width="25" height="18" rx="4" /><rect x="70" y="8" width="25" height="18" rx="4" /><rect x="24" y="31" width="25" height="18" rx="4" /><rect x="55" y="31" width="25" height="18" rx="4" /><rect x="86" y="31" width="25" height="18" rx="4" /></>}
    {id === 'space' && <><circle cx="64" cy="27" r="17" /><ellipse cx="64" cy="27" rx="34" ry="10" transform="rotate(-20 64 27)" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M15 7v10M10 12h10M104 9v8M100 13h8M21 39v7M17.5 42.5h7" fill="none" stroke="currentColor" strokeWidth="2" /></>}
    {id === 'ocean' && <><path d="M-8 30q12-11 24 0t24 0t24 0t24 0t24 0t24 0M-8 44q12-11 24 0t24 0t24 0t24 0t24 0t24 0" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M55 17q13-11 26 0q-13 11-26 0l-9 6V11z" /><circle cx="96" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth="2" /></>}
    {id === 'basketball' && <><circle cx="69" cy="27" r="22" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M47 27h44M69 5v44M54 10q17 17 0 34M84 10q-17 17 0 34M15 0v54M103 0v54" fill="none" stroke="currentColor" strokeWidth="2" /></>}
    {id === 'music' && <><path d="M12 40V22M25 47V9M38 41V18M51 34V24M64 45V12M77 39V20M90 48V8M103 38V23" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /></>}
    {id === 'animals' && <><path d="M8 49q14-41 38-40q-2 26-38 40M8 49q13-23 31-32" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M65 28q-7 9 0 15q5 3 13-3q8 6 13 3q7-6 0-15q-6-6-13 0q-7-6-13 0z" /><circle cx="60" cy="14" r="4" /><circle cx="71" cy="9" r="4" /><circle cx="84" cy="9" r="4" /><circle cx="96" cy="14" r="4" /></>}
    {id === 'trains' && <><path d="M-5 9h130M-5 45h130M14 9v36M37 9v36M60 9v36M83 9v36M106 9v36" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="60" cy="27" r="8" /><circle cx="60" cy="27" r="3" fill="var(--kb-deck)" /></>}
  </svg>
}

function ProductCallout({ label }: { label: string }) {
  return <span className="kb-product-callout" aria-hidden="true">{label}</span>
}

function SpeakerPreview({ side, theme, onFeature }: { side: 'left' | 'right'; theme: KeyboardThemeId; onFeature: () => void }) {
  return <div className="kb-speaker-module">
    <ProductCallout label="Built-in speaker" />
    <button type="button" className="kb-speaker" onClick={onFeature} aria-label={`Explore the proposed ${side} speaker`}>
      <SpeakerMark id={theme} />
      <span className="kb-speaker-grille" aria-hidden="true" />
    </button>
  </div>
}

export function VolumeKnob({ volume, onFeature, className = '' }: { volume: number; onFeature: () => void; className?: string }) {
  const rotation = -125 + volume * 2.5
  return <button type="button" className={`kb-knob ${className}`} onClick={onFeature} aria-label={`Volume knob preview, ${volume} percent. Learn about the proposed sound control.`}>
    <span className="kb-knob-face" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true"><i /></span>
    <span className="kb-knob-caption">VOL · {volume}%</span>
  </button>
}

export function KeyboardPreview({ color, theme: themeId, volume, immersion, feature, onFeature, onVolume, onImmersion, onColor, onTheme }: Props) {
  const theme = keyboardThemes[themeId]
  const activeMacro = macroKeys.find((macro) => macro.key === feature)
  const css = {
    '--kb-immersion': immersion / 100,
    '--kb-shell': theme.colors.shell,
    '--kb-deck': theme.colors.deck,
    '--kb-keycap': theme.colors.key,
    '--kb-key-edge': theme.colors.keyEdge,
    '--kb-legend': theme.colors.legend,
    '--kb-function': theme.colors.function,
    '--kb-wrist': theme.colors.wrist,
    '--kb-wrist-edge': theme.colors.wristEdge,
    '--kb-ambient': theme.colors.ambient,
    '--kb-highlight': theme.colors.highlight,
  } as CSSProperties
  const macro = macroKeys.filter((item) => item.key.startsWith('M'))
  const functionKeys = macroKeys.filter((item) => item.key.startsWith('F'))
  return <section className="kb-preview" aria-labelledby="kb-preview-title" data-color={color} data-theme={themeId} data-mode={immersionLabel(immersion).toLowerCase()} style={css}>
    <div className="kb-preview-heading"><div><span className="eyebrow">INTERACTIVE PRODUCT CONCEPT</span><h2 id="kb-preview-title">Explore the keyboard</h2></div><span className="status-tag">Preview only · No hardware connected</span></div>
    <div className="kb-theme-picker" role="group" aria-label="Keyboard preview themes"><div><strong>Themes</strong><span>{theme.name} · {theme.edition}</span></div><div className="kb-theme-options">{keyboardThemeOrder.map((id) => <button type="button" key={id} className={themeId === id ? 'selected' : ''} aria-pressed={themeId === id} onClick={() => onTheme(id)}>{keyboardThemes[id].name}</button>)}</div></div>
    <p className="kb-theme-description" role="status">{theme.description} The proposed hardware layout stays the same.</p>
    <div className="kb-preview-scroll" role="region" aria-label={`${theme.name} keyboard visualization; scroll horizontally on small screens`} tabIndex={0}>
      <div className="kb-device">
        <div className="kb-control-deck">
          <SpeakerPreview side="left" theme={themeId} onFeature={() => onFeature('speakers')} />
          <VolumeKnob volume={volume} onFeature={() => onFeature('volume')} />
          <button type="button" className="kb-mosaic-tiles" onClick={() => onFeature('led')} aria-label="Explore the nine-tile MOSAIC lighting cluster">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ background: theme.colors.macro[index % 6] }} aria-hidden="true" />)}</button>
          <div className="kb-top-sensory"><label htmlFor="kb-sensory-slider">SENSORY · {immersionLabel(immersion).toUpperCase()}</label><input id="kb-sensory-slider" type="range" min="0" max="100" value={immersion} onChange={(event) => { onImmersion(Number(event.target.value)); onFeature('sensory') }} aria-valuetext={`${immersion} percent, ${immersionLabel(immersion)} preview`} /></div>
          <SpeakerPreview side="right" theme={themeId} onFeature={() => onFeature('speakers')} />
        </div>
        <div className="kb-macro-strip" aria-label="Proposed shortcut keys"><div className="kb-macro-run">{macro.map((item, index) => <button type="button" key={item.key} className={`kb-key kb-macro${feature === item.key ? ' selected' : ''}`} style={{ '--kb-macro-color': theme.colors.macro[index] } as CSSProperties} onClick={() => onFeature(item.key)} onMouseEnter={() => onFeature(item.key)} onFocus={() => onFeature(item.key)} aria-label={`${item.key}: ${item.label}. ${item.description}`}>{item.key}</button>)}</div><div className="kb-function-run">{functionKeys.map((item) => <button type="button" key={item.key} className={`kb-key kb-function${feature === item.key ? ' selected' : ''}`} onClick={() => onFeature(item.key)} onMouseEnter={() => onFeature(item.key)} onFocus={() => onFeature(item.key)} aria-label={`${item.key}: ${item.label}. ${item.description}`}>{item.key}</button>)}</div><button type="button" className="kb-calm" aria-pressed={immersion === 0} onClick={() => { onImmersion(0); onFeature('calm') }} aria-label="Preview dedicated Calm Mode control">CALM</button></div>
        <div className="kb-key-bed" aria-label="Illustrated physical typing keys">{rows.map((row, rowIndex) => <div className="kb-typing-row" key={rowIndex} aria-hidden="true">{row.map((key, keyIndex) => <span key={`${rowIndex}-${keyIndex}`} className={`kb-key kb-typing-key${key === 'Space' ? ' kb-space' : ''}`}>{key === 'Space' ? '' : key}</span>)}</div>)}</div>
        <div className="kb-shell-signature"><span>MOSAIC · {theme.edition}</span><ThemeMotif id={themeId} /></div>
        <button type="button" className="kb-wrist-rest" onClick={() => onFeature('wrist')} onMouseEnter={() => onFeature('wrist')} onFocus={() => onFeature('wrist')} aria-label="Explore the soft felt wrist rest"><span>SOFT FELT WRIST REST</span></button>
      </div>
    </div>
    <div className="kb-preview-controls"><label>Preview volume · {volume}%<input type="range" min="0" max="100" value={volume} onChange={(event) => { onVolume(Number(event.target.value)); onFeature('volume') }} aria-label="Preview physical volume knob position" /></label><label>Preview immersion · {immersion}% ({immersionLabel(immersion)})<input type="range" min="0" max="100" value={immersion} onChange={(event) => { onImmersion(Number(event.target.value)); onFeature('sensory') }} aria-label="Preview Chill to Immersive position" /></label><div className="kb-preview-color"><span>Preview finish and lighting</span><div className="kb-color-swatches">{keyboardColors.map((option) => <button type="button" key={option.id} className={`kb-swatch kb-swatch-${option.id}${color === option.id ? ' active' : ''}`} onClick={() => { onColor(option.id); onFeature('led') }} aria-label={`Preview ${option.label} keyboard and lighting`} aria-pressed={color === option.id} />)}</div></div></div>
    <div className="kb-feature-note" role="status"><strong>{activeMacro ? `${activeMacro.key} · ${activeMacro.label}` : feature === 'wrist' ? 'Soft felt wrist rest' : feature === 'calm' ? 'Calm Mode' : feature === 'led' ? 'Nine-tile lighting' : feature === 'speakers' ? 'Built-in speakers' : feature === 'volume' ? 'Physical sound knob' : 'Chill-to-Immersive slider'}</strong><p>{activeMacro ? `${activeMacro.description} Proposed mapping only; no code is inserted by this preview.` : featureCopy[feature as Exclude<PreviewFeature, MacroKey>]}</p></div>
  </section>
}
