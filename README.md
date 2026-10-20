# MOSAIC

MOSAIC is an accessible, interest-based Python learning space built with React, TypeScript, and Vite. Learners can choose a topic and visual preferences, write and run Python in a Monaco-based editor, ask for authored hints, and track progress across twelve beginner concepts. Python runs in a Pyodide Web Worker with an eight-second execution limit.

## Run locally

Use Node 24 or newer and Python 3 for the validation tests. From this directory:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Monaco and Pyodide load from pinned CDNs, so the editor and Python runtime require a network connection.

## Check the implementation

```sh
npm test
npm run lint
npm run build
```

The automated suite covers adaptive scoring, persistence, 216 immersive theme/lesson/guidance combinations, 105 legacy lesson variants, authentication flows, structured project data, rendered UI, sensory preferences, navigation, and contrast. See [ADAPTIVE_ENGINE.md](./ADAPTIVE_ENGINE.md) for the scoring formula and data flow.

Use Home to start optional setup, Learn to browse the roadmap, and Progress to see your learning record. A lesson workspace uses Lesson, Code, and Output tabs on smaller screens, in focus mode, and in Simplified View. The current screen and saved lesson resume after refresh. See [UI_REDESIGN.md](./UI_REDESIGN.md) for the design audit and browser verification checklist.

To try adaptation manually, choose an interest, open Learn, select a lesson, and run a challenge. Request one or more hints and compare the mastery estimate on Progress with an independently solved challenge. Try two unsuccessful conditions submissions after completing variables; Conditions should be recommended for reinforcement. Change the difficulty selector or interest, then refresh to confirm the saved draft, override, and progress return.

Learning data and preferences stay in this browser's localStorage. They are not synced or backed up. No AI service is used in this version.

## Optional accounts

The profile menu supports Supabase email/password registration, confirmation, login, password recovery, and sign-out. MOSAIC remains usable as a guest. Accounts do not sync learning progress yet; signing out leaves local lessons, code drafts, and sensory settings in place. See [AUTH_SETUP.md](./AUTH_SETUP.md) for Supabase redirect configuration and a manual test sequence.

## Teammate reference design

The landing page now reuses the original logo, robot, illustrated worlds, Lexend typography, and rounded sections from `mosaic-reference`. The floating world picker changes real lesson interests. Home and Settings share working sensory cards. The four-stage visual roadmap keeps Python available and clearly labels other stages upcoming.

See [REFERENCE_MIGRATION.md](./REFERENCE_MIGRATION.md) for the audit, every changed file, stage results, local comparison instructions, and browser verification limits. Existing learning data and Python execution controllers are preserved.

## Immersive theme journeys

Choose Basketball, Space, Ocean, Trains, Animals, or Music in setup or Settings. Each has a connected twelve-mission project, themed learning path, and a real validated variable-data preview. Basketball’s reference project is the Mosaic Falcons season hub. Existing concept mastery carries across themes, while project milestones remain specific to the theme.

The optional Sensory Profile Matcher is available during setup, from Settings, and through Aa in the workspace. Calm/Balanced/Vibrant colors, display contrast, text sizing, motion, optional sound, and Simplified Focus View save locally. Sound defaults off.

See [PHASE4.md](./PHASE4.md) for milestone results, architecture, the complete file list, draft compatibility, logo status, and remaining browser checks.

## Phase 5 review checkpoint

Milestones 1 and 2 add persistent numeric sound/color/motion controls, visual density, a live preview, and optional motion for the original robot and background scenes. Sound starts muted. Device reduced motion is followed by default, with an explicit custom setting available. Motion at 0% stays static.

See [PHASE5_MILESTONES_1_2.md](./PHASE5_MILESTONES_1_2.md) for the changed files, migration rules, test results, browser limitations, and local review steps. Milestones 3 and 4 await review.

## Phase 6

The optional companion now follows the selected interest and gives authored, active-lesson guidance. Original ambient music has explicit play/pause, volume, mute, execution pause, and stop-all controls. The Python path now contains twelve concepts, including real queued `input()` and a themed final reporting project. The Accessible Keyboard Program at `#keyboards` is informational with a disabled coming-soon registration preview; no contact information is collected.

See [PHASE6.md](./PHASE6.md) for milestone results, every changed file, data compatibility, audio provenance, tests, local review steps, and remaining browser verification.
