import type { ConceptId } from './types.ts'
import type { LearningTheme } from './themes/types.ts'
import type { ExecutionTrace, TraceEvent } from './executionTrace.ts'
import { clampTraceStep } from './executionTrace.ts'

export type SimulationSource = 'output' | 'module-variable' | 'function-return' | 'loop-iteration'
export interface SimulationContract {
  source: SimulationSource
  label: string
  key?: string
  fallbackKey?: string
  functionName?: string
  details: Array<{ key: string; label: string }>
}

export interface WorldState {
  value: unknown
  available: boolean
  label: string
  source: SimulationSource
  sourceName: string
  details: Array<{ label: string; value: unknown }>
  recordedIterations: number
  totalRecordedIterations: number
  event: TraceEvent
}

export interface SimulationFrame {
  eventIndex: number
  state: WorldState
  reading?: unknown
  readingLabel?: string
  scoreDelta?: number
  description: string
  progress: number
}

const seriesPresentation: Record<LearningTheme['id'], { reading: string; processed: string }> = {
  basketball: { reading: 'Game score', processed: 'Games processed' },
  space: { reading: 'Signal reading', processed: 'Signal readings processed' },
  ocean: { reading: 'Observation depth (m)', processed: 'Depth observations processed' },
  trains: { reading: 'Station delay (min)', processed: 'Stations processed' },
  animals: { reading: 'Daily sightings', processed: 'Days processed' },
  music: { reading: 'Track length (min)', processed: 'Tracks processed' },
}

export function simulationValueText(value: unknown): string {
  if (value === null) return 'None'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.length <= 4 ? value.map(simulationValueText).join(', ') : `${value.length} items`
  if (typeof value === 'object') return `${Object.keys(value).length} recorded fields`
  return 'No value recorded'
}

/** These visual scales never alter the exact Python value shown in the readout. */
export function signalMeterPercent(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null
}

export function oceanDepthPosition(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? 82 + Math.max(0, Math.min(30, value)) * 1.7 : 105
}

/** Each lesson reads a named value, named function result, actual output, or observed loop events. */
export function simulationContract(theme: LearningTheme | null, conceptId: ConceptId): SimulationContract {
  if (!theme) return { source: 'output', label: 'Program output', details: [] }
  const [name, peer, metric, peerMetric, person, stat] = theme.fields
  switch (conceptId) {
    case 'hello-python': return { source: 'output', label: 'Project introduction', details: [] }
    case 'variables': return { source: 'module-variable', label: metric.label, key: metric.key, fallbackKey: theme.id === 'basketball' ? 'total' : undefined,
      details: [name, peer, peerMetric, person, stat].map((field) => ({ key: field.key, label: field.label })) }
    case 'conditions': return { source: 'module-variable', label: 'Current decision', key: 'status', details: [{ key: 'goal_status', label: 'Goal decision' }, { key: metric.key, label: metric.label }, { key: peerMetric.key, label: peerMetric.label }] }
    case 'loops': return { source: 'module-variable', label: theme.series.totalLabel, key: theme.series.totalKey, fallbackKey: 'total', details: [{ key: theme.series.key, label: 'Values to process' }, { key: theme.series.countKey, label: theme.series.countLabel }] }
    case 'functions': return { source: 'function-return', label: theme.calculator.label, functionName: theme.calculator.name, details: [] }
    case 'lists': return { source: 'function-return', label: 'Collection returned', functionName: 'extend_collection', details: [] }
    case 'strings': return { source: 'function-return', label: 'Cleaned label returned', functionName: 'clean_label', details: [] }
    case 'dictionaries': return { source: 'function-return', label: 'Record returned', functionName: 'make_record', details: [] }
    case 'user-input': return { source: 'function-return', label: 'Entry returned', functionName: 'read_entry', details: [] }
    case 'numbers': return { source: 'function-return', label: 'Average returned', functionName: 'calculate_average', details: [] }
    case 'combining-concepts': return { source: 'function-return', label: 'Analysis returned', functionName: 'analyze', details: [] }
    case 'final-project': return { source: 'function-return', label: 'Project report returned', functionName: 'build_report', details: [] }
  }
}

const last = <T,>(values: T[], match: (value: T) => boolean): T | undefined => {
  for (let index = values.length - 1; index >= 0; index--) if (match(values[index])) return values[index]
  return undefined
}

export function worldStateAt(trace: ExecutionTrace, step: number, theme: LearningTheme | null, conceptId: ConceptId): WorldState | null {
  if (!trace.events.length) return null
  const index = clampTraceStep(step, trace)
  const events = trace.events.slice(0, index + 1)
  const event = trace.events[index]
  const contract = simulationContract(theme, conceptId)
  const moduleEvent = last(events, (item) => item.scope === '<module>')
  const isSeriesIteration = (item: TraceEvent) => conceptId === 'loops' && theme && item.loopIteration?.source === theme.series.key
  const recordedIterations = events.filter(isSeriesIteration).length
  const totalRecordedIterations = trace.events.filter(isSeriesIteration).length
  let value: unknown
  let sourceName = ''
  const details: WorldState['details'] = []

  if (contract.source === 'output') {
    value = event.output.trimEnd() || undefined
    sourceName = 'actual printed output'
  } else if (contract.source === 'module-variable') {
    const variables = moduleEvent?.variables ?? {}
    const key = contract.key && Object.hasOwn(variables, contract.key) ? contract.key : contract.fallbackKey && Object.hasOwn(variables, contract.fallbackKey) ? contract.fallbackKey : undefined
    if (key) { value = variables[key]; sourceName = `module variable ${key}` }
    for (const item of contract.details) if (Object.hasOwn(variables, item.key)) details.push({ label: item.label, value: variables[item.key] })
    if (value === undefined && conceptId === 'loops' && recordedIterations > 0) {
      value = recordedIterations
      sourceName = `observed loop iterations over ${theme?.series.key}`
    }
  } else if (contract.source === 'function-return') {
    const returnEvent = last(events, (item) => item.kind === 'return' && item.scope === contract.functionName && Object.hasOwn(item, 'returnValue'))
    if (returnEvent) { value = returnEvent.returnValue; sourceName = `return value from ${contract.functionName}()` }
  }

  const observedLoop = sourceName.startsWith('observed loop iterations over ')
  return { value, available: value !== undefined && value !== '<value not shown>' && value !== '<collection too large to show>' && value !== '<dictionary too large to show>', label: observedLoop && theme ? seriesPresentation[theme.id].processed : contract.label,
    source: observedLoop ? 'loop-iteration' : contract.source,
    sourceName, details, recordedIterations, totalRecordedIterations, event }
}

function readingAt(event: TraceEvent, theme: LearningTheme | null, conceptId: ConceptId): unknown {
  // A themed reading is shown only for `for item in theme.series.key`, as recorded by Python's trace hook.
  // Other loops and arbitrary numeric locals are never treated as project observations.
  if (conceptId !== 'loops' || !theme || event.loopIteration?.source !== theme.series.key || !event.loopIteration.item) return undefined
  const value = event.variables[event.loopIteration.item]
  return value === '<value not shown>' || value === '<collection too large to show>' ? undefined : value
}

/** Select observed changes, not every Python line. Every frame refers to a real trace event. */
export function simulationFrames(trace: ExecutionTrace, theme: LearningTheme | null, conceptId: ConceptId): SimulationFrame[] {
  const candidates: Omit<SimulationFrame, 'progress'>[] = []
  let previousValue = ''
  let previousScore: number | undefined
  let latestReading: unknown
  let latestReadingLabel: string | undefined
  for (let index = 0; index < trace.events.length; index++) {
    const state = worldStateAt(trace, index, theme, conceptId)
    if (!state) continue
    const event = trace.events[index]
    const reading = readingAt(event, theme, conceptId)
    const score = theme?.id === 'basketball' && state.source === 'module-variable' && typeof state.value === 'number' ? state.value : undefined
    const scoreDelta = score !== undefined && previousScore !== undefined ? score - previousScore : undefined
    if (score !== undefined) previousScore = score
    if (reading !== undefined && theme) { latestReading = reading; latestReadingLabel = seriesPresentation[theme.id].reading }
    const valueSignature = JSON.stringify([state.available ? state.value : undefined, state.details])
    const valueChanged = valueSignature !== previousValue
    previousValue = valueSignature
    const meaningful = reading !== undefined || Boolean(event.decision || event.error) ||
      (state.available && valueChanged) || (event.outputChanged && simulationContract(theme, conceptId).source === 'output')
    if (!meaningful) continue
    const description = event.error ? `Python stopped: ${event.error}`
      : reading !== undefined ? `${latestReadingLabel}: ${simulationValueText(reading)}. Your loop processed this recorded value.`
        : scoreDelta !== undefined && scoreDelta > 0 ? `${state.label} increased by ${scoreDelta} to ${simulationValueText(state.value)}.`
        : event.decision ? `Your condition followed the ${event.decision.branch === 'if' ? 'if' : 'else'} path.`
          : state.available ? `${state.label}: ${simulationValueText(state.value)}.`
            : 'Your program printed a message.'
    candidates.push({ eventIndex: index, state, reading: latestReading, readingLabel: latestReadingLabel, scoreDelta, description })
  }
  if (!candidates.some((frame) => frame.state.available || frame.reading !== undefined)) return []
  // Long traces stay watchable; selected frames still come only from actual execution.
  const maxFrames = 28
  const selected = candidates.length <= maxFrames ? candidates : Array.from({ length: maxFrames }, (_, index) => candidates[Math.round(index * (candidates.length - 1) / (maxFrames - 1))])
  return selected.map((frame, index) => ({ ...frame, progress: (index + 1) / selected.length }))
}
