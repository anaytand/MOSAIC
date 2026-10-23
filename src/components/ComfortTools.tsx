import { useEffect, useState } from 'react'

/** A soft band that follows the pointer, to help keep your place while reading. */
export function ReadingGuide({ enabled }: { enabled: boolean }) {
  const [y, setY] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) return
    const move = (event: PointerEvent) => { if (event.pointerType !== 'touch') setY(event.clientY) }
    const leave = () => setY(null)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [enabled])
  if (!enabled || y === null) return null
  return <div className="reading-guide" aria-hidden="true" style={{ top: `${y}px` }} />
}

const BREAK_SECONDS = 120

/** Optional, gentle break reminders. Only time with the page visible is counted. */
export function BreakReminder({ minutes }: { minutes: number }) {
  const [elapsed, setElapsed] = useState(0)
  const [onBreak, setOnBreak] = useState(false)
  const [breakLeft, setBreakLeft] = useState(BREAK_SECONDS)
  useEffect(() => {
    if (!minutes) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((value) => value + 15)
    }, 15000)
    return () => window.clearInterval(timer)
  }, [minutes])
  useEffect(() => {
    if (!onBreak) return
    const timer = window.setInterval(() => setBreakLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [onBreak])
  if (!minutes) return null
  const reset = () => { setElapsed(0); setOnBreak(false); setBreakLeft(BREAK_SECONDS) }
  if (onBreak) {
    const time = `${Math.floor(breakLeft / 60)}:${String(breakLeft % 60).padStart(2, '0')}`
    return <div className="break-overlay" role="dialog" aria-modal="true" aria-labelledby="break-title">
      <div className="break-card">
        <span className="eyebrow">BREAK</span>
        <h2 id="break-title">{breakLeft > 0 ? `Break time left: ${time}` : 'Your break is finished.'}</h2>
        <div className="break-breath" aria-hidden="true" />
        <p>Look away from the screen. Breathe in while the square grows. Breathe out while it shrinks.</p>
        <p>Your work is saved. Nothing changes while you are away.</p>
        <button type="button" className="button button-primary" onClick={reset}>I am back</button>
      </div>
    </div>
  }
  if (elapsed < minutes * 60) return null
  return <aside className="break-reminder" role="status" aria-live="polite">
    <p><strong>You have been working for {minutes} minutes.</strong> A short break can help you focus. Your work is saved.</p>
    <div className="break-actions">
      <button type="button" className="button button-primary" onClick={() => setOnBreak(true)}>Take a 2-minute break</button>
      <button type="button" className="button button-secondary" onClick={reset}>Keep working</button>
    </div>
  </aside>
}
