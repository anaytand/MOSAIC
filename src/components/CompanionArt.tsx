import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { RobotMascot } from './RobotMascot'
import { companionId, companions } from '../companions/catalog'
import type { CompanionId, CompanionState } from '../companions/catalog'
import type { UserPreferences } from '../types'
import { observeMotionRegion } from '../motionActivity'
interface Props { preferences: Pick<UserPreferences, 'interest' | 'customTopic'>; className?: string; state?: CompanionState; floating?: boolean; label?: string }

const INK = '#1E3A5F'
/** A thick limb with an outline: an ink stroke with the fill color drawn on top. */
function limb(d: string, fill: string, width = 14) {
  return <><path d={d} stroke={INK} strokeWidth={width + 9} strokeLinecap="round" fill="none" /><path d={d} stroke={fill} strokeWidth={width} strokeLinecap="round" fill="none" /></>
}
const badge = <g transform="translate(207 247)">{['#1E3A5F', '#3B8FBF', '#EBA25E'].map((fill, i) => <rect key={fill} x={i * 16} width="13" height="13" rx="3" fill={fill} />)}</g>

/** Each theme's companion is its own character. Eyes blink (.robot-eyes) and one arm waves (.robot-wave-arm). */
const art: Record<Exclude<CompanionId, 'robot'>, ReactNode> = {
  basketball: <>
    {limb('M142 224 Q104 238 96 272', '#E8823A')}
    <circle cx="94" cy="280" r="15" fill="#F6D2AE" stroke={INK} strokeWidth="5" />
    <path d="M198 282v28M262 282v28" stroke={INK} strokeWidth="14" strokeLinecap="round" />
    <ellipse cx="188" cy="316" rx="30" ry="14" fill="#FFFFFF" stroke={INK} strokeWidth="5" />
    <ellipse cx="272" cy="316" rx="30" ry="14" fill="#FFFFFF" stroke={INK} strokeWidth="5" />
    <g className="robot-wave-arm" style={{ transformOrigin: '322px 216px' }}>{limb('M322 216 Q356 198 368 162', '#E8823A')}<circle cx="370" cy="152" r="15" fill="#F6D2AE" stroke={INK} strokeWidth="5" /></g>
    <circle cx="230" cy="168" r="118" fill="#E8823A" stroke={INK} strokeWidth="5" />
    <ellipse cx="186" cy="104" rx="52" ry="24" fill="#FFFFFF" opacity=".25" transform="rotate(-24 186 104)" />
    <g stroke="#7A3A12" strokeWidth="5" fill="none" strokeLinecap="round"><path d="M230 52v232M114 168h232" /><path d="M152 80c40 50 40 126 0 176M308 80c-40 50-40 126 0 176" /></g>
    <g className="robot-eyes"><ellipse cx="196" cy="148" rx="21" ry="25" fill="#FFFFFF" stroke={INK} strokeWidth="4" /><ellipse cx="264" cy="148" rx="21" ry="25" fill="#FFFFFF" stroke={INK} strokeWidth="4" /><circle cx="200" cy="152" r="9" fill={INK} /><circle cx="260" cy="152" r="9" fill={INK} /></g>
    <path d="M198 198 Q230 228 262 198 Z" fill="#FFFFFF" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="168" cy="190" r="10" fill="#F6B07E" /><circle cx="292" cy="190" r="10" fill="#F6B07E" />
  </>,
  astronaut: <>
    <rect x="138" y="222" width="184" height="104" rx="38" fill="#C5CED4" stroke={INK} strokeWidth="5" />
    {limb('M168 262 Q126 274 114 310', '#F4F6F8', 24)}
    <circle cx="112" cy="318" r="16" fill="#DCE4E9" stroke={INK} strokeWidth="5" />
    <path d="M160 336V264q0-28 30-28h80q30 0 30 28v72Z" fill="#F4F6F8" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <rect x="206" y="258" width="48" height="34" rx="8" fill="#DCE4E9" stroke={INK} strokeWidth="4" />
    <circle cx="220" cy="275" r="5" fill="#3B8FBF" /><circle cx="240" cy="275" r="5" fill="#EBA25E" />
    <g className="robot-wave-arm" style={{ transformOrigin: '292px 262px' }}>{limb('M292 262 Q334 246 350 206', '#F4F6F8', 24)}<circle cx="354" cy="196" r="16" fill="#DCE4E9" stroke={INK} strokeWidth="5" /></g>
    <g className="robot-antenna"><path d="M230 46V24" stroke={INK} strokeWidth="5" strokeLinecap="round" /><circle cx="230" cy="18" r="9" fill="#EBA25E" stroke={INK} strokeWidth="4" /></g>
    <rect x="124" y="118" width="18" height="46" rx="8" fill="#DCE4E9" stroke={INK} strokeWidth="4" />
    <rect x="318" y="118" width="18" height="46" rx="8" fill="#DCE4E9" stroke={INK} strokeWidth="4" />
    <circle cx="230" cy="140" r="96" fill="#F4F6F8" stroke={INK} strokeWidth="5" />
    <rect x="158" y="92" width="144" height="104" rx="46" fill="#CFE8F5" stroke={INK} strokeWidth="5" />
    <ellipse cx="230" cy="150" rx="50" ry="44" fill="#E8B88E" />
    <path d="M182 136q8-36 48-36t48 36q-22-16-48-14t-48 14Z" fill="#4A3426" />
    <g className="robot-eyes" fill={INK}><ellipse cx="212" cy="150" rx="6" ry="9" /><ellipse cx="248" cy="150" rx="6" ry="9" /></g>
    <path d="M214 170q16 14 32 0" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M172 112q16-14 40-14" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" fill="none" opacity=".75" />
  </>,
  music: <>
    <g fill="#C7B3E6"><ellipse cx="88" cy="98" rx="13" ry="10" /><rect x="96" y="50" width="5" height="48" rx="2" /><ellipse cx="384" cy="250" rx="11" ry="8" /><rect x="391" y="208" width="5" height="42" rx="2" /></g>
    {limb('M128 270 Q98 286 88 316', '#7A4FB0')}
    <circle cx="86" cy="322" r="14" fill="#C7B3E6" stroke={INK} strokeWidth="5" />
    <rect x="262" y="54" width="24" height="200" rx="10" fill="#7A4FB0" stroke={INK} strokeWidth="5" />
    <g className="robot-antenna" style={{ transformOrigin: '274px 64px' }}><path d="M284 58q70 22 72 92-22-38-70-42Z" fill="#7A4FB0" stroke={INK} strokeWidth="5" strokeLinejoin="round" /></g>
    <g className="robot-wave-arm" style={{ transformOrigin: '274px 262px' }}>{limb('M274 262 Q312 250 326 216', '#7A4FB0')}<circle cx="330" cy="208" r="14" fill="#C7B3E6" stroke={INK} strokeWidth="5" /></g>
    <ellipse cx="200" cy="252" rx="90" ry="66" fill="#7A4FB0" stroke={INK} strokeWidth="5" transform="rotate(-18 200 252)" />
    <ellipse cx="166" cy="220" rx="32" ry="13" fill="#FFFFFF" opacity=".25" transform="rotate(-18 166 220)" />
    <g className="robot-eyes"><ellipse cx="176" cy="246" rx="16" ry="19" fill="#FFFFFF" stroke={INK} strokeWidth="4" /><ellipse cx="226" cy="236" rx="16" ry="19" fill="#FFFFFF" stroke={INK} strokeWidth="4" /><circle cx="179" cy="250" r="7" fill={INK} /><circle cx="223" cy="240" r="7" fill={INK} /></g>
    <path d="M182 280q24 20 52-8Z" fill="#FFFFFF" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
  </>,
  dinosaur: <>
    <path d="M132 236Q72 250 34 298q60 2 116-30Z" fill="#5FB37A" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <g fill="#3E8E5A" stroke={INK} strokeWidth="4" strokeLinejoin="round"><path d="m116 216 12-28 18 22Z" /><path d="m144 188 14-30 20 22Z" /><path d="m178 166 14-30 20 22Z" /></g>
    <rect x="160" y="268" width="38" height="54" rx="14" fill="#5FB37A" stroke={INK} strokeWidth="5" />
    <rect x="240" y="268" width="38" height="54" rx="14" fill="#5FB37A" stroke={INK} strokeWidth="5" />
    <ellipse cx="218" cy="232" rx="100" ry="70" fill="#5FB37A" stroke={INK} strokeWidth="5" />
    <ellipse cx="240" cy="250" rx="54" ry="44" fill="#D7EEC2" />
    <g fill="#3E8E5A" opacity=".6"><circle cx="168" cy="214" r="10" /><circle cx="150" cy="250" r="7" /><circle cx="190" cy="270" r="6" /></g>
    <g className="robot-wave-arm" style={{ transformOrigin: '296px 222px' }}>{limb('M296 222 Q326 214 336 190', '#5FB37A', 13)}</g>
    <ellipse cx="282" cy="118" rx="88" ry="64" fill="#5FB37A" stroke={INK} strokeWidth="5" />
    <circle cx="322" cy="76" r="7" fill="#3E8E5A" opacity=".6" />
    <g className="robot-eyes"><ellipse cx="254" cy="102" rx="15" ry="19" fill="#FFFFFF" stroke={INK} strokeWidth="4" /><ellipse cx="312" cy="102" rx="15" ry="19" fill="#FFFFFF" stroke={INK} strokeWidth="4" /><circle cx="257" cy="106" r="7" fill={INK} /><circle cx="309" cy="106" r="7" fill={INK} /></g>
    <path d="M236 144q47 34 94 0Z" fill="#FFFFFF" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="m258 148 6 9 6-8m26 0 6 9 6-8" stroke={INK} strokeWidth="3" fill="none" strokeLinejoin="round" />
    <circle cx="352" cy="108" r="4" fill={INK} /><circle cx="362" cy="100" r="4" fill={INK} />
  </>,
  shark: <><path d="M126 169 65 114l8 101 57-25M211 112l37-62 35 74" fill="#3B8FBF" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /><ellipse cx="244" cy="182" rx="132" ry="94" fill="#8FC6DF" stroke="#1E3A5F" strokeWidth="5" /><path d="M127 198q117 110 240-2-16 91-125 81-97-2-115-79Z" fill="#EEF2F4" /><g className="robot-wave-arm"><path d="m282 220 42 65-75-20Z" fill="#3B8FBF" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /></g><path d="M269 190q35 25 63-2" stroke="#1E3A5F" strokeWidth="5" strokeLinecap="round" fill="none" /><g className="robot-eyes" fill="#1E3A5F"><ellipse cx="267" cy="157" rx="9" ry="14" /><ellipse cx="330" cy="153" rx="9" ry="14" /></g>{badge}</>,
  train: <><rect x="131" y="80" width="198" height="210" rx="50" fill="#EEF2F4" stroke="#1E3A5F" strokeWidth="5" /><rect x="150" y="106" width="160" height="86" rx="35" fill="#14234D" /><path d="M139 75h182" stroke="#3B8FBF" strokeWidth="22" strokeLinecap="round" /><g className="robot-eyes" fill="#EFFFFA"><rect x="190" y="137" width="14" height="24" rx="7" /><rect x="257" y="137" width="14" height="24" rx="7" /></g><circle cx="174" cy="287" r="25" fill="#1E3A5F" /><circle cx="288" cy="287" r="25" fill="#1E3A5F" /><circle cx="175" cy="232" r="17" fill="#EBA25E" /><circle cx="287" cy="232" r="17" fill="#EBA25E" /><path d="M197 277h65" stroke="#3B8FBF" strokeWidth="10" strokeLinecap="round" />{badge}</>,
  fox: <><path d="m133 153-2-93 71 48m56 0 71-48-2 93" fill="#D9853A" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /><path d="M130 139q99-75 200 0l-12 73-88 64-88-64Z" fill="#EBA25E" stroke="#1E3A5F" strokeWidth="5" strokeLinejoin="round" /><path d="m143 182 87 29 87-29-8 36-79 58-79-58Z" fill="#EEF2F4" /><g className="robot-eyes" fill="#1E3A5F"><ellipse cx="184" cy="169" rx="9" ry="14" /><ellipse cx="276" cy="169" rx="9" ry="14" /></g><path d="m216 214 14 12 14-12Z" fill="#1E3A5F" /><path d="M230 227v14m0 0-13 8m13-8 13 8" stroke="#1E3A5F" strokeWidth="4" strokeLinecap="round" />{badge}</>,
}

export function CompanionArt({ preferences, className = '', state = 'idle', floating = false, label }: Props) {
  const character = companionId(preferences)
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => ref.current ? observeMotionRegion(ref.current) : undefined, [])
  if (label && character !== 'robot') label = `${companions[character].name}: ${companions[character].description}`
  const reaction = state === 'welcoming' ? 'welcome' : state === 'celebrating' ? 'success' : state === 'explaining' ? 'hint' : state === 'encouraging' ? 'lesson' : 'none'
  if (character === 'robot') return <RobotMascot className={`companion-art ${className}`} companion={character} companionState={state} label={label} floating={floating} reaction={reaction} />
  return <svg ref={ref} className={`robot-mascot companion-art ${className}${floating ? ' robot-floating' : ''}`} viewBox="0 0 460 340" aria-label={label} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} data-motion-active="false" data-reaction={reaction} data-companion={character} data-companion-state={state} focusable="false">
    <title>{companions[character].description}</title>
    {art[character]}
  </svg>
}
