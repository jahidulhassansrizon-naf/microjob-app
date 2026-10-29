# SebaLagbe Primary Admin Migration

The primary administrator is now a MongoDB `users` collection document with `role: "admin"` and `isPrimaryAdmin: true`. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are no longer read during sign-in.

## One-time setup

1. Back up the MongoDB database first.
2. Ensure `MONGODB_URI` is available to the local terminal (the script reads `.env.local`, then `.env`; already-exported environment variables take precedence).
3. From the project root, run `npm run bootstrap:admin`.
4. Enter the intended admin email. For a new admin, enter a distinct name and phone number. Enter a 12+ character password twice and type `MAKE PRIMARY ADMIN`.
5. Test login locally and in staging using the new database account. If local and production use different MongoDB databases, run this command separately against each intended database; each database needs its own setup.
6. Once verified, remove `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and old admin-specific env secrets from local/Vercel settings. Retain `MONGODB_URI`, `JWT_SECRET`, and any other application secrets.

## Important behavior

- The script refuses to create a second primary admin if a different one already exists.
- If the given email already belongs to a database user, the script promotes that account and resets its password after explicit confirmation.
- Old `env-admin` cookies are deliberately rejected after migration. Sign in again after running the setup.
- The script never prints the password or stores it in plain text; it is persisted as a bcrypt hash.
- The primary admin cannot be demoted/deleted or have its password reset by the ordinary admin-user management action. Its account settings support cookie-based authentication; forgotten passwords can also be recovered with the verified email OTP flow.
- This script must be run by a trusted operator with database access. Do not expose it as a public API endpoint.

A full production build and real MongoDB integration test should pass before deployment.
