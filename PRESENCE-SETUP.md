# Sohoj Hub live presence setup

The live presence changes use Vercel's WebSocket support, MongoDB to track individual browser tabs, and Redis pub/sub to push a status change to administrator dashboards across different Vercel Function instances.

## Required package install

Run this from the project root after extracting both updated ZIPs:

```bash
npm install
```

`package.json` now includes `@vercel/functions`, `ioredis`, `ws`, and `@types/ws`; `npm install` installs the exact dependency ranges. You do not need to run a separate `npm install <package>` command unless you are manually applying the changes without the updated package file.

## Redis configuration for push updates

1. In the Vercel project, add the **Upstash Redis** integration (or use a reachable Redis service that supports standard Redis Pub/Sub).
2. Ensure the server-side environment variable `REDIS_URL` is available to the deployment. Use the private server-side connection URL provided by the integration; do not expose it as a `NEXT_PUBLIC_` variable.
3. Redeploy after changing environment variables.
4. Verify that **Fluid Compute** is enabled for the Vercel project. Vercel's native WebSocket support runs on Fluid Compute and is currently in public beta.

Without `REDIS_URL`, user connection tracking and the administrator's automatic database refresh still work, but cross-instance WebSocket push is unavailable. The admin page then uses a five-second fallback refresh instead of push updates.

## Expected behavior

- Signed-in user tabs open a WebSocket and send a small heartbeat every five seconds.
- The server keeps one lease per browser tab. Closing/logging out closes that tab's lease; other tabs for the same account remain online.
- A normal close is reflected as soon as the close event reaches the server. If a connection disappears without a clean close (for example, a network outage), the stale lease is treated as offline after the heartbeat grace period.
- WebSocket connections must reconnect when Vercel reaches the Function's maximum duration, so automatic reconnect is built in.
- The old payment and subscription records are not modified by presence tracking.

## Deployment note

Vercel's WebSocket upgrade API for Next.js is experimental/public beta and works on Vercel deployments. A local `next dev` server may not reproduce production WebSocket behavior. Test the feature on a Vercel Preview deployment before relying on it in production.
