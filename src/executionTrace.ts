/** Bounded snapshots emitted by the real Python trace hook in the Pyodide worker. */
export interface TraceEvent {
  kind: 'line' | 'call' | 'return' | 'exception'
  line: number
  scope: string
  variables: Record<string, unknown>
  changes: Record<string, unknown>
  executedLine: number | null
  output: string
  outputChanged?: boolean
  outputPreviewTruncated?: boolean
  error?: string
  decision?: { line: number; branch: 'if' | 'else' }
  loopIteration?: { line: number; count: number; source?: string | null; item?: string | null }
  returnValue?: unknown
}

export interface ExecutionTrace {
  events: TraceEvent[]
  truncated: boolean
  outputTruncated: boolean
}

export const basketballScoreContracts = {
  variables: 'team_score',
  loops: 'season_points',
} as const

/** The public simulation contract is a module-level numeric `total`, or a lesson's documented score variable. */
export function basketballScoreVariable(conceptId: string, trace?: ExecutionTrace): string {
  const lessonVariable = basketballScoreContracts[conceptId as keyof typeof basketballScoreContracts]
  if (lessonVariable && trace?.events.some((event) => basketballScoreAt(event, lessonVariable) !== null)) return lessonVariable
  return 'total'
}

export function basketballScoreAt(event: TraceEvent, scoreVariable: string): number | null {
  if (event.scope !== '<module>') return null
  const value = event.variables[scoreVariable]
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 9999 ? value : null
}

export function basketballScoreHistory(trace: ExecutionTrace, scoreVariable: string): number[] {
  const values: number[] = []
  for (const event of trace.events) {
    const score = basketballScoreAt(event, scoreVariable)
    if (score !== null && values.at(-1) !== score) values.push(score)
  }
  return values
}

export function traceLine(event: TraceEvent): number {
  return Object.keys(event.changes).length > 0 && event.executedLine ? event.executedLine : event.line
}

export function clampTraceStep(step: number, trace: ExecutionTrace): number {
  return Math.max(0, Math.min(trace.events.length - 1, Math.trunc(step)))
}
