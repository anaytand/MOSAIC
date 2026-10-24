# Code-to-World: tracing and themed simulations

The engine uses the existing Pyodide Web Worker. The worker compiles and runs learner Python once, with a `sys.settrace` hook active only for frames whose filename is `<learner>`. It records source lines, bounded snapshots of ordinary values, changes since the previous event in the same frame, branch destinations, loop-body entries, function calls and returns, captured output, and Python exceptions. The hook is removed before the lesson validator runs. Validation and mastery updates still depend on the original lesson checker, never on the simulation.

Each supported interest—basketball, space, ocean, trains, animals, and music—uses the same trace player. The themed scene changes its displayed value from a documented contract, while the editor and lesson checker stay the same. Artwork movement shows the order of recorded events; readouts and short descriptions contain the actual data. A program can change a scene while still failing the lesson's separate challenge check.

| Lesson | Value displayed from the learner's run |
| --- | --- |
| Print statements | Actual printed output |
| Variables | The theme's named main numeric field, such as `team_score`, `fuel_units`, or `depth_m` |
| Conditions | Module-level `status` and optional `goal_status` |
| Loops | The theme's named total, or module-level `total`; guided exercises without a total show actual readings from `for item in <theme series>` and the number of those iterations |
| Functions | Return value of the theme's named calculator |
| Lists | Return value of `extend_collection()` |
| Strings | Return value of `clean_label()` |
| Dictionaries | Return value of `make_record()` |
| User input | Return value of `read_entry()` using the real input queue |
| Numbers | Return value of `calculate_average()` |
| Combining concepts | Return value of `analyze()` |
| Final project | Return value of `build_report()` |

If a program does not produce its lesson's named value or supported loop readings, playback is unavailable with a plain-language explanation. The Console still shows actual output and Python errors. A custom interest without a curated world uses a plain Python-output scene.

For example, running this in a basketball lesson produces score snapshots `0 → 2 → 5 → 7`:

```python
scores = [2, 3, 2]
total = 0
for score in scores:
    total += score
print(total)
```

Changing the list to `[3, 3, 3]` produces `0 → 3 → 6 → 9`. Neither result is hardcoded. A basketball Loops mission accepts its lesson-specific `season_points` variable or a standalone `total` for exploration. Playback starts only after the learner presses **Play Simulation**. The same button replays from the beginning. Recorded lines can be highlighted in Monaco without changing the code.

The loop trace now records the actual iterable name and item variable from Python's parsed `for` statement. A themed observation is shown only when the loop iterates the theme's named series. Space uses `signal_readings`, ocean uses `observation_depths`, trains use `station_delays`, animals use `daily_sightings`, and music uses `track_minutes`. Basketball uses `game_scores`. The spacecraft, ball, train, animal, and notes move between recorded events to show processing order; horizontal position does not claim that the Python values represent distance. The ocean submarine also moves vertically with recorded depth, using a visual range of 0–30 metres. The Space signal meter uses a visual 0–100 range. Exact readings remain visible outside those visual ranges. Positive changes in a basketball total trigger the basket arc.

Safety bounds: at most 400 trace events, 30 visible variables per event, short nested primitive/list/dictionary values, 4,000 characters of output per event, and 20,000 characters of total console output. Playback selects at most 28 meaningful frames from the recorded events. A truncated trace is labeled; the lesson program continues. One playback timer is pending at a time and is canceled when the panel closes or unmounts. Editing code or queued input removes the old trace and requires another Run Code action. The existing worker Stop control and eight-second execution timeout terminate and restart Python for nonterminating programs. Imports and browser privileges remain unavailable to learner code. This is a beginner-program visualization, not a general-purpose Python debugger or a security boundary for arbitrary hostile Python; future server-hosted execution would require stronger isolation.

Current scope: all six curated interests and all twelve lessons have scene contracts. The themed artwork shows a limited, beginner-friendly view of each program; arbitrary Python objects and unrelated variable names are not interpreted as themed scene data. Prediction mode and additional explanation modes remain future work.
