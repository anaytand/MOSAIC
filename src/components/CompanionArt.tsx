import { RobotMascot } from './RobotMascot'
import { mascotVariants } from './mascotVariants'
import { companionId, companions } from '../companions/catalog'
import type { CompanionState } from '../companions/catalog'
import type { UserPreferences } from '../types'
interface Props { preferences: Pick<UserPreferences, 'interest' | 'customTopic'>; className?: string; state?: CompanionState; floating?: boolean; label?: string }
export function CompanionArt({ preferences, className = '', state = 'idle', floating = false, label }: Props) {
  const character = companionId(preferences)
  if (label && character !== 'robot') label = `${companions[character].name}: ${companions[character].description}`
  const reaction = state === 'welcoming' ? 'welcome' : state === 'celebrating' ? 'success' : state === 'explaining' ? 'hint' : state === 'encouraging' ? 'lesson' : 'none'
  const artwork = mascotVariants[character]
  return <RobotMascot className={`companion-art ${className}`} companion={character} companionState={state} label={label} floating={floating} reaction={reaction} backdrop={artwork?.backdrop}>
    {artwork?.outfit}
    {character === 'music' && <g><path d="M117 143v-20a113 92 0 0 1 226 0v20" fill="none" stroke="#7A4FB0" strokeWidth="14" /><rect x="98" y="118" width="26" height="52" rx="12" fill="#7A4FB0" /><rect x="336" y="118" width="26" height="52" rx="12" fill="#7A4FB0" /><rect x="188" y="245" width="84" height="60" rx="14" fill="#3D2760" /><path d="M235 255v32m0-31 19-4v28" fill="none" stroke="#F08AA8" strokeWidth="5" /><ellipse cx="228" cy="288" rx="9" ry="6" fill="#F08AA8" /><ellipse cx="247" cy="280" rx="9" ry="6" fill="#F08AA8" /></g>}
  </RobotMascot>
}
