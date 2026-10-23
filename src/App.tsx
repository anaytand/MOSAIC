import { KeyboardProgram } from './components/KeyboardProgram'
import { AuthPage } from './components/AuthPage'
import { ProfileMenu } from './components/ProfileMenu'
import { initialAuthCallback, supabase } from './lib/supabase'
import { useLearningPersistence } from './lib/useLearningPersistence'
import type { Session } from '@supabase/supabase-js'
import { AmbientControls } from './components/AmbientControls'
import { ambientEngine, ambientTrack } from './ambient'
import { applyMotionRates } from './motionPlayback'
import { useEffect, useState } from 'react'
import { sensoryVisualVariables } from './sensoryVisuals'
import { effectiveMotion, motionVariables } from './motion'
import { soundEngine } from './sound'
import { WorldPicker } from './components/reference/WorldPicker'
import { NavigationIcon } from './components/reference/NavigationIcon'
import { Brand } from './components/Brand'
import { HomePage, LearningPath, ProgressPage } from './components/LearningPages'
import { sensoryAttributes } from './sensory'
import { SensoryMatcher } from './components/SensoryMatcher'
import { Onboarding } from './components/Onboarding'
import { SettingsPage } from './components/SettingsPage'
import { Workspace } from './components/Workspace'
import { BreakReminder, ReadingGuide } from './components/ComfortTools'
import { getLearningTheme } from './themes/catalog'
import { setDifficultyOverride } from './adaptive'
import { defaultPreferences } from './preferences'
import { initialRoute, parseRoute, routeHash } from './navigation'
import type { AppRoute, AuthPage as AuthMode } from './navigation'
import type { AppPage, ConceptId, Difficulty } from './types'
import './App.css'
import './styles/journey.css'
import './styles/reference-landing.css'
import './styles/reference.css'
import './styles/sensory.css'
import './styles/motion.css'
import './styles/phase6.css'
import './styles/auth.css'

const pages: AppPage[] = ['Home', 'Learn', 'Progress', 'Settings']
function App() {
  const [authSession, setAuthSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const { preferences: storedPreferences, setPreferences, lessonProgress, setLessonProgress, dataReady, activeUserId, status: syncStatus,
    message: syncMessage, canImport, conflict, retry, useCloud, useDevice, importGuest } = useLearningPersistence(supabase, authSession, authReady)
  const preferences = dataReady ? storedPreferences : defaultPreferences
  const [callbackStatus, setCallbackStatus] = useState<'idle' | 'pending' | 'success' | 'error'>(() => {
    return initialAuthCallback ? initialAuthCallback.hadCode ? 'pending' : 'error' : 'idle'
  })
  const [pendingEmail, setPendingEmail] = useState('')
  const [sensoryReturn, setSensoryReturn] = useState<AppRoute>({ page: 'Settings', workspace: false, setup: false })
  const [route, setRoute] = useState<AppRoute>(() => initialRoute(window.location.hash, window.location.search ?? ''))
  useEffect(() => {
    const client = supabase
    if (!client) return
    let active = true
    const callback = initialAuthCallback?.kind
    const hadCode = initialAuthCallback?.hadCode
    const settleCallback = (kind: 'confirm' | 'reset') => {
      const next = parseRoute(kind === 'confirm' ? '#auth/confirmed' : '#auth/reset')
      const url = new URL(window.location.href)
      url.searchParams.delete('mosaic_auth')
      url.searchParams.delete('code')
      url.hash = routeHash(next)
      window.history.replaceState(null, '', url)
      setRoute(next)
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return
      setAuthSession(session)
      setAuthReady(true)
      if (event === 'PASSWORD_RECOVERY') {
        setCallbackStatus('success')
        settleCallback('reset')
      } else if (event === 'SIGNED_IN' && callback === 'confirm' && hadCode && new URLSearchParams(window.location.search).get('mosaic_auth') === 'confirm') {
        setCallbackStatus('success')
        settleCallback('confirm')
      }
    })
    if ((callback === 'confirm' || callback === 'reset') && hadCode) {
      void client.auth.initialize().then(async ({ error }) => {
        if (!active) return
        if (error) { setCallbackStatus('error'); setAuthReady(true); settleCallback(callback); return }
        const result = await client.auth.getSession()
        if (!active) return
        if (result.error || !result.data.session) { setCallbackStatus('error'); settleCallback(callback) }
        else { setAuthSession(result.data.session); setAuthReady(true); setCallbackStatus('success'); settleCallback(callback) }
      }).catch(() => { if (active) { setCallbackStatus('error'); setAuthReady(true); settleCallback(callback) } })
    }
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    const root = document.documentElement
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applySensory = () => {
      for (const [key, value] of Object.entries(sensoryAttributes(preferences, motionQuery.matches))) root.dataset[key] = value
      for (const [key, value] of Object.entries(motionVariables(preferences, motionQuery.matches))) root.style.setProperty(key, value)
      applyMotionRates(root, effectiveMotion(preferences, motionQuery.matches))
    }
    applySensory()
    const motionFrame = requestAnimationFrame(() => applyMotionRates(root, effectiveMotion(preferences, motionQuery.matches)))
    motionQuery.addEventListener('change', applySensory)
    for (const [key, value] of Object.entries(sensoryVisualVariables(preferences))) root.style.setProperty(key, value)
root.style.setProperty('--warm-tint', String((preferences.warmTint ?? 0) / 100))
    root.dataset.adventure = getLearningTheme(preferences)?.id ?? 'custom'
    soundEngine.configure(preferences)
    ambientEngine.configure(preferences, ambientTrack(preferences))
    return () => { cancelAnimationFrame(motionFrame); motionQuery.removeEventListener('change', applySensory) }
  }, [preferences])
  useEffect(() => () => { soundEngine.dispose(); ambientEngine.dispose() }, [])
  useEffect(() => {
    const onHashChange = () => { setRoute(initialRoute(window.location.hash, window.location.search ?? '')); requestAnimationFrame(() => document.getElementById('main-content')?.focus()) }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onHashChange)
    return () => { window.removeEventListener('hashchange', onHashChange); window.removeEventListener('popstate', onHashChange) }
  }, [])
  const navigate = (next: AppRoute) => {
    setRoute(next)
    const url = new URL(window.location.href)
    const callback = url.searchParams.has('mosaic_auth') || url.searchParams.has('code')
    if (callback) { url.searchParams.delete('mosaic_auth'); url.searchParams.delete('code'); url.hash = routeHash(next); window.history.pushState(null, '', url) }
    else if (window.location.hash !== routeHash(next)) window.history.pushState(null, '', routeHash(next))
    requestAnimationFrame(() => document.getElementById('main-content')?.focus())
  }
  const openPage = (page: AppPage) => navigate({ page, workspace: false, setup: false })
  const openAuth = (auth: AuthMode) => navigate({ page: 'Home', workspace: false, setup: false, auth })
  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setAuthSession(null)
    openPage('Home')
  }
  const openLesson = (id = lessonProgress.currentLessonId) => {
    const next = { ...lessonProgress, currentLessonId: id }
    setLessonProgress(next)
    navigate({ page: 'Learn', workspace: true, setup: false })
  }
  const startSetup = () => { try { sessionStorage.removeItem('mosaic-setup-step') } catch { /* Setup remains usable without session storage. */ } navigate({ page: 'Home', workspace: false, setup: true }) }
  const openSensory = () => { try { sessionStorage.removeItem('mosaic-sensory-step') } catch { /* Optional navigation memory. */ } setSensoryReturn(route); navigate({ page: 'Settings', workspace: false, setup: false, sensory: true }) }
  const finishSetup = () => {
    setPreferences({ ...preferences, onboardingComplete: true })
    try { sessionStorage.removeItem('mosaic-setup-step') } catch { /* Preferences are saved separately. */ }
    openLesson()
  }
  const changeDifficulty = (difficulty: Difficulty | null) => setLessonProgress((progress) => setDifficultyOverride(progress, difficulty))
  const inWorkspace = route.page === 'Learn' && route.workspace && !route.setup
  const isHome = route.page === 'Home' && !route.setup && !route.sensory && !route.auth
  const showHomeHero = isHome && dataReady && !conflict
  const syncNotice = <div className={`sync-banner sync-${syncStatus}`} role={syncStatus === 'failed' || syncStatus === 'conflict' ? 'alert' : 'status'} aria-live="polite"><span>{syncStatus === 'guest' ? 'Guest · Saved on this device' : syncStatus === 'loading' ? 'Loading cloud progress…' : syncStatus === 'ready' ? 'Cloud ready · Nothing saved yet' : syncStatus === 'saving' ? 'Saving to cloud…' : syncStatus === 'saved' ? 'Saved to cloud' : syncStatus === 'conflict' ? 'Sync needs your choice' : 'Sync Failed'}</span>{syncMessage && <span>{syncMessage}</span>}{(syncStatus === 'failed' || syncStatus === 'conflict' && !conflict) && <button type="button" className="text-button" onClick={retry}>{syncStatus === 'conflict' ? 'Review copies' : 'Retry sync'}</button>}</div>
  const guestImportNotice = canImport && <section className="guest-import-banner" aria-label="Guest progress available"><div><strong>Bring your guest progress into this account?</strong><p>Your cloud progress stays intact. Conflicting drafts are kept as separate copies.</p></div><button type="button" className="button button-secondary" onClick={importGuest}>Import guest progress</button></section>
  return <div className={`app-shell${showHomeHero ? ' reference-landing-shell' : ''}${inWorkspace && preferences.focusMode ? ' app-focus-mode' : ''}`} onClickCapture={(event) => { const target = event.target; if (target instanceof Element && target.closest('button') && !target.closest('[data-sound-control]')) void soundEngine.interaction() }}>
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to content</a>
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="main-nav" aria-label="Main navigation">{pages.map((page) => <button className={`nav-link${route.page === page && !route.setup && !route.sensory && !route.auth ? ' active' : ''}`} key={page} type="button" aria-current={route.page === page && !route.setup && !route.sensory && !route.auth ? 'page' : undefined} onClick={() => openPage(page)}><NavigationIcon page={page} />{page}</button>)}</nav><button type="button" className="preferences-shortcut" onClick={() => openPage('Settings')} aria-label="Open accessibility and learning preferences"><span aria-hidden="true">Aa</span><span>Preferences</span></button><ProfileMenu key={routeHash(route)} session={authSession} authReady={authReady} onNavigate={openAuth} onSignOut={signOut} /></div>{showHomeHero && <div className="home-toolbar">{syncNotice}{guestImportNotice}<AmbientControls preferences={preferences} onChange={setPreferences} /></div>}</header>
    {!showHomeHero && syncNotice}
    {dataReady && !showHomeHero && <AmbientControls preferences={preferences} onChange={setPreferences} />}
    <main id="main-content" tabIndex={-1} className={inWorkspace ? 'main-content workspace-main' : 'main-content'}>
      {conflict ? <section className="sync-decision page" aria-labelledby="sync-decision-title"><h1 id="sync-decision-title">Choose which saved work to open</h1><p>This account has a cloud copy and unsynced work from this device. We have not replaced either copy.</p><div className="sync-decision-actions"><button type="button" className="button button-primary" onClick={useCloud}>Open cloud copy</button><button type="button" className="button button-secondary" onClick={useDevice}>Use this device’s copy and replace cloud fields</button></div><p>Choosing the device copy can replace newer cloud edits. The cloud copy will stay unchanged until its save succeeds.</p></section> : route.auth ? <AuthPage key={route.auth} mode={route.auth} preferences={preferences} session={authSession} authReady={authReady} callbackStatus={callbackStatus} pendingEmail={pendingEmail} onPendingEmail={setPendingEmail} onNavigate={openAuth} onGuest={() => openPage('Home')} canImport={canImport && dataReady} onImport={importGuest} syncStatus={syncStatus} /> : !dataReady ? <section className="sync-decision page" role="status"><h1>{syncStatus === 'failed' ? 'Cloud progress could not load' : 'Opening your learning space…'}</h1><p>{syncMessage || 'Checking your saved lessons and preferences.'}</p>{syncStatus === 'failed' && <button type="button" className="button button-primary" onClick={retry}>Try again</button>}</section> : route.sensory ? <SensoryMatcher preferences={preferences} onChange={setPreferences} onFinish={() => navigate(sensoryReturn)} onExit={() => navigate(sensoryReturn)} /> : route.setup ? <Onboarding preferences={preferences} progress={lessonProgress} onChange={setPreferences} onDifficulty={changeDifficulty} onFinish={finishSetup} onBack={() => openPage('Home')} /> : <>
        {!showHomeHero && guestImportNotice}
        {route.page === 'Home' && <HomePage preferences={preferences} progress={lessonProgress} onSelectLesson={openLesson} onStart={() => preferences.onboardingComplete ? openLesson() : startSetup()} onPath={() => openPage('Learn')} onSetup={startSetup} onPreferencesChange={setPreferences} onSensory={openSensory} />}
        {route.page === 'Learn' && (route.workspace ? <Workspace key={activeUserId ?? 'guest'} preferences={preferences} progress={lessonProgress} onProgressChange={setLessonProgress} onPreferencesChange={setPreferences} onBackToPath={() => openPage('Learn')} onOpenSettings={openSensory} /> : <LearningPath preferences={preferences} progress={lessonProgress} onSelectLesson={(id: ConceptId) => openLesson(id)} />)}
        {route.page === 'Progress' && <ProgressPage preferences={preferences} progress={lessonProgress} onSelectLesson={openLesson} />}
        {route.page === 'Keyboard Program' && <KeyboardProgram />}
        {route.page === 'Settings' && <SettingsPage preferences={preferences} progress={lessonProgress} onChange={setPreferences} onDifficulty={changeDifficulty} onSetup={startSetup} onSensory={openSensory} onLesson={() => openLesson()} />}
      </>}
    </main>{dataReady && !route.setup && !route.sensory && !route.auth && !inWorkspace && (route.page === 'Home' || route.page === 'Learn') && <WorldPicker preferences={preferences} onChange={setPreferences} />}{dataReady && <><ReadingGuide enabled={preferences.readingGuide === true} /><BreakReminder minutes={preferences.breakReminderMinutes ?? 0} /></>}<footer className="site-footer"><Brand compact /><a href="#keyboards">Accessible Keyboard Program</a><span>A little progress, at your pace.</span><span>Python fundamentals · Made for your way of learning</span></footer>
  </div>
}
export default App
