import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { keyboardPrice, macroKeys, validateKeyboardInterest } from '../keyboardProduct.ts'
import type { KeyboardColor, KeyboardInterestInput } from '../keyboardProduct.ts'
import { keyboardThemeOrder, keyboardThemes } from '../keyboardThemes.ts'
import type { KeyboardThemeId } from '../keyboardThemes.ts'
import { submitKeyboardInterest } from '../lib/keyboardInterest.ts'
import { supabase } from '../lib/supabase.ts'
import { KeyboardPreview } from './KeyboardPreview.tsx'
import type { PreviewFeature } from './KeyboardPreview.tsx'

interface Props {
  session: Session | null
  onSignIn: () => void
  client?: SupabaseClient | null
}

const confirmation = "Thank you for your interest in the MOSAIC Adaptive Keyboard! Your request has been received. We'll share more information when availability is confirmed."

export function KeyboardProductPage({ session, onSignIn, client = supabase }: Props) {
  const [feature, setFeature] = useState<PreviewFeature>('M1')
  const [keyboardTheme, setKeyboardTheme] = useState<KeyboardThemeId>('mosaic')
  const [color, setColor] = useState<KeyboardColor>('mint')
  const [volume, setVolume] = useState(0)
  const [immersion, setImmersion] = useState(50)
  const [requestOpen, setRequestOpen] = useState(false)
  const [form, setForm] = useState<KeyboardInterestInput>({ fullName: '', email: session?.user.email ?? '', quantity: 1, preferredTheme: 'mosaic', comments: '', acknowledged: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const selected = macroKeys.find((macro) => macro.key === feature) ?? macroKeys[0]

  const openRequest = () => {
    setRequestOpen(true)
    requestAnimationFrame(() => document.getElementById('keyboard-request-title')?.focus())
  }
  const changeColor = (value: KeyboardColor) => setColor(value)
  const changeTheme = (value: KeyboardThemeId) => { setKeyboardTheme(value); setForm((current) => ({ ...current, preferredTheme: value })) }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || saved) return
    const invalid = validateKeyboardInterest(form)
    if (invalid) { setError(invalid); return }
    setBusy(true)
    setError('')
    try {
      await submitKeyboardInterest(client, session?.user.id ?? null, form)
      setSaved(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your request could not be confirmed as saved. Please try again.')
    } finally { setBusy(false) }
  }

  return <div className="kb-product-page">
    <section className="kb-product-hero page" aria-labelledby="kb-product-title">
      <div className="kb-hero-copy"><span className="kb-kicker">MOSAIC HARDWARE · PRODUCT CONCEPT</span><h1 id="kb-product-title">Meet the MOSAIC <span>Adaptive Keyboard</span></h1><p className="kb-hero-subtitle">Your keyboard. Your comfort. Your way to code.</p><p>The MOSAIC Adaptive Keyboard is a customizable physical keyboard concept designed to make learning Python more intuitive, comfortable, and accessible. With programmable shortcuts, adjustable sensory settings, built-in audio controls, and a soft felt wrist rest, it brings MOSAIC's personalized learning experience beyond the screen.</p><div className="kb-hero-actions"><button type="button" className="button button-primary" onClick={openRequest}>Request to Buy <span aria-hidden="true">↗</span></button><span><strong>{keyboardPrice}</strong> per keyboard · Availability to be announced.</span></div><p className="kb-concept-note">Concept visualization. Physical manufacturing, connectivity, and fulfillment have not been announced.</p></div>
      <div className="kb-hero-ornament" aria-hidden="true"><span>M</span><span>O</span><span>S</span><span>A</span><span>I</span><span>C</span></div>
    </section>

    <div className="kb-product-content page"><KeyboardPreview color={color} theme={keyboardTheme} volume={volume} immersion={immersion} feature={feature} onFeature={setFeature} onVolume={setVolume} onImmersion={setImmersion} onColor={changeColor} onTheme={changeTheme} />
      <section className="kb-section kb-macros" aria-labelledby="kb-macros-title"><div className="kb-section-intro"><span className="eyebrow">01 / SHORTCUTS</span><h2 id="kb-macros-title">Code Faster. Think Freely.</h2><p>Proposed Python shortcuts would reduce repetitive typing. Template keys would insert editable code with the cursor in a useful field where possible. MOSAIC settings could customize these mappings in a future hardware integration.</p></div><div className="kb-macro-layout"><div className="kb-macro-guide" aria-label="Proposed macro key mappings">{macroKeys.map((macro) => <button type="button" key={macro.key} className={`kb-macro-guide-key${feature === macro.key ? ' active' : ''}`} onClick={() => setFeature(macro.key)} aria-pressed={feature === macro.key}><strong>{macro.key}</strong><span>{macro.label}</span></button>)}</div><div className="kb-code-demo"><div className="kb-code-demo-header"><span>INTERACTION PREVIEW</span><span>{selected.key}</span></div><p>{selected.description}</p><pre aria-label={`Preview for ${selected.key}`}><code>{selected.preview}</code></pre><small>{selected.kind === 'template' ? 'The ▏ marker shows the proposed cursor position.' : 'This action is described only; no Python executes here.'} The physical keyboard is not connected.</small><div className="kb-demo-actions"><button type="button" onClick={() => setFeature('M1')}>Try M1</button><button type="button" onClick={() => setFeature('M3')}>Try M3</button><button type="button" onClick={() => setFeature('F1')}>Try F1</button></div></div></div><p className="kb-section-footnote">The proposed keyboard would send programmable key commands. A future MOSAIC website integration would interpret supported shortcuts; this preview does not insert code into lessons.</p></section>

      <section className="kb-feature-grid" aria-label="Product concept features"><article className="kb-feature-card kb-sound" aria-labelledby="kb-sound-title"><span className="eyebrow">02 / AUDIO</span><h2 id="kb-sound-title">Sound on Your Terms</h2><p>A proposed physical rotary knob would adjust keyboard audio volume. Built-in speakers could provide optional coding feedback, lesson narration, and gentle sound effects. Volume could reach zero or be muted completely; sound would never be required to finish a lesson.</p><div className="kb-sound-control"><span className="kb-sound-icon" aria-hidden="true">◖</span><label>Volume preview · {volume}%<input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></label><span className="kb-sound-dial" style={{ transform: `rotate(${-125 + volume * 2.5}deg)` }} aria-hidden="true"><i /></span></div><p className="kb-feature-caption">No audio plays in this preview. Website sound preferences would synchronize with physical controls only when hardware integration exists.</p></article>
      <article className="kb-feature-card kb-immersion" aria-labelledby="kb-immersion-title"><span className="eyebrow">03 / SENSORY CONTROL</span><h2 id="kb-immersion-title">One Slider. Your Ideal Environment.</h2><p>The proposed Chill-to-Immersive slider would communicate with MOSAIC's sensory personalization system. It supports intermediate positions. A separate Calm Mode button would offer quick access to less stimulation.</p><div className="kb-mode-list"><div><strong>Chill</strong><span>Less animation and lighting, no unnecessary sound, simplified interface.</span></div><div><strong>Balanced</strong><span>Gentle transitions, moderate lighting, optional audio.</span></div><div><strong>Immersive</strong><span>Richer color and controlled animation, with optional sound and lighting.</span></div></div><label className="kb-inline-range">Sensory preview · {immersion}%<input type="range" min="0" max="100" value={immersion} onChange={(event) => setImmersion(Number(event.target.value))} /></label><button type="button" className="button button-secondary" onClick={() => { setImmersion(0); setFeature('calm') }}>Preview Calm Mode</button><p className="kb-feature-caption">Moving this preview does not change your saved MOSAIC settings or enable sound. Browser reduced-motion preferences remain respected.</p></article></section>

      <section className="kb-comfort kb-section" aria-labelledby="kb-comfort-title"><div><span className="eyebrow">04 / PHYSICAL COMFORT</span><h2 id="kb-comfort-title">Built for Comfort, Designed for You</h2><p>The proposed soft felt wrist rest, easy-to-identify keys, gentle customizable LED illumination, and dedicated physical controls make the concept approachable for extended learning sessions. Different learners may prefer different layouts and levels of stimulation.</p><p>Comfort is personal. This concept does not promise medical or ergonomic outcomes.</p></div><div className="kb-felt-closeup" aria-label="Illustrated close-up of soft felt wrist rest"><span>SOFT FELT</span><div aria-hidden="true" /><small>A subtle, low-contrast material preview</small></div></section>

      <section className="kb-connected kb-section" aria-labelledby="kb-connected-title"><div><span className="eyebrow">05 / CONNECTED LEARNING</span><h2 id="kb-connected-title">One Connected Learning Experience</h2><p>When physical integration is developed, the keyboard could trigger Run Code, insert Python templates, request explanations and hints, save progress, adjust sensory profiles and optional sound, and let learners customize macro mappings.</p><p className="kb-section-footnote">Today, the keyboard interactions on this page are demonstrations. MOSAIC's website already teaches and runs real Python; hardware communication and synchronization are future work.</p></div><div className="kb-connection-diagram" aria-label="Concept diagram: adaptive keyboard commands would connect to the MOSAIC coding workspace"><div><span>01</span><strong>Keyboard concept</strong><small>Proposed physical commands</small></div><span className="kb-connection-arrow" aria-hidden="true">→</span><div><span>02</span><strong>MOSAIC workspace</strong><small>Future supported shortcuts</small></div></div></section>

      <section id="keyboard-request" className="kb-request kb-section" aria-labelledby="keyboard-request-title"><div className="kb-request-heading"><div><span className="eyebrow">REGISTER YOUR INTEREST</span><h2 id="keyboard-request-title" tabIndex={-1}>Request to Buy</h2><p>{keyboardPrice} per keyboard. Availability to be announced. This is a product-interest request, not a purchase or reservation.</p></div>{!requestOpen && <button type="button" className="button button-primary" onClick={openRequest} aria-expanded="false" aria-controls="keyboard-request-form">Request to Buy</button>}</div>
        {requestOpen && <div id="keyboard-request-form">{saved ? <div className="kb-request-success" role="status"><strong>Request saved</strong><p>{confirmation}</p></div> : !session ? <div className="kb-request-signin"><h3>Sign in to send your request</h3><p>Requests are saved securely to your account. Guest submissions are not available yet, so no contact information is collected here without sign-in.</p><button type="button" className="button button-primary" onClick={onSignIn}>Sign in or create an account</button></div> : <form className="kb-request-form" onSubmit={(event) => { void submit(event) }}><div className="kb-form-grid"><label>Full name <span aria-hidden="true">*</span><input name="fullName" type="text" autoComplete="name" required minLength={2} maxLength={100} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label><label>Email address <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Quantity interested in <span aria-hidden="true">*</span><input name="quantity" type="number" min={1} max={10} step={1} required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label><label>Preferred theme <span aria-hidden="true">*</span><select name="preferredTheme" value={form.preferredTheme} onChange={(event) => changeTheme(event.target.value as KeyboardThemeId)}>{keyboardThemeOrder.map((id) => <option value={id} key={id}>{keyboardThemes[id].name}</option>)}</select></label></div><label className="kb-comments-label">Optional comments or accessibility preferences<textarea name="comments" rows={4} maxLength={1000} value={form.comments} onChange={(event) => setForm({ ...form, comments: event.target.value })} placeholder="Share what would make a keyboard more comfortable for you. Please avoid medical details." /></label><p className="kb-privacy-note"><strong>Privacy notice:</strong> MOSAIC stores your name, email, quantity, preferred theme, and optional comments in its Supabase project only to review product interest and follow up about availability. Your request is visible only to your account and authorized project administrators. Do not include payment details, diagnoses, addresses, or other sensitive information.</p><label className="kb-consent"><input type="checkbox" required checked={form.acknowledged} onChange={(event) => setForm({ ...form, acknowledged: event.target.checked })} /><span>I understand this is a product-interest request, not a confirmed purchase. The listed price is {keyboardPrice} per keyboard, and availability has not been announced.</span></label>{error && <p className="kb-request-error" role="alert">{error}</p>}<button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving request…' : 'Send purchase-interest request'}</button><small>We show confirmation only after Supabase confirms your request was saved.</small></form>}</div>}
      </section>
    </div>
  </div>
}
