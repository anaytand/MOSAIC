# Phase 4 — Themed learning and sensory personalization

## Milestone results

1. **Basketball reference journey:** added a typed theme catalog and one lesson provider. The Mosaic Falcons project introduces the team, builds a scoreboard, tests referee decisions with alternate scores, processes a team season, and calculates Jordan’s individual averages. The variables checker returns a structured project snapshot after validating variable types, values, source usage, and output. Milestone verification: 37 tests passed, ESLint clean, production build passed.
2. **Five additional journeys:** space, ocean, trains, animals, and music each define project data, narratives, chapter titles, milestones, completion copy, palettes, and illustration identity. Shared templates produce all 90 combinations of six themes, five concepts, and three guidance levels. Milestone verification: 40 tests passed, ESLint clean, production build passed.
3. **Sensory Profile Matcher:** five optional, individually focused screens cover intensity, display, text, motion/sound, and layout. The matcher is embedded in onboarding and can be opened from Settings or the workspace Aa control. Preferences apply globally, remain adjustable, and persist with compatible defaults. Milestone verification: 44 tests passed, ESLint clean, production build passed.
4. **Polish and regression:** strengthened loop checks with changed input data, separated carried-over concept completion from theme project milestones, preserved long historical custom-topic draft keys, and checked project rendering and execution errors after printed output. Final automated results: **48 tests passed; ESLint and production build passed**. Browser verification remains pending as described below.

## Architecture

`themes/catalog.ts` stores strongly typed content and palettes. `themes/lessons.ts` compiles a theme, concept, and difficulty into the existing `PythonLesson` interface. Stable concept IDs continue to drive the unchanged mastery algorithm and dependency graph. Theme changes never reset attempts, completions, or difficulty preferences.

The previous lesson provider remains available for older custom-topic examples and regression compatibility. The UI uses `getLearningLesson()` to select the immersive provider for supported themes. Basketball is also selected for legacy Sports preferences and a custom interest exactly named basketball. Other custom interests retain their original personalized examples; the UI explains that the six listed themes have complete project journeys.

```text
Theme content + concept + guidance → PythonLesson
                                           ↓
Monaco → Pyodide worker → real stdout/error → trusted Python checker
                                           ↓
                     checked attempt + optional structured project data
                                           ↓
                existing adaptive engine + localStorage + React UI
```

`pythonExecution.ts` contains the actual Python execution program used by the worker and regression tests. Legacy two-value checker results remain supported. A successful project checker can also return a third value: a versioned, bounded project snapshot. The browser validates this snapshot against the selected theme’s explicit field contract. Failed execution, incorrect variables, or arbitrary JSON-looking stdout cannot generate a preview. The displayed preview is labeled **Last validated Python run** and can remain visible after later unsuccessful runs.

Only the variables project currently produces a visual snapshot. Other missions contribute checked milestones and reusable Python skills; their program output remains in the real console. These are predefined learning contracts rather than an arbitrary Python-state visualizer.

## Data and draft compatibility

- Existing `mosaic-preferences`, `mosaic-learning-v1`, and legacy fallback keys are retained.
- `colorIntensity` defaults to balanced; `soundEffects` defaults to false. Existing theme, font, contrast, motion, density, focus, and guidance choices remain supported.
- Learning data adds a compatible `projectSnapshots` map. Stored snapshots are validated on load; invalid ones are discarded without discarding progress.
- New exercise drafts use `journey-v1:<theme>:<concept>:<level>` keys. Old drafts are preserved and are not silently loaded into a different task.
- The workspace offers a named saved-draft selector and a confirmed **Load a copy** action. The original remains stored.
- Python concept completion is global. Theme milestones are credited only for actual completions within that theme, so switching to space does not falsely claim that a space project was built.

## Sensory behavior

Global root attributes and CSS variables apply intensity and display choices to Home, Learn, Progress, Settings, and the workspace. Calm hides decorative illustrations and uses quiet surfaces; Balanced uses soft illustrations; Vibrant adds richer theme accents and colored card boundaries. Text sizing changes the interface and resets the editor’s manual size override to the selected scale. Existing explicit editor sizing is otherwise preserved.

Reduced motion respects both the saved choice and system preference, including system changes while the app is open. Simplified Focus View keeps Lesson, Code, and Output in tabs; all functions remain accessible. Optional audio is a brief low-gain completion tone, enabled only by user choice. It is prepared on an explicit Run action, never automatically on page load. A separate Try Sound button is available only after opt-in. Unsupported audio fails gracefully.

## Branding

The repository contains the four-tile wordmark in `components/Brand.tsx` and a starter Vite favicon; no identifiable official MOSAIC logo asset was found. Confirmation of the official logo/source was requested. The existing MOSAIC wordmark was preserved, and no replacement logo was created. Theme illustration accents are independent of the wordmark. Official logo/favicon alignment remains pending its source.

## Files created

- `src/themes/types.ts`, `catalog.ts`, `lessons.ts`, `projects.ts`, `drafts.ts`
- `src/pythonExecution.ts`, `src/sensory.ts`, `src/sound.ts`
- `src/components/ThemeArt.tsx`, `ThemeJourney.tsx`, `ProjectPreview.tsx`, `SensoryMatcher.tsx`
- `src/styles/journey.css`
- `tests/themes.test.mjs`, `tests/sensory.test.mjs`
- `PHASE4.md`

## Files modified

- `src/App.tsx`, `src/types.ts`, `src/preferences.ts`, `src/navigation.ts`, `src/lessons.ts`
- `src/adaptive.ts` (empty-record snapshot default only; scoring rules retained)
- `src/workers/python.worker.ts`
- `src/components/Workspace.tsx`, `LearningPages.tsx`, `PreferenceForm.tsx`, `Onboarding.tsx`, `SettingsPage.tsx`, `ConfirmDialog.tsx`, `ExecutionFeedback.tsx`
- `tests/ui.test.mjs`, `README.md`, `ADAPTIVE_ENGINE.md`

## Verification and local browser checklist

Use Node 24+ and Python 3. Run `npm test`, `npm run lint`, and `npm run build`. Tests execute all 90 themed lesson variants against both starters and working solutions through the same Python program that the worker uses. They also retain the 105 legacy variant checks, score/progress tests, theme-switch tests, snapshot rejection tests, preference migration, editor font sizing, system reduced motion, rendering states, and color contrast checks.

This test execution uses local CPython; it does not replace a browser check of the CDN-loaded Pyodide WASM runtime or Monaco. Vite startup was attempted here but local TCP listening was denied with `EPERM` on 127.0.0.1:5173. Interactive responsive, keyboard, screen-reader, and audio verification therefore remains required before claiming completed end-to-end review or WCAG conformance.

To view locally, run `npm run dev` from the MOSAIC directory and open Vite’s printed URL. Use a private window for fresh-user checks without deleting saved progress:

1. Choose Basketball and Step by Step. Complete the two-line Falcons introduction.
2. Open Build a Scoreboard, change the starter’s `team_score` from 0 to 24, and run. Confirm the actual output, completed mission, and validated 24–18 scoreboard.
3. Work through decisions, season loops, and the player calculator. Re-running a completed challenge should not duplicate completion credit.
4. Switch to Space. Concept mastery should carry over; space project milestones should remain unbuilt until their own tasks pass. Old basketball drafts should still be selectable as copies.
5. Open Sensory Profile Matcher from Settings or workspace Aa. Try all intensity/display/text options, sound off/on with its explicit preview, and Simplified Focus View. Refresh and confirm persistence.
6. Check all six themes at desktop, tablet, and mobile widths; use keyboard only, 200% text zoom, reduced motion, and a screen reader. Verify errors after correct printed output never complete the task.
