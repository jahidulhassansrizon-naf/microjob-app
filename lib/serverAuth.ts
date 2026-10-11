import jwt from "jsonwebtoken";
import {
  ENV_ADMIN_USER_ID,
  isCurrentAdminToken,
  type AdminTokenClaims,
} from "@/lib/adminCredentials";

type SessionClaims = AdminTokenClaims & {
  userId?: string;
  exp?: number;
};

export type VerifiedRequestSession = {
  userId: string;
  role: "user" | "admin";
  claims: SessionClaims;
};

function extractRequestToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice("Bearer ".length).trim();
    if (bearer) return bearer;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  if (!pair) return null;

  const value = pair.slice("token=".length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Validate the signed JWT server-side; never treat localStorage as proof of login. */
export function getVerifiedRequestSession(
  request: Request,
): VerifiedRequestSession | null {
  const secret = process.env.JWT_SECRET?.trim();
  const token = extractRequestToken(request);
  if (!secret || !token) return null;

  let claims: SessionClaims;
  try {
    claims = jwt.verify(token, secret) as SessionClaims;
  } catch {
    return null;
  }

  const isAdminToken =
    claims.admin === true ||
    claims.role === "admin" ||
    claims.userId === ENV_ADMIN_USER_ID;

  if (isAdminToken) {
    if (!isCurrentAdminToken(claims)) return null;
    return { userId: ENV_ADMIN_USER_ID, role: "admin", claims };
  }

  if (
    typeof claims.userId !== "string" ||
    !/^[a-f\d]{24}$/i.test(claims.userId)
  ) {
    return null;
  }

  return { userId: claims.userId, role: "user", claims };
}

export function hasVerifiedRequestSession(request: Request): boolean {
  return getVerifiedRequestSession(request) !== null;
}
