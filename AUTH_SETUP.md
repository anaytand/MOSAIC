# MOSAIC Supabase Auth setup

MOSAIC uses Supabase Auth. Guest lessons remain available. The browser receives only the Supabase project URL and publishable key; passwords are handled by Supabase. Existing cloud progress tables and local guest data are unchanged by this callback update.

## Required dashboard settings

In **Authentication → Providers → Email**, enable the Email provider and **Confirm email**.

In **Authentication → URL Configuration**:

- **Site URL:** `https://YOUR-PRODUCTION-DOMAIN/` (the exact deployed MOSAIC origin; use your custom domain if present).
- **Redirect URLs:** add `https://YOUR-PRODUCTION-DOMAIN/?mosaic_auth=confirm` and `https://YOUR-PRODUCTION-DOMAIN/?mosaic_auth=reset`.
- For local Vite development, also add `http://localhost:5173/?mosaic_auth=confirm` and `http://localhost:5173/?mosaic_auth=reset`. If the actual port or hostname differs, add those exact URLs too.
- If you test Vercel preview deployments, allow only the preview origins you use. Supabase documents `https://*-YOUR-TEAM.vercel.app/**` as a preview pattern; use the actual Vercel team/account slug. The production entries should stay exact.

MOSAIC generates these redirect URLs from the page's current origin and path. A deployment under a subpath must allow the corresponding path in Supabase. The app's production callback is the root page with a query marker; its hash navigation does not require a separate Vercel SPA rewrite. Loading `https://YOUR-PRODUCTION-DOMAIN/?mosaic_auth=confirm` directly should serve `index.html`. If that URL returns a Vercel 404, fix the Vercel project routing before testing email delivery.

In **Authentication → Email Templates**, use these links. Preserve any surrounding message copy you want, but do not use `{{ .ConfirmationURL }}` or a link with a bare `token_hash` and no `mosaic_auth` marker for these two templates. The `RedirectTo` value is set by MOSAIC's `emailRedirectTo` and `redirectTo` options.

**Confirm signup** link:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Confirm your MOSAIC email</a>
```

**Reset password** link:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Reset your MOSAIC password</a>
```

These links send the one-time token hash directly to the MOSAIC callback. The learner presses **Confirm email** or **Verify reset link** before the app calls `verifyOtp` once. This prevents a mail scanner that merely opens the link from consuming the token. MOSAIC checks the authenticated user and session before showing success. A link made with the previous `ConfirmationURL`/PKCE format needs to be resent after these template changes. Do not turn off email confirmation.

The deployment must set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the same project that sends the email. Do not put a service-role key in a `VITE_` variable. Restart Vite or redeploy Vercel after changing environment variables.

## Manual verification

1. Run `npm run dev`, create a new account, and open the newest confirmation email. The link should point to MOSAIC and include `mosaic_auth=confirm`, `token_hash`, and `type=email`. Do not share or paste the token hash into a bug report.
2. Open that link in a second browser as well as the original browser during separate tests. Press **Confirm email**. MOSAIC should show **Email confirmed** and offer **Continue learning**. Reload; the profile menu should still show the account.
3. Sign out, sign in with the verified account, and confirm that cloud progress loads. Guest progress should remain separately importable.
4. Request a password reset. The link should have `mosaic_auth=reset` and `type=recovery`. Press **Verify reset link**; the password form should appear only after verification.
5. Reopen a used link and test an expired link. They should not be reported as fresh successes. If a previously confirmed account is already signed in, the page may report that existing session separately.

Automated tests cover callback parsing, one-time verification, confirmed-session checks, recovery links, and error states. A live Supabase project and email delivery are required to verify the dashboard template and redirects end to end.
