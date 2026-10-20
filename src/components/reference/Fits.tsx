import type { CSSProperties } from 'react';

/* Nine tiles start scattered and fly together into the MOSAIC logo as you scroll. */
const TILES: { dx: number; dy: number; r: number; color: string }[] = [
  { dx: -220, dy: -160, r: -40, color: 'var(--decor-deep, var(--deep))' },
  { dx: 40, dy: -260, r: 30, color: 'var(--decor-accent, var(--acc))' },
  { dx: 260, dy: -120, r: 60, color: 'var(--decor-secondary, var(--acc2))' },
  { dx: -300, dy: 20, r: 45, color: 'var(--decor-accent, var(--acc))' },
  { dx: 0, dy: 220, r: -90, color: 'var(--decor-secondary, var(--acc2))' },
  { dx: 320, dy: 60, r: -30, color: 'var(--decor-deep, var(--deep))' },
  { dx: -200, dy: 240, r: 70, color: 'var(--decor-secondary, var(--acc2))' },
  { dx: 60, dy: 300, r: 20, color: 'var(--decor-deep, var(--deep))' },
  { dx: 240, dy: 260, r: -60, color: 'var(--decor-accent, var(--acc))' },
];

export default function Fits() {
  return (
    <section aria-labelledby="fits-title" className="lp-fits mz-t">
      <div className="lp-fits__inner">
        <div aria-hidden="true" className="lp-fits__grid">
          {TILES.map((t, i) => (
            <div
              key={i}
              className="lp-fits__tile mz-asm mz-t"
              style={{ '--dx': `${t.dx}px`, '--dy': `${t.dy}px`, '--r': `${t.r}deg`, background: t.color } as CSSProperties}
            />
          ))}
        </div>
        <div className="lp-fits__copy mz-reveal">
          <h2 id="fits-title" className="lp-h2-light">
            <span className="lp-d lp-d--88 lp-d--bold">Every piece</span>
            <span className="lp-d lp-d--88 lp-d--light">fits.</span>
          </h2>
          <p>Your senses. Your focus. Your interests. Your routine. MOSAIC puts the pieces together around you, so the only challenge left is the fun one: the code.</p>
        </div>
      </div>
    </section>
  );
}
