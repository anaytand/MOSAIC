# MOSAIC adaptive learning engine

MOSAIC keeps sensory settings separate from learning performance. Interest and visual preferences live under `mosaic-preferences`; the versioned learning record lives under `mosaic-learning-v1`. No diagnosis or other medical information is stored. The older `mosaic-lesson-progress` record is read once as a fallback. Its drafts and completed concepts are kept, but missing historical attempts are never invented.

## Learning path and content

`src/lessons.ts` combines five curated concept templates, three difficulty variants, and seven interest contexts (105 combinations). Each generated lesson has an objective, concept ID, explanation, starter, expected behavior, three hints, and a Python checker. Interest changes only the context and expected values; the objective and task structure for a given concept and level stay the same. A custom topic is trimmed to 48 characters and encoded as a Python string literal. New lesson providers can implement the same `PythonLesson` interface without changing the workspace or learning engine.

The dependency path is Print Statements → Variables → Conditions → Loops → Functions. Learners can open any concept to review or explore. Two recent unsuccessful submissions for a concept prioritize another exercise on that concept. Otherwise, the next incomplete concept whose prerequisites are complete is recommended. Every recommendation includes a plain-language reason.

## Mastery estimate

For each concept, only checked Python submissions count as attempts. A passed exercise is a success; Python errors, timeouts, and failed challenge checks are unsuccessful. The score is deterministic:

- 40 points × all-time success fraction
- 35 points × success fraction over the last five attempts, weighted from oldest (1) to newest (up to 5)
- 15 points × number of distinct difficulty levels successfully completed ÷ 3
- 10 points × average independence on successful attempts, where each hint subtracts one third of that attempt's independence credit

The sum is multiplied by `min(1, attempt count ÷ 3)` and rounded. This limits how much a single attempt can imply. With no attempts, the score is zero. Time is recorded for continuity and never enters the score. The score is an estimate of performance on MOSAIC exercises, not a measure of intelligence or general coding ability.

Guided is suggested by default. Independent requires at least three attempts, two successes, two successes among the last three, and mastery ≥55. Challenge requires at least five attempts, four successes, two successes among the last three, and mastery ≥70. For a new concept, three recent successes across at least three completed concepts with at most one hint in total can suggest Independent; a new concept is never automatically set to Challenge. A manual level override takes precedence and remains saved until the learner clears it. Interest and sensory preferences do not affect these calculations.

## Data flow

```text
Learner code → Pyodide Web Worker → real output, error, challenge check
                                      ↓
                           attempt + error category
                                      ↓
                        versioned local learning record
                                      ↓
                  mastery + level + next lesson recommendation
                                      ↓
                         workspace and progress dashboard
```

Hints are revealed only on request and saved as events. The worker validates program behavior; a click on Run alone never completes an exercise. The workspace stores code drafts by concept, level, and interest so changing a topic does not remove other drafts or concept progress. Time is flushed periodically, on page hide, and when leaving a lesson. Saved data is validated on load, invalid entries are dropped, and the recommendation is recomputed. The record keeps at most 500 attempts and 1,000 hint events to bound local storage growth.

## Testing

Run `npm test`, `npm run lint`, and `npm run build`. The tests cover failures, independent and hinted successes, level progression, manual override, interest switching, refresh, review, migration, invalid data, failed execution, and time neutrality. They also run all 105 challenge checkers against untouched starters and working solutions using local Python. To explore manually, choose an interest, open Learn, run a solution, request hints or select a level, and inspect My Progress. Refresh and return to Learn to confirm the draft and learning record persist.

## Current limits

Data is local to one browser profile and does not sync across devices. The Python editor and runtime load CDN assets, so an internet connection is required the first time. The mastery estimate is a transparent classroom heuristic, not a validated psychometric measure. Browser execution still uses the Phase 2 Web Worker and its eight-second timeout; it needs a full browser check in an environment that permits local server listening and CDN access.
