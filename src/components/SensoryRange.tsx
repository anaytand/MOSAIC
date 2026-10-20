import { useId } from 'react'

export function SensoryRange({ label, value, max = 100, valueText = `${value}%`, description, onChange }: { label: string; value: number; max?: number; valueText?: string; description?: string; onChange: (value: number) => void }) {
  const id = useId()
  return <div className="sensory-range"><label htmlFor={id}><span>{label}</span><output htmlFor={id}>{valueText}</output></label><input id={id} aria-label={label} aria-valuetext={valueText} aria-describedby={description ? `${id}-help` : undefined} type="range" min="0" max={max} step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} />{description && <small id={`${id}-help`}>{description}</small>}</div>
}
