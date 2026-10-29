import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type SessionClaims = {
  userId?: unknown;
  exp?: unknown;
  nbf?: unknown;
  email?: unknown;
  role?: unknown;
  admin?: unknown;
  adminCredentialVersion?: unknown;
};

const ADMIN_USER_ID = "env-admin";

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  // Return a concrete ArrayBuffer to remain compatible with strict TS DOM crypto types.
  return bytes.buffer;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
}

function safeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function isCurrentAdminSession(
  claims: SessionClaims,
  jwtSecret: string,
): Promise<boolean> {
  const configuredEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || "";
  if (
    claims.admin !== true ||
    claims.role !== "admin" ||
    claims.userId !== ADMIN_USER_ID ||
    typeof claims.email !== "string" ||
    claims.email.trim().toLowerCase() !== configuredEmail ||
    !configuredEmail ||
    !configuredPassword
  ) {
    return false;
  }

  const expectedVersion = await hmacSha256Hex(
    jwtSecret,
    `${configuredEmail}\u0000${configuredPassword}`,
  );
  return (
    typeof claims.adminCredentialVersion === "string" &&
    safeEqualString(claims.adminCredentialVersion, expectedVersion)
  );
}

/**
 * Verify the signed session cookie before a protected page is rendered.
 * This deliberately does not trust localStorage or the mere presence of a cookie.
 */
async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) return null;

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return null;

  try {
    const header = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(parts[0])),
    ) as { alg?: unknown };
    if (header.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!validSignature) return null;

    const claims = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(parts[1])),
    ) as SessionClaims;
    const now = Math.floor(Date.now() / 1000);

    // This app's user/admin login tokens are always issued with an expiry.
    if (
      typeof claims.exp !== "number" ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= now ||
      (typeof claims.nbf === "number" && claims.nbf > now)
    ) {
      return null;
    }

    // The environment-configured root administrator is the only session whose
    // identity is bound to ADMIN_EMAIL / ADMIN_PASSWORD. Database administrators
    // have a MongoDB ObjectId and are validated against the User document by the
    // protected page/API before privileged data or actions are served.
    const isEnvironmentAdmin =
      claims.admin === true || claims.userId === ADMIN_USER_ID;

    if (isEnvironmentAdmin) {
      return (await isCurrentAdminSession(claims, jwtSecret)) ? claims : null;
    }

    // All database-backed sessions are issued for MongoDB ObjectIds. The signed
    // role claim is used only for navigation; app/admin/page.tsx and admin APIs
    // re-check the live role and sessionVersion against MongoDB.
    if (
      typeof claims.userId !== "string" ||
      !/^[a-f\d]{24}$/i.test(claims.userId) ||
      claims.admin === true
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const response = NextResponse.redirect(loginUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
  response.cookies.set("token", "", cookieOptions);
  response.cookies.set("subscription_access", "", cookieOptions);
  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mobile QR upload is an intentional token-link flow: the page is opened on
  // another device and the upload API verifies its one-time token separately.
  if (
    pathname === "/ai-editor/mobile-upload" ||
    pathname.startsWith("/ai-editor/mobile-upload/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value || "";
  const claims = token ? await verifySessionToken(token) : null;
  if (!claims) return loginRedirect(request);

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isEnvironmentAdmin =
    claims.admin === true &&
    claims.role === "admin" &&
    claims.userId === ADMIN_USER_ID;

  // For a database-backed identity, let the server-rendered admin page perform
  // the authoritative role + sessionVersion check. Middleware cannot query the
  // live role; rejecting a valid pre-role-claim JWT here can cause a redirect
  // loop for legacy database administrators. Admin APIs independently require
  // an active database administrator session before returning or changing data.

  // Only the environment administrator is force-routed here at middleware
  // level. Database admins are revalidated by /dashboard and /admin; avoiding
  // role-claim redirects here prevents a stale token after demotion from causing
  // a /dashboard <-> /admin redirect loop.
  if (isEnvironmentAdmin && !isAdminPath) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/my-files/:path*",
    "/subscription/:path*",
    "/sohoj-tools/:path*",
    "/dorkar-link/:path*",
    "/dorkari-document/:path*",
    "/customers-invoices/:path*",
    "/income-expenses/:path*",
    "/questions-create/:path*",
    "/ai-editor/:path*",
    "/ai-photo/:path*",
    "/ai-template/:path*",
    "/bulk-photo-edit/:path*",
    "/manual-editor/:path*",
    "/print-media/:path*",
    "/tools/:path*",
    "/login-success/:path*",
    "/payment/manual/:path*",
  ],
};
