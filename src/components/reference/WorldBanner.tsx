import { CompanionArt } from '../CompanionArt'
import { getLearningTheme } from '../../themes/catalog'
import { selectedWorld, THEMES } from '../../design/worlds'
import type { UserPreferences } from '../../types'
import { BackScene, Floaters, TrainTrack } from './Scenes'
export function WorldBanner({ preferences }: { preferences: UserPreferences }) {
  const world = selectedWorld(preferences)
  const theme = getLearningTheme(preferences)
  return <section className="world-banner" aria-label={`${theme?.name ?? 'Your MOSAIC world'} introduction`}>
    <div aria-hidden="true" className="world-banner-wordmark">{THEMES[world].wordmark}</div><BackScene theme={world} /><Floaters theme={world} />{world === 'trains' && <TrainTrack />}
    <div className="world-banner-copy"><span className="world-badge">YOUR PYTHON JOURNEY</span><h2>{theme?.name ?? 'Your world. Your code.'}</h2><p>{theme?.description ?? 'Practice real Python through your own interests.'}</p></div><CompanionArt preferences={preferences} className="world-banner-robot" />
  </section>
}
