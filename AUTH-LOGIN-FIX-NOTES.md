# Login fix notes

Changed: lib/loginCore.ts (new), app/api/auth/login/route.ts, app/login/page.tsx,
scripts/bootstrap-primary-admin.mjs, scripts/diagnose-login.mjs (new), package.json,
tests/login-core.test.ts (new), tests/bootstrap-hash.test.ts (new).

Verify before touching ADMIN_EMAIL/ADMIN_PASSWORD env vars:
1. `npm install && npm run test:auth && npx tsc --noEmit && npm run build`
2. `npm run diagnose:login` once with local .env.local, once with MONGODB_URI=<production uri>
   (read-only; prints db name, whether the identifier is found, whether the password verifies).
3. After deploying, a failed login returns `requestId`; search the host logs for
   `[auth-login] requestId=<id>` to read category, db name, env and build.
