/** Shared JWT configuration for server-side authentication and signed app tokens. */
/**
 * Return the configured signing secret only when it meets the minimum strength
 * policy. Keeping the original value (rather than trimming it) preserves token
 * compatibility when the configured secret contains intentional whitespace.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || "";
  return secret.trim().length >= 32 ? secret : "";
}
