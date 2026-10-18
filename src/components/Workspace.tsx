import { useCallback, useEffect, useRef, useState } from 'react'
import { getLesson, lessons } from '../lessons'
import { addTime, categorizeError, conceptNames, recordAttempt, recordHint, setDifficultyOverride, statsFor, suggestedDifficulty } from '../adaptive'
import { saveLessonProgress } from '../preferences'
import type { ConceptId, Difficulty, LessonProgress, PythonLesson, UserPreferences } from '../types'
import { MonacoEditor } from './MonacoEditor'

type RuntimeState = 'loading' | 'ready' | 'running' | 'failed' | 'stopped' | 'timed-out'
type WorkspaceTab = 'instructions' | 'editor' | 'output'
interface WorkerReply { type: 'ready' | 'initialization-error' | 'result' | 'failure'; id?: number; result?: string; message?: string }
interface RunResult { output: string; error: string; passed: boolean; feedback: string }
interface WorkspaceProps {
  preferences: UserPreferences
  progress: LessonProgress
  onProgressChange: (progress: LessonProgress) => void
  onPreferencesChange: (preferences: UserPreferences) => void
  onFocusModeChange: (enabled: boolean) => void
}

const executionLimitMs = 8000
const nowMs = () => Date.now()
const defaultResult: RunResult = { output: '', error: '', passed: false, feedback: '' }

function humanError(error: string): string {
  if (error.includes('IndentationError')) return 'The spaces at the start of a line do not match the block around it. Check the lines inside your loop, function, or condition.'
  if (error.includes('SyntaxError')) return 'Python found a line it could not understand. Check spelling, punctuation, quotes, and parentheses.'
  if (error.includes('NameError')) return 'Python could not find a name in your code. Check that the name is spelled the same way each time.'
  if (error.includes('ImportError') || error.includes('__import__') || error.includes("NoneType' object is not callable")) return 'This learning workspace keeps imports and browser or system access turned off. Try the Python tools covered in this lesson.'
  if (error.includes('TypeError')) return 'Python received a kind of value it could not use for that operation. Check the values and how they are combined.'
  return 'Python stopped because it found an error. Read the detail below and compare the line with the lesson instructions.'
}

export function Workspace({ preferences, progress, onProgressChange, onPreferencesChange, onFocusModeChange }: WorkspaceProps) {
  const initialLesson = lessons.find((lesson) => lesson.id === progress.currentLessonId) ?? lessons[0]
  const [activeLessonId, setActiveLessonId] = useState(initialLesson.id)
  const [draft, setDraft] = useState(progress.drafts[initialLesson.id] ?? initialLesson.starterCode)
  const [runtimeState, setRuntimeState] = useState<RuntimeState>('loading')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [output, setOutput] = useState<RunResult>(defaultResult)
  const [hasRun, setHasRun] = useState(false)
  const [runWasAlreadyComplete, setRunWasAlreadyComplete] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [saveNotice, setSaveNotice] = useState('')
  const [mobileTab, setMobileTab] = useState<WorkspaceTab>('editor')
  const [editorRetry, setEditorRetry] = useState(0)
  const [editorReset, setEditorReset] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)
  const requestIdRef = useRef(0)
  const activeRequestRef = useRef(0)
  const activeExerciseForRunRef = useRef({ conceptId: initialLesson.id, exerciseId: initialLesson.exerciseId, difficulty: initialLesson.difficulty, hintsUsed: 0 })
  const lessonStartedAtRef = useRef(0)
  const hintsForNextRunRef = useRef(0)
  const progressRef = useRef(progress)
  const changeProgressRef = useRef(onProgressChange)
  const conceptId = activeLessonId as ConceptId
  const difficulty = progress.difficultyOverride ?? suggestedDifficulty(progress, conceptId)
  const currentLesson = getLesson(conceptId, difficulty, preferences.interest ?? 'ocean', preferences.customTopic)
  const currentFontSize = preferences.editorFontSize ?? (preferences.fontSize === 'extra-large' ? 20 : preferences.fontSize === 'large' ? 18 : 16)
  useEffect(() => { progressRef.current = progress }, [progress])
  useEffect(() => { changeProgressRef.current = onProgressChange }, [onProgressChange])
  useEffect(() => {
    const nextDraft = progressRef.current.drafts[currentLesson.exerciseId] ?? progressRef.current.drafts[currentLesson.id] ?? currentLesson.starterCode
    setDraft(nextDraft)
    setEditorReset((value) => value + 1)
    setOutput(defaultResult)
    setHasRun(false)
    const savedHintLevel = Math.min(3, progressRef.current.hints.filter((hint) => hint.exerciseId === currentLesson.exerciseId).length)
    setHintLevel(savedHintLevel)
    hintsForNextRunRef.current = savedHintLevel
  }, [currentLesson.exerciseId, currentLesson.id, currentLesson.starterCode])

  useEffect(() => {
    lessonStartedAtRef.current = nowMs()
    const flushTime = () => {
      const now = nowMs()
      const elapsed = now - lessonStartedAtRef.current
      lessonStartedAtRef.current = now
      if (elapsed <= 0) return
      const next = addTime(progressRef.current, progressRef.current.currentLessonId, elapsed)
      progressRef.current = next
      changeProgressRef.current(next)
      saveLessonProgress(next)
    }
    const onVisibility = () => { if (document.hidden) flushTime(); else lessonStartedAtRef.current = nowMs() }
    document.addEventListener('visibilitychange', onVisibility)
    const onUnload = () => { if (!document.hidden) flushTime() }
    window.addEventListener('beforeunload', onUnload)
    const timer = window.setInterval(() => { if (!document.hidden) flushTime() }, 30_000)
    return () => { if (!document.hidden) flushTime(); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('beforeunload', onUnload) }
  }, [])

  const startWorker = useCallback(() => {
    const worker = new Worker(new URL('../workers/python.worker.ts', import.meta.url), { type: 'module', name: 'mosaic-python-runner' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const message = event.data
      if (message.type === 'ready') { setRuntimeState('ready'); return }
      if (message.type === 'initialization-error') { setRuntimeState('failed'); setOutput({ ...defaultResult, error: message.message ?? 'Python could not start.' }); return }
      if (message.id !== activeRequestRef.current) return
      activeRequestRef.current = 0
      window.clearTimeout(timeoutRef.current)
      setMobileTab('output')
      if (window.matchMedia('(max-width: 1000px)').matches) requestAnimationFrame(() => document.getElementById('workspace-tab-output')?.focus())
      if (message.type === 'failure') {
        setRuntimeState('failed')
        setHasRun(true)
        setOutput({ ...defaultResult, error: message.message ?? 'Python could not run this code.' })
        return
      }
      try {
        const result = JSON.parse(message.result ?? '{}') as RunResult
        setOutput(result)
        setHasRun(true)
        setRuntimeState('ready')
        const run = activeExerciseForRunRef.current
        const next = recordAttempt(progressRef.current, { id: `${nowMs()}-${message.id}`, conceptId: run.conceptId, exerciseId: run.exerciseId, difficulty: run.difficulty, passed: result.passed && !result.error, errorCategory: categorizeError(result.error, result.passed), hintsUsed: run.hintsUsed, at: nowMs() })
        progressRef.current = next
        changeProgressRef.current(next)
        saveLessonProgress(next)
      } catch {
        setRuntimeState('failed')
        setHasRun(true)
        setOutput({ ...defaultResult, error: 'The Python worker returned a response that could not be read.' })
      }
    }
    worker.onerror = (event) => {
      event.preventDefault()
      setRuntimeState('failed')
      setOutput({ ...defaultResult, error: 'The Python worker stopped unexpectedly. Restart it to continue.' })
    }
  }, [])

  useEffect(() => {
    startWorker()
    return () => {
      window.clearTimeout(timeoutRef.current)
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [startWorker])

  const restartWorker = useCallback((state: RuntimeState) => {
    window.clearTimeout(timeoutRef.current)
    workerRef.current?.terminate()
    workerRef.current = null
    activeRequestRef.current = 0
    setRuntimeState(state)
    startWorker()
  }, [startWorker])

  const updateDraft = (code: string) => {
    const next = { ...progressRef.current, drafts: { ...progressRef.current.drafts, [currentLesson.exerciseId]: code }, currentLessonId: conceptId }
    progressRef.current = next
    setDraft(code)
    onProgressChange(next)
    setSaveNotice('')
  }

  const selectLesson = (lesson: PythonLesson) => {
    if (runtimeState === 'running') return
    const next = addTime({ ...progressRef.current, currentLessonId: lesson.id }, conceptId, nowMs() - lessonStartedAtRef.current)
    lessonStartedAtRef.current = nowMs()
    progressRef.current = next
    onProgressChange(next)
    saveLessonProgress(next)
    setActiveLessonId(lesson.id)
    setOutput(defaultResult)
    setHasRun(false)
    setHintLevel(0)
    setMobileTab('instructions')
    setSaveNotice('')
  }

  const saveProgress = () => {
    const next = addTime({ ...progressRef.current, currentLessonId: conceptId, drafts: { ...progressRef.current.drafts, [currentLesson.exerciseId]: draft } }, conceptId, nowMs() - lessonStartedAtRef.current)
    lessonStartedAtRef.current = nowMs()
    progressRef.current = next
    onProgressChange(next)
    saveLessonProgress(next)
    setSaveNotice('Your code and lesson place are saved on this device.')
  }

  const resetCode = () => {
    updateDraft(currentLesson.starterCode)
    setEditorReset((value) => value + 1)
    setOutput(defaultResult)
    setHasRun(false)
    setSaveNotice('Starter code restored.')
  }

  const runCode = () => {
    if (runtimeState !== 'ready' || !workerRef.current) return
    const id = ++requestIdRef.current
    activeRequestRef.current = id
    activeExerciseForRunRef.current = { conceptId, exerciseId: currentLesson.exerciseId, difficulty, hintsUsed: hintsForNextRunRef.current }
    setRunWasAlreadyComplete(progressRef.current.completedExerciseIds.includes(currentLesson.exerciseId))
    setRuntimeState('running')
    setOutput(defaultResult)
    setHasRun(false)
    workerRef.current.postMessage({ type: 'run', id, code: draft, checkSource: currentLesson.checkSource })
    timeoutRef.current = window.setTimeout(() => {
      if (activeRequestRef.current !== id) return
      setRuntimeState('timed-out')
      activeRequestRef.current = 0
      const error = `This run reached the ${executionLimitMs / 1000}-second time limit. Python has been stopped and is restarting safely.`
      setOutput({ ...defaultResult, error })
      setMobileTab('output')
      if (window.matchMedia('(max-width: 1000px)').matches) requestAnimationFrame(() => document.getElementById('workspace-tab-output')?.focus())
      const run = activeExerciseForRunRef.current
      const next = recordAttempt(progressRef.current, { id: `${nowMs()}-${id}`, conceptId: run.conceptId, exerciseId: run.exerciseId, difficulty: run.difficulty, passed: false, errorCategory: 'timeout', hintsUsed: run.hintsUsed, at: nowMs() })
      progressRef.current = next
      changeProgressRef.current(next)
      saveLessonProgress(next)
      restartWorker('timed-out')
    }, executionLimitMs)
  }

  const stopCode = () => {
    setOutput({ ...defaultResult, error: 'Execution stopped. The Python worker is restarting.' })
    restartWorker('stopped')
  }

  const toggleFocusMode = () => {
    const next = !focusMode
    setFocusMode(next)
    if (next) setMobileTab('editor')
    onFocusModeChange(next)
  }

  const changeEditorFont = (change: number) => {
    onPreferencesChange({ ...preferences, editorFontSize: Math.max(12, Math.min(28, currentFontSize + change)) })
  }

  const selectMobileTab = (event: React.KeyboardEvent<HTMLDivElement>, selected: WorkspaceTab) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const order: WorkspaceTab[] = ['instructions', 'editor', 'output']
    const currentIndex = order.indexOf(selected)
    const nextTab = order[(currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length]
    setMobileTab(nextTab)
    document.getElementById(`workspace-tab-${nextTab}`)?.focus()
  }

  const changeDifficulty = (value: string) => {
    const next = setDifficultyOverride(progressRef.current, value === 'recommended' ? null : value as Difficulty)
    progressRef.current = next
    onProgressChange(next)
    saveLessonProgress(next)
  }
  const requestHint = () => {
    if (hintLevel >= 3) return
    const level = (hintLevel + 1) as 1 | 2 | 3
    const next = recordHint(progressRef.current, { conceptId, exerciseId: currentLesson.exerciseId, level, at: nowMs() })
    progressRef.current = next
    onProgressChange(next)
    saveLessonProgress(next)
    hintsForNextRunRef.current = Math.min(3, hintsForNextRunRef.current + 1)
    setHintLevel(level)
  }

  const continueToRecommendation = () => {
    const recommendation = progressRef.current.recommendation
    const nextLesson = getLesson(recommendation.conceptId, recommendation.difficulty, preferences.interest ?? 'ocean', preferences.customTopic)
    selectLesson(nextLesson)
  }

  return <section className={`workspace-page${focusMode ? ' focus-mode' : ''}`} aria-label="Python lesson workspace">
    <div className="workspace-heading"><div><span className="eyebrow muted-eyebrow">LEARN / LESSON {String(lessons.indexOf(currentLesson) + 1).padStart(2, '0')}</span><h1>{currentLesson.title}</h1></div><div className="workspace-heading-actions"><span className="lesson-duration">{runtimeState === 'running' ? 'Running Python…' : runtimeState === 'loading' ? 'Starting Python…' : `${difficulty[0].toUpperCase()}${difficulty.slice(1)} level`}</span><button className="button button-soft focus-toggle" type="button" onClick={toggleFocusMode}>{focusMode ? 'Exit focus mode' : 'Focus mode'}</button></div></div>
    <div className="workspace-tabs" role="tablist" aria-label="Learning workspace panels" onKeyDown={(event) => selectMobileTab(event, mobileTab)}>{(['instructions', 'editor', 'output'] as const).map((tab) => <button key={tab} id={`workspace-tab-${tab}`} role="tab" type="button" aria-selected={mobileTab === tab} aria-controls={`workspace-panel-${tab}`} tabIndex={mobileTab === tab ? 0 : -1} onClick={() => setMobileTab(tab)}>{tab === 'instructions' ? 'Lesson' : tab === 'editor' ? 'Editor' : 'Output & help'}</button>)}</div>
    <div className="workspace-layout" aria-busy={runtimeState === 'running'}>
      <aside className="workspace-sidebar" id="workspace-panel-instructions" role="tabpanel" aria-labelledby="workspace-tab-instructions" data-mobile-active={mobileTab === 'instructions'} aria-label="Lesson instructions">
        <div className="panel-title">LESSON PATH <span>{progress.completedLessonIds.length} / {lessons.length} complete</span></div><label className="difficulty-control">Challenge level<select value={progress.difficultyOverride ?? 'recommended'} onChange={(event) => changeDifficulty(event.target.value)}><option value="recommended">Recommended ({suggestedDifficulty(progress, conceptId)})</option><option value="guided">Guided</option><option value="independent">Independent</option><option value="challenge">Challenge</option></select></label><p className="recommendation-note">Suggested next: {conceptNames[progress.recommendation.conceptId]}. {progress.recommendation.reason}</p>
        <ol className="lesson-list">{lessons.map((lesson, index) => <li key={lesson.id} className={`${lesson.id === activeLessonId ? 'current' : ''}${progress.completedLessonIds.includes(lesson.id) ? ' completed' : ''}`}><button type="button" onClick={() => selectLesson(lesson)} disabled={runtimeState === 'running'} aria-current={lesson.id === activeLessonId ? 'step' : undefined}><span className="lesson-step-dot">{progress.completedLessonIds.includes(lesson.id) ? '✓' : index + 1}</span><span><strong>{lesson.title}</strong><small>{progress.completedLessonIds.includes(lesson.id) ? 'Completed' : lesson.id === activeLessonId ? 'Current lesson' : 'Ready when you are'}</small></span></button></li>)}</ol>
        <article className="instruction-card"><span className="panel-title">LEARNING OBJECTIVE</span><h2>{currentLesson.objective}</h2><p>{currentLesson.concept}</p><h3>Try these steps</h3><ol className="instruction-steps">{currentLesson.instructions.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><p>{instruction}</p></li>)}</ol><div className="sample-code"><span>EXAMPLE</span><pre>{currentLesson.sample}</pre></div><div className="challenge-card"><span>YOUR CHALLENGE</span><p>{currentLesson.challenge}</p><small>Expected behavior: {currentLesson.expectedBehavior.replaceAll('\n', ' · ')}</small></div></article>
      </aside>
      <section className="editor-panel" id="workspace-panel-editor" role="tabpanel" aria-labelledby="workspace-tab-editor" data-mobile-active={mobileTab === 'editor'} aria-label="Python editor">
        <div className="editor-toolbar"><div className="file-tab"><span aria-hidden="true">▤</span> main.py <small>PYTHON</small></div><div className="editor-toolbar-actions"><div className="font-controls" role="group" aria-label="Editor text size"><button type="button" onClick={() => changeEditorFont(-1)} aria-label="Decrease editor text size" disabled={currentFontSize <= 12}>A−</button><button type="button" onClick={() => changeEditorFont(1)} aria-label="Increase editor text size" disabled={currentFontSize >= 28}>A+</button></div>{runtimeState === 'failed' && <button className="button button-reset" type="button" onClick={() => restartWorker('loading')}>Restart Python</button>}<button className="button button-run" type="button" onClick={runCode} disabled={runtimeState !== 'ready'}>{runtimeState === 'running' ? 'Running…' : '▶ Run Code'}</button><button className="button button-reset" type="button" onClick={resetCode} disabled={runtimeState === 'running'}>Reset Code</button><button className="button button-save" type="button" onClick={saveProgress}>Save Progress</button></div></div>
        <div className="editor-helpbar"><span>{currentLesson.objective}</span><span className={`runtime-pill runtime-${runtimeState}`}><i />{runtimeState === 'loading' ? 'Loading Python' : runtimeState === 'ready' ? 'Python ready' : runtimeState === 'running' ? 'Code is running' : runtimeState === 'timed-out' ? 'Time limit reached' : runtimeState === 'stopped' ? 'Execution stopped' : 'Python needs attention'}</span></div>
        {runtimeState === 'running' && <div className="run-progress"><span /></div>}
        <div className="code-editor"><MonacoEditor key={`${activeLessonId}-${editorReset}`} initialValue={draft} theme={preferences.colorTheme} highContrast={preferences.highContrast} fontSize={currentFontSize} onChange={updateDraft} onError={setEditorError} retryKey={editorRetry} />{editorError && <div className="editor-load-error" role="alert"><p>{editorError}</p><button type="button" className="button button-primary" onClick={() => setEditorRetry((value) => value + 1)}>Retry editor loading</button></div>}</div>
        <div className="editor-status"><span><i /> {draft.length.toLocaleString()} characters</span>{runtimeState === 'running' ? <button type="button" className="stop-run-button" onClick={stopCode}>Stop and restart Python</button> : <span>Draft auto-saves on this device</span>}</div>
        {saveNotice && <p className="save-confirmation" role="status">{saveNotice}</p>}
      </section>
      <aside className="workspace-help" id="workspace-panel-output" role="tabpanel" aria-labelledby="workspace-tab-output" data-mobile-active={mobileTab === 'output'} aria-label="Python output and help">
        <section className="help-section console-section" aria-live="polite" aria-atomic="true"><div className="console-heading"><span className="panel-title">PYTHON CONSOLE</span>{runtimeState === 'running' && <button type="button" className="stop-run-button" onClick={stopCode}>Stop</button>}</div>
          {!hasRun && <div className="console-empty"><span aria-hidden="true">⌁</span><p>Your program’s output will appear here after you run it.</p></div>}
          {runtimeState === 'running' && <p className="console-status" role="status">Python is running in a separate worker…</p>}
          {output.output && <pre className="console-output" aria-label="Program output">{output.output}</pre>}
          {output.error && <div className="python-error" role="alert"><strong>Python error</strong><p>{humanError(output.error)}</p><pre>{output.error}</pre></div>}
          {hasRun && !output.error && <div className={`check-feedback${output.passed ? ' check-passed' : ''}`} role="status" aria-live="polite"><strong>{output.passed ? '✓ Lesson Complete' : 'Keep going'}</strong>{output.passed ? <><p>{runWasAlreadyComplete ? `You have already completed ${currentLesson.title}. Running it again will not add another mastery success.` : `Great work! You completed ${currentLesson.title}.`}</p><p className="completion-progress">Progress: {progress.completedLessonIds.length} of {lessons.length} concepts complete · {statsFor(progress, conceptId).mastery} / 100 mastery estimate</p><div className="completion-next"><span>Next recommended lesson</span><strong>{conceptNames[progress.recommendation.conceptId]}</strong><p>{progress.recommendation.reason}</p><button className="button button-dark" type="button" onClick={continueToRecommendation}>{progress.completedLessonIds.length === lessons.length ? 'Choose a Lesson to Review' : 'Continue to Next Lesson'} <span aria-hidden="true">→</span></button></div></> : <p>{output.feedback}</p>}</div>}
        </section>
        <section className="help-section help-actions"><div className="console-heading"><span className="panel-title">SUPPORT</span><span className="authored-tag">LESSON GUIDE</span></div><p>Hints are written for this lesson and available whenever they help.</p><button className="button button-hint" type="button" onClick={requestHint} disabled={hintLevel >= 3}>{hintLevel === 0 ? 'Get Hint' : hintLevel < 3 ? 'Get next hint' : 'All hints shown'}</button>{hintLevel > 0 && <div className="hint-card" role="status">{currentLesson.hints.slice(0, hintLevel).map((hint, index) => <p key={index}><strong>Hint {index + 1}:</strong> {hint}</p>)}</div>}</section>
        <section className="help-section learner-settings"><span className="panel-title">YOUR SETTINGS</span><div className="setting-chip"><span>Level</span><strong>{difficulty}</strong></div><div className="setting-chip"><span>Topic</span><strong>{preferences.interest === 'custom' ? preferences.customTopic || 'Your topic' : preferences.interest ?? 'Not chosen'}</strong></div><div className="setting-chip"><span>Text size</span><strong>{preferences.fontSize === 'extra-large' ? 'Extra large' : preferences.fontSize === 'large' ? 'Large' : 'Standard'}</strong></div><div className="setting-chip"><span>Editor text</span><strong>{currentFontSize}px</strong></div><div className="setting-chip"><span>Theme</span><strong>{preferences.colorTheme === 'dark' ? 'Dark' : 'Light'}</strong></div><div className="setting-chip"><span>Contrast</span><strong>{preferences.highContrast ? 'Higher' : 'Standard'}</strong></div><div className="setting-chip"><span>Motion</span><strong>{preferences.reducedMotion ? 'Reduced' : 'Standard'}</strong></div><div className="setting-chip"><span>Workspace</span><strong>{preferences.simplifiedInterface ? 'Simplified' : 'Standard'}</strong></div></section>
      </aside>
    </div>
  </section>
}
