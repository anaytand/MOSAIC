# Phase 5 — Sensory controls and decorative motion

## Scope and audit

Completed **Milestones 1 and 2 only**. Milestones 3 and 4 have not started and await review.

Before this change, preferences offered three named color presets, boolean reduced motion, and boolean sound. Home/Settings had a three-position intensity slider. Audio was a single fixed-gain completion tone. The original reference's marquee/floating/scroll animations had deliberately not been imported during the previous visual migration.

The current design, original reference SVG paths, logo, curriculum, assessment rules, Pyodide worker, Monaco lifecycle, mastery engine, and learning storage remain. No new animation library or service was added.

## Milestone 1: complete sensory controls

- Shared `SensoryControls` appears in the existing reference cards on Home and Settings. Guided setup uses the same controls, divided across its focused questions. The workspace Aa control still opens the matcher and returns to the lesson.
- Sound volume 0–100%, visible percentage, separate Mute/Unmute button, and Test Sound. Completion sound is available after unmuting. Interaction and successful-run sounds are separately optional and default off. Errors never produce an execution/completion sound.
- Color intensity 0–100%. Decorative backgrounds, SVG paints, logo-tile compositions, theme-card surfaces, and progress fills blend using centralized variables. At 100%, original reference background colors return. No whole-page filter/opacity changes or modifications to text, code, focus-ring, or control colors are used.
- Motion intensity 0–100%, with a visible percentage and explicit device-preference policy. Zero motion is static. Moving the slider records a custom choice; a labeled checkbox restores following the device's reduced-motion setting.
- Visual density slider: Minimal / Balanced / Detailed. Minimal hides nonessential decoration and uses one workspace panel at a time. Detailed initially expands authored examples/explanations; it never automatically reveals hints. Navigation, tasks, code, output, guidance, and controls remain available. The existing independent compact/spacious setting remains.
- Existing display, high contrast, and text sizing remain. Text changes still reach Monaco.
- A shared live preview shows background, repeated typography, the original robot, a lesson card, and density. It explicitly identifies itself as a style preview.

**Checkpoint:** 62 tests passed; ESLint and production build passed before Milestone 2 began.

## Milestone 2: typography, scenes, robot

- Three repeated hero wordmark layers translate horizontally at different rates. Each repeats identical text for a continuous loop. Space is slowest; the other worlds have modest rate differences. The hero and preview clip their decorative content, which stays behind readable content.
- Existing ocean illustrations drift and hills move slightly like waves. Space planets/stars drift without opacity flashing. Basketball, wildlife, music, and trains use restrained floating/lateral movement. No looping scale pulse, strobe, parallax, or code animation is added.
- `RobotMascot` uses the original SVG paths, coordinates, gradients, and tile colors, with unique gradient IDs for each instance. Optional groups animate the arm, eyes, and antenna.
- Home and live preview allow gentle floating and occasional blinking. Onboarding welcome, lesson introduction, completion, and requested hints get brief reactions. Workspace mascots do not continuously float or blink and remain outside Monaco.
- `MotionRegion` and mascot visibility observers pause CSS animation offscreen and while the tab is hidden. They mutate visibility attributes without animation-frame loops or React state updates. Observers/listeners disconnect on unmount. Browsers without IntersectionObserver receive static artwork.
- CSS animations only activate after the resolved preference says motion is enabled. Before preferences/visibility resolve, content remains static and visible. Reduced/zero motion disables animation; the device media rule applies by default and permits the explicit custom setting.

**Checkpoint:** 68 tests passed; ESLint and production build passed.

## Architecture

```text
Saved preferences (mosaic-preferences, sensoryVersion: 2)
            │
            ├─ SensoryControls + guided matcher → central App preference state
            │
            ├─ sensory.ts → attributes for display, density, text, effective view
            ├─ sensoryVisuals.ts → decorative palette variables
            ├─ motion.ts → resolved intensity, amplitude, duration and easing
            │       └─ motion.css → existing wordmarks/scenes + original RobotMascot
            │               └─ motionActivity.ts → viewport/tab pause + cleanup
            └─ SoundEngine → lazy AudioContext → one master volume → effect envelopes

Lesson execution → existing real result/validator → existing progress/mastery
                          └─ optional sound classification + original mascot reaction
```

Sound context creation/resume happens only after an explicit user action, such as Test Sound, an opted-in button action, or Run Code. Merely loading, configuring settings, moving a slider, or navigating via saved state does not play audio. One master gain limits full-volume peak gain to 0.035, with short sine tones and gentle envelopes. Volume changes ramp smoothly; mute/zero immediately sets gain to zero and stops active oscillators. Ended oscillators/envelopes disconnect. App teardown closes the context. Rapid overlapping requests coalesce with at most two active oscillator voices, preventing stacked tones from becoming a loud chord. This is application volume, not a claim about physical speaker loudness.

Motion uses transform/translate/rotate/scale only on decorative typography, SVG groups, and mascots. Eye blinking changes just the small eye shapes. Shared duration/amplitude values are resolved in `motion.ts`. There are no new route/content entrance, dashboard-card, progress-bar transition, or workspace-panel animations in this checkpoint.

## Saved preference compatibility

The existing `mosaic-preferences` key is retained. New numeric values are clamped to 0–100 and saved with `sensoryVersion: 2`. Invalid/missing fields recover safely.

- Old Calm/Balanced/Vibrant becomes 0/50/100 color.
- Old reduced motion becomes custom 0% motion; otherwise the default is 50% with device preference following.
- Old enabled sound stays unmuted at a gentle 35% default; otherwise sound is muted. New learners start muted.
- Legacy Calm or Simplified View maps to Minimal density. Existing high contrast, interest/custom topic, font size, editor size, focus, and spacing remain.
- Old compatibility fields remain for existing controls. New controls update them alongside numeric fields.
- Learning data (`mosaic-learning-v1`), attempts, completed exercises, mastery, recommendations, snapshots, and saved code drafts are not migrated, reset, or rewritten by sensory controls.

## Files created

- `src/motion.ts`: centralized tokens and system/custom resolution.
- `src/motionActivity.ts`: offscreen/tab pausing and cleanup.
- `src/sensoryVisuals.ts`: safe decorative color blending.
- `src/components/SensoryControls.tsx`: reusable numeric sliders and sound controls.
- `src/components/SensoryPreview.tsx`: honest shared live preview.
- `src/components/MotionRegion.tsx`: visibility boundary.
- `src/components/RobotMascot.tsx`: original artwork with isolated animation groups.
- `src/styles/sensory.css`, `src/styles/motion.css`: controls, preview, density, and decorative animation.
- `tests/phase5-sensory.test.mjs`, `tests/phase5-motion.test.mjs`: sensory/audio/motion regression checks.
- `PHASE5_MILESTONES_1_2.md`: this checkpoint report.

## Files modified

- `src/types.ts`, `src/preferences.ts`: typed numeric fields and compatible loading.
- `src/sensory.ts`: shared preference updates and effective attributes.
- `src/sound.ts`: lazy shared audio engine and execution-effect classification.
- `src/App.tsx`: central variables, audio configuration/teardown, optional interaction audio.
- `src/index.css`: device reduced-motion default with explicit custom override.
- `src/design/worlds.ts`: explicit TS import extensions for standalone pure-logic tests.
- `src/components/reference/SensoryCards.tsx`: shared controls/preview in existing cards.
- `src/components/reference/ReferenceHome.tsx`: numeric palette and motion boundaries/mascot.
- `src/components/reference/Scenes.tsx`, `src/components/reference/Fits.tsx`, `src/components/ThemeArt.tsx`: decorative color tokens and isolated scene groups.
- `src/components/SensoryMatcher.tsx`, `src/components/PreferenceForm.tsx`: compatible shared controls.
- `src/components/Onboarding.tsx`: original welcome reaction and accurate numeric summary.
- `src/components/Workspace.tsx`: optional honest audio, mascot events, and density behavior; editor/worker/validation controllers preserved.
- `src/components/ExecutionFeedback.tsx`: original completion reaction.
- `src/styles/journey.css`, `src/styles/reference.css`: density owns visual complexity instead of color intensity; compatible dark variables.
- `tests/reference-design.test.mjs`: numeric shared-control regression.
- `README.md`: latest checkpoint link and test count.

## Verification results

- `npm test`: **68 passing tests**, including all existing adaptive/lesson/worker-source/persistence regressions.
- `npm run lint`: passes.
- `npm run build`: passes.
- New tests verify master gain actually follows volume for all effect types, mute/zero silence, lazy/no-autoplay audio, effect opt-ins, error silence, migration, refresh, bounds, motion overrides, contrast at 0/25/50/75/100 in all six light/dark themes, offscreen/hidden-tab pausing, cleanup, static fallback, unique SVG IDs, and preservation of original robot geometry/colors.

Audio unit tests use a Web Audio test double that records gain schedules, oscillator lifetime, and lazy context creation. Python tests execute the worker's Python/checker source in local CPython. React rendering and control callback tests cover UI structure and preference wiring. These are not audible playback, browser WASM, visual smoothness, screen-reader, or layout tests.

Browser verification was attempted again: Vite was denied its local socket with `EPERM` at `127.0.0.1:5173`, and Chrome exited 134 even for `about:blank`. Consequently no browser screenshot, audible playback, actual offscreen GPU profiling, keyboard interaction, viewport render, or end-to-end Monaco/Pyodide check could be completed here. Browser smoothness and responsive behavior require local review.

## Local review before Milestone 3

```sh
cd /Users/anaytandon/MOSAIC
npm run dev
```

1. Open Home or Settings. Move color through 0/50/100 and compare hero backgrounds, illustrations, lesson surfaces, tile art, and progress fills. Check that text and focus indicators remain readable.
2. Verify sound starts muted. Unmute, set 10/50/100%, and use Test Sound. Set 0% and mute: every effect must be silent. Reload: no sound should play on load.
3. Optionally enable button and successful-run sounds. Run incorrect Python: no error sound. Run valid but incomplete code: only the optional execution tone. Complete a challenge: the completion tone. Re-run it: no new completion credit.
4. Move motion through 0/25/50/100. At 0 all movement stops. At higher levels compare typography speed, robot float amplitude, planets, fish, notes, court and train decorations.
5. Enable system reduced motion and select Follow device. Animation stops. Explicitly choose a nonzero slider value to test the custom override; restore Follow device or 0% afterward.
6. Scroll the hero offscreen and hide/reopen the tab; decorative motion should pause/resume without resetting lesson state.
7. Check welcome/lesson/completion/hint mascot reactions. In the editor, type, select text, scroll, run, request hints, and continue. No code animation, editor remount, or continuous in-editor mascot movement should occur.
8. Choose Minimal, Balanced, and Detailed. Check one-panel access in Minimal and optional explanations in Detailed. The Simplified View checkbox reflects Minimal and can return to Balanced. No mastery or draft changes should result.
9. Refresh and switch themes. Settings, concept progress, and theme-specific drafts should remain. Check light/dark/high contrast, larger text, keyboard-only controls, tablet, and mobile.

**Awaiting review:** Milestone 3 shared route/content/panel transitions and Milestone 4 performance/responsive/accessibility polish are intentionally deferred.
