# Sohozkaj Admin Dashboard Setup

The admin workspace is available at `/admin`. It uses a single environment-configured administrator and does not require the administrator to sign up or exist in the users collection. Admin credentials are checked on the server and the browser cannot grant itself an admin role.

## Required environment variables

Set these in your local `.env.local` file and in the hosting provider's server-side environment settings:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-long-unique-password
ADMIN_NAME=Administrator
JWT_SECRET=replace-with-a-long-random-secret
MONGODB_URI=your-existing-mongodb-connection-string
```

Replace all example values. `ADMIN_PASSWORD` can be any non-empty password you choose; the application does not enforce a fixed minimum length. For security, choose a long, unique password that is difficult to guess. `JWT_SECRET` must be set to a strong random value; the code intentionally has no known default secret. The Admin JWT is returned only in an HttpOnly cookie and is not written to browser localStorage. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are server-only values; never prefix them with `NEXT_PUBLIC_`, commit them to Git, put them in a frontend file, or share your real `.env` files. Do not create an account through Signup for the administrator. The configured admin credentials are used in the existing `/login` form; successful login sends that session to `/admin`.

A matching `ADMIN_EMAIL` is reserved, so normal user registration with that email is rejected. Public signups always receive the `user` role. If the admin password is changed in the environment, existing admin sessions are invalidated by the server-side credential version check. The admin does not have a database password-reset flow; update `ADMIN_PASSWORD` through the hosting environment to rotate it.

## Online activity

The website sends a small authenticated heartbeat while a signed-in browser tab is active. The dashboard treats a user as online when their last heartbeat was received within the last three minutes. This is an activity estimate, not a guarantee that a person is actively interacting with the page. The environment-managed administrator is excluded from customer user counts.

## Dashboard scope

The admin overview shows registered accounts, recent login timestamps, estimated online users, active subscribers, subscription records, payment/access states, recorded completed-payment revenue, and recent registrations. Passwords are never returned by the admin APIs.
