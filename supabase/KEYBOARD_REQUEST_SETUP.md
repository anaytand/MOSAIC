# Adaptive Keyboard request setup

The keyboard is a product concept. The purchase-interest form does not accept payment, reserve a unit, promise a price, or guarantee availability. No request can be submitted until the migration is applied to the same Supabase project configured in MOSAIC's Vite environment.

## Apply the migration manually

Review and paste the full contents of [`migrations/20261023000000_keyboard_interest_requests.sql`](migrations/20261023000000_keyboard_interest_requests.sql) into the Supabase SQL Editor, then run it once. The migration creates only `public.keyboard_interest_requests`; it does not modify existing learning, profile, or code-save tables. It intentionally fails if a table with that name already exists, so inspect an existing table before reconciling it. Do not put a service-role key in the frontend.

The table stores one request per signed-in account. Client-side validation and database constraints limit names, emails, quantity, colors, and comment length. The required acknowledgment records that the user understood this is interest only. `anon` and `public` have no table grants. Signed-in users have SELECT and INSERT grants, with Row Level Security policies limiting both to their own `user_id`. No UPDATE or DELETE grant is exposed through the browser. Supabase project administrators can manage requests through approved administrative tools.

## Verify access with two accounts

1. In browser A, sign in as account A and send one valid request. Confirm the page shows success only after the database response. Check the row in the Supabase Table Editor.
2. In browser B, sign in as account B. In the browser console, use the existing signed-in Supabase client or a temporary local test script to request `keyboard_interest_requests` with account B's JWT. A SELECT filtered to account A's `user_id` must return no rows. Attempting to INSERT a row with account A's `user_id` must be rejected by RLS.
3. While signed out, try SELECT and INSERT with the project's publishable key and no user JWT. Both must be denied; the app offers sign-in instead of a guest form.
4. As account A, try to send a second request. The unique `user_id` constraint should reject it; the page must not show another success message.
5. Temporarily test against a project without this migration (or revoke the table grant in a disposable test project). The page must explain that the request was not saved. Restore the test project afterward.

The automated suite checks the UI contract, client error handling, and SQL grant/policy text. It cannot prove the live project's policy behavior until the migration is applied and the two-account checks above are performed.
