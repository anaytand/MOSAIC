export type KeyboardColor = 'mint' | 'lavender' | 'sky' | 'peach'
export type MacroKey = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'F1' | 'F2' | 'F3' | 'F4'

export interface MacroDefinition {
  key: MacroKey
  label: string
  description: string
  preview: string
  kind: 'template' | 'action'
}

export const keyboardColors: { id: KeyboardColor; label: string }[] = [
  { id: 'mint', label: 'Soft mint' }, { id: 'lavender', label: 'Lavender' },
  { id: 'sky', label: 'Sky blue' }, { id: 'peach', label: 'Warm peach' },
]

/** Proposed defaults. These previews do not change the live Python editor. */
export const macroKeys: MacroDefinition[] = [
  { key: 'M1', label: 'print()', description: 'Start a print statement. The insertion point would sit between the parentheses.', preview: 'print(▏)', kind: 'template' },
  { key: 'M2', label: 'if condition:', description: 'Start an if statement with an editable condition and indented body.', preview: 'if ▏condition:\n    pass', kind: 'template' },
  { key: 'M3', label: 'for item in items:', description: 'Start a for loop with editable names and an indented body.', preview: 'for ▏item in items:\n    pass', kind: 'template' },
  { key: 'M4', label: 'while condition:', description: 'Start a while loop with an editable condition.', preview: 'while ▏condition:\n    pass', kind: 'template' },
  { key: 'M5', label: 'def function_name():', description: 'Start a function definition with an editable name and body.', preview: 'def ▏function_name():\n    pass', kind: 'template' },
  { key: 'M6', label: 'input()', description: 'Start an input call, with the insertion point inside the parentheses.', preview: 'input(▏)', kind: 'template' },
  { key: 'F1', label: 'Run Code', description: 'Proposed command to run the code currently in the MOSAIC editor.', preview: 'Run Code would be requested. No Python runs in this preview.', kind: 'action' },
  { key: 'F2', label: 'Explain Code', description: 'Proposed command to open the current lesson explanation.', preview: 'Explain Code would open lesson guidance.', kind: 'action' },
  { key: 'F3', label: 'Get a Hint', description: 'Proposed command to request the next optional lesson hint.', preview: 'Get a Hint would reveal optional guidance.', kind: 'action' },
  { key: 'F4', label: 'Save Progress', description: 'Proposed command to save the current lesson and code draft.', preview: 'Save Progress would be requested.', kind: 'action' },
]

export function immersionLabel(value: number): 'Chill' | 'Balanced' | 'Immersive' {
  return value < 34 ? 'Chill' : value < 67 ? 'Balanced' : 'Immersive'
}

export interface KeyboardInterestInput {
  fullName: string
  email: string
  quantity: number
  preferredColor: KeyboardColor
  comments: string
  acknowledged: boolean
}

export function validateKeyboardInterest(input: KeyboardInterestInput): string | null {
  if (input.fullName.trim().length < 2 || input.fullName.trim().length > 100) return 'Enter your full name (2–100 characters).'
  if (input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return 'Enter a valid email address.'
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 10) return 'Choose a quantity from 1 to 10.'
  if (!keyboardColors.some((color) => color.id === input.preferredColor)) return 'Choose one of the available color previews.'
  if (input.comments.length > 1000) return 'Keep comments under 1,000 characters.'
  if (!input.acknowledged) return 'Please confirm that this is an interest request, not a purchase.'
  return null
}
