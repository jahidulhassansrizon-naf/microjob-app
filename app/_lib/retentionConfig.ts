/** Single source of truth for how long user photos/files are kept. No imports on purpose. */
export const FILE_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getRetentionCutoff(now = Date.now()) {
  return new Date(now - FILE_RETENTION_DAYS * DAY_MS);
}
