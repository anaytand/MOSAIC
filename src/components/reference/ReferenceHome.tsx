import type { CSSProperties } from 'react'
import { sensoryVisualVariables } from '../../sensoryVisuals'
import type { ConceptId, LessonProgress, UserPreferences } from '../../types'
import { getLearningLesson } from '../../lessons'
import { conceptOrder, suggestedDifficulty } from '../../adaptive'
import { getLearningTheme } from '../../themes/catalog'
import { lessonDraft } from '../../themes/drafts'
import { THEMES, selectedWorld } from '../../design/worlds'
import { ArrowUpRight } from './Icons'
import SvgDefs from './SvgDefs'
import { CompanionArt } from '../CompanionArt'
import { MotionRegion } from '../MotionRegion'
import { StageRoadmap } from './StageRoadmap'
import { SensoryCards } from './SensoryCards'
import { InterestPreview } from './InterestPreview'
import Fits from './Fits'
import { BackScene, Floaters, TrainTrack } from './Scenes'

export interface ReferenceHomeProps {
  preferences: UserPreferences
  progress: LessonProgress
  onSelectLesson: (id: ConceptId) => void
  onStart: () => void
  onPath: () => void
  onSetup: () => void
  onPreferencesChange?: (preferences: UserPreferences) => void
  onSensory?: () => void
}
export function ReferenceHome({ preferences, progress, onSelectLesson, onStart, onSetup, onPath, onPreferencesChange, onSensory }: ReferenceHomeProps) {
  const world = selectedWorld(preferences)
  const visual = THEMES[world]
  const theme = getLearningTheme(preferences)
  const returning = progress.attempts.length > 0 || progress.completedLessonIds.length > 0
  const active = getLearningLesson(progress.currentLessonId, progress.difficultyOverride ?? suggestedDifficulty(progress, progress.currentLessonId), preferences)
  return <div className="lp-page reference-home" style={sensoryVisualVariables(preferences) as CSSProperties}>
    <SvgDefs />
    <MotionRegion as="section" aria-label="Welcome" className="lp-hero">
      <div aria-hidden="true" className="lp-wordmark">{['outline', 'solid', 'outline'].map((row, index) => <div key={index} className={`lp-wordmark__row lp-wordmark__row--${row}`}><span>{visual.wordmark}</span><span>{visual.wordmark}</span></div>)}</div>
      <BackScene theme={world} /><Floaters theme={world} />
      <div className="lp-robot-wrap"><CompanionArt preferences={preferences} label="The MOSAIC robot guide, waving" floating state="welcoming" /><div className="lp-robot-shadow" /></div>
      <svg aria-hidden="true" className="lp-hills" viewBox="0 0 1440 300" preserveAspectRatio="none"><path d="M0 150 Q240 40 520 120 Q760 190 1000 90 Q1240 10 1440 110 L1440 300 L0 300 Z" fill="url(#mz-hill1)" /><path d="M0 210 Q300 110 640 190 Q900 250 1160 160 Q1320 110 1440 170 L1440 300 L0 300 Z" fill="url(#mz-hill2)" /><path d="M0 260 Q420 190 820 250 Q1140 290 1440 230 L1440 300 L0 300 Z" fill="url(#mz-hill3)" /></svg>
      {world === 'trains' && <TrainTrack />}
      <div className="lp-hero-card"><div className="lp-world-badge"><span className="lp-swatch" />{visual.world}</div><h1 className="lp-h1"><span className="lp-d lp-d--76 lp-d--bold">Code that fits</span><span className="lp-d lp-d--76 lp-d--light">how you think.</span></h1><p className="lp-hero-lead">Learn real Python through what you love, with flexible guidance and a workspace that fits your senses. Built with neurodivergent learners in mind. Open to everyone.</p><div className="lp-actions"><button type="button" className="lp-btn" onClick={onStart}>{returning ? 'Continue coding' : 'Start Coding'}<span className="lp-btn__arrow"><ArrowUpRight /></span></button><button type="button" className="lp-btn-ghost" onClick={onSensory ?? onSetup}>Set up my sensory profile</button></div></div>
      <div className="lp-mini"><div className="lp-mini__top"><span>{theme?.projectName ?? 'Your Python project'}</span><span className="lp-mini__time">{returning ? 'Saved lesson' : 'First mission'}</span></div><div className="lp-mini__code"><code>{lessonDraft(progress, active).split('\n').filter(Boolean).slice(0, 2).join('\n')}</code></div><div className="lp-mini__note">{returning ? `${progress.completedLessonIds.length} of ${conceptOrder.length} concepts completed` : 'Your interests. Your pace. Real code.'}</div><button className="text-button" type="button" onClick={() => onSelectLesson(active.id)}>Open workspace ↗</button></div>
    </MotionRegion>
    <section aria-hidden="true" className="lp-ticker"><div className="lp-ticker__row">Sensory-adaptive <span>■</span> Interest-driven <span>■</span> No judgment <span>■</span> Focus-friendly <span>■</span> Your pace <span>■</span></div></section>
    {returning && <section className="reference-resume lp-container"><div><span className="eyebrow">Welcome back.</span><h2>{active.title}</h2><p>{progress.completedLessonIds.length} of {conceptOrder.length} Python concepts completed. Your code is ready when you are.</p><button className="button button-primary" type="button" onClick={() => onSelectLesson(active.id)}>Continue Learning →</button></div><pre aria-label="Your saved Python draft"><code>{lessonDraft(progress, active)}</code></pre></section>}
    {onPreferencesChange && <SensoryCards preferences={preferences} progress={progress} onChange={onPreferencesChange} onSensory={onSensory ?? onSetup} onResume={() => onSelectLesson(active.id)} />}
    <InterestPreview preferences={preferences} progress={progress} lesson={active} onChange={onPreferencesChange} onOpen={() => onSelectLesson(active.id)} />
    <StageRoadmap onPython={onPath} />
    <Fits />
    <MotionRegion as="section" className="lp-final"><div className="lp-final__card"><h2><span className="lp-d lp-d--84 lp-d--bold">Ready when</span><span className="lp-d lp-d--84 lp-d--light">you are.</span></h2><button className="lp-btn lp-btn--lg" type="button" onClick={onStart}>{returning ? 'Continue your project' : 'Start your first project'}<span className="lp-btn__arrow"><ArrowUpRight /></span></button><div className="lp-final__robot"><CompanionArt preferences={preferences} label="The MOSAIC robot guide, ready to help" floating state="welcoming" /></div><svg aria-hidden="true" className="lp-final__hills" viewBox="0 0 1440 160" preserveAspectRatio="none"><path d="M0 80 Q360 10 720 70 Q1080 130 1440 50 L1440 160 L0 160 Z" fill="url(#mz-hill2)" /><path d="M0 120 Q480 70 900 120 Q1200 150 1440 110 L1440 160 L0 160 Z" fill="url(#mz-hill3)" /></svg></div></MotionRegion>
  </div>
}
