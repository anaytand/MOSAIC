import Logo from './Logo'
export function StageRoadmap({ onPython }: { onPython: () => void }) {
  const stages = [
    { title: 'Blocks', text: 'Drag-and-drop logic. Learn how code thinks.', color: 'var(--deep)', available: false },
    { title: 'Python', text: 'Real code, one line at a time, themed to your interest.', color: 'var(--acct)', available: true },
    { title: 'JavaScript', text: 'Build things people can use on the web.', color: 'var(--acc2)', available: false },
    { title: 'Portfolio', text: 'A place to bring your projects together.', color: '#0F1A1F', available: false },
  ]
  return <section className="lp-path" aria-labelledby="stage-roadmap-heading"><div className="lp-container"><div className="lp-head"><h2 id="stage-roadmap-heading" className="lp-h2-light"><span className="lp-d lp-d--76 lp-d--bold">Every line of code</span><span className="lp-d lp-d--76 lp-d--light">leads somewhere.</span></h2><p>Start with twelve real Python lessons. More ways to create are on the horizon.</p></div><div className="lp-road"><div aria-hidden="true" className="lp-road__track"><div className="lp-road__fill" /></div><ol className="lp-road__steps">{stages.map((stage, index) => <li key={stage.title} className={`lp-road__step${stage.available ? ' stage-available' : ''}`}><span aria-hidden="true" className="lp-road__num" style={{ background: stage.color, color: index === 2 ? '#0F1A1F' : '#FFFFFF' }}>{index === 3 ? <Logo size={34} /> : `0${index + 1}`}</span><div className="lp-road__card"><b>{stage.title}</b><span>{stage.text}</span>{stage.available ? <button type="button" className="text-button" onClick={onPython}>Explore Python →</button> : <small className="stage-upcoming">Upcoming</small>}</div></li>)}</ol></div></div></section>
}
