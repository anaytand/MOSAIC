# MOSAIC UI redesign

## Audit and implementation

The original app already had a real Monaco editor, Pyodide worker, personalized Python validators, deterministic adaptive engine, progress storage, and sensory preferences. These services remain in place. The prior UI concentrated many screens in App.tsx, displayed the whole preference form at once, duplicated the lesson path and recommendations in the workspace, and used overlapping CSS overrides with small supporting text. Learn opened the editor directly without a clear overview. Focus mode could obscure the output panel.

The redesign establishes one visual system, focused optional setup, a task-oriented Home page, a Learn roadmap, a quieter workspace, and a dedicated Progress page. It keeps educational logic separate from view settings.

## Screens and controls

- Home uses actual active lesson content and saved draft code for its labeled preview. New learners see a clear start action; returning learners see real completion data and their current lesson.
- Learn shows the five existing concepts with Completed, Current lesson, and Upcoming labels. Every card supports Start, Continue, or Review. The existing engine supplies the recommendation and explanation.
- Setup has four focused screens and a completion summary. It supports Back, Skip Setup, skipping questions, immediate preference previews, and resuming the current setup step during the browser session.
- Settings reuses interest, guidance, and visual preference controls. Step by Step, Balanced, and Explore map directly to the existing guided, independent, and challenge levels. Automatic recommendations remain available.
- The workspace keeps Monaco and the existing worker. The task is visible by default; examples and explanations expand on request. Desktop panels can collapse. After a run, the console opens and differentiates execution errors, incomplete tasks, and checked completion. The next action names the recommended concept.
- Smaller screens, Simplified View, and focus mode use Lesson, Code, and Output tabs. All panels remain mounted so changing tabs preserves the editor. Hints are disclosed on request, with saved usage retained. Reset uses a native confirmation dialog.
- Run Code supports Ctrl+Enter or Command+Enter while focus is in the workspace. Visible and screen-reader editor guidance explains how to release Tab focus using the shortcuts documented in [Monaco’s accessibility guide](https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide). The editor options retain font sizing and runtime restart. Preferences remain accessible from the header and workspace.

## Data compatibility

Existing `mosaic-preferences` and `mosaic-learning-v1` keys stay in use. Old sensory preferences receive safe defaults for the new `layoutDensity` and `focusMode` fields. Learner history, completions, exercise IDs, validators, and mastery calculations are retained. Visual changes do not add learning attempts or alter mastery. URL hash navigation restores the current page; the workspace continues to restore its lesson and draft from the learning record.

The active exercise's difficulty stays stable while it is open, so a new recommendation cannot replace a successful result. Learners can still change their guidance explicitly, or receive a newly recommended level when they open another lesson.

## Files

Shared styles: `src/styles/tokens.css`, `src/index.css`, `src/App.css`.

App routing and presentation: `src/App.tsx`, `src/navigation.ts`, `src/presentation.ts`.

Reusable UI: `src/components/PreferenceForm.tsx`, `GuidanceChoices.tsx`, `Onboarding.tsx`, `LearningPages.tsx`, `SettingsPage.tsx`, `ConfirmDialog.tsx`, `ExecutionFeedback.tsx`.

Workspace integration: `src/components/Workspace.tsx`, `src/components/MonacoEditor.tsx`.

Compatible preferences and types: `src/preferences.ts`, `src/types.ts`.

Verification and documentation: `tests/render-support.mjs`, `tests/ui.test.mjs`, `README.md`, `ADAPTIVE_ENGINE.md`, and this document.

## Verification completed

`npm test`, `npm run lint`, and `npm run build` pass. The suite includes the existing Python/engine regression checks plus rendering tests for setup steps, empty states, the roadmap, success and incomplete feedback, named workspace tabs, new preference defaults, saved preferences, and page routes. Core light, dark, and high-contrast token pairs are checked for AA text contrast and visible control contrast. UI tests render real components in Node; they do not claim to exercise browser interactions or layout.

## Local browser checklist

Run `npm run dev` and open the printed URL. Use a private browser window to test a fresh learner without deleting existing progress.

1. Start Learning Python, choose a custom interest such as basketball, choose Step by Step, preview theme/text/spacing, and finish setup. Return through Back to confirm choices stay selected.
2. In another fresh private session, use Skip Setup and start the first lesson with defaults.
3. Read the first task, open Code, and run both `print("Hello, Python!")` and `print("Hello, basketball!")` when basketball is the chosen topic. Both output lines should appear and the task should complete. Use the displayed task if another topic or guidance level is selected.
4. Continue to Variables. Refresh and confirm the workspace page, current lesson, draft, preferences, and completion record return.
5. Run incorrect code and incorrect output. Confirm errors and incomplete results are distinct, Task review works, and hints are not disclosed automatically.
6. Review a completed exercise and run it again. The completion count must not increase.
7. Test saving, Cancel and Confirm in Reset code, panel collapse, focus mode, Simplified View, guidance selection, and returning from Settings.
8. Check 1440px, 1024px, 768px, and 390px widths, 200% zoom, keyboard-only navigation, visible focus, dialog focus restoration, and screen-reader announcements. Switch light, dark, and high-contrast settings and test reduced motion.

## Remaining verification

This execution environment denies local TCP listening (`EPERM` from Vite), and a full interactive browser check could not be run. Real-browser layout, keyboard navigation, screen-reader behavior, and CDN-loaded Monaco/Pyodide need the checklist above before claiming WCAG conformance or a completed end-to-end review. Panel resizing is not included; panels support collapse and tabs.
