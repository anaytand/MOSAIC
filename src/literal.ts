import type { ValidationMode } from './types.ts'

/**
 * Literal Mode: exact, plain wording. Removes filler words, praise and exclamation marks,
 * numbers every step, and states exactly what "done" looks like.
 */
const praise = /\b(nice work|great job|great work|awesome|well done|amazing|you got this)[!.,]?\s*/gi
const fillers = /\b(just|simply|basically|actually|really|quickly|easily|obviously)\s+/gi

export function literalText(text: string): string {
  if (!text) return text
  let out = text.replace(praise, '')
  out = out.replace(/\b[Ll]et[’']s\s+/g, '')
  out = out.replace(/\b[Tt]ry to\s+/g, '')
  out = out.replace(fillers, '')
  out = out.replace(/!+/g, '.')
  out = out.replace(/[ \t]{2,}/g, ' ').trim()
  return out.charAt(0).toUpperCase() + out.slice(1)
}

export function literalSteps(instructions: string[]): string[] {
  return instructions.map((step, index) => `Step ${index + 1} of ${instructions.length}: ${literalText(step)}`)
}

export function doneWhen(mode: ValidationMode): string {
  if (mode === 'exact-output') return 'Done when: your program prints exactly this output, in this order.'
  if (mode === 'required-line') return 'Done when: your output includes each of these lines. Extra lines are allowed.'
  return 'Done when: your code does what the example below shows.'
}
