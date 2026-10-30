# Task for Claude: Diagnose and Fix SebaLagbe Primary Admin Login (HTTP 401)

You are acting as a senior Next.js, TypeScript, MongoDB/Mongoose, authentication, and application-security engineer. This packet contains the relevant files extracted from the latest available application and configuration ZIPs. Inspect the source rather than guessing.

## Exact issue
A MongoDB user was previously a normal user and was promoted to Primary Admin via `npm run bootstrap:admin` (`scripts/bootstrap-primary-admin.mjs`). The command reported success. The user document has `role: "admin"`.

Other user accounts work. The same Primary Admin email/password reportedly works for a friend on the live website after logout and login, but the owner receives HTTP `401` and the Bengali generic message `ফোন নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।`. Incognito/Guest mode has the same issue. Password was reset using the bootstrap script; the problem appeared to resolve for a while and later returned.

The owner does not want repeated manual troubleshooting or repeated password resets. Identify the actual root cause, fix it, and provide a corrected ZIP if a fix is supported by code/tests.

## Mandatory inspection
1. Trace the complete path from `app/login/page.tsx` request payload to `app/api/auth/login/route.ts` and every 400/401/429/500 branch.
2. Inspect `models/User.ts` for password field names, `select: false`, schema hooks, defaults, `isPrimaryAdmin`, role and session fields. Check that login explicitly selects the hash if hidden by Mongoose and compares it using the same bcrypt implementation used by the bootstrap script.
3. Compare `scripts/bootstrap-primary-admin.mjs` with the login API: field name written, hash method/cost, normalization of email, role flags, account ID and database URI selection. Ensure the bootstrap and runtime use the same MongoDB database/collection without printing the secret URI.
4. Search all provided files for `getAdminCredentials`, `isConfiguredAdminEmail`, `env-admin`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `sessionVersion`, and any alternate login functions. Explain any legacy branch that can intercept this account before the DB password check.
5. Inspect `lib/db.ts`, `lib/serverAuth.ts`, `lib/adminCredentials.ts`, `middleware.ts`, login/logout/me/activity routes and `app/api/admin/_lib/adminAuth.ts`. Confirm cookies, token claims, role checks and session invalidation are consistent. Do not introduce a single-device-session policy unless existing code explicitly requires it.
6. Inspect `app/api/_lib/authRateLimit.ts` and `models/AuthRateLimit.ts`. Determine whether an IP or identifier rate limit can cause the observed generic 401; preserve rate limiting but return the correct status/category.
7. Check how the login page reads/normalizes email or phone and maps backend responses to the visible message. Test trimming, case normalization and exact payload keys.
8. Check the bootstrap’s existing-account promotion path carefully. Verify it cannot accidentally promote the wrong record or leave `role`, primary-admin marker and password hash inconsistent.
9. The user's archives do not appear to contain `components/i18n/I18nProvider.tsx` although the login page imports it. Do not claim a complete project build if the module is truly absent; explicitly identify missing dependencies and request them only if needed to validate/build.

## Security requirements
- No hardcoded credentials or backdoors.
- Do not weaken authorization, disable rate limits, or trust role from client input.
- Keep password hashes only in the database; never log credentials or secret values.
- Preserve `HttpOnly` cookie behavior where appropriate.
- Keep existing Admin/user management and other features working.
- Do not recommend deleting `ADMIN_EMAIL` / `ADMIN_PASSWORD` until database-based Primary Admin sign-in is verified in production.
- Do not reveal actual account existence via public password-reset responses.
- Do not modify production data unnecessarily.

## Tests required
Run the available tests and actual `package.json` build/type-check scripts. At minimum test:
- valid ordinary user login;
- valid Primary Admin login after bootstrap;
- wrong password;
- unknown email;
- email case/whitespace normalization;
- phone login unaffected;
- password hash produced by the bootstrap can be verified by login;
- Primary Admin has the correct role after promotion;
- normal users cannot promote themselves;
- protected admin APIs reject non-admins;
- sessions are invalidated after password/role changes as intended;
- rate-limit responses are correctly classified and don't masquerade as bad credentials;
- two devices may log in unless the application explicitly documents a single-session policy.

Do not say tests/build passed unless actually executed. Separate verified facts, hypotheses, tests run, and untested items.

## Deliverables
1. Evidence-based root-cause explanation pointing to exact files/branches.
2. Minimal file-change list with reasons.
3. Corrected ZIP preserving relative paths if a supported fix can be made.
4. Any required migration/setup steps, explained safely.
5. Build/test report with explicit limitations.
6. A short, step-by-step verification procedure for the owner.

Do not simply reset the password again. Diagnose the request that returns 401 and the difference between the owner's failing login and the friend's successful login.
