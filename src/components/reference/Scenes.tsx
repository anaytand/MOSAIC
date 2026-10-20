import type { CSSProperties } from 'react';
import type { ThemeKey } from '../../design/referenceWorlds';

/* Background illustrations that appear behind the robot in each world. */

function SpaceScene() {
  const stars: [number, number, number, string?][] = [
    [120, 120, 2.5], [300, 60, 2, '-1s'], [520, 140, 2.5, '-2s'], [860, 70, 2], [1010, 160, 3, '-1.5s'],
    [1300, 90, 2, '-.5s'], [1380, 300, 2.5, '-2.5s'], [80, 380, 2, '-1.2s'], [700, 40, 2, '-.8s'], [1180, 420, 2],
  ];
  return (
    <svg aria-hidden="true" className="lp-scene mz-swap" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
      {stars.map(([cx, cy, r, delay]) => (
        <circle key={`${cx}-${cy}`} className="scene-star" cx={cx} cy={cy} r={r} fill="color-mix(in srgb, #FFFFFF var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" style={delay ? { animationDelay: delay } : undefined} />
      ))}
      <g className="scene-planet">
      <circle cx="1220" cy="230" r="70" fill="color-mix(in srgb, #F2B84B var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
      <circle cx="1200" cy="210" r="70" fill="color-mix(in srgb, #F7D07E var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" opacity="0.5" />
      <ellipse cx="1220" cy="235" rx="128" ry="22" fill="none" stroke="color-mix(in srgb, #FFE3A8 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="6" transform="rotate(-14 1220 235)" />
      <circle cx="220" cy="260" r="34" fill="color-mix(in srgb, #8C8FC7 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
      </g>
    </svg>
  );
}

function DinoScene() {
  return (
    <svg aria-hidden="true" className="lp-scene mz-swap" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
      <path d="M80 760 L230 520 L280 520 L440 760 Z" fill="color-mix(in srgb, #7A5A3A var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
      <path d="M230 520 L280 520 L265 560 L245 555 Z" fill="color-mix(in srgb, #D9772E var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
      <circle className="mz-up" cx="255" cy="500" r="26" fill="color-mix(in srgb, #E8DCC8 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
      <circle className="mz-up" cx="275" cy="500" r="20" fill="color-mix(in srgb, #E8DCC8 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" style={{ animationDelay: '-3s' }} />
      <circle className="mz-up" cx="240" cy="500" r="18" fill="color-mix(in srgb, #E8DCC8 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" style={{ animationDelay: '-6s' }} />
      <g fill="color-mix(in srgb, #4A6227 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" opacity="0.92">
        <ellipse cx="1150" cy="690" rx="86" ry="40" />
        <path d="M1200 670 Q1250 580 1280 548" stroke="color-mix(in srgb, #4A6227 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="22" strokeLinecap="round" fill="none" />
        <ellipse cx="1292" cy="544" rx="24" ry="13" />
        <path d="M1072 696 Q990 720 940 690" stroke="color-mix(in srgb, #4A6227 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="16" strokeLinecap="round" fill="none" />
        <rect x="1100" y="710" width="18" height="50" rx="8" />
        <rect x="1180" y="710" width="18" height="50" rx="8" />
      </g>
    </svg>
  );
}

function HeroesScene() {
  const buildings: [number, number, number, number][] = [
    [40, 560, 90, 300], [140, 500, 70, 360], [220, 590, 110, 270], [1060, 520, 90, 340],
    [1160, 470, 70, 390], [1240, 560, 120, 300], [1370, 610, 70, 250],
  ];
  return (
    <svg aria-hidden="true" className="lp-scene mz-swap" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
      <g fill="color-mix(in srgb, #14234D var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" opacity="0.85">
        {buildings.map(([x, y, w, h]) => <rect key={x} x={x} y={y} width={w} height={h} />)}
      </g>
      <g className="mz-bob" style={{ transformOrigin: '1200px 220px' }}>
        <path d="M1200 120 L1225 185 L1295 170 L1245 220 L1300 268 L1228 262 L1210 330 L1188 265 L1118 280 L1160 225 L1110 175 L1178 185 Z" fill="color-mix(in srgb, #F5C518 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        <text x="1204" y="236" textAnchor="middle" fontFamily="Lexend, sans-serif" fontWeight="700" fontSize="34" fill="color-mix(in srgb, #14234D var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))">ZAP!</text>
      </g>
      <path d="M180 160 L205 220 L190 220 L215 290" stroke="color-mix(in srgb, #F5C518 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Extensions use the reference's flat SVG fills and simple, rounded silhouettes. */
function BasketballScene() {
  return <svg aria-hidden="true" className="lp-scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
    <g fill="none" stroke="color-mix(in srgb, #FFF4D9 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="5" opacity=".8"><path d="M60 680h1320v170H60zM720 680v170" /><ellipse cx="720" cy="765" rx="80" ry="65" /><path d="M60 710h180v110H60m1320-110h-180v110h180" /></g>
    <g className="scene-ball"><g transform="translate(1190 250) rotate(-18)"><circle r="78" fill="color-mix(in srgb, #DB713B var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" /><g fill="none" stroke="color-mix(in srgb, #6F351E var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="5"><circle r="78" /><path d="M-78 0H78M0-78V78M-53-58C28-30 28 30-53 58M53-58C-28-30-28 30 53 58" /></g></g></g>
    <g transform="translate(150 180)"><rect width="160" height="90" rx="14" fill="#14234D" /><text x="80" y="31" textAnchor="middle" fill="#FFFFFF" fontFamily="Lexend,sans-serif" fontSize="16">YOUR TEAM</text><path d="M35 48h24v20H35m66-20h24v20h-24" fill="none" stroke="color-mix(in srgb, #F5C518 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" strokeWidth="5" /></g>
  </svg>
}
function WildlifeScene() {
  return <svg aria-hidden="true" className="lp-scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice"><g className="scene-nature" fill="color-mix(in srgb, #55702D var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))"><path d="m160 390-80 160h40l-70 130h220l-70-130h40Z" /><rect x="150" y="640" width="20" height="120" rx="8" /><path d="m1250 420-70 140h35l-65 125h200l-65-125h35Z" /><rect x="1240" y="650" width="20" height="110" rx="8" /></g><g fill="color-mix(in srgb, #D9772E var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" transform="translate(1180 190)"><ellipse cx="0" cy="40" rx="48" ry="28" /><circle cx="43" cy="20" r="21" /><path d="m29 5 3-25 20 22M-40 30q-45-65-67-10 25-4 32 28M-25 60v38h16V60m35-2v40h16V55" /><circle cx="49" cy="17" r="3" fill="color-mix(in srgb, #3E4A22 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" /></g></svg>
}

export function BackScene({ theme }: { theme: ThemeKey }) {
  if (theme === 'basketball') return <BasketballScene />;
  if (theme === 'animals') return <WildlifeScene />;
  if (theme === 'space') return <SpaceScene key="space" />;
  if (theme === 'dinosaurs') return <DinoScene key="dino" />;
  if (theme === 'heroes') return <HeroesScene key="heroes" />;
  return null;
}

/* Floating elements in front of the scene (they drift up as you scroll). */

const tile = (style: CSSProperties) => <div className="mz-bob lp-tile" style={style} />;

function Fish({ color, style }: { color: string; style: CSSProperties }) {
  return (
    <svg className="mz-bob" viewBox="0 0 80 40" style={style}>
      <ellipse cx="34" cy="20" rx="26" ry="14" fill={color} />
      <path d="M58 20 L78 6 L78 34 Z" fill={color} />
      <circle cx="22" cy="17" r="3" fill="color-mix(in srgb, #0F4B6E var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
    </svg>
  );
}

function Note({ color, style }: { color: string; style: CSSProperties }) {
  return (
    <svg className="mz-bob" viewBox="0 0 40 60" style={style}>
      <ellipse cx="13" cy="48" rx="12" ry="9" fill={color} />
      <rect x="22" y="6" width="4" height="42" fill={color} />
      <path d="M26 6 Q38 14 36 28 Q32 18 26 18 Z" fill={color} />
    </svg>
  );
}

export function Floaters({ theme }: { theme: ThemeKey }) {
  return (
    <div aria-hidden="true" className="lp-floaters mz-par-up">
      {theme === 'mosaic' && (
        <>
          {tile({ left: '18%', top: 210, width: 46, height: 46, borderRadius: 10, background: 'var(--decor-accent, var(--acc))' })}
          {tile({ left: '27%', top: 420, width: 30, height: 30, borderRadius: 7, background: 'var(--decor-secondary, var(--acc2))', animationDelay: '-2s', boxShadow: 'none' })}
          {tile({ right: '20%', top: 180, width: 36, height: 36, borderRadius: 8, background: 'var(--decor-deep, var(--deep))', animationDelay: '-4s', boxShadow: 'none' })}
          {tile({ right: '26%', top: 470, width: 52, height: 52, borderRadius: 11, background: 'var(--decor-secondary, var(--acc2))', animationDelay: '-1s', boxShadow: 'none' })}
          {tile({ right: '12%', top: 330, width: 24, height: 24, borderRadius: 6, background: 'var(--decor-accent, var(--acc))', animationDelay: '-3s', boxShadow: 'none' })}
        </>
      )}
      {theme === 'ocean' && (
        <>
          <div className="mz-up lp-bubble" style={{ left: '16%', top: 640, width: 26, height: 26 }} />
          <div className="mz-up lp-bubble" style={{ left: '24%', top: 680, width: 14, height: 14, animationDelay: '-3s' }} />
          <div className="mz-up lp-bubble" style={{ right: '22%', top: 660, width: 20, height: 20, animationDelay: '-5s' }} />
          <div className="mz-up lp-bubble" style={{ right: '14%', top: 700, width: 32, height: 32, animationDelay: '-7s' }} />
          <Fish color="#F28C6A" style={{ left: '14%', top: 300, width: 80 }} />
          <Fish color="#F7C95C" style={{ right: '16%', top: 230, width: 60, animationDelay: '-3s', transform: 'scaleX(-1)' }} />
        </>
      )}
      {theme === 'music' && (
        <>
          <Note color="#7A4FB0" style={{ left: '17%', top: 220, width: 44 }} />
          <Note color="#F08AA8" style={{ left: '26%', top: 440, width: 32, animationDelay: '-2s' }} />
          <Note color="#3D2760" style={{ right: '20%', top: 190, width: 38, animationDelay: '-4s' }} />
          <Note color="#7A4FB0" style={{ right: '25%', top: 460, width: 48, animationDelay: '-1s' }} />
        </>
      )}
    </div>
  );
}

/** Trains world: a train rolls slowly across a track on the hills. */
export function TrainTrack() {
  const windows = [14, 48, 82, 140, 174, 208];
  const wheels = [24, 96, 150, 222, 280, 352];
  return (
    <div aria-hidden="true" className="lp-track mz-swap">
      <div className="lp-track__rail" />
      <div className="lp-track__ties" />
      <svg className="lp-track__train mz-train" viewBox="0 0 420 60">
        <rect x="0" y="14" width="120" height="36" rx="6" fill="color-mix(in srgb, #A8432F var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        <rect x="126" y="14" width="120" height="36" rx="6" fill="color-mix(in srgb, #E8B44A var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        <rect x="252" y="6" width="130" height="44" rx="8" fill="color-mix(in srgb, #2C3540 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        <rect x="350" y="0" width="16" height="14" fill="color-mix(in srgb, #2C3540 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        <path d="M382 50 L414 50 L398 26 L382 26 Z" fill="color-mix(in srgb, #2C3540 var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        {windows.map((x) => <rect key={x} x={x} y="22" width="22" height="14" rx="3" fill="color-mix(in srgb, #F4F2EE var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />)}
        <rect x="270" y="16" width="30" height="18" rx="3" fill="color-mix(in srgb, #E8B44A var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />
        {wheels.map((cx) => <circle key={cx} cx={cx} cy="54" r="6" fill="color-mix(in srgb, #15191E var(--decor-strength, 100%), var(--decor-neutral, #a7b4b7))" />)}
      </svg>
    </div>
  );
}
