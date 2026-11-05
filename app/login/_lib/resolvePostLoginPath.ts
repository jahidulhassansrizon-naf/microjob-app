const LOCAL_ORIGIN = "https://sebalagbe.invalid";
const UNSAFE_TARGET_CHARACTERS = /[\\\u0000-\u001F\u007F]/;

/** Return a canonical same-origin path, or null for an unsafe redirect target. */
export function getSafeLocalPostLoginTarget(requestedTarget: string): string | null {
  const rawTarget = typeof requestedTarget === "string" ? requestedTarget : "";
  if (UNSAFE_TARGET_CHARACTERS.test(rawTarget)) return null;
  const target = rawTarget.trim();
  if (!target || !target.startsWith("/") || target.startsWith("//")) return null;
  if (/^\/(?:login|register|login-success)(?:[/?#]|$)/i.test(target)) return null;

  try {
    const parsed = new URL(target, LOCAL_ORIGIN);
    if (parsed.origin !== LOCAL_ORIGIN || parsed.protocol !== "https:") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/** Resolve post-login navigation only after using a server-verified role. */
export function resolvePostLoginPath(role: unknown, requestedTarget: string): string {
  const isAdmin = role === "admin";
  const target = getSafeLocalPostLoginTarget(requestedTarget);
  const isAdminTarget = Boolean(target && /^\/admin(?:[/?#]|$)/i.test(target));

  if (isAdmin) return target && isAdminTarget ? target : "/admin";
  if (!target || isAdminTarget) return "/dashboard";
  return target;
}
