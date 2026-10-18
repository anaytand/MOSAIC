# MOSAIC

MOSAIC is an accessible, interest-based Python learning space built with React, TypeScript, and Vite. Learners can choose a topic and visual preferences, write and run Python in a Monaco-based editor, ask for authored hints, and track progress across five introductory concepts. Python runs in a Pyodide Web Worker with an eight-second execution limit.

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

The tests cover adaptive scoring, recommendations, persistence, and all 105 curated lesson variants. See [ADAPTIVE_ENGINE.md](./ADAPTIVE_ENGINE.md) for the scoring formula and data flow.

To try adaptation manually, choose an interest, open Learn, and run a challenge. Request one or more hints and compare the mastery estimate on My Progress with an independently solved challenge. Try two unsuccessful conditions submissions after completing variables; Conditions should be recommended for reinforcement. Change the difficulty selector or interest, then refresh to confirm the saved draft, override, and progress return.

Learning data and preferences stay in this browser's localStorage. They are not synced or backed up. No AI service or API key is used in this version.
