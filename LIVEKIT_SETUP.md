# Sohoj Hub LiveKit screen sharing setup

The Live screen uses LiveKit rooms. The old activity-detail panel, activity-consent prompt, page/action snapshots, and activity-sharing banner have been removed. The site keeps only a short-lived signed-in presence heartbeat so admins can choose an online user; no page/action activity or screen recording is stored.

## Required server environment variables

Set these on each app runtime (local `.env.local`, production hosting environment, or any other Node/Next.js host):

```env
LIVEKIT_URL=wss://YOUR-LIVEKIT-HOST
LIVEKIT_API_KEY=YOUR_API_KEY
LIVEKIT_API_SECRET=YOUR_API_SECRET
```

Never prefix the API key/secret with `NEXT_PUBLIC_`; they must remain server-only. `LIVEKIT_URL` is returned to the authenticated client only with a short-lived participant token.

## LiveKit infrastructure

These packages are SDKs, not a LiveKit media server. Use a LiveKit Cloud project or run your own LiveKit server. For the same live-view behavior in local development, Vercel, and other app hosts, point each deployment at the same LiveKit server and use the same API key/secret. If you self-host, the server must be reachable by the browsers over WebSocket/WebRTC and configured for your network/firewall. For the same live-user list across local and production, both app deployments must also use the same `MONGODB_URI` database; separate databases show separate sessions.

The app's token endpoint is `POST /api/livekit/token`. It validates the logged-in user/admin and the active approved live-view request before issuing a short-lived token. For Website Live View, both participants can exchange scoped LiveKit data packets, but neither participant can publish audio/video tracks.

## Install/update dependencies

After extracting/merging the ZIPs, run this from the full project root so npm resolves the rrweb runtime packages and synchronizes `package-lock.json`:

```bash
npm install
```

The ZIP's package manifest lists these dependencies:

- `@livekit/components-react`
- `@livekit/components-styles`
- `livekit-client`
- `livekit-server-sdk`
- `@rrweb/record`
- `@rrweb/replay`

The custom live viewer uses the LiveKit client SDK and rrweb directly, so the LiveKit components packages are optional UI helpers and are not needed by these specific components.

## Important browser behavior

A user must explicitly accept the site's own Website Live View prompt. This DOM-mirror method does not call `getDisplayMedia()` and does not show the browser's screen-selection picker. It sends privacy-filtered DOM/interaction events through LiveKit and reconstructs the page in an isolated replay frame; it is not a pixel-perfect video capture. The app does not save the event stream to the database by default.


## Website live view (DOM mirror)

Website live view uses rrweb to send privacy-filtered DOM/interaction events over a session-scoped LiveKit reliable data channel. It does not publish a camera, screen, or canvas video track and does not persist the event stream in the database. Install the added runtime packages from the project root before running/building:

```bash
npm install @rrweb/record@^2.1.7 @rrweb/replay@^2.1.7
```

The recorder blocks `[data-live-view-ignore]` and `[data-live-view-sensitive]`, masks input values, samples high-frequency pointer/scroll activity, and stops when the user or admin ends the approved session. Canvas pixels, media bytes, and cross-origin iframe contents are not guaranteed to replay exactly. Review the rrweb privacy selectors before adding any new data-sensitive UI.
