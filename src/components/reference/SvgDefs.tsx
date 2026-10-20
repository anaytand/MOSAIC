/**
 * Shared SVG gradients and the robot mascot symbol for the landing page.
 * Render once per page, then draw the robot anywhere with <Robot />.
 * Hill gradients read the current world's CSS variables, so they recolor with the theme.
 */
export default function SvgDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <linearGradient id="mz-shell" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#EEF2F4" /><stop offset="1" stopColor="#C2CCD2" />
        </linearGradient>
        <linearGradient id="mz-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#8A98A0" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="mz-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26394A" /><stop offset="1" stopColor="#0C141B" />
        </linearGradient>
        <linearGradient id="mz-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mz-eye" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#EFFFFA" /><stop offset="0.45" stopColor="#9FE3CC" /><stop offset="1" stopColor="#3B8FBF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mz-amber" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFE3C2" /><stop offset="1" stopColor="#D9853A" />
        </radialGradient>
        <linearGradient id="mz-hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--h1a)' }} /><stop offset="1" style={{ stopColor: 'var(--h1b)' }} />
        </linearGradient>
        <linearGradient id="mz-hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--h2a)' }} /><stop offset="1" style={{ stopColor: 'var(--h2b)' }} />
        </linearGradient>
        <linearGradient id="mz-hill3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--h3a)' }} /><stop offset="1" style={{ stopColor: 'var(--h3b)' }} />
        </linearGradient>

        {/* The MOSAIC robot guide */}
        <symbol id="mz-robot" viewBox="0 0 460 340">
          <line x1="230" y1="30" x2="230" y2="62" stroke="#9AA7AE" strokeWidth="6" strokeLinecap="round" />
          <circle cx="230" cy="24" r="14" fill="url(#mz-amber)" />
          <rect x="110" y="58" width="240" height="160" rx="64" fill="url(#mz-shell)" />
          <rect x="110" y="58" width="240" height="160" rx="64" fill="url(#mz-side)" />
          <rect x="136" y="84" width="188" height="104" rx="44" fill="url(#mz-visor)" />
          <path d="M156 100 Q230 84 304 100 Q300 120 230 118 Q160 120 156 100 Z" fill="url(#mz-gloss)" />
          <circle cx="190" cy="140" r="26" fill="url(#mz-eye)" />
          <circle cx="270" cy="140" r="26" fill="url(#mz-eye)" />
          <rect x="183" y="128" width="14" height="24" rx="7" fill="#EFFFFA" />
          <rect x="263" y="128" width="14" height="24" rx="7" fill="#EFFFFA" />
          <rect x="96" y="118" width="18" height="44" rx="9" fill="#C2CCD2" />
          <rect x="346" y="118" width="18" height="44" rx="9" fill="#C2CCD2" />
          <rect x="206" y="214" width="48" height="18" rx="6" fill="#B0BCC3" />
          <path d="M140 250 Q140 228 166 228 L294 228 Q320 228 320 250 L312 318 Q310 336 290 336 L170 336 Q150 336 148 318 Z" fill="url(#mz-shell)" />
          <path d="M140 250 Q140 228 166 228 L294 228 Q320 228 320 250 L312 318 Q310 336 290 336 L170 336 Q150 336 148 318 Z" fill="url(#mz-side)" />
          <rect x="196" y="250" width="20" height="20" rx="4" fill="#1E3A5F" />
          <rect x="220" y="250" width="20" height="20" rx="4" fill="#3B8FBF" />
          <rect x="244" y="250" width="20" height="20" rx="4" fill="#EBA25E" />
          <rect x="196" y="274" width="20" height="20" rx="4" fill="#3B8FBF" />
          <rect x="220" y="274" width="20" height="20" rx="4" fill="#EBA25E" />
          <rect x="244" y="274" width="20" height="20" rx="4" fill="#1E3A5F" />
          <path d="M142 252 Q104 262 94 300" stroke="#C2CCD2" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="92" cy="306" r="14" fill="url(#mz-shell)" />
          <path d="M318 252 Q362 236 378 196" stroke="#C2CCD2" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="382" cy="188" r="14" fill="url(#mz-shell)" />
        </symbol>
      </defs>
    </svg>
  );
}

/** Draws the robot mascot. Requires <SvgDefs /> on the page. */
export function Robot({ label }: { label: string }) {
  return (
    <svg role="img" aria-label={label} viewBox="0 0 460 340" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <use href="#mz-robot" />
    </svg>
  );
}
