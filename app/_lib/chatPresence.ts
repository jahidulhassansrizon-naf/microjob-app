/**
 * Bridge between the chat UI and ActivityTracker. Opening / using the chat counts as
 * activity, so the user is reported online. Closing the chat does NOT mark them offline
 * (they are still on the site); online simply expires after a few idle minutes.
 */
export function announceChatOpen() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("sohojhub:chat-presence"));
}
