import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  ENV_ADMIN_USER_ID,
  isCurrentAdminToken,
  type AdminTokenClaims,
} from "@/lib/adminCredentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type SessionClaims = AdminTokenClaims & {
  userId?: string;
  exp?: number;
  iat?: number;
  sessionVersion?: number;
};

export type VerifiedRequestSession = {
  userId: string;
  role: "user" | "admin";
  isBanned: boolean;
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

/** Validate a signed session and resolve the current role and ban state from MongoDB. */
export async function getVerifiedRequestSession(
  request: Request,
): Promise<VerifiedRequestSession | null> {
  const secret = process.env.JWT_SECRET?.trim();
  const token = extractRequestToken(request);
  if (!secret || !token) return null;

  let claims: SessionClaims;
  try {
    claims = jwt.verify(token, secret) as SessionClaims;
  } catch {
    return null;
  }

  const isEnvironmentAdmin =
    claims.admin === true || claims.userId === ENV_ADMIN_USER_ID;

  if (isEnvironmentAdmin) {
    if (!isCurrentAdminToken(claims)) return null;
    return {
      userId: ENV_ADMIN_USER_ID,
      role: "admin",
      isBanned: false,
      claims,
    };
  }

  if (
    typeof claims.userId !== "string" ||
    !mongoose.isValidObjectId(claims.userId)
  ) {
    return null;
  }

  try {
    await connectDB();
    const user = await User.findById(claims.userId)
      .select("role isBanned sessionVersion")
      .lean();
    if (!user) return null;

    const tokenVersion = Number(claims.sessionVersion || 0);
    const currentVersion = Number(user.sessionVersion || 0);
    if (tokenVersion !== currentVersion) return null;

    return {
      userId: String(user._id),
      role: user.role === "admin" ? "admin" : "user",
      isBanned: user.isBanned === true,
      claims,
    };
  } catch (error) {
    console.error("[auth-session] Could not verify the database user session:", error);
    return null;
  }
}

/** Authentication gate used by tool APIs. Banned users still have valid site sessions. */
export async function hasVerifiedRequestSession(request: Request): Promise<boolean> {
  const session = await getVerifiedRequestSession(request);
  return Boolean(session && (session.role === "admin" || !session.isBanned));
}
