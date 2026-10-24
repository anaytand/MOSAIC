import { ambientEngine } from '../ambient'
import { CompanionPanel } from './CompanionPanel'
import { CompanionArt } from './CompanionArt'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLearningLesson, lessons } from '../lessons'
import { addTime, categorizeError, conceptNames, recordAttempt, recordHint, setDifficultyOverride, suggestedDifficulty } from '../adaptive'
import type { ConceptId, Difficulty, LessonProgress, PythonLesson, UserPreferences } from '../types'
import { MonacoEditor } from './MonacoEditor'
import { ConfirmDialog } from './ConfirmDialog'
import { ExecutionFeedback } from './ExecutionFeedback'
import { editorTextSize } from '../sensory'
import { soundEngine, executionSound } from '../sound'
import { getLearningTheme } from '../themes/catalog'
import { parseProjectSnapshot } from '../themes/projects'
import { lessonDraft, previousDrafts } from '../themes/drafts'
import { ProjectPreview } from './ProjectPreview'
import { guidanceLabels, interestLabel } from '../presentation'
import type { ExecutionTrace } from '../executionTrace'
import { WorldSimulation } from './WorldSimulation'

type RuntimeState = 'loading' | 'ready' | 'running' | 'failed' | 'stopped' | 'timed-out'
type WorkspaceTab = 'instructions' | 'editor' | 'output'
interface WorkerReply { type: 'ready' | 'initialization-error' | 'result' | 'failure'; id?: number; result?: string; message?: string }
interface RunResult { output: string; error: string; passed: boolean; feedback: string; project?: unknown; trace?: ExecutionTrace }
interface WorkspaceProps {
  preferences: UserPreferences
  progress: LessonProgress
  onProgressChange: (progress: LessonProgress) => void
  onPreferencesChange: (preferences: UserPreferences) => void
  onBackToPath: () => void
  onOpenSettings: () => void
}

const executionLimitMs = 8000
const nowMs = () => Date.now()
const defaultResult: RunResult = { output: '', error: '', passed: false, feedback: '' }

function humanError(error: string): string {
  if (error.includes('time limit')) return 'This run reached the execution safety limit. Python is restarting. The lesson itself has no time limit; check that any loop can finish before trying again.'
  if (error.includes('Execution stopped')) return 'You stopped this run. Python is restarting so you can edit and try again.'
  if (error.includes('EOFError')) return 'The input queue ran out of lines. Add one line per input() call in Program input, then run again.'
  if (error.includes('IndentationError')) return 'The spaces at the start of a line do not match the block around it. Check the lines inside your loop, function, or condition.'
  if (error.includes('SyntaxError')) return 'Python found a line it could not understand. Check spelling, punctuation, quotes, and parentheses.'
  if (error.includes('NameError')) return 'Python could not find a name in your code. Check that the name is spelled the same way each time.'
  if (error.includes('ImportError') || error.includes('__import__') || error.includes("NoneType' object is not callable")) return 'This learning workspace keeps imports and browser or system access turned off. Try the Python tools covered in this lesson.'
  if (error.includes('TypeError')) return 'Python received a kind of value it could not use for that operation. Check the values and how they are combined.'
  return 'Python stopped because it found an error. Read the detail below and compare the line with the lesson instructions.'
}

export function Workspace({ preferences, progress, onProgressChange, onPreferencesChange, onBackToPath, onOpenSettings }: WorkspaceProps) {
  const initialLesson = getLearningLesson(progress.currentLessonId, progress.difficultyOverride ?? suggestedDifficulty(progress, progress.currentLessonId), preferences)
  const [activeLessonId, setActiveLessonId] = useState(initialLesson.id)
  const [inputDraft, setInputDraft] = useState(progress.inputDrafts[initialLesson.exerciseId] ?? initialLesson.defaultInputs?.join('\n') ?? '')
  const [draft, setDraft] = useState(lessonDraft(progress, initialLesson))
  const [runtimeState, setRuntimeState] = useState<RuntimeState>('loading')
  useEffect(() => { if (runtimeState !== 'running') ambientEngine.setExecuting(false) }, [runtimeState])
  useEffect(() => () => ambientEngine.setExecuting(false), [])
  const [editorError, setEditorError] = useState<string | null>(null)
  const [output, setOutput] = useState<RunResult>(defaultResult)
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
  const [traceRunKey, setTraceRunKey] = useState(0)
  const [hasRun, setHasRun] = useState(false)
  const [runWasAlreadyComplete, setRunWasAlreadyComplete] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [saveNotice, setSaveNotice] = useState('')
  const [mobileTab, setMobileTab] = useState<WorkspaceTab>(progress.attempts.length ? 'editor' : 'instructions')
  const [editorRetry, setEditorRetry] = useState(0)
  const [editorReset, setEditorReset] = useState(0)
  const focusMode = preferences.focusMode
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false)
  const [consoleCollapsed, setConsoleCollapsed] = useState(true)
  const [hintsExpanded, setHintsExpanded] = useState(false)
  const [restoreKey, setRestoreKey] = useState('')
  const [pendingRestore, setPendingRestore] = useState<string | null>(null)
  const [resetPending, setResetPending] = useState(false)
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(() => progress.difficultyOverride ?? suggestedDifficulty(progress, initialLesson.id))
  const workerRef = useRef<Worker | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)
  const requestIdRef = useRef(0)
  const activeRequestRef = useRef(0)
  const activeExerciseForRunRef = useRef({ conceptId: initialLesson.id, exerciseId: initialLesson.exerciseId, difficulty: initialLesson.difficulty, hintsUsed: 0, themeId: initialLesson.themeId })
  const lessonStartedAtRef = useRef(0)
  const hintsForNextRunRef = useRef(0)
  const progressRef = useRef(progress)
  const changeProgressRef = useRef(onProgressChange)
  const conceptId = activeLessonId as ConceptId
  const difficulty = activeDifficulty
  const currentLesson = useMemo(() => getLearningLesson(conceptId, difficulty, { interest: preferences.interest, customTopic: preferences.customTopic }), [conceptId, difficulty, preferences.interest, preferences.customTopic])
  const theme = getLearningTheme(preferences)
  const archivedDrafts = previousDrafts(progress, currentLesson)
  const currentFontSize = editorTextSize(preferences)
  useEffect(() => { progressRef.current = progress }, [progress])
  useEffect(() => { changeProgressRef.current = onProgressChange }, [onProgressChange])
  useEffect(() => {
    const nextDraft = lessonDraft(progressRef.current, currentLesson)
    setDraft(nextDraft)
    setInputDraft(progressRef.current.inputDrafts[currentLesson.exerciseId] ?? currentLesson.defaultInputs?.join('\n') ?? '')
    setEditorReset((value) => value + 1)
    setOutput(defaultResult)
    setHighlightedLine(null)
    setHasRun(false)
    setRestoreKey('')
    setHintsExpanded(false)
    const savedHintLevel = Math.min(3, progressRef.current.hints.filter((hint) => hint.exerciseId === currentLesson.exerciseId).length)
    setHintLevel(savedHintLevel)
    hintsForNextRunRef.current = savedHintLevel
  }, [currentLesson])

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
      if (message.type === 'initialization-error') { setConsoleCollapsed(false); setMobileTab('output'); setRuntimeState('failed'); setOutput({ ...defaultResult, error: message.message ?? 'Python could not start.' }); return }
      if (message.id !== activeRequestRef.current) return
      activeRequestRef.current = 0
      window.clearTimeout(timeoutRef.current)
      setConsoleCollapsed(false)
      setMobileTab('output')
      if (window.matchMedia('(max-width: 1000px)').matches || document.documentElement.dataset.simplified === 'true' || document.documentElement.dataset.focus === 'true') requestAnimationFrame(() => document.getElementById('workspace-tab-output')?.focus())
      if (message.type === 'failure') {
        setRuntimeState('failed')
        setHasRun(true)
        setOutput({ ...defaultResult, error: message.message ?? 'Python could not run this code.' })
        return
      }
      try {
        const result = JSON.parse(message.result ?? '{}') as RunResult
        setOutput(result)
        setTraceRunKey(message.id ?? 0)
        setHasRun(true)
        setRuntimeState('ready')
        const run = activeExerciseForRunRef.current
        const effect = executionSound(result.error, result.passed, progressRef.current.completedExerciseIds.includes(run.exerciseId))
        if (effect) soundEngine.play(effect)
        let next = recordAttempt(progressRef.current, { id: `${nowMs()}-${message.id}`, conceptId: run.conceptId, exerciseId: run.exerciseId, difficulty: run.difficulty, passed: result.passed && !result.error, errorCategory: categorizeError(result.error, result.passed), hintsUsed: run.hintsUsed, at: nowMs() })
        const snapshot = result.passed && !result.error && run.themeId ? parseProjectSnapshot(result.project, run.themeId) : null
        if (snapshot) next = { ...next, projectSnapshots: { ...next.projectSnapshots, [snapshot.themeId]: snapshot } }
        progressRef.current = next
        changeProgressRef.current(next)
      } catch {
        setRuntimeState('failed')
        setHasRun(true)
        setOutput({ ...defaultResult, error: 'The Python worker returned a response that could not be read.' })
      }
    }
    worker.onerror = (event) => {
      event.preventDefault()
      setRuntimeState('failed')
      setConsoleCollapsed(false)
      setMobileTab('output')
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

  const invalidateRun = () => {
    if (runtimeState === 'running') restartWorker('stopped')
    setOutput(defaultResult)
    setHighlightedLine(null)
    setHasRun(false)
  }

  const updateDraft = (code: string) => {
    if (code !== draft) invalidateRun()
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
    setActiveLessonId(lesson.id)
    setActiveDifficulty(next.difficultyOverride ?? suggestedDifficulty(next, lesson.id))
    setOutput(defaultResult)
    setHighlightedLine(null)
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
    setSaveNotice('Save requested. Check the sync status above for confirmation.')
  }

  const resetCode = () => {
    updateDraft(currentLesson.starterCode)
    setEditorReset((value) => value + 1)
    setOutput(defaultResult)
    setHighlightedLine(null)
    setHasRun(false)
    setSaveNotice('Starter code restored.')
  }

  const runCode = () => {
    if (runtimeState !== 'ready' || !workerRef.current) return
    ambientEngine.setExecuting(true)
    void soundEngine.unlock()
    const id = ++requestIdRef.current
    activeRequestRef.current = id
    activeExerciseForRunRef.current = { conceptId, exerciseId: currentLesson.exerciseId, difficulty, hintsUsed: hintsForNextRunRef.current, themeId: currentLesson.themeId }
    setRunWasAlreadyComplete(progressRef.current.completedExerciseIds.includes(currentLesson.exerciseId))
    setRuntimeState('running')
    setConsoleCollapsed(false)
    setOutput(defaultResult)
    setHighlightedLine(null)
    setHasRun(false)
    workerRef.current.postMessage({ type: 'run', id, code: draft, checkSource: currentLesson.checkSource, inputLines: inputDraft ? inputDraft.split('\n') : [] })
    timeoutRef.current = window.setTimeout(() => {
      if (activeRequestRef.current !== id) return
      setRuntimeState('timed-out')
      activeRequestRef.current = 0
      const error = `This run reached the ${executionLimitMs / 1000}-second time limit. Python has been stopped and is restarting safely.`
      setOutput({ ...defaultResult, error })
      setConsoleCollapsed(false)
      setMobileTab('output')
      if (window.matchMedia('(max-width: 1000px)').matches || document.documentElement.dataset.simplified === 'true' || document.documentElement.dataset.focus === 'true') requestAnimationFrame(() => document.getElementById('workspace-tab-output')?.focus())
      const run = activeExerciseForRunRef.current
      const next = recordAttempt(progressRef.current, { id: `${nowMs()}-${id}`, conceptId: run.conceptId, exerciseId: run.exerciseId, difficulty: run.difficulty, passed: false, errorCategory: 'timeout', hintsUsed: run.hintsUsed, at: nowMs() })
      progressRef.current = next
      changeProgressRef.current(next)
      restartWorker('timed-out')
    }, executionLimitMs)
  }

  const stopCode = () => {
    setOutput({ ...defaultResult, error: 'Execution stopped. The Python worker is restarting.' })
    restartWorker('stopped')
  }

  const toggleFocusMode = () => {
    const next = !focusMode
    onPreferencesChange({ ...preferences, focusMode: next })
    if (next) setMobileTab('editor')
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
    setActiveDifficulty(next.difficultyOverride ?? suggestedDifficulty(next, conceptId))
    progressRef.current = next
    onProgressChange(next)
  }
  const requestHint = () => {
    setHintsExpanded(true)
    if (hintLevel >= 3) return
    const level = (hintLevel + 1) as 1 | 2 | 3
    const next = recordHint(progressRef.current, { conceptId, exerciseId: currentLesson.exerciseId, level, at: nowMs() })
    progressRef.current = next
    onProgressChange(next)
    hintsForNextRunRef.current = Math.min(3, hintsForNextRunRef.current + 1)
    setHintLevel(level)
  }

  const continueToRecommendation = () => {
    const recommendation = progressRef.current.recommendation
    const nextLesson = getLearningLesson(recommendation.conceptId, recommendation.difficulty, preferences)
    selectLesson(nextLesson)
  }

  const reviewTask = () => {
    setInstructionsCollapsed(false)
    setMobileTab('instructions')
    requestAnimationFrame(() => document.getElementById('current-task')?.focus())
  }
  const openHints = () => {
    requestHint()
    setConsoleCollapsed(false)
    setMobileTab('output')
    if (window.matchMedia('(max-width: 1000px)').matches || preferences.simplifiedInterface || preferences.visualDensity === 'minimal' || focusMode) requestAnimationFrame(() => document.getElementById('workspace-tab-output')?.focus())
  }
  return <section className={`workspace-page${focusMode ? ' focus-mode' : ''}${instructionsCollapsed ? ' instructions-collapsed' : ''}${consoleCollapsed ? ' console-collapsed' : ''}`} aria-label="Python lesson workspace" onKeyDownCapture={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !resetPending) { event.preventDefault(); runCode() } }}>
    <header className="workspace-heading"><div><button className="text-button workspace-back" type="button" onClick={onBackToPath}>← Learning path</button><div className="workspace-title"><span className="eyebrow">{theme?.name ?? 'PYTHON FUNDAMENTALS'}</span><h1>{currentLesson.title}</h1></div></div><div className="workspace-heading-actions"><label className="lesson-switch"><span className="sr-only">Choose a lesson</span><select value={activeLessonId} disabled={runtimeState === 'running'} onChange={(event) => { const lesson = lessons.find((item) => item.id === event.target.value); if (lesson) selectLesson(lesson) }}>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{theme?.chapters[lesson.id].title ?? conceptNames[lesson.id]}</option>)}</select></label><button className="button button-secondary focus-toggle" type="button" onClick={toggleFocusMode} aria-pressed={focusMode}>{focusMode ? 'Exit focus mode' : 'Focus mode'}</button><button className="icon-button" type="button" onClick={onOpenSettings} aria-label="Open Sensory Profile Matcher" title="Sensory preferences">Aa</button></div></header>
    <div className="workspace-context"><span>{interestLabel(preferences)} examples</span><span>{progress.completedLessonIds.length} / {lessons.length} concepts complete</span><label className="simplified-switch"><input type="checkbox" checked={preferences.simplifiedInterface || preferences.visualDensity === 'minimal'} onChange={(event) => onPreferencesChange({ ...preferences, simplifiedInterface: event.target.checked, visualDensity: !event.target.checked && preferences.visualDensity === 'minimal' ? 'balanced' : preferences.visualDensity })} /> Simplified View</label></div>
    <div className="panel-controls" aria-label="Workspace panel visibility"><button type="button" className="text-button" aria-expanded={!instructionsCollapsed} aria-controls="workspace-panel-instructions" onClick={() => setInstructionsCollapsed(!instructionsCollapsed)}>{instructionsCollapsed ? 'Show lesson' : 'Collapse lesson'}</button><button type="button" className="text-button" aria-expanded={!consoleCollapsed} aria-controls="workspace-panel-output" onClick={() => setConsoleCollapsed(!consoleCollapsed)}>{consoleCollapsed ? 'Show console & help' : 'Collapse console & help'}</button></div>
    <div className="workspace-tabs" role="tablist" aria-label="Learning workspace panels" onKeyDown={(event) => selectMobileTab(event, mobileTab)}>{(['instructions', 'editor', 'output'] as const).map((tab) => <button key={tab} id={`workspace-tab-${tab}`} role="tab" type="button" aria-selected={mobileTab === tab} aria-controls={`workspace-panel-${tab}`} tabIndex={mobileTab === tab ? 0 : -1} onClick={() => setMobileTab(tab)}>{tab === 'instructions' ? 'Lesson' : tab === 'editor' ? 'Code' : 'Output & help'}</button>)}</div>
    <div className="workspace-layout" aria-busy={runtimeState === 'running'}>
      <aside className="workspace-sidebar" id="workspace-panel-instructions" role="tabpanel" aria-labelledby="workspace-tab-instructions" data-mobile-active={mobileTab === 'instructions'}>
        <div className="lesson-intro-mark"><CompanionArt preferences={preferences} key={currentLesson.exerciseId} state="welcoming" /><span className="panel-title">YOUR LESSON</span></div><label className="difficulty-control">Guidance<select value={progress.difficultyOverride ?? 'recommended'} disabled={runtimeState === 'running'} onChange={(event) => changeDifficulty(event.target.value)}><option value="recommended">Adaptive · {guidanceLabels[suggestedDifficulty(progress, conceptId)]}</option><option value="guided">Step by Step</option><option value="independent">Balanced</option><option value="challenge">Explore</option></select></label><span className="status-tag">Current: {guidanceLabels[difficulty]}</span>
        <article className="instruction-card">
          <span className="eyebrow">THE GOAL</span>
          <h2>{currentLesson.objective}</h2>
          {currentLesson.narrative && <p className="lesson-narrative">{currentLesson.narrative}</p>}
          <div className="challenge-card"><h3 id="current-task" tabIndex={-1}>Your task</h3><p>{currentLesson.challenge}</p><pre aria-label={currentLesson.id === 'user-input' ? 'Example output for suggested inputs' : 'Expected program output'}>{currentLesson.expectedBehavior}</pre><small>{currentLesson.validationMode === 'required-line' ? 'Include each complete line. Extra output lines are welcome.' : currentLesson.validationMode === 'exact-output' ? 'Match the requested output, including its order.' : 'Your code is checked against the task’s behavior.'}</small></div>
          {!theme && currentLesson.themeId && <p className="support-note">These extended missions use the Ocean research project. Your custom topic and earlier drafts are preserved.</p>}
          <CompanionPanel key={currentLesson.exerciseId} lesson={currentLesson} progress={progress} preferences={preferences} running={runtimeState === 'running'} result={hasRun || output.error ? output : undefined} errorExplanation={output.error ? humanError(output.error) : undefined} onPreferencesChange={onPreferencesChange} onHint={openHints} onStart={reviewTask} onContinue={continueToRecommendation} />
          <button className="button button-secondary mobile-code-action" type="button" onClick={() => { setMobileTab('editor'); document.getElementById('workspace-tab-editor')?.focus() }}>Open code editor →</button>
        </article>
      </aside>
      <section className="editor-panel" id="workspace-panel-editor" role="tabpanel" aria-labelledby="workspace-tab-editor" data-mobile-active={mobileTab === 'editor'}>
        <div className="editor-toolbar"><div className="file-tab"><span aria-hidden="true">▤</span> main.py <small>PYTHON</small></div><button className="button button-run button-primary" type="button" aria-keyshortcuts="Control+Enter Meta+Enter" title="Run Python (Ctrl+Enter or Command+Enter)" onClick={runCode} disabled={runtimeState !== 'ready'}>{runtimeState === 'running' ? 'Running…' : '▶ Run Code'}</button></div>
        <div className="editor-helpbar"><span className={`runtime-pill runtime-${runtimeState}`}>{runtimeState === 'loading' ? 'Starting Python…' : runtimeState === 'ready' ? '● Python ready' : runtimeState === 'running' ? 'Python is running…' : runtimeState === 'timed-out' ? 'Time limit reached' : runtimeState === 'stopped' ? 'Run stopped' : 'Python needs attention'}</span><details className="editor-options"><summary>Editor options</summary><div><div className="font-controls" role="group" aria-label="Editor text size"><button type="button" onClick={() => changeEditorFont(-1)} aria-label="Decrease editor text size" disabled={currentFontSize <= 12}>A−</button><span>{currentFontSize}px</span><button type="button" onClick={() => changeEditorFont(1)} aria-label="Increase editor text size" disabled={currentFontSize >= 28}>A+</button></div><button className="text-button" type="button" onClick={() => setResetPending(true)} disabled={runtimeState === 'running'}>Reset code…</button>{runtimeState === 'failed' && <button className="button button-secondary" type="button" onClick={() => restartWorker('loading')}>Restart Python</button>}</div></details></div>
        <p className="editor-keyboard-note" id="editor-keyboard-help">Run: Ctrl / ⌘ + Enter. Tab indents; use Ctrl+M (Mac: Ctrl+Shift+M) to let Tab move focus.</p>
        <div className="code-editor"><MonacoEditor key={`${activeLessonId}-${editorReset}`} initialValue={draft} theme={preferences.colorTheme} highContrast={preferences.highContrast} fontSize={currentFontSize} highlightLine={highlightedLine} onChange={updateDraft} onError={setEditorError} retryKey={editorRetry} />{editorError && <div className="editor-load-error" role="alert"><p>{editorError}</p><button type="button" className="button button-primary" onClick={() => setEditorRetry((value) => value + 1)}>Retry editor loading</button></div>}</div>
        {archivedDrafts.length > 0 && <details className="archived-drafts"><summary>Other saved drafts for this concept ({archivedDrafts.length})</summary><p>Your earlier code is kept separately. Load a copy only if you want to use it in this new task.</p><label className="field-label">Saved draft<select value={restoreKey} onChange={(event) => setRestoreKey(event.target.value)}><option value="">Choose a saved draft</option>{archivedDrafts.map(([key]) => <option key={key} value={key}>{key}</option>)}</select></label><button className="button button-secondary" type="button" disabled={!restoreKey || runtimeState === 'running'} onClick={() => setPendingRestore(restoreKey)}>Load a copy…</button></details>}
        <details className="program-input" open={currentLesson.id === 'user-input' ? true : undefined}><summary>Program input · queued lines</summary><label className="field-label">One line per input() call<textarea maxLength={8000} rows={3} value={inputDraft} onChange={(event) => { const value = event.target.value; if (value !== inputDraft) invalidateRun(); setInputDraft(value); const next = { ...progressRef.current, inputDrafts: { ...progressRef.current.inputDrafts, [currentLesson.exerciseId]: value } }; progressRef.current = next; onProgressChange(next) }} /></label><small>Real input() reads these lines in order. No blocking prompt. Maximum 50 lines of 1,000 characters.</small>{currentLesson.defaultInputs && <button className="text-button" type="button" onClick={() => { const value = currentLesson.defaultInputs!.join('\n'); if (value !== inputDraft) invalidateRun(); setInputDraft(value); const next = { ...progressRef.current, inputDrafts: { ...progressRef.current.inputDrafts, [currentLesson.exerciseId]: value } }; progressRef.current = next; onProgressChange(next) }}>Restore suggested inputs</button>}</details><div className="editor-status"><span role="status" aria-live="polite">{saveNotice || 'Draft changes save automatically. See the sync status above.'}</span><button className="text-button" type="button" onClick={saveProgress}>Save Progress</button></div>{runtimeState === 'running' && <div className="running-notice" role="status">Python runs in a separate worker.<button type="button" className="text-button" onClick={stopCode}>Stop and restart Python</button></div>}
      </section>
      <aside className="workspace-help" id="workspace-panel-output" role="tabpanel" aria-labelledby="workspace-tab-output" data-mobile-active={mobileTab === 'output'}>
        <section className="console-section"><div className="console-heading"><h2>Console</h2><span className="status-tag">{runtimeState === 'running' ? 'Running' : hasRun && !output.error ? 'Run finished' : 'Output'}</span></div><div aria-live="polite" aria-atomic="true">{!hasRun && !output.error && <p className="console-empty">{runtimeState === 'running' ? 'Running your Python code…' : 'Run your code to see what happens here.'}</p>}{output.output && <pre className="console-output" aria-label="Actual Python program output">{output.output}</pre>}{output.error && <div className="python-error" role="alert"><h3>Python stopped with an error</h3><p>{humanError(output.error)}</p><details><summary>Show Python error details</summary><pre>{output.error}</pre></details><button className="text-button" type="button" onClick={reviewTask}>Review Task</button></div>}{hasRun && !output.error && <ExecutionFeedback preferences={preferences} theme={theme} lesson={currentLesson} passed={output.passed} feedback={output.feedback} alreadyCompleted={runWasAlreadyComplete} progress={progress} onContinue={continueToRecommendation} onReviewTask={reviewTask} onHint={requestHint} />}</div></section>
        {output.trace && <WorldSimulation key={`${traceRunKey}-${currentLesson.exerciseId}`} trace={output.trace} conceptId={currentLesson.id} theme={theme} preferences={preferences} onHighlightLine={setHighlightedLine} />}
        {theme && <details className="project-details" open={output.passed && currentLesson.id === 'variables'}><summary>View your Python project</summary><ProjectPreview theme={theme} snapshot={progress.projectSnapshots[theme.id]} /></details>}<section className="help-section"><div className="hint-guide"><CompanionArt preferences={preferences} key={`${currentLesson.exerciseId}-hint-${hintLevel}`} state={hintsExpanded ? 'explaining' : 'idle'} /><h2>A little help, when you want it.</h2></div><p>Three authored hints, from a nudge to a worked example.</p><button className="button button-secondary" type="button" onClick={() => { if (hintLevel === 0) requestHint(); else setHintsExpanded(!hintsExpanded) }} aria-expanded={hintsExpanded}>{hintLevel === 0 ? 'Get a Hint' : hintsExpanded ? 'Hide hints' : 'Show saved hints'}</button>{hintsExpanded && <div className="hint-card">{currentLesson.hints.slice(0, hintLevel).map((hint, index) => <article key={index}><strong>Hint {index + 1} · {index === 0 ? 'The idea' : index === 1 ? 'A direction' : 'An example'}</strong><p>{hint}</p></article>)}{hintLevel < 3 && <button className="text-button" type="button" onClick={requestHint}>Show hint {hintLevel + 1} →</button>}</div>}</section><button className="text-button output-return" type="button" onClick={() => { setMobileTab('editor'); document.getElementById('workspace-tab-editor')?.focus() }}>← Back to code</button>
      </aside>
    </div><ConfirmDialog open={resetPending || pendingRestore !== null} title={pendingRestore ? 'Load a copy of this saved draft?' : undefined} description={pendingRestore ? 'This replaces the current exercise draft. The original saved draft stays available. The copied code may need changes for this task.' : undefined} confirmLabel={pendingRestore ? 'Load a copy' : undefined} onCancel={() => { setResetPending(false); setPendingRestore(null) }} onConfirm={() => { if (pendingRestore) { updateDraft(progressRef.current.drafts[pendingRestore]); setEditorReset((value) => value + 1); setSaveNotice('A copy is saved in this exercise. The original draft is preserved.') } else resetCode(); setResetPending(false); setPendingRestore(null) }} />
  </section>
}
