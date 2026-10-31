/**
 * Resolve post-login navigation by the role verified by the server.
 * Administrators always enter the admin workspace; ordinary users cannot use
 * a stale callbackUrl to enter the admin area.
 */
export function resolvePostLoginPath(role: unknown, requestedTarget: string): string {
  const isAdmin = role === "admin";
  const target = requestedTarget.trim();
  const isSafeLocalTarget =
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !/^\/(?:login|register|login-success)(?:[/?#]|$)/i.test(target);
  const isAdminTarget = /^\/admin(?:[/?#]|$)/i.test(target);

  if (isAdmin) {
    return isSafeLocalTarget && isAdminTarget ? target : "/admin";
  }

  if (!isSafeLocalTarget || isAdminTarget) return "/dashboard";
  return target;
}
