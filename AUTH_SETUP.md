# MOSAIC authentication setup and review

MOSAIC uses Supabase Auth for email/password sign-up, sign-in, confirmation, recovery, and sign-out. The browser uses only the Supabase project URL and publishable key from `.env.local`. The Supabase client manages the session; MOSAIC never saves passwords. Guest learning remains available.

## Supabase dashboard configuration

Enable the Email provider and **Confirm email** in Supabase Authentication settings to require verification before login. Under **Authentication → URL Configuration**, allow the exact confirmation and recovery return URLs for every origin where MOSAIC runs. For Vite's default local URL, add:

```text
http://localhost:5173/?mosaic_auth=confirm
http://localhost:5173/?mosaic_auth=reset
```

If Vite prints a different port, you use `127.0.0.1`, deploy under a subpath, or publish the site, add the corresponding URLs for that origin and path. Set the Supabase Site URL to the deployed MOSAIC origin. If you customized Supabase email templates, ensure their links honor the configured `RedirectTo` value. See the [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

The existing `.env.local` must contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Restart Vite after editing it. Never use a service-role or secret key in a `VITE_` variable.

## Manual learner journey

1. Start MOSAIC with `npm run dev`, open the printed URL, and use the **Guest** profile menu. You can enter any lesson without an account.
2. Choose **Create account**, enter an email and password, and submit. With confirmation enabled, MOSAIC shows **Check your email** and offers a resend control. Registration does not create a learning progress record in Supabase.
3. Open the confirmation link in the same browser used for sign-up, so the PKCE verifier is available. MOSAIC returns to its confirmation screen and only reports success after Supabase establishes the session. Use the profile menu to inspect the signed-in account.
4. Choose **Sign out**. The profile menu returns to Guest. Reload the page to confirm the Supabase session ended while local lesson drafts, progress, and preferences remain.
5. Choose **Log in** with the confirmed account, then reload to confirm the session persists.
6. Choose **Forgot password?**, request a reset email, and open the link in the same browser. The new-password form appears only after Supabase validates the recovery callback. Update the password, sign out, and log in with the new password.
7. Test an expired or altered link. MOSAIC should explain that it could not complete the link and offer a way to request another.

Email delivery and live account creation require the Supabase project to be reachable and configured. The automated tests mock Auth method calls and validate route/form states; they do not send mail or create live accounts.

## Data boundary

Authentication does not upload or merge progress. Existing learning data remains under MOSAIC's localStorage keys on the same browser, including when a user signs out. A person who signs in on another device will see a session but no synced lesson progress yet.
