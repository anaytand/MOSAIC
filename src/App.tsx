import { useEffect, useState } from 'react'
import { Brand } from './components/Brand'
import { PreferenceForm } from './components/PreferenceForm'
import { Workspace } from './components/Workspace'
import { lessons } from './lessons'
import { conceptNames, conceptOrder, recentImprovement, statsFor } from './adaptive'
import { loadLessonProgress, loadPreferences, saveLessonProgress, savePreferences } from './preferences'
import type { AppPage, ConceptId, LessonProgress, UserPreferences } from './types'
import './App.css'

const pages: AppPage[] = ['Home', 'Learn', 'My Progress', 'Settings']
const pageIcons: Record<AppPage, string> = { Home: '⌂', Learn: '▤', 'My Progress': '◷', Settings: '⚙' }

function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)
  const [lessonProgress, setLessonProgress] = useState<LessonProgress>(loadLessonProgress)
  const [page, setPage] = useState<AppPage>('Home')
  const [onboarding, setOnboarding] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'standard'
    document.documentElement.dataset.fontSize = preferences.fontSize
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'standard'
    document.documentElement.dataset.theme = preferences.colorTheme
    document.documentElement.dataset.simplified = preferences.simplifiedInterface ? 'true' : 'false'
    savePreferences(preferences)
  }, [preferences])

  useEffect(() => { saveLessonProgress(lessonProgress) }, [lessonProgress])

  const openPage = (next: AppPage) => { setOnboarding(false); setFocusMode(false); setPage(next) }
  const openLesson = (lessonId?: ConceptId) => {
    const next = lessonId ? { ...lessonProgress, currentLessonId: lessonId } : lessonProgress
    if (lessonId) {
      setLessonProgress(next)
      saveLessonProgress(next)
    }
    openPage('Learn')
  }
  const finishOnboarding = () => { setPreferences({ ...preferences, onboardingComplete: true }); setOnboarding(false); setPage('Home') }
  return (
    <div className={`app-shell${focusMode ? ' app-focus-mode' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <Brand />
        <nav aria-label="Main navigation" className="main-nav">
          {pages.map((item) => <button key={item} type="button" className={`nav-link${page === item && !onboarding ? ' active' : ''}`} onClick={() => openPage(item)} aria-current={page === item && !onboarding ? 'page' : undefined}><span aria-hidden="true">{pageIcons[item]}</span>{item}</button>)}
        </nav>
        <button className="avatar-button" type="button" onClick={() => openPage('Settings')} aria-label="Open settings">A</button>
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {onboarding ? <Onboarding preferences={preferences} onChange={setPreferences} onBack={() => setOnboarding(false)} onFinish={finishOnboarding} /> : <>
          {page === 'Home' && <HomePage preferences={preferences} progress={lessonProgress} onSetup={() => setOnboarding(true)} onLearn={() => openLesson()} onSelectLesson={openLesson} onSettings={() => openPage('Settings')} />}
          {page === 'Learn' && <Workspace preferences={preferences} progress={lessonProgress} onProgressChange={setLessonProgress} onPreferencesChange={setPreferences} onFocusModeChange={setFocusMode} />}
          {page === 'My Progress' && <ProgressPage progress={lessonProgress} onLearn={() => openPage('Learn')} />}
          {page === 'Settings' && <SettingsPage preferences={preferences} onChange={setPreferences} onSetup={() => setOnboarding(true)} />}
        </>}
      </main>
      <footer className="site-footer"><Brand compact /><span>Learn at your own pace. Make it yours.</span><span className="footer-note">A gentle place to begin coding</span></footer>
    </div>
  )
}

interface HomePageProps { preferences: UserPreferences; progress: LessonProgress; onSetup: () => void; onLearn: () => void; onSelectLesson: (lessonId: ConceptId) => void; onSettings: () => void }
function HomePage({ preferences, progress, onSetup, onLearn, onSelectLesson, onSettings }: HomePageProps) {
  const ready = preferences.onboardingComplete
  const interestName = preferences.interest === 'custom' ? preferences.customTopic : preferences.interest
  const interestLabel = interestName ? `${interestName[0].toUpperCase()}${interestName.slice(1)}` : 'Choose a topic'
  return <>
    <section className="welcome-hero">
      <div className="hero-copy">
        <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PYTHON LEARNING SPACE</span>
        <h1>Learn Python, <em>your way.</em></h1>
        <p>A welcoming place to build confidence with code. Choose a topic you love, set a comfortable pace, and take one small step at a time.</p>
        <div className="hero-actions"><button className="button button-primary" onClick={ready ? onLearn : onSetup}>{ready ? 'Open your lesson' : 'Personalize your space'} <span aria-hidden="true">→</span></button><span className="no-pressure">No rush. You’re in control.</span></div>
      </div>
      <WorkspacePreview onOpen={() => onSelectLesson(lessons[0].id)} />
    </section>
    <section className="home-content" aria-label="Your learning dashboard">
      <div className="section-heading"><div><span className="eyebrow muted-eyebrow">YOUR DASHBOARD</span><h2>{ready ? `Welcome back${preferences.interest ? `, ${interestLabel.toLowerCase()} learner` : ''}` : 'A good place to begin'}</h2></div>{ready && <button className="text-button" onClick={onSettings}>Edit preferences <span aria-hidden="true">↗</span></button>}</div>
      <div className="dashboard-stats"><article><span className="stat-icon teal-icon" aria-hidden="true">◷</span><div><small>LESSONS COMPLETE</small><strong>{progress.completedLessonIds.length} <span>/ {lessons.length}</span></strong></div></article><article><span className="stat-icon orange-icon" aria-hidden="true">✦</span><div><small>CURRENT LESSON</small><strong>{lessons.find((lesson) => lesson.id === progress.currentLessonId)?.title ?? lessons[0].title}</strong></div></article><article><span className="stat-icon navy-icon" aria-hidden="true">⌁</span><div><small>YOUR TOPIC</small><strong>{interestLabel}</strong></div></article></div>
      <div className="dashboard-grid">
        <article className="lesson-card"><div className="lesson-icon" aria-hidden="true">{progress.completedLessonIds.length ? '↗' : '01'}</div><div className="lesson-info"><span className="card-kicker">{progress.completedLessonIds.length ? `${progress.completedLessonIds.length} LESSON${progress.completedLessonIds.length === 1 ? '' : 'S'} COMPLETE` : 'YOUR FIRST STEP · 5 MIN'}</span><h3>{progress.completedLessonIds.length ? 'Keep your momentum' : 'Meet your first Python line'}</h3><p>{ready ? 'Your code draft saves on this device. Continue the current lesson whenever you are ready.' : 'Set up your space, then take a first look at Python and how code is written.'}</p><button className="button button-dark" onClick={ready ? onLearn : onSetup}>{ready ? 'Continue lesson' : 'Set up your space'} <span aria-hidden="true">→</span></button></div></article>
        <aside className="next-card"><span className="card-kicker">RECOMMENDED NEXT STEP</span><span className="next-step-number">↗</span><h3>{conceptNames[progress.recommendation.conceptId]}</h3><p>{progress.recommendation.reason}</p><button className="button button-soft" onClick={() => onSelectLesson(progress.recommendation.conceptId)}>Open recommendation</button></aside>
      </div>
    </section>
    <Curriculum onSelectLesson={onSelectLesson} />
  </>
}

function WorkspacePreview({ onOpen }: { onOpen: () => void }) {
  return <button className="workspace-preview" type="button" onClick={onOpen} aria-label="Open the Hello, Python lesson workspace">
    <div className="preview-top"><span className="preview-dots"><i /><i /><i /></span><span>LESSON WORKSPACE</span><span className="preview-open">↗</span></div>
    <div className="preview-content"><div className="preview-sidebar"><span>LESSON 01</span><b>● &nbsp;Hello, Python</b><small>○ &nbsp;Variables</small><small>○ &nbsp;Decisions</small></div><div className="preview-editor"><span className="preview-file">main.py <small>PREVIEW</small></span><div><i>1</i><code><b>print</b>(<em>"Hello, world!"</em>)</code></div><div><i>2</i><code /></div><div><i>3</i><code><span># one line at a time</span></code></div></div></div>
    <div className="preview-foot"><span><i /> Editor preview</span><span>Open workspace <b>→</b></span></div>
  </button>
}

function Curriculum({ onSelectLesson }: { onSelectLesson: (lessonId: ConceptId) => void }) {
  return <section className="curriculum-section"><div className="section-heading"><div><span className="eyebrow muted-eyebrow">THE LEARNING PATH</span><h2>A clear path, one idea at a time.</h2></div><span className="curriculum-caption">Beginner Python · {lessons.length} lessons</span></div><ol className="roadmap">{lessons.map((lesson, index) => <li key={lesson.id} className={index === 0 ? 'roadmap-current' : ''}><button type="button" onClick={() => onSelectLesson(lesson.id)} aria-label={`Open lesson ${index + 1}: ${lesson.title}`}><span className="roadmap-marker">{String(index + 1).padStart(2, '0')}</span><span className="roadmap-copy"><strong>{lesson.title}</strong><small>{index === 0 ? 'Start here · 5 min' : 'Open lesson'}</small></span><span className="roadmap-arrow" aria-hidden="true">→</span></button></li>)}</ol></section>
}

interface OnboardingProps { preferences: UserPreferences; onChange: (next: UserPreferences) => void; onBack: () => void; onFinish: () => void }
function Onboarding({ preferences, onChange, onBack, onFinish }: OnboardingProps) {
  return <section className="onboarding-page"><button type="button" className="back-button" onClick={onBack}>← <span>Back</span></button><div className="onboarding-heading"><span className="eyebrow muted-eyebrow">MAKE THIS SPACE YOURS</span><h1>A few choices, all yours.</h1><p>There are no right answers. You can update these anytime in Settings.</p></div><div className="form-panel"><PreferenceForm preferences={preferences} onChange={onChange} /></div><div className="onboarding-actions"><span className="privacy-note">Your preferences stay on this device.</span><button className="button button-primary" onClick={onFinish} disabled={!preferences.interest || (preferences.interest === 'custom' && !preferences.customTopic.trim())}>Save and continue <span aria-hidden="true">→</span></button></div></section>
}

function ProgressPage({ progress, onLearn }: { progress: LessonProgress; onLearn: () => void }) {
  const completed = progress.completedLessonIds.length
  const successes = progress.completedExerciseIds.length
  const improvement = recentImprovement(progress)
  const practicing = conceptOrder.filter((id) => (id === progress.currentLessonId || statsFor(progress, id).attempts > 0) && !progress.completedLessonIds.includes(id))
  return <section className="subpage"><span className="eyebrow muted-eyebrow">MY PROGRESS</span><h1>Your journey, at your pace.</h1><p className="subpage-lede">Mastery is an estimate of your performance on MOSAIC exercises. It is not a measure of intelligence or general coding ability. Time spent does not affect your score.</p>
    <div className="progress-card"><div className="progress-ring" aria-label={`${completed} of ${lessons.length} concepts completed`}><span>{completed}<small> / {lessons.length}</small></span></div><div><span className="card-kicker">YOUR LEARNING RECORD</span><h2>{completed} of {lessons.length} concepts completed</h2><p>{successes} distinct challenge{successes === 1 ? '' : 's'} solved from {progress.attempts.length} submission{progress.attempts.length === 1 ? '' : 's'}.</p><p>{practicing.length ? `Currently practicing: ${practicing.map((id) => conceptNames[id]).join(', ')}.` : 'Choose any concept to begin or review.'}</p><p>{improvement === null ? 'Complete four submissions to see a recent trend.' : `Recent success rate changed by ${improvement >= 0 ? '+' : ''}${improvement} percentage points compared with the previous attempts.`}</p><button className="button button-dark progress-button" onClick={onLearn}>Continue learning <span aria-hidden="true">→</span></button></div></div>
    <section className="learning-map" aria-label="Python concept learning map"><h2>Your Python learning map</h2><ol>{conceptOrder.map((id, index) => { const stats = statsFor(progress, id); return <li key={id}><span className="map-step">{index + 1}</span><div><strong>{conceptNames[id]}</strong><small>{progress.completedLessonIds.includes(id) ? 'Completed' : stats.attempts ? 'In practice' : 'Not started'} · {stats.attempts} attempt{stats.attempts === 1 ? '' : 's'} · {stats.hintsRequested} hint{stats.hintsRequested === 1 ? '' : 's'}</small><div className="mastery-track" role="progressbar" aria-label={`${conceptNames[id]} mastery estimate`} aria-valuenow={stats.mastery} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${stats.mastery}%` }} /></div><small>Mastery estimate: {stats.mastery} / 100</small></div></li> })}</ol></section>
    <aside className="progress-recommendation"><span className="card-kicker">RECOMMENDED NEXT</span><h2>{conceptNames[progress.recommendation.conceptId]} · {progress.recommendation.difficulty}</h2><p>{progress.recommendation.reason}</p></aside>
  </section>
}

interface SettingsPageProps { preferences: UserPreferences; onChange: (next: UserPreferences) => void; onSetup: () => void }
function SettingsPage({ preferences, onChange, onSetup }: SettingsPageProps) {
  return <section className="subpage settings-page"><span className="eyebrow muted-eyebrow">SETTINGS</span><h1>Your space, your way.</h1><p className="subpage-lede">Adjust your learning theme and visual preferences whenever you need.</p><div className="form-panel settings-panel"><PreferenceForm preferences={preferences} onChange={onChange} /></div><div className="settings-save"><span aria-live="polite">Changes save automatically on this device.</span>{!preferences.onboardingComplete && <button className="button button-primary" onClick={onSetup}>Finish setting up <span aria-hidden="true">→</span></button>}</div></section>
}

export default App
