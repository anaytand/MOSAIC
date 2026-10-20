# Cloud progress schema review and isolation test plan

The migration in `migrations/20261019000000_cloud_progress_schema.sql` is **prepared only**. It has not been applied to the Supabase project. It creates three new tables in one transaction and inserts no learner records. It deliberately uses plain `CREATE TABLE`: an existing table with the same name causes the transaction to fail without changing it.

## Mapping from today's browser storage

| Local source | Current content | Proposed cloud destination |
| --- | --- | --- |
| `mosaic-preferences` | `UserPreferences`, including interest, custom topic, optional avatar, sensory controls, and onboarding choice | `profiles.interest_id`, `custom_topic`, `avatar_id`, and `preferences` (the remaining preference fields) |
| `mosaic-learning-v1` | `currentLessonId`, `difficultyOverride`, `lastCompletedExerciseId`, `projectSnapshots` | `profiles.current_lesson_id`, `difficulty_override`, `last_completed_exercise_id`, `project_snapshots` |
| `mosaic-learning-v1` | `completedLessonIds`, `completedExerciseIds`, `attempts`, `hints`, `timeSpentMs` | One `lesson_progress` row per stable `ConceptId`; retain existing `AttemptRecord` and `HintRecord` objects, and exact exercise IDs |
| `mosaic-learning-v1` | `drafts` and `inputDrafts` maps keyed by exercise ID | One `code_saves` row per distinct draft key; `code` and `input_draft` can be saved independently |
| `mosaic-lesson-progress` | Older fallback with completions, drafts, and sometimes a `codeDraft` | Normalize first through the existing `parseLearningData` path, then map as above; do not invent missing attempts |

The 12 concept IDs match `src/adaptive.ts` exactly, including `hello-python`, `user-input`, and `final-project`. `draft_key` preserves the full existing `exerciseId`, including `journey-v1:<theme>:<concept>:<difficulty>` and legacy/custom keys. The optional `concept_id` and `interest_id` in `code_saves` are metadata; they must never replace `draft_key` when restoring a draft. A theme change must not erase another theme's row.

The original app chose its companion from the interest. Settings now allow an explicit avatar choice; `profiles.avatar_id` remains null for learners who keep the interest-based default. `recommendation` is recomputed from progress on load, so it needs no stored copy. `mastery_score` is an estimate derived from real attempts by `masteryFor()`; cloud sync calculates it with that existing algorithm, uses model version 1, and leaves it null when no attempt evidence exists. A legacy completion remains completed even if its mastery estimate is null. `project_snapshots` retain the validated theme-project data currently kept in local storage.

The app now uses localStorage for guests and these tables for signed-in learners. Guest imports are explicit, and account-scoped pending saves are retained locally on failure. The migration still needs to be applied before live cloud saving can work. Because current validation and scoring run in the browser, these tables protect each learner's records from other learners; they are not a server-verified anti-cheat ledger.

## Why the access rules isolate accounts

Every row has `user_id` referencing `auth.users(id)` with `ON DELETE CASCADE`. `profiles` and `lesson_progress` use owner-based primary keys, while `code_saves` has a unique `(user_id, draft_key)` constraint. All three tables enable RLS. Each has four separate policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`, restricted to the `authenticated` role and comparing `user_id` with `auth.uid()`. `UPDATE` checks both the existing row and the proposed row, preventing ownership reassignment. Default `PUBLIC`/`anon` table grants are revoked; signed-in clients get only the four required DML grants. The primary keys and `code_saves_user_id_idx` cover owner-filtered lookups. Supabase's privileged `service_role` is outside these learner policies and must remain server-side only.

## Cross-account acceptance test (after approval, in a disposable Supabase project)

Do not run this against real learner accounts. Apply the migration to a local/disposable Supabase database, create two test Auth users **A** and **B**, and use two Supabase clients with separate user sessions and the publishable key. Never use the service-role key for these tests: it bypasses RLS.

1. **Own rows work.** As A, insert a profile with `user_id=A`, a `lesson_progress` row with `user_id=A`, `concept_id='hello-python'`, `completed=false`, `attempts=[]`, `hints=[]`, `mastery_score=null`, and a `code_saves` row with `user_id=A`, `draft_key='hello-python'`, `code='print("test")'`. Confirm A can select, update, and delete each own row. Repeat as B with B's UUID. These are disposable access-control fixtures, not learning data to ship.
2. **Cross-account SELECT is empty.** After recreating fixtures, A filters each table by `user_id=B` and gets no rows; B filters by `user_id=A` and gets no rows. An unfiltered query must return only the caller's own rows.
3. **Cross-account INSERT fails.** A attempts to insert each table with `user_id=B`, and B does the reverse. Each insert must fail with an RLS/permission error, with no row created.
4. **Cross-account UPDATE is ineffective.** A targets B's row by its key and attempts to change `interest_id`, `completed`, or `code`, respectively. The mutation must affect zero rows and B's original values must remain. Repeat in reverse. Also try changing A's own row's `user_id` to B; `WITH CHECK` must reject it.
5. **Cross-account DELETE is ineffective.** A targets B's row in each table, then re-select as B. B's rows must still exist. Repeat in reverse.
6. **Signed-out access is denied.** Use a client without a user session. `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on each table must fail at the grant layer or return no rows as appropriate; none may reveal or mutate data.
7. **Constraints behave as intended.** A second `code_saves` row with the same `(user_id, draft_key)` must fail; the same draft key for B must succeed. Invalid concept IDs, mastery outside 0–100, and oversized drafts must be rejected. Deleting a disposable Auth user should cascade that user's rows only.
8. **Recheck from B.** After every denied operation, query as B to verify the data is unchanged. Check each client's `auth.getUser()` ID before interpreting a result.

For application-level tests, the same cases can be implemented with Supabase JS against the disposable instance. Supabase also supports pgTAP tests run with `supabase test db`. The isolation test requires applying the migration to that disposable database first; neither step has been performed here.
