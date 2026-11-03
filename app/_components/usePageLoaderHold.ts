"use client";

/**
 * The full-screen page loader has been removed, so this is now a harmless no-op.
 * (Kept so existing pages that call it keep working.)
 */
export default function usePageLoaderHold(
  _active: boolean,
  _maxMs?: number,
  _showAfterMs?: number,
) {
  // intentionally empty
}
