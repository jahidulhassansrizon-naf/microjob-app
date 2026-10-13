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

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data?.user) {
      const user = data.user as ClientAuthUser;
      try {
        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        // Cache is optional.
      }

      return { authenticated: true, user, token, verified: true };
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
  } finally {
    window.clearTimeout(timeout);
  }
}

export function clearClientSession() {
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
