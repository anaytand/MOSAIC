import type { ConceptId, Difficulty, UserPreferences } from './types.ts'
export const guidanceLabels: Record<Difficulty, string> = { guided: 'Step by Step', independent: 'Balanced', challenge: 'Explore' }
export const conceptDescriptions: Record<ConceptId, string> = {
  'hello-python': 'Display your first message with print().', variables: 'Give values a name and use them in your code.',
  conditions: 'Make decisions with if and else.', loops: 'Repeat an action with a for loop.', functions: 'Create reusable code with functions.', lists: 'Collect and extend related values in lists.', strings: 'Clean and format text with string methods.', dictionaries: 'Connect names and values in records.', 'user-input': 'Read queued learner input with input().', numbers: 'Calculate and round useful measurements.', 'combining-concepts': 'Combine loops, conditions, and records.', 'final-project': 'Build a reusable themed reporting application.',
}
export function interestLabel(preferences: UserPreferences): string {
  if (preferences.interest === 'custom') return preferences.customTopic || 'Your topic'
  if (!preferences.interest) return 'Ocean (default)'
  const label = preferences.interest
  return label.charAt(0).toUpperCase() + label.slice(1)
}
