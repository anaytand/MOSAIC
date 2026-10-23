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
  const recordedIterations = events.filter((item) => item.loopIteration).length
  const totalRecordedIterations = trace.events.filter((item) => item.loopIteration).length
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
      sourceName = 'observed loop iterations'
    }
  } else if (contract.source === 'function-return') {
    const returnEvent = last(events, (item) => item.kind === 'return' && item.scope === contract.functionName && Object.hasOwn(item, 'returnValue'))
    if (returnEvent) { value = returnEvent.returnValue; sourceName = `return value from ${contract.functionName}()` }
  }

  return { value, available: value !== undefined && value !== '<value not shown>' && value !== '<collection too large to show>' && value !== '<dictionary too large to show>', label: sourceName === 'observed loop iterations' ? 'Observed loop iterations' : contract.label,
    source: value === recordedIterations && sourceName === 'observed loop iterations' ? 'loop-iteration' : contract.source,
    sourceName, details, recordedIterations, totalRecordedIterations, event }
}
