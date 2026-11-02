/**
 * "Online" = the user did something on the site (click / touch / key / scroll) recently.
 * There is no background heartbeat: the browser tells the server at most once every
 * PRESENCE_ACTIVITY_REFRESH_MS, and only when the user actually interacts. An idle
 * user sends no requests at all; their online status simply expires.
 */
export const PRESENCE_ACTIVITY_REFRESH_MS = 120_000; // at most one "I'm active" request per 2 minutes
export const CHAT_IDLE_CLOSE_MS = 120_000;           // chat auto-closes after 2 min without activity
export const CHAT_PRESENCE_REFRESH_MS = 60_000;      // chat re-announces at most once a minute while in use
export const CHAT_OPEN_POLL_MS = 0;                  // 0 = no polling while the chat is open

// Online for ~3 minutes after the last activity (a bit longer than the 2-minute refresh so it never flickers).
export const PRESENCE_STALE_AFTER_MS = 180_000;
export const PRESENCE_SESSION_TTL_MS = 185_000;
