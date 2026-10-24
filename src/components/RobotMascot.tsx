import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { observeMotionRegion } from '../motionActivity'
export type RobotReaction = 'none' | 'welcome' | 'lesson' | 'success' | 'hint'
interface Props { label?: string; className?: string; floating?: boolean; reaction?: RobotReaction; backdrop?: ReactNode; children?: ReactNode; companion?: string; companionState?: string }
/** Original reference SVG, with isolated, optional transform groups. Static is the same artwork. */
export function RobotMascot({ label, className = '', floating = false, reaction = 'none', backdrop, children, companion, companionState }: Props) {
  const id = `robot-${useId().replace(/:/g, '')}`
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => ref.current ? observeMotionRegion(ref.current) : undefined, [])
  return <svg ref={ref} className={`robot-mascot ${className}${floating ? ' robot-floating' : ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} viewBox="0 0 460 340" focusable="false" data-motion-active="false" data-reaction={reaction} data-companion={companion} data-companion-state={companionState}>
    <defs>
        <linearGradient id={`${id}-shell`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#EEF2F4" /><stop offset="1" stopColor="#C2CCD2" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#8A98A0" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26394A" /><stop offset="1" stopColor="#0C141B" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-eye`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#EFFFFA" /><stop offset="0.45" stopColor="#9FE3CC" /><stop offset="1" stopColor="#3B8FBF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-amber`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFE3C2" /><stop offset="1" stopColor="#D9853A" />
        </radialGradient>
    </defs>
    {backdrop}
<g className="robot-antenna">
          <line x1="230" y1="30" x2="230" y2="62" stroke="#9AA7AE" strokeWidth="6" strokeLinecap="round" />
          <circle cx="230" cy="24" r="14" fill={`url(#${id}-amber)`} />
</g>
          <rect x="110" y="58" width="240" height="160" rx="64" fill={`url(#${id}-shell)`} />
          <rect x="110" y="58" width="240" height="160" rx="64" fill={`url(#${id}-side)`} />
          <rect x="136" y="84" width="188" height="104" rx="44" fill={`url(#${id}-visor)`} />
          <path d="M156 100 Q230 84 304 100 Q300 120 230 118 Q160 120 156 100 Z" fill={`url(#${id}-gloss)`} />
          <circle cx="190" cy="140" r="26" fill={`url(#${id}-eye)`} />
          <circle cx="270" cy="140" r="26" fill={`url(#${id}-eye)`} />
<g className="robot-eyes">
          <rect x="183" y="128" width="14" height="24" rx="7" fill="#EFFFFA" />
          <rect x="263" y="128" width="14" height="24" rx="7" fill="#EFFFFA" />
</g>
          <rect x="96" y="118" width="18" height="44" rx="9" fill="#C2CCD2" />
          <rect x="346" y="118" width="18" height="44" rx="9" fill="#C2CCD2" />
          <rect x="206" y="214" width="48" height="18" rx="6" fill="#B0BCC3" />
          <path d="M140 250 Q140 228 166 228 L294 228 Q320 228 320 250 L312 318 Q310 336 290 336 L170 336 Q150 336 148 318 Z" fill={`url(#${id}-shell)`} />
          <path d="M140 250 Q140 228 166 228 L294 228 Q320 228 320 250 L312 318 Q310 336 290 336 L170 336 Q150 336 148 318 Z" fill={`url(#${id}-side)`} />
          <rect x="196" y="250" width="20" height="20" rx="4" fill="#1E3A5F" />
          <rect x="220" y="250" width="20" height="20" rx="4" fill="#3B8FBF" />
          <rect x="244" y="250" width="20" height="20" rx="4" fill="#EBA25E" />
          <rect x="196" y="274" width="20" height="20" rx="4" fill="#3B8FBF" />
          <rect x="220" y="274" width="20" height="20" rx="4" fill="#EBA25E" />
          <rect x="244" y="274" width="20" height="20" rx="4" fill="#1E3A5F" />
          <path d="M142 252 Q104 262 94 300" stroke="#C2CCD2" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="92" cy="306" r="14" fill={`url(#${id}-shell)`} />
<g className="robot-wave-arm">
          <path d="M318 252 Q362 236 378 196" stroke="#C2CCD2" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="382" cy="188" r="14" fill={`url(#${id}-shell)`} />
</g>
    {children}
  </svg>
}
