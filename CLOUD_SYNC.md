# MOSAIC cloud progress

Signed-out learners keep using the existing `mosaic-preferences` and `mosaic-learning-v1` localStorage records. Signed-in learners load `profiles`, `lesson_progress`, and `code_saves` for their Supabase Auth user ID. The Python worker, lesson checks, and adaptive scoring are unchanged.

Cloud saves start after the account's records have loaded. Changes are backed up under `mosaic-cloud-pending-v1:<user-id>` in that browser, then the cloud write is debounced by 850 ms. **Saving** appears while a write is pending, **Saved to cloud** only after the database returns a successful result, and **Sync Failed** if a read or write fails. Refreshing or signing back in with an unsynced backup asks which copy to open. Choosing the device copy combines completion and attempt history and preserves conflicting code drafts as separate copies. Each row update checks the `updated_at` version it loaded; a newer cloud row stops the write and requests a review rather than being overwritten silently.

After sign-up or login, **Import guest progress** is offered when this browser has guest work. It merges completed concepts, attempts, hints, and themed drafts into the account. A same-key guest draft is saved as a separate copy. Existing cloud interests and sensory settings take priority for an established account; a new account can take the guest preferences. Import is optional and is not marked complete until cloud saving succeeds. Guest data stays available in localStorage.

The SQL migration in `supabase/migrations/20261019000000_cloud_progress_schema.sql` must be reviewed and applied to the intended Supabase project before live cloud saving can work. This repository change does **not** apply the migration or migrate existing guest data automatically. Keep the service-role key out of Vite environment variables and client code.

## Verify with two browsers

1. Apply the reviewed migration to a test Supabase project, then start MOSAIC with `npm run dev`. Confirm that `.env.local` points to that project using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. In Browser A, use guest mode to select an interest and write a Python draft. Create and confirm an account. On the account page, choose **Import guest progress**. Wait for **Saved to cloud**; do not close the tab while it says **Saving** or **Sync Failed**.
3. Complete a lesson, request a hint, change text size or theme, and select a companion avatar. Wait for **Saved to cloud** again.
4. In a different browser or private profile, sign in to the same account. Confirm the completed lesson, mastery estimate, hint history, current lesson, interest, avatar, sensory settings, and exact theme-specific draft appear. Switch themes and back to confirm each theme retains its own code.
5. Sign out of Browser B. Confirm it shows that browser's guest work, not the account's cloud work. Sign in to a *different* account and confirm the first account's records do not appear. The database's owner-only RLS policies should also be tested with the cross-account plan in `supabase/CLOUD_PROGRESS_PLAN.md`.
6. To test failure recovery, temporarily disconnect Browser A, edit a draft, and verify **Sync Failed** appears. Reconnect and choose **Retry sync**. If another browser edited the same row, choose which copy to use after reviewing the warning. Verify neither draft disappears.

The automated tests use a simulated database and do not establish that the migration is installed or that live Supabase RLS is configured. A real two-account RLS test in a disposable project is still required. Account-scoped pending backups remain in browser storage until a save succeeds, so on a physically shared browser, signing out does not erase unsynced code from that device's storage; use a separate browser profile when local privacy matters.
