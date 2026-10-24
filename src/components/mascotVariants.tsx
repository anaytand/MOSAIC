import type { ReactNode } from 'react'
import type { CompanionId } from '../companions/catalog'

/** Artwork uses the original robot's 460 × 340 coordinate system. Backdrops sit behind
 * its shell; outfits sit over the torso without replacing the shared face or proportions. */
export interface MascotArtwork { backdrop: ReactNode; outfit: ReactNode }

const ink = '#1E3A5F'

export const mascotVariants: Partial<Record<CompanionId, MascotArtwork>> = {
  basketball: {
    backdrop: <g aria-hidden="true">
      <path d="M26 323q56-59 117-35M317 296q58-27 116 26" fill="none" stroke="#E8B475" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 322h62m345 0h-61" stroke="#E8B475" strokeWidth="4" strokeLinecap="round" />
    </g>,
    outfit: <g aria-hidden="true">
      {/* Team uniform, not a badge pasted on the original mosaic chest. */}
      <path d="M166 229h128q23 0 26 27l-7 66q-2 13-16 13H163q-13 0-15-13l-8-66q4-27 26-27Z" fill="#C66735" stroke={ink} strokeWidth="4" />
      <path d="M181 230l20 19h58l20-19M154 246l18 8-5 69m139-77-18 8 5 69" fill="none" stroke="#FFF5E9" strokeWidth="7" strokeLinejoin="round" />
      <path d="M190 239q40 21 80 0" fill="none" stroke="#193B55" strokeWidth="4" />
      <text x="230" y="279" textAnchor="middle" fill="#FFF8ED" fontSize="11" fontWeight="800" letterSpacing="2" fontFamily="system-ui, sans-serif">FALCONS</text>
      <text x="230" y="315" textAnchor="middle" fill="#FFF8ED" fontSize="35" fontWeight="900" fontFamily="system-ui, sans-serif">24</text>
      <path d="M123 75q107-41 214 0l-7 18q-98-32-200 0Z" fill="#C66735" stroke={ink} strokeWidth="3" />
      <path d="M138 81q91-27 183 0" fill="none" stroke="#FFF5E9" strokeWidth="4" />
      <path d="M112 271l-15 6m247-21 14-6" stroke="#FFF5E9" strokeWidth="7" strokeLinecap="round" />
      <path d="M150 324q21-4 46 6l-5 9h-47q-7-6 6-15Zm114 6q25-10 46-6 13 9 6 15h-47Z" fill="#233F64" stroke="#FFF5E9" strokeWidth="3" />
      {/* The raised hand sits in front of the ball to read as a held dribble. */}
      <circle cx="402" cy="158" r="30" fill="#E48A43" stroke="#66340F" strokeWidth="4" />
      <path d="M373 158h58m-29-29v58m-19-52q30 23 0 47m38-47q-30 23 0 47" fill="none" stroke="#66340F" strokeWidth="3" />
      <path d="M377 185q8 7 16 0" fill="none" stroke="#F5F7F4" strokeWidth="7" strokeLinecap="round" />
    </g>,
  },
  astronaut: {
    backdrop: <g aria-hidden="true">
      <circle cx="76" cy="73" r="5" fill="#F1C976" />
      <path d="M71 73h-12m17-5V56m5 17h12m-17 5v12" stroke="#F1C976" strokeWidth="2" strokeLinecap="round" />
      <circle cx="393" cy="102" r="13" fill="#C7C5F6" stroke="#7878B5" strokeWidth="2" />
      <path d="M370 105q25-23 50-8" fill="none" stroke="#7878B5" strokeWidth="3" />
      <rect x="91" y="232" width="45" height="84" rx="15" fill="#6369A8" stroke={ink} strokeWidth="4" />
      <rect x="324" y="232" width="45" height="84" rx="15" fill="#6369A8" stroke={ink} strokeWidth="4" />
      <path d="m102 314-7 18m26-18 7 18m211-18-7 18m26-18 7 18" stroke="#F1C976" strokeWidth="6" strokeLinecap="round" />
    </g>,
    outfit: <g aria-hidden="true">
      {/* Helmet rim retains the familiar glowing face beneath its clear visor. */}
      <rect x="99" y="48" width="262" height="180" rx="75" fill="none" stroke={ink} strokeWidth="17" />
      <rect x="99" y="48" width="262" height="180" rx="75" fill="none" stroke="#A4A7E8" strokeWidth="11" />
      <path d="M136 108q36-32 91-25" fill="none" stroke="#FFFFFF" strokeOpacity=".62" strokeWidth="6" strokeLinecap="round" />
      <circle cx="105" cy="143" r="12" fill="#F0C677" stroke={ink} strokeWidth="3" />
      <circle cx="355" cy="143" r="12" fill="#F0C677" stroke={ink} strokeWidth="3" />
      <path d="M164 230h132q20 0 24 23l-8 68q-2 14-17 14H165q-15 0-17-14l-8-68q4-23 24-23Z" fill="#DADCF7" stroke={ink} strokeWidth="4" />
      <path d="M174 233l18 18h76l18-18m-132 26 22 4m130-4-22 4" fill="none" stroke="#7881C6" strokeWidth="7" strokeLinecap="round" />
      <rect x="205" y="262" width="50" height="47" rx="11" fill="#273F66" stroke="#909AE2" strokeWidth="4" />
      <path d="m230 270 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#F4CE78" />
      <circle cx="180" cy="282" r="11" fill="#F4CE78" stroke={ink} strokeWidth="3" />
      <path d="M150 324q20-5 46 4l-4 11h-45q-7-6 3-15Zm114 4q26-9 46-4 10 9 3 15h-45Z" fill="#535F9B" stroke={ink} strokeWidth="3" />
    </g>,
  },
  shark: {
    backdrop: <g aria-hidden="true">
      <path d="M272 59l25-43 25 52Z" fill="#66B7C7" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="67" cy="72" r="9" fill="none" stroke="#80C9DA" strokeWidth="3" />
      <circle cx="83" cy="45" r="5" fill="none" stroke="#80C9DA" strokeWidth="3" />
      <circle cx="389" cy="66" r="7" fill="none" stroke="#80C9DA" strokeWidth="3" />
      <path d="M48 277q18-13 36 0-18 13-36 0Zm-5 0-12-9v18Z" fill="#82C5CE" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="74" cy="273" r="2" fill={ink} />
      <rect x="312" y="237" width="42" height="83" rx="16" fill="#6DBBCA" stroke={ink} strokeWidth="4" />
      <path d="M333 237v-14" stroke="#91D1D4" strokeWidth="8" strokeLinecap="round" />
    </g>,
    outfit: <g aria-hidden="true">
      {/* Research wetsuit, shark-fin hood and diver mask share the base robot's face. */}
      <path d="M159 231h142q18 0 19 25l-9 65q-1 14-17 14H166q-16 0-17-14l-9-65q1-25 19-25Z" fill="#277F8E" stroke={ink} strokeWidth="4" />
      <path d="M180 232l19 20h62l19-20M230 253v70m-75-67 20 6m130-6-20 6" fill="none" stroke="#A9DDD7" strokeWidth="6" strokeLinecap="round" />
      <circle cx="230" cy="285" r="18" fill="#EAF9F4" stroke={ink} strokeWidth="3" />
      <path d="m218 289 11-10 13 10m-24 1 24 1" fill="none" stroke="#2C929C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M111 105q119-59 238 0" fill="none" stroke="#277F8E" strokeWidth="12" strokeLinecap="round" />
      <rect x="128" y="78" width="204" height="124" rx="52" fill="#7DD1D5" fillOpacity=".12" stroke="#53B3BF" strokeWidth="10" />
      <path d="M160 94q28-14 55-9" fill="none" stroke="#F0FFFF" strokeOpacity=".8" strokeWidth="5" strokeLinecap="round" />
      <path d="M349 102h22q9 0 9-9V54m0 0h-13" fill="none" stroke="#277F8E" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M145 324q19-4 45 4l-8 11h-46q-4-8 9-15Zm125 4q26-8 45-4 13 7 9 15h-46Z" fill="#2C929C" stroke={ink} strokeWidth="3" />
    </g>,
  },
  fox: {
    backdrop: <g aria-hidden="true">
      {/* The ears and tail give Scout a wildlife silhouette at card size. */}
      <path d="M123 83 116 34l48 33m173 16 7-49-48 33" fill="#D99A65" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="m132 69-6-20 22 19m180 1 6-20-22 19" fill="#F3D7B6" />
      <path d="M318 262q42-33 72-10 21 16-6 42-19 19-46 11" fill="#D99A65" stroke={ink} strokeWidth="4" />
      <path d="M370 247q39 11 19 39-15 12-26 13" fill="#FFF4E4" />
      <path d="M25 321q20-34 40-17m-19 16q22-25 39-8m317 6q14-26 32-17" fill="none" stroke="#7BA581" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 303q-12-15-1-24 17 1 10 20m359 1q-11-18 2-25 16 9 3 25" fill="#9BC39A" stroke="#638B70" strokeWidth="2" />
    </g>,
    outfit: <g aria-hidden="true">
      {/* Field vest, observation kit, and paw badge sit over the shared robot torso. */}
      <path d="M160 230h140q20 0 20 25l-8 67q-2 13-17 13H165q-15 0-17-13l-8-67q0-25 20-25Z" fill="#EED9B4" stroke={ink} strokeWidth="4" />
      <path d="M166 231h42l22 32-23 71h-42q-15 0-17-13l-8-66q1-19 26-24Zm128 0h-42l-22 32 23 71h42q15 0 17-13l8-66q-1-19-26-24Z" fill="#A37B51" stroke={ink} strokeWidth="3" />
      <path d="m178 233 26 23-14 18m92-41-26 23 14 18" fill="none" stroke="#F8E9CE" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M171 294h30v22h-30Zm88 0h30v22h-30Z" fill="#C99C68" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M183 294v7m91-7v7" stroke="#F8E9CE" strokeWidth="3" />
      <circle cx="278" cy="271" r="14" fill="#F8E9CE" stroke={ink} strokeWidth="3" />
      <ellipse cx="278" cy="276" rx="6" ry="4" fill="#507D66" />
      <circle cx="270" cy="268" r="2.5" fill="#507D66" /><circle cx="276" cy="264" r="2.5" fill="#507D66" /><circle cx="283" cy="264" r="2.5" fill="#507D66" /><circle cx="287" cy="269" r="2.5" fill="#507D66" />
      <path d="M187 233q43 39 86 0" fill="none" stroke="#507D66" strokeWidth="4" />
      <rect x="200" y="267" width="27" height="24" rx="6" fill="#314D45" stroke="#E8D3A9" strokeWidth="3" />
      <rect x="229" y="267" width="27" height="24" rx="6" fill="#314D45" stroke="#E8D3A9" strokeWidth="3" />
      <path d="M226 276h4" stroke="#E8D3A9" strokeWidth="5" strokeLinecap="round" />
      <circle cx="213" cy="278" r="6" fill="#9CC4AC" /><circle cx="243" cy="278" r="6" fill="#9CC4AC" />
      <path d="M148 325q20-5 47 4l-5 10h-46q-6-7 4-14Zm117 4q27-9 47-4 10 7 4 14h-46Z" fill="#507D66" stroke={ink} strokeWidth="3" />
      <path d="M386 178q16-30 35-20-3 19-29 24m-2 1q-10-15-2-24 14 4 11 17" fill="#8EBB88" stroke="#507D66" strokeWidth="3" strokeLinejoin="round" />
    </g>,
  },
  train: {
    backdrop: <g aria-hidden="true">
      {/* Station rails and a signal frame the conductor without crowding the face. */}
      <path d="M19 322h105m217 0h102M25 333h91m229 0h91M52 322v11m36-11v11m284-11v11m36-11v11" stroke="#7EA9AA" strokeWidth="4" strokeLinecap="round" />
      <path d="M52 266v-61m-18 0h36" fill="none" stroke="#406B79" strokeWidth="5" strokeLinecap="round" />
      <circle cx="52" cy="226" r="11" fill="#E8AE62" stroke={ink} strokeWidth="3" />
      <circle cx="52" cy="250" r="11" fill="#8ABFA9" stroke={ink} strokeWidth="3" />
    </g>,
    outfit: <g aria-hidden="true">
      {/* Cap, uniform, route display, and signal whistle make Pip a rail guide. */}
      <path d="M151 72q3-39 79-42 76 3 79 42l-14 15H165Z" fill="#2D6174" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M153 73h154v14H153Z" fill="#E7AD62" stroke={ink} strokeWidth="3" />
      <path d="M130 87q100-22 200 0l12 13q-112-14-224 0Z" fill="#23485F" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="230" cy="57" r="15" fill="#F7E9C8" stroke={ink} strokeWidth="3" />
      <path d="M221 58h18m-14-5v10m10-10v10" stroke="#406B79" strokeWidth="3" strokeLinecap="round" />
      <path d="M162 230h136q22 0 22 26l-8 66q-2 13-17 13H165q-15 0-17-13l-8-66q0-26 22-26Z" fill="#315F73" stroke={ink} strokeWidth="4" />
      <path d="m178 231 28 30 24-13 24 13 28-30m-52 18v84" fill="none" stroke="#D9E8E0" strokeWidth="6" strokeLinejoin="round" />
      <path d="M150 258h30m130 0h-30" stroke="#E7AD62" strokeWidth="6" strokeLinecap="round" />
      <circle cx="177" cy="278" r="12" fill="#F7E9C8" stroke={ink} strokeWidth="3" />
      <path d="m169 278 5 5 10-11" fill="none" stroke="#3D8375" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="201" y="267" width="58" height="51" rx="7" fill="#E8F1E9" stroke={ink} strokeWidth="3" />
      <path d="M212 280h36m-36 13h36m-36 13h36" stroke="#81A9A1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="213" cy="280" r="4" fill="#E7AD62" /><circle cx="230" cy="293" r="4" fill="#3D8375" /><circle cx="248" cy="306" r="4" fill="#E7AD62" />
      <path d="M148 325q20-5 47 4l-5 10h-46q-6-7 4-14Zm117 4q27-9 47-4 10 7 4 14h-46Z" fill="#23485F" stroke={ink} strokeWidth="3" />
      <path d="M384 173h31v17h-31Zm7-7h17" fill="#E7AD62" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="399" cy="181" r="4" fill="#F7E9C8" />
    </g>,
  },
}
