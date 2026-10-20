# MOSAIC reference design migration

## Audit and approach

The appearance source is `mosaic-reference/src/pages/landing`, its `src/data/themes.ts`, and its SVG assets. The reference uses Lexend (300/400/500/600/700), JetBrains Mono (400/500), a nine-tile navy/blue/orange logo, a white robot with a dark visor and tile chest, layered gradient hills, large outlined/solid wordmarks, rounded sections, and a floating dark world dock.

The reference lesson and landing error decoder simulate execution, its dashboard contains invented example statistics, and its save-point window contains example countdowns. Those implementations were not adopted. The existing application remains the source of truth for navigation, onboarding, real Monaco/Pyodide execution, Python checking, mastery, recommendations, hints, theme-specific drafts, validated project snapshots, and localStorage.

The original `mosaic-reference` directory has not been edited. No storage keys, learning data versions, curriculum IDs, worker execution code, validator rules, or mastery algorithms changed. No migration or reset of existing learner data is needed.

## Completed stages

1. **Audit:** mapped reference assets, typography, palette variables, hero geometry, scenes, sensory panels, roadmap, and reference demo behavior to existing functional components.
2. **Homepage/navigation:** original logo, robot symbol, hills, world scenes, background wordmarks, bold/light headline, hero card, CTA, floating world dock, and consistent pill navigation. Reference fonts are bundled locally. Original mascot/logo/favicon copies are checked byte-for-byte.
3. **Themed learning:** reference space/ocean/train/music environments connect to real existing lessons. Basketball adds court lines, a ball, and a decorative scoreboard silhouette; wildlife adds forest/animal silhouettes in the reference's flat SVG style. Compact lesson artwork follows the same style. Changing worlds changes existing interest preferences, preserving mastery and separate drafts.
4. **Roadmap/sensory:** four visual stages match the reference progression. Python opens the five working lessons; Blocks, JavaScript, and Portfolio say Upcoming. Reference-style sensory and save-point cards are shared between Home and Settings. Sliders change actual intensity/text preferences, and controls change display, motion, sound opt-in, and Simplified View. The save panel displays actual local completion data without fabricated timestamps or countdowns.
5. **Workspace:** existing panels, controls, and editor use the new fonts, borders, rounded geometry, and themed lesson headers. Mascot introductions/hints/completion stay outside Monaco. Running, validation, saved drafts, reset confirmation, stopping/restarting Python, guidance overrides, hints, and Continue retain their controllers.
6. **Verification:** automated regression checks, contrast calculations, ESLint, and production build pass. Browser visual verification remains pending because this environment cannot launch the server/browser (details below).

## Reference fidelity and accessibility

At normal text size on a 1440×900 viewport, the migrated hero uses the reference's 880px minimum / 100vh height, 440px robot at x=50% / y=150px, 76px bold/light headline, 700px maximum hero card, 40px top-right corner, and 300px lower-right preview card. Original SVG paths and supported world palettes are reused. This is a source-based comparison, **not a verified screenshot match**.

Intentional differences:

- Main navigation retains Home, Learn, Progress, and Settings. The floating world picker keeps the reference's dark pill appearance.
- Reference countdowns, made-up learner data, simulated Python results, and automatic error fixes are replaced with honest local data and links to the real workspace.
- Sensory controls use the existing safe preference model rather than a whole-page brightness/contrast filter that could impair text contrast.
- No looping animations, blinking caret, autoplay audio, or scroll-driven reveals are introduced. Existing reduced-motion/system preferences remain respected.
- Dark/high-contrast, Calm, text sizing, density, Simplified View, and mobile breakpoints extend the reference without changing learning data. Display typography uses rem units so saved text size applies.
- Basketball and wildlife illustrations extend the reference; they are not original teammate assets. Custom interests keep their existing lesson behavior and use the default visual world.

The core light/dark/high-contrast token tests remain. Added checks cover header text on each world's sky colors, captions on dark cards, and text accents on white. These calculations and semantic tests do not constitute a complete WCAG audit.

## Files created

- `public/brand/mosaic-logo.svg`, `public/brand/mosaic-robot.svg`: unchanged original artwork.
- `src/design/referenceWorlds.ts`: reference palettes plus basketball/wildlife extensions; demo lesson content excluded.
- `src/design/worlds.ts`: typed mapping from existing interests to presentation worlds.
- `src/components/reference/Logo.tsx`, `SvgDefs.tsx`, `Icons.tsx`, `Scenes.tsx`, `Fits.tsx`: reused reference graphics/compositions, with themed scene extensions.
- `src/components/reference/NavigationIcon.tsx`: consistent destination icons.
- `src/components/reference/WorldPicker.tsx`: real saved interest selection.
- `src/components/reference/ReferenceHome.tsx`: reference landing composition with actual learner state/actions.
- `src/components/reference/WorldBanner.tsx`: themed learning-path introduction.
- `src/components/reference/StageRoadmap.tsx`: honest four-stage progression.
- `src/components/reference/SensoryCards.tsx`: live preference controls and real local save summary.
- `src/components/reference/InterestPreview.tsx`: actual saved-code preview and real workspace entry.
- `src/styles/reference-landing.css`: reference layout stylesheet, with scalable display text and a scoped world-border variable.
- `src/styles/reference.css`: integration, application styling, responsive rules, and accessible display variants.
- `tests/reference-design.test.mjs`: asset fidelity, palette fidelity/contrast, actual preference callbacks, storage restoration, roadmap availability, and saved-code rendering.
- `REFERENCE_MIGRATION.md`: this audit, file list, stage report, and verification guide.

## Files modified

- `package.json`, `package-lock.json`: locally bundled reference font packages, installed from cached npm tarballs.
- `index.html`: reference tagline in the title and matching theme color.
- `public/favicon.svg`: original reference favicon.
- `src/App.tsx`: reference styling, shared visual variables, navigation icons, functional world picker, Home preference callbacks.
- `src/main.tsx`: local reference font imports.
- `src/index.css`: removes remote Google Fonts import.
- `src/styles/tokens.css`: reference typography and navy/blue/orange core identity, preserving accessible variants.
- `src/components/Brand.tsx`: exact nine-tile reference logo.
- `src/components/LearningPages.tsx`: integrates reference Home, world banner, and stage roadmap while retaining actual Python path/progress/recommendations.
- `src/components/ThemeArt.tsx`: compact illustrations consistent with original reference scenes.
- `src/components/SettingsPage.tsx`: functional reference sensory/save cards, preserving guidance and quick settings.
- `src/components/Onboarding.tsx`: original mascot in welcome screen.
- `src/components/ExecutionFeedback.tsx`: restrained original mascot on first successful completion.
- `src/components/Workspace.tsx`: original mascot in lesson/help presentation only.
- `src/components/MonacoEditor.tsx`: reference code font; editor behavior unchanged.
- `tests/ui.test.mjs`: intentional Home headline/button expectations updated.
- `README.md`: current design entry points, test count, and verification documentation.

## Automated results

- `npm test`: **55 passing tests**. Includes real Python behavior checks for all 90 themed lesson/guidance variants and 105 legacy variants, error rejection, Print Statements extra-line regression, completion deduplication, adaptive recommendations, preference/progress restoration, structured scoreboard data, and seven new reference migration checks.
- `npm run lint`: passes.
- `npm run build`: passes.

One full-suite run reached the existing five-second local CPython batch timeout. The subsequent complete run passed all 55 tests in approximately 433ms. The test timeout and educational checks were not relaxed.

Python tests execute the same Python program/checker source as the worker using local CPython. They do not run browser Pyodide/WASM or interact with Monaco. UI tests render actual React components and exercise stateless preference callbacks, but do not replace browser testing.

## View and test locally

```sh
cd /Users/anaytandon/MOSAIC
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The fonts and artwork are bundled. Monaco and Pyodide still require their existing CDN network access.

1. Open Home at 1440×900. Check the robot, giant wordmarks, headline, left hero card, preview, floating dock, sensory panels, roadmap, tile section, and final CTA.
2. Switch Space, Ocean, Basketball, Trains, Animals, and Music in the dock. Check backgrounds, scenes, examples, academy headings, and existing lesson context.
3. Use Start Coding to complete or skip onboarding. Set preferences, move backward, and resume your lesson.
4. For a Guided basketball first lesson, run:

   ```python
   print("Mosaic Falcons")
   print("Welcome to the court!")
   ```

   Confirm real output, Lesson Complete, saved progress, and an enabled Continue button. Run again: the completion count must stay unchanged. Incorrect output and Python errors must not add completion.
5. Continue to Variables, change the scoreboard starter's `team_score` to `24`, and run the challenge. The preview must reflect validated data. Review Progress and the recommendation.
6. Edit code, switch worlds, and refresh. Mastery/completions remain; drafts stay separated by theme. Earlier drafts remain available through the existing restore-copy control.
7. On Home or Settings, change intensity, text size, display, reduced motion, and Simplified View. Verify actual page changes and refresh persistence. In the workspace, check editor font sizing and Lesson/Code/Output tabs. Enable sound only if desired; no sound plays automatically on load.
8. Use only Tab/Shift+Tab, Enter, Space, and arrow keys. Check focus outlines, labeled controls, mobile tab navigation, dialog focus, and editor keyboard escape guidance.
9. Repeat at 1024×768 and 390×844, and with large text, Calm, light/dark, high contrast, focus mode, and compact density. Check that no code edits disappear when panels switch.

To inspect the original alongside the app, run `npm exec -- vite mosaic-reference --port 5174` in a second terminal. This uses the existing root dependencies. Capture both at matching 1440×900 dimensions and compare the first hero and full-page sections. Use the same selected world and normal text size; disable motion in the reference for a stable capture.

## Remaining verification limits

This execution environment denied the Vite server socket with `EPERM` at `127.0.0.1:5173`. Headless Chrome terminated with exit 134 before rendering, including on `about:blank`. No reference screenshots were supplied in the directory. Consequently screenshot comparison, browser Pyodide loading, actual keyboard/screen-reader interactions, viewport rendering, and the end-to-end browser learning journey could not be verified here. No exact visual-match or full accessibility-conformance claim is made. Those checks should be completed locally before competition submission.
