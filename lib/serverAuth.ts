import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ENV_ADMIN_USER_ID, isCurrentAdminToken, type AdminTokenClaims } from "@/lib/adminCredentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type SessionClaims = AdminTokenClaims & { userId?: string; exp?: number; iat?: number; sessionVersion?: number };

export type VerifiedRequestSession = {
  userId: string;
  role: "user" | "admin";
  isBanned: boolean;
  isRootAdmin: boolean;
  claims: SessionClaims;
};

function extractRequestToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (pair) {
    const value = pair.slice("token=".length);
    try { return decodeURIComponent(value); } catch { return value; }
  }
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim() || null;
  return null;
}

export async function getVerifiedRequestSession(request: Request): Promise<VerifiedRequestSession | null> {
  const secret = process.env.JWT_SECRET?.trim();
  const token = extractRequestToken(request);
  if (!secret || !token) return null;

  let claims: SessionClaims;
  try { claims = jwt.verify(token, secret) as SessionClaims; } catch { return null; }

  const isEnvAdmin = claims.admin === true || claims.userId === ENV_ADMIN_USER_ID;
  if (isEnvAdmin) {
    if (!isCurrentAdminToken(claims)) return null;
    return { userId: ENV_ADMIN_USER_ID, role: "admin", isBanned: false, isRootAdmin: true, claims };
  }

  if (typeof claims.userId !== "string" || !mongoose.isValidObjectId(claims.userId)) return null;
  try {
    await connectDB();
    const user = await User.findById(claims.userId).select("role isBanned sessionVersion").lean();
    if (!user) return null;
    if (Number(claims.sessionVersion || 0) !== Number(user.sessionVersion || 0)) return null;
    return {
      userId: String(user._id),
      role: user.role === "admin" ? "admin" : "user",
      isBanned: user.isBanned === true,
      isRootAdmin: false,
      claims,
    };
  } catch (error) {
    console.error("[auth-session] Could not verify the database user session:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

export async function hasVerifiedRequestSession(request: Request): Promise<boolean> {
  const session = await getVerifiedRequestSession(request);
  return Boolean(session && (session.role === "admin" || !session.isBanned));
}
