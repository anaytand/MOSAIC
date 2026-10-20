import { useEffect, useRef } from 'react'
import { RobotMascot } from './RobotMascot'
import { companionId, companions } from '../companions/catalog'
import type { CompanionState } from '../companions/catalog'
import type { UserPreferences } from '../types'
import { observeMotionRegion } from '../motionActivity'
interface Props { preferences: Pick<UserPreferences, 'interest' | 'customTopic'>; className?: string; state?: CompanionState; floating?: boolean; label?: string }
export function CompanionArt({ preferences, className = '', state = 'idle', floating = false, label }: Props) {
  const character = companionId(preferences)
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => ref.current ? observeMotionRegion(ref.current) : undefined, [])
  if (label && character !== 'robot') label = `${companions[character].name}: ${companions[character].description}`
  const reaction = state === 'welcoming' ? 'welcome' : state === 'celebrating' ? 'success' : state === 'explaining' ? 'hint' : state === 'encouraging' ? 'lesson' : 'none'
  if (character === 'robot' || character === 'basketball' || character === 'astronaut' || character === 'music') return <RobotMascot className={`companion-art ${className}`} companion={character} companionState={state} label={label} floating={floating} reaction={reaction}>
    {character === 'basketball' && <g><circle cx="230" cy="274" r="34" fill="#DB713B" stroke="#66340F" strokeWidth="3" /><path d="M196 274h68m-34-34v68m-23-58c29 9 29 39 0 48m46-48c-29 9-29 39 0 48" stroke="#66340F" strokeWidth="3" fill="none" /></g>}
    {character === 'astronaut' && <g fill="none" stroke="#7A7EE0" strokeWidth="7"><rect x="105" y="54" width="250" height="168" rx="68" /><path d="M155 234v65m150-65v65" /><circle cx="289" cy="274" r="10" fill="#F2B84B" /></g>}
    {character === 'music' && <g><path d="M117 143v-20a113 92 0 0 1 226 0v20" fill="none" stroke="#7A4FB0" strokeWidth="14" /><rect x="98" y="118" width="26" height="52" rx="12" fill="#7A4FB0" /><rect x="336" y="118" width="26" height="52" rx="12" fill="#7A4FB0" /><rect x="188" y="245" width="84" height="60" rx="14" fill="#3D2760" /><path d="M235 255v32m0-31 19-4v28" fill="none" stroke="#F08AA8" strokeWidth="5" /><ellipse cx="228" cy="288" rx="9" ry="6" fill="#F08AA8" /><ellipse cx="247" cy="280" rx="9" ry="6" fill="#F08AA8" /></g>}
  </RobotMascot>
  return <svg ref={ref} className={`robot-mascot companion-art ${className}${floating ? ' robot-floating' : ''}`} viewBox="0 0 460 340" aria-label={label} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} data-motion-active="false" data-reaction={reaction} data-companion={character} data-companion-state={state} focusable="false">
    <title>{companions[character].description}</title>
    {character === 'shark' && <><path d="M126 169 65 114l8 101 57-25M211 112l37-62 35 74" fill="#3B8FBF" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /><ellipse cx="244" cy="182" rx="132" ry="94" fill="#8FC6DF" stroke="#1E3A5F" strokeWidth="5" /><path d="M127 198q117 110 240-2-16 91-125 81-97-2-115-79Z" fill="#EEF2F4" /><g className="robot-wave-arm"><path d="m282 220 42 65-75-20Z" fill="#3B8FBF" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /></g><path d="M269 190q35 25 63-2" stroke="#1E3A5F" strokeWidth="5" strokeLinecap="round" fill="none" /><g className="robot-eyes" fill="#1E3A5F"><ellipse cx="267" cy="157" rx="9" ry="14" /><ellipse cx="330" cy="153" rx="9" ry="14" /></g></>}
    {character === 'train' && <><rect x="131" y="80" width="198" height="210" rx="50" fill="#EEF2F4" stroke="#1E3A5F" strokeWidth="5" /><rect x="150" y="106" width="160" height="86" rx="35" fill="#14234D" /><path d="M139 75h182" stroke="#3B8FBF" strokeWidth="22" strokeLinecap="round" /><g className="robot-eyes" fill="#EFFFFA"><rect x="190" y="137" width="14" height="24" rx="7" /><rect x="257" y="137" width="14" height="24" rx="7" /></g><circle cx="174" cy="287" r="25" fill="#1E3A5F" /><circle cx="288" cy="287" r="25" fill="#1E3A5F" /><circle cx="175" cy="232" r="17" fill="#EBA25E" /><circle cx="287" cy="232" r="17" fill="#EBA25E" /><path d="M197 277h65" stroke="#3B8FBF" strokeWidth="10" strokeLinecap="round" /></>}
    {character === 'fox' && <><path d="m133 153-2-93 71 48m56 0 71-48-2 93" fill="#D9853A" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /><path d="M130 139q99-75 200 0l-12 73-88 64-88-64Z" fill="#EBA25E" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /><path d="m143 182 87 29 87-29-8 36-79 58-79-58Z" fill="#EEF2F4" /><g className="robot-eyes" fill="#1E3A5F"><ellipse cx="184" cy="169" rx="9" ry="14" /><ellipse cx="276" cy="169" rx="9" ry="14" /></g><path d="m216 214 14 12 14-12Z" fill="#1E3A5F" /><path d="M230 227v14m0 0-13 8m13-8 13 8" stroke="#1E3A5F" strokeWidth="4" strokeLinecap="round" /></>}
    <g transform="translate(207 247)">{['#1E3A5F','#3B8FBF','#EBA25E'].map((fill, i) => <rect key={fill} x={i * 16} width="13" height="13" rx="3" fill={fill} />)}</g>
  </svg>
}
