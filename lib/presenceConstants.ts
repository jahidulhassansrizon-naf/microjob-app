/**
 * "Online" = the user did something on the site (click / touch / key / scroll) recently.
 * There is no background heartbeat: the browser tells the server at most once every
 * PRESENCE_ACTIVITY_REFRESH_MS, and only when the user actually interacts. An idle
 * user sends no requests at all; their online status simply expires.
 */
export const PRESENCE_ACTIVITY_REFRESH_MS = 120_000; // at most one "I'm active" request per 2 minutes
export const CHAT_IDLE_CLOSE_MS = 120_000;           // chat auto-closes after 2 min without activity
export const CHAT_PRESENCE_REFRESH_MS = 60_000;      // chat re-announces at most once a minute while in use
// LIVE CHAT SPEED. Polling only runs while the browser tab is visible (see visibleInterval),
// and each poll is a tiny "messages newer than X" query, so it is fast and cheap.
export const CHAT_OPEN_POLL_MS = 1_500;              // chat open: check for new messages every 1.5s
export const CHAT_CLOSED_POLL_MS = 4_000;            // chat closed: check the unread badge every 4s
export const CHAT_FULL_SYNC_MS = 20_000;             // chat open: full reload every 20s (picks up deletions / expired photos)
export const ADMIN_CHAT_MESSAGES_POLL_MS = 1_500;    // admin: open conversation
export const ADMIN_CHAT_LIST_POLL_MS = 4_000;        // admin: user list (new message previews / unread badges)
export const ADMIN_CHAT_BADGE_POLL_MS = 5_000;       // admin: sidebar unread badge

// Online for ~3 minutes after the last activity (a bit longer than the 2-minute refresh so it never flickers).
export const PRESENCE_STALE_AFTER_MS = 180_000;
export const PRESENCE_SESSION_TTL_MS = 185_000;
