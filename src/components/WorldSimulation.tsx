import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ConceptId, UserPreferences } from '../types'
import type { LearningTheme, ThemeId } from '../themes/types'
import type { ExecutionTrace, TraceEvent } from '../executionTrace'
import { clampTraceStep, traceLine } from '../executionTrace'
import { simulationContract, worldStateAt } from '../worldSimulation'
import type { WorldState } from '../worldSimulation'

interface Props {
  trace: ExecutionTrace
  conceptId: ConceptId
  theme: LearningTheme | null
  preferences: UserPreferences
  onHighlightLine: (line: number | null) => void
}

function describeStep(event: TraceEvent): string {
  if (event.error) return `Python reported ${event.error} on line ${event.line}.`
  if (event.decision) return `The condition on line ${event.decision.line} took the ${event.decision.branch === 'if' ? 'if' : 'else or skip'} path.`
  if (event.loopIteration) return `Loop iteration ${event.loopIteration.count} began at line ${event.loopIteration.line}.`
  if (event.kind === 'return' && event.scope !== '<module>') return `${event.scope}() returned ${JSON.stringify(event.returnValue)}.`
  const changed = Object.keys(event.changes)
  if (changed.length) return `After line ${event.executedLine ?? event.line}, ${changed.slice(0, 3).join(', ')} changed.`
  if (event.outputChanged) return `The program printed output after line ${event.executedLine ?? event.line}.`
  if (event.kind === 'call') return `Python entered ${event.scope}() on line ${event.line}.`
  return `Python reached line ${event.line}.`
}

function displayValue(value: unknown): string {
  if (value === null) return 'None'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'item' : 'items'}`
  if (typeof value === 'object') return `${Object.keys(value).length} ${Object.keys(value).length === 1 ? 'field' : 'fields'}`
  return 'Waiting for a recorded value'
}

function WorldArtwork({ themeId, progress, state }: { themeId: ThemeId | 'code'; progress: number; state: WorldState }) {
  const markerX = 42 + Math.round(progress * 190)
  if (themeId === 'basketball') return <div className="world-art world-art--basketball" aria-hidden="true"><div className="court-markings"><span className="court-hoop" /><span className="court-center" /></div><span className="court-player">FALCONS</span><span className="court-ball" style={{ left: `${markerX}px` }} /><div className="court-scoreboard"><small>{state.label}</small><strong>{state.available ? displayValue(state.value) : '—'}</strong></div></div>
  return <svg className={`world-art world-art--${themeId}`} viewBox="0 0 300 150" role="presentation" aria-hidden="true" focusable="false">
    {themeId === 'space' && <><circle cx="247" cy="41" r="27" fill="var(--sim-accent)" opacity=".65" /><ellipse cx="247" cy="41" rx="42" ry="9" fill="none" stroke="var(--sim-ink)" strokeWidth="3" transform="rotate(-18 247 41)" /><g fill="var(--sim-ink)" opacity=".65"><circle cx="34" cy="26" r="2" /><circle cx="137" cy="43" r="2" /><circle cx="276" cy="112" r="2" /></g><path d={`M${markerX} 108l13-25 13 25-13-5z`} fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /></>}
    {themeId === 'ocean' && <><path d="M0 66 Q38 50 75 66 T150 66 T225 66 T300 66 V150 H0Z" fill="var(--sim-accent)" opacity=".26" /><path d="M0 91 Q38 76 75 91 T150 91 T225 91 T300 91" fill="none" stroke="var(--sim-ink)" strokeWidth="3" opacity=".5" /><g transform={`translate(${markerX} 105)`}><rect x="-19" y="-10" width="38" height="20" rx="10" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><circle cx="6" cy="-1" r="4" fill="var(--sim-soft)" /><path d="M-3-10v-10h13" fill="none" stroke="var(--sim-ink)" strokeWidth="2" /></g><circle cx="250" cy="103" r="3" fill="var(--sim-ink)" /></>}
    {themeId === 'trains' && <><path d="M10 108h280M10 120h280" stroke="var(--sim-ink)" strokeWidth="3" /><path d="M30 108v12m35-12v12m35-12v12m35-12v12m35-12v12m35-12v12m35-12v12" stroke="var(--sim-ink)" strokeWidth="3" /><g transform={`translate(${markerX} 74)`}><rect x="-27" y="-17" width="54" height="32" rx="7" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><rect x="-17" y="-11" width="17" height="12" rx="2" fill="var(--sim-soft)" /><rect x="6" y="-11" width="13" height="12" rx="2" fill="var(--sim-soft)" /><circle cx="-15" cy="18" r="5" fill="var(--sim-ink)" /><circle cx="15" cy="18" r="5" fill="var(--sim-ink)" /></g></>}
    {themeId === 'animals' && <><path d="M30 116l24-67 24 67zM238 116l25-75 25 75z" fill="var(--sim-accent)" opacity=".62" /><path d="M54 112v25m209-25v25" stroke="var(--sim-ink)" strokeWidth="6" /><g transform={`translate(${markerX} 105)`}><ellipse rx="21" ry="12" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><circle cx="17" cy="-10" r="10" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><path d="M12-18l2-11 7 11m-24 11q-26-18-32 2" fill="none" stroke="var(--sim-ink)" strokeWidth="3" /></g></>}
    {themeId === 'music' && <><g stroke="var(--sim-ink)" opacity=".5" strokeWidth="2"><path d="M12 58h276M12 72h276M12 86h276M12 100h276" /></g><g transform={`translate(${markerX} 90)`} fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2"><ellipse cx="0" cy="16" rx="11" ry="7" /><path d="M10 16v-47l29 6v12l-29-6" fill="var(--sim-accent)" /><ellipse cx="29" cy="-1" rx="11" ry="7" /></g></>}
    {themeId === 'code' && <><rect x="23" y="26" width="254" height="98" rx="13" fill="var(--sim-accent)" opacity=".25" /><path d="M78 58L55 75l23 17m144-34l23 17-23 17M160 48l-20 54" fill="none" stroke="var(--sim-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></>}
  </svg>
}

function WorldScene({ state, theme, preferences }: { state: WorldState; theme: LearningTheme | null; preferences: UserPreferences }) {
  const themeId = theme?.id ?? 'code'
  const progress = state.totalRecordedIterations ? state.recordedIterations / state.totalRecordedIterations : 0
  const palette = theme?.palette
  const accent = preferences.colorTheme === 'dark' ? palette?.darkAccent ?? '#8bd8c9' : palette?.accent ?? '#187f7b'
  const soft = preferences.colorTheme === 'dark' ? palette?.darkSoft ?? '#142f39' : palette?.soft ?? '#e4f2ec'
  const strength = Math.max(0, Math.min(100, preferences.colorLevel))
  const style = { '--sim-accent': `color-mix(in srgb, ${accent} ${Math.max(20, strength)}%, ${soft})`,
    '--sim-soft': soft,
    '--sim-ink': preferences.colorTheme === 'dark' ? palette?.darkInk ?? '#ffffff' : palette?.ink ?? '#142f39',
    '--sim-color-strength': `${strength}%` } as CSSProperties
  const limited = state.value === '<value not shown>' || state.value === '<collection too large to show>' || state.value === '<dictionary too large to show>'
  const value = state.available ? displayValue(state.value) : limited ? 'Value outside trace display limits' : 'Waiting for a recorded value'
  return <div className={`world-scene world-scene--${themeId}`} style={style}>
    <WorldArtwork themeId={themeId} progress={progress} state={state} />
    <div className="world-readout"><small>{theme?.projectName ?? 'Your Python program'}</small><span>{state.label}</span><strong>{value}</strong><small>{state.available ? `From ${state.sourceName}` : limited ? 'Python produced a value, but the trace limits prevent showing it here.' : 'No matching value has appeared in this run yet.'}</small></div>
    {state.available && Array.isArray(state.value) && <ul className="world-value-list" aria-label="Returned collection">{state.value.map((item, index) => <li key={index}>{displayValue(item)}</li>)}</ul>}
    {state.available && state.value !== null && typeof state.value === 'object' && !Array.isArray(state.value) && <dl className="world-value-record">{Object.entries(state.value).map(([key, item]) => <div key={key}><dt>{key}</dt><dd>{Array.isArray(item) ? item.map(displayValue).join(', ') : displayValue(item)}</dd></div>)}</dl>}
    {state.details.length > 0 && <dl className="world-value-record">{state.details.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{displayValue(value)}</dd></div>)}</dl>}
    {state.recordedIterations > 0 && <p className="world-iterations">{state.recordedIterations} loop {state.recordedIterations === 1 ? 'iteration' : 'iterations'} observed so far</p>}
    {state.source === 'output' && state.event.outputPreviewTruncated && <p className="world-iterations">Showing the last 4,000 output characters here. The Console has the full captured output.</p>}
  </div>
}

export function WorldSimulation({ trace, conceptId, theme, preferences, onHighlightLine }: Props) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState(false)
  const state = useMemo(() => worldStateAt(trace, step, theme, conceptId), [trace, step, theme, conceptId])
  const contract = simulationContract(theme, conceptId)
  const playbackAllowed = !preferences.reducedMotion && preferences.motionIntensity > 0
  const playbackMs = 1500 - Math.min(100, Math.max(0, preferences.motionIntensity)) * 6

  useEffect(() => {
    onHighlightLine(open && state ? traceLine(state.event) : null)
    return () => onHighlightLine(null)
  }, [state, onHighlightLine, open])
  useEffect(() => {
    if (!playing) return
    if (!playbackAllowed) { const timer = window.setTimeout(() => setPlaying(false), 0); return () => window.clearTimeout(timer) }
    const timer = window.setTimeout(() => { const next = Math.min(step + 1, trace.events.length - 1); setStep(next); if (next === trace.events.length - 1) setPlaying(false) }, playbackMs)
    return () => window.clearTimeout(timer)
  }, [playing, playbackAllowed, playbackMs, step, trace.events.length])

  const move = (next: number) => { setPlaying(false); setStep(clampTraceStep(next, trace)) }
  return <details className="world-simulation" open={open} onToggle={(event) => { const next = event.currentTarget.open; setOpen(next); if (!next) setPlaying(false) }}>
    <summary>See Your Code Come to Life <span className="simulation-count">{trace.events.length} real steps · {theme?.name ?? 'Python execution'}</span></summary>
    <div className="simulation-inner">
      <p className="simulation-contract">This scene follows {contract.source === 'module-variable' ? `the module-level ${contract.key}${contract.fallbackKey ? ` or ${contract.fallbackKey}` : ''} variable` : contract.source === 'function-return' ? `the actual return value of ${contract.functionName}()` : 'actual Python output'}. It does not determine whether the lesson is complete.</p>
      {state && <>
        <WorldScene state={state} theme={theme} preferences={preferences} />
        <p className="simulation-step" aria-live={playing ? 'off' : 'polite'}><strong>Step {step + 1} of {trace.events.length} · Line {traceLine(state.event)}</strong><br />{describeStep(state.event)}<span className="sr-only"> {state.label}: {state.available ? displayValue(state.value) : 'not available yet'}.</span></p>
        <div className="simulation-controls" role="group" aria-label="Execution timeline controls">
          <button type="button" onClick={() => move(step - 1)} disabled={step === 0}>Previous Step</button>
          <button type="button" onClick={() => move(step + 1)} disabled={step >= trace.events.length - 1}>Next Step</button>
          <button type="button" onClick={() => setPlaying(!playing)} disabled={!playbackAllowed || trace.events.length < 2 || step >= trace.events.length - 1}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" onClick={() => move(0)} disabled={step === 0}>Restart</button>
        </div>
        {!playbackAllowed && <p className="simulation-note">Motion is off. Use Previous Step and Next Step to explore at your pace.</p>}
        <label className="simulation-timeline">Execution step <input type="range" min="0" max={Math.max(0, trace.events.length - 1)} value={step} onChange={(event) => move(Number(event.target.value))} aria-valuetext={`Step ${step + 1} of ${trace.events.length}`} /></label>
        <div className="simulation-variables"><h3>Variables at this step</h3>{Object.keys(state.event.variables).length ? <dl>{Object.entries(state.event.variables).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{JSON.stringify(value)}</dd></div>)}</dl> : <p>No learner variables yet.</p>}</div>
        {state.event.output && <details className="simulation-output"><summary>Output so far</summary><pre>{state.event.output}</pre></details>}
      </>}
      {!state && <p className="simulation-note">Python did not execute a source line in this run. Check the Console for the error, then try again.</p>}
      {trace.truncated && <p className="simulation-note" role="status">The timeline stops after 400 steps to keep the page responsive. Your Python program and lesson check continued running.</p>}
      {trace.outputTruncated && <p className="simulation-note" role="status">Program output was limited to 20,000 characters for this run.</p>}
    </div>
  </details>
}
