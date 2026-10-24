import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ConceptId, UserPreferences } from '../types'
import type { LearningTheme, ThemeId } from '../themes/types'
import type { ExecutionTrace } from '../executionTrace'
import { traceLine } from '../executionTrace'
import { oceanDepthPosition, signalMeterPercent, simulationContract, simulationFrames, simulationValueText } from '../worldSimulation'
import type { SimulationFrame } from '../worldSimulation'
import { createPlaybackClock } from '../simulationPlayback'

interface Props {
  trace: ExecutionTrace
  conceptId: ConceptId
  theme: LearningTheme | null
  preferences: UserPreferences
  onHighlightLine: (line: number | null) => void
}

/** Position is presentation only; numbers and decisions always come from recorded Python events. */
function WorldArtwork({ themeId, progress, frame }: { themeId: ThemeId | 'code'; progress: number; frame?: SimulationFrame }) {
  const markerX = 38 + Math.round(progress * 205)
  const oceanY = oceanDepthPosition(frame?.reading)
  if (themeId === 'basketball') return <div className="world-art world-art--basketball" aria-hidden="true">
    <div className="court-markings"><span className="court-hoop" /><span className="court-center" /></div>
    <span className="court-player">FALCONS</span>
    <span key={frame?.scoreDelta && frame.scoreDelta > 0 ? frame.eventIndex : 'idle'} className={`court-ball${frame?.scoreDelta && frame.scoreDelta > 0 ? ' scored' : ''}`} style={{ left: frame?.scoreDelta && frame.scoreDelta > 0 ? 'calc(100% - 66px)' : `${13 + progress * 68}%` }} />
    <div className="court-scoreboard"><small>{frame?.state.label ?? 'Game preview'}</small><strong>{frame?.state.available ? simulationValueText(frame.state.value) : '—'}</strong></div>
  </div>
  return <svg className={`world-art world-art--${themeId}`} viewBox="0 0 300 150" role="presentation" aria-hidden="true" focusable="false">
    {themeId === 'space' && <><circle cx="247" cy="41" r="27" fill="var(--sim-accent)" opacity=".65" /><ellipse cx="247" cy="41" rx="42" ry="9" fill="none" stroke="var(--sim-ink)" strokeWidth="3" transform="rotate(-18 247 41)" /><g fill="var(--sim-ink)" opacity=".65"><circle cx="34" cy="26" r="2" /><circle cx="137" cy="43" r="2" /><circle cx="276" cy="112" r="2" /></g><g className="sim-mover" style={{ transform: `translate(${markerX}px, 0px)` }}><path d="M0 108l13-25 13 25-13-5z" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /></g></>}
    {themeId === 'ocean' && <><path d="M0 66 Q38 50 75 66 T150 66 T225 66 T300 66 V150 H0Z" fill="var(--sim-accent)" opacity=".26" /><path d="M0 91 Q38 76 75 91 T150 91 T225 91 T300 91" fill="none" stroke="var(--sim-ink)" strokeWidth="3" opacity=".5" /><g className="sim-mover" style={{ transform: `translate(${markerX}px, ${oceanY}px)` }}><rect x="-19" y="-10" width="38" height="20" rx="10" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><circle cx="6" cy="-1" r="4" fill="var(--sim-soft)" /><path d="M-3-10v-10h13" fill="none" stroke="var(--sim-ink)" strokeWidth="2" /></g><circle cx="250" cy="103" r="3" fill="var(--sim-ink)" /></>}
    {themeId === 'trains' && <><path d="M10 108h280M10 120h280" stroke="var(--sim-ink)" strokeWidth="3" /><path d="M30 108v12m35-12v12m35-12v12m35-12v12m35-12v12m35-12v12m35-12v12" stroke="var(--sim-ink)" strokeWidth="3" /><g className="sim-mover" style={{ transform: `translate(${markerX}px, 74px)` }}><rect x="-27" y="-17" width="54" height="32" rx="7" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><rect x="-17" y="-11" width="17" height="12" rx="2" fill="var(--sim-soft)" /><rect x="6" y="-11" width="13" height="12" rx="2" fill="var(--sim-soft)" /><circle cx="-15" cy="18" r="5" fill="var(--sim-ink)" /><circle cx="15" cy="18" r="5" fill="var(--sim-ink)" /></g></>}
    {themeId === 'animals' && <><path d="M30 116l24-67 24 67zM238 116l25-75 25 75z" fill="var(--sim-accent)" opacity=".62" /><path d="M54 112v25m209-25v25" stroke="var(--sim-ink)" strokeWidth="6" /><g className="sim-mover" style={{ transform: `translate(${markerX}px, 105px)` }}><ellipse rx="21" ry="12" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><circle cx="17" cy="-10" r="10" fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2" /><path d="M12-18l2-11 7 11m-24 11q-26-18-32 2" fill="none" stroke="var(--sim-ink)" strokeWidth="3" /></g></>}
    {themeId === 'music' && <><g stroke="var(--sim-ink)" opacity=".5" strokeWidth="2"><path d="M12 58h276M12 72h276M12 86h276M12 100h276" /></g><g className="sim-mover" style={{ transform: `translate(${markerX}px, 90px)` }} fill="var(--sim-accent)" stroke="var(--sim-ink)" strokeWidth="2"><ellipse cx="0" cy="16" rx="11" ry="7" /><path d="M10 16v-47l29 6v12l-29-6" fill="var(--sim-accent)" /><ellipse cx="29" cy="-1" rx="11" ry="7" /></g></>}
    {themeId === 'code' && <><rect x="23" y="26" width="254" height="98" rx="13" fill="var(--sim-accent)" opacity=".25" /><path d="M78 58L55 75l23 17m144-34l23 17-23 17M160 48l-20 54" fill="none" stroke="var(--sim-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></>}
  </svg>
}

function WorldScene({ frame, theme, conceptId, preferences, unavailable }: { frame?: SimulationFrame; theme: LearningTheme | null; conceptId: ConceptId; preferences: UserPreferences; unavailable: boolean }) {
  const themeId = theme?.id ?? 'code'
  const progress = frame?.progress ?? 0
  const palette = theme?.palette
  const accent = preferences.colorTheme === 'dark' ? palette?.darkAccent ?? '#8bd8c9' : palette?.accent ?? '#187f7b'
  const soft = preferences.colorTheme === 'dark' ? palette?.darkSoft ?? '#142f39' : palette?.soft ?? '#e4f2ec'
  const strength = Math.max(0, Math.min(100, preferences.colorLevel))
  const style = { '--sim-accent': `color-mix(in srgb, ${accent} ${Math.max(20, strength)}%, ${soft})`,
    '--sim-soft': soft,
    '--sim-ink': preferences.colorTheme === 'dark' ? palette?.darkInk ?? '#ffffff' : palette?.ink ?? '#142f39',
    '--sim-color-strength': `${strength}%`,
    '--sim-transition': `${Math.max(180, 700 - preferences.motionIntensity * 4)}ms` } as CSSProperties
  const signal = themeId === 'space' ? signalMeterPercent(frame?.reading) : null
  return <div className={`world-scene world-scene--${themeId}`} style={style} data-animate={!preferences.reducedMotion && preferences.motionIntensity > 0}>
    <div className="world-visual">
      <WorldArtwork themeId={themeId} progress={progress} frame={frame} />
      {frame?.reading !== undefined && <div className="world-reading"><span>{frame.readingLabel}</span><strong>{simulationValueText(frame.reading)}</strong></div>}
      {themeId === 'space' && conceptId === 'loops' && !unavailable && <div className="world-signal"><span>{signal === null ? 'Ready to scan' : `Signal ${simulationValueText(frame?.reading)}`}</span><i><b style={{ width: `${signal ?? 0}%` }} /></i></div>}
      <div className="world-mission-progress"><span>{themeId === 'space' && conceptId === 'loops' ? 'Mission scan' : 'Simulation journey'}</span><i><b style={{ width: `${Math.round(progress * 100)}%` }} /></i></div>
    </div>
    <div className="world-readout"><small>{theme?.projectName ?? 'Your Python program'}</small><span>{frame?.state.label ?? (unavailable ? 'No scene data in this run' : 'Ready to explore')}</span><strong>{frame?.state.available ? simulationValueText(frame.state.value) : frame?.reading !== undefined ? simulationValueText(frame.reading) : frame ? 'Your program is making progress' : unavailable ? 'Check your task and run again' : 'Press Play Simulation'}</strong></div>
  </div>
}

export function WorldSimulation({ trace, conceptId, theme, preferences, onHighlightLine }: Props) {
  const frames = useMemo(() => simulationFrames(trace, theme, conceptId), [trace, theme, conceptId])
  const [frameIndex, setFrameIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState(false)
  const clockRef = useRef<ReturnType<typeof createPlaybackClock> | null>(null)
  const frame = frameIndex >= 0 ? frames[frameIndex] : undefined
  const finished = frameIndex === frames.length - 1 && frames.length > 0 && !playing
  const playbackMs = preferences.reducedMotion || preferences.motionIntensity === 0 ? 1100 : 1050 - Math.min(100, preferences.motionIntensity) * 3
  const contract = simulationContract(theme, conceptId)

  useEffect(() => {
    const clock = createPlaybackClock()
    clockRef.current = clock
    return () => { clock.cancel(); clockRef.current = null }
  }, [])
  useEffect(() => {
    onHighlightLine(open && frame ? traceLine(frame.state.event) : null)
    return () => onHighlightLine(null)
  }, [frame, onHighlightLine, open])
  useEffect(() => {
    if (!playing) return
    clockRef.current?.schedule(() => {
      const next = frameIndex + 1
      setFrameIndex(next)
      if (next >= frames.length - 1) setPlaying(false)
    }, playbackMs)
    return () => clockRef.current?.cancel()
  }, [playing, frameIndex, frames.length, playbackMs])

  const play = () => {
    if (playing || !frames.length) return
    setFrameIndex(-1)
    setPlaying(true)
  }

  return <details className="world-simulation" open={open} onToggle={(event) => { const next = event.currentTarget.open; setOpen(next); if (!next) { setPlaying(false); setFrameIndex(-1) } }}>
    <summary>See Your Code Come to Life <span className="simulation-count">{theme?.name ?? 'Python execution'} · Simulation</span></summary>
    <div className="simulation-inner">
      <p className="simulation-contract">{conceptId === 'loops' && theme ? `Watch your program process ${theme.series.key.replaceAll('_', ' ')}.` : `Watch how your Python program changes ${contract.label.toLowerCase()}.`} Movement shows the order of recorded events; displayed values come from your code.</p>
      <WorldScene frame={frame} theme={theme} conceptId={conceptId} preferences={preferences} unavailable={!frames.length} />
      <button className="button button-primary simulation-play" type="button" onClick={play} disabled={playing || !frames.length}>{playing ? 'Playing…' : '▶ Play Simulation'}</button>
      {frames.length ? <p className="simulation-story" aria-live={playing ? 'off' : 'polite'}>{frame ? frame.description : 'Press Play to watch this run from the beginning.'}</p>
        : <p className="simulation-note" role="status">This run did not record the {contract.label.toLowerCase()} this scene uses. Check the task, then run your code again. Your Console still shows the actual Python result.</p>}
      {finished && <p className={`simulation-finish${frame?.state.event.error ? ' is-error' : ''}`} role="status"><strong>{frame?.state.event.error ? 'Playback stopped with a Python error.' : trace.truncated ? 'Recorded preview finished.' : 'Simulation complete.'}</strong> {frame?.state.event.error ? 'Check the Console for details.' : trace.truncated ? 'Only the first recorded events are shown; the Console has the run result.' : frame?.state.available ? `${frame.state.label}: ${simulationValueText(frame.state.value)}.` : frame?.reading !== undefined ? `${frame.readingLabel}: ${simulationValueText(frame.reading)}.` : 'Review the Console for the full result.'} Press Play Simulation to watch again.</p>}
      {trace.truncated && !finished && <p className="simulation-note">This preview uses the first recorded events. The Console has the full run result.</p>}
      {trace.outputTruncated && <p className="simulation-note">Program output was limited for this run. See the Console for its captured output.</p>}
    </div>
  </details>
}
