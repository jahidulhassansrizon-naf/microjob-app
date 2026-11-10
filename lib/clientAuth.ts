"use client";

export type ClientAuthUser = {
  id?: string;
  _id?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: unknown;
};

export type ClientSession = {
  authenticated: boolean;
  user: ClientAuthUser | null;
  token: string | null;
  verified: boolean;
};

function readCachedUser(): ClientAuthUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ClientAuthUser) : null;
  } catch {
    return null;
  }
}

export function getClientAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const cachedUser = readCachedUser();
  if (cachedUser?.role === "admin") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Shared /api/auth/me fetch.
//
// Many components (navbar, guards, chat, banner, pages) each asked /api/auth/me on
// their own, so one page view could send several identical requests. This helper
// (1) merges requests that are in flight at the same time and (2) reuses the answer
// for a few seconds. Only definite auth answers (200/401/403) are reused, never 5xx.
// The cache is cleared on login, logout and impersonation changes (invalidateAuthMe).
// ---------------------------------------------------------------------------
const AUTH_ME_URL = "/api/auth/me";
const AUTH_ME_TTL_MS = 5_000;
const AUTH_ME_TIMEOUT_MS = 8_000;

type AuthMeSnapshot = { status: number; body: string };
let authMeKey = "";
let authMeInflight: Promise<AuthMeSnapshot> | null = null;
let authMeCached: { at: number; snapshot: AuthMeSnapshot } | null = null;
let authMeGeneration = 0;

function snapshotToResponse(snapshot: AuthMeSnapshot): Response {
  return new Response(snapshot.body, {
    status: snapshot.status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Forget the stored /api/auth/me answer. Call after login, logout or impersonation changes. */
export function invalidateAuthMe() {
  authMeGeneration += 1;
  authMeCached = null;
  authMeInflight = null;
}

/**
 * Drop-in replacement for fetch("/api/auth/me"). Returns a fresh Response each call, so
 * callers can keep using response.ok / response.status / response.json() unchanged.
 * Pass { force: true } when a guaranteed-fresh answer is needed.
 */
export async function fetchAuthMe(options: { force?: boolean } = {}): Promise<Response> {
  if (typeof window === "undefined") return fetch(AUTH_ME_URL, { credentials: "include", cache: "no-store" });

  let bearer = "";
  try {
    bearer = getClientAuthHeaders().Authorization || "";
  } catch {
    bearer = "";
  }
  if (bearer !== authMeKey) {
    // A different token (new login in this browser) must never reuse the old answer.
    authMeKey = bearer;
    authMeCached = null;
    authMeInflight = null;
  }

  if (!options.force) {
    if (authMeCached && Date.now() - authMeCached.at < AUTH_ME_TTL_MS) {
      return snapshotToResponse(authMeCached.snapshot);
    }
    if (authMeInflight) return snapshotToResponse(await authMeInflight);
  }

  const generation = authMeGeneration;
  const run = async (): Promise<AuthMeSnapshot> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), AUTH_ME_TIMEOUT_MS);
    try {
      const response = await fetch(AUTH_ME_URL, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: bearer ? { Authorization: bearer } : {},
        signal: controller.signal,
      });
      const body = await response.text().catch(() => "");
      const snapshot = { status: response.status, body };
      const definite = response.status === 200 || response.status === 401 || response.status === 403;
      if (definite && generation === authMeGeneration) authMeCached = { at: Date.now(), snapshot };
      return snapshot;
    } finally {
      window.clearTimeout(timer);
    }
  };
  const request: Promise<AuthMeSnapshot> = run().finally(() => {
    if (authMeInflight === request) authMeInflight = null;
  });
  authMeInflight = request;
  return snapshotToResponse(await request);
}

/**
 * Client-side session bootstrap.
 *
 * The real session lives in the HttpOnly `token` cookie, so browser code must
 * never rely on document.cookie to read it. When a localStorage token exists,
 * it is also sent as a Bearer token for compatibility with existing APIs.
 */
export async function getClientSession(): Promise<ClientSession> {
  if (typeof window === "undefined") {
    return { authenticated: false, user: null, token: null, verified: false };
  }

  const token = localStorage.getItem("token");
  const cachedUser = readCachedUser();

  try {
    const response = await fetchAuthMe();

    const data = await response.json().catch(() => ({}));

    if (response.ok && data?.user) {
      const user = data.user as ClientAuthUser;
      const isAdmin = user.role === "admin";
      try {
        localStorage.setItem("user", JSON.stringify(user));
        // Admin sessions are cookie-only; clear any old JS-readable JWT left by
        // a previous user login on this browser.
        if (isAdmin) localStorage.removeItem("token");
      } catch {
        // Cache is optional.
      }

      return { authenticated: true, user, token: isAdmin ? null : token, verified: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { authenticated: false, user: null, token: null, verified: true };
    }

    // Non-auth failures (for example a temporary 5xx) must not trap the UI in
    // an endless authentication spinner when a session signal is already cached.
    if (token || cachedUser) {
      return {
        authenticated: true,
        user: cachedUser,
        token,
        verified: false,
      };
    }

    return { authenticated: false, user: null, token: null, verified: false };
  } catch {
    // Network failure is not the same thing as an invalid login session.
    if (token || cachedUser) {
      return {
        authenticated: true,
        user: cachedUser,
        token,
        verified: false,
      };
    }

    return { authenticated: false, user: null, token: null, verified: false };
  }
}

export function clearClientSession() {
  invalidateAuthMe();
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("justLoggedIn");
  } catch {
    // Ignore storage failures.
  }
}

export async function logoutClientSession() {
  invalidateAuthMe();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sohojhub:presence-stop"));
  }
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // The local cleanup below still runs if the network is unavailable.
  } finally {
    clearClientSession();
  }
}
