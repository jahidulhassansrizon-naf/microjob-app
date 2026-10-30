# SebaLagbe — Admin Login Issue (for code review)

## Observed behavior
- A Primary Admin was previously an ordinary MongoDB user and was promoted using `npm run bootstrap:admin` (`scripts/bootstrap-primary-admin.mjs`).
- The bootstrap command printed `Primary Admin setup completed.` and said the password is stored as a bcrypt hash and previous sessions are revoked.
- The relevant database user has `role: "admin"`. Do not assume that this alone proves password verification works.
- Other regular accounts can sign in.
- The same Primary Admin credentials reportedly work on a friend's browser on the live website, including after logout and logging in again, while the owner cannot log in on their own browser/device.
- The owner's login attempt returns HTTP 401 and the UI message: `ফোন নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।`
- Incognito/Guest mode has the same behavior, so simple cookie/cache is less likely but is not excluded completely.
- A password reset/bootstrap was run; the issue seemed to be resolved briefly and later returned.
- User reports local and production may use the same MongoDB database, but confirm configuration safely without exposing URIs.

## What must be determined
Find the actual root cause from source code and tests. Plausible areas include: password/hash mismatch, password field projection, email/phone normalization, incorrect identifier sent by the login UI, wrong MongoDB/database selection, rate limiting incorrectly mapped to 401, legacy ENV-based auth branch, stale or inconsistent production deployment, or user/account-specific checks.

Do not infer the cause without evidence. Do not request or log any real password, hash, OTP, cookie, JWT, MongoDB URI, or other secret. Do not reset the password repeatedly as a workaround. Do not remove `ADMIN_EMAIL` / `ADMIN_PASSWORD` until the database-admin login is verified.
