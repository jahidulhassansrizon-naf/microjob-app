import mongoose from "mongoose";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ENV_ADMIN_USER_ID, getAdminCredentials, isCurrentAdminToken, type AdminTokenClaims } from "@/lib/adminCredentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "";
type AdminClaims = AdminTokenClaims & { userId?: string; sessionVersion?: number };

function getToken(request: Request): string | null {
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (pair) {
    try { return decodeURIComponent(pair.slice("token=".length)); } catch { return pair.slice("token=".length); }
  }
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim() || null;
  return null;
}

export type AdminIdentity = { id: string; fullName: string; email: string; phoneNumber: string; isRootAdmin: boolean };

export async function requireAdmin(request: Request): Promise<{ admin: AdminIdentity | null; response: NextResponse | null }> {
  if (!JWT_SECRET.trim()) {
    return { admin: null, response: NextResponse.json({ success: false, code: "JWT_SECRET_NOT_CONFIGURED", message: "Set a strong JWT_SECRET in the server environment before enabling admin access." }, { status: 503 }) };
  }
  const token = getToken(request);
  if (!token) return { admin: null, response: NextResponse.json({ success: false, message: "Please log in to continue." }, { status: 401 }) };

  let decoded: AdminClaims;
  try { decoded = jwt.verify(token, JWT_SECRET) as AdminClaims; }
  catch { return { admin: null, response: NextResponse.json({ success: false, message: "Your login session is invalid or expired." }, { status: 401 }) }; }

  const isEnvAdmin = decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID;
  if (isEnvAdmin) {
    if (!isCurrentAdminToken(decoded)) return { admin: null, response: NextResponse.json({ success: false, message: "The configured Main Admin credentials changed. Please sign in again." }, { status: 401 }) };
    const credentials = getAdminCredentials();
    return {
      admin: { id: ENV_ADMIN_USER_ID, fullName: credentials.fullName, email: credentials.email, phoneNumber: "", isRootAdmin: true },
      response: null,
    };
  }

  if (typeof decoded.userId !== "string" || !mongoose.isValidObjectId(decoded.userId)) {
    return { admin: null, response: NextResponse.json({ success: false, message: "You do not have permission to access the admin area." }, { status: 403 }) };
  }
  try {
    await connectDB();
    const user = await User.findById(decoded.userId).select("fullName email phoneNumber role sessionVersion").lean();
    if (!user || user.role !== "admin") return { admin: null, response: NextResponse.json({ success: false, message: "You do not have permission to access the admin area." }, { status: 403 }) };
    if (Number(decoded.sessionVersion || 0) !== Number(user.sessionVersion || 0)) return { admin: null, response: NextResponse.json({ success: false, message: "Your login session has been reset. Please sign in again." }, { status: 401 }) };
    return { admin: { id: String(user._id), fullName: user.fullName || "Administrator", email: user.email || "", phoneNumber: user.phoneNumber || "", isRootAdmin: false }, response: null };
  } catch (error) {
    console.error("Admin database session verification error:", error instanceof Error ? error.message : "Unknown error");
    return { admin: null, response: NextResponse.json({ success: false, message: "Could not verify administrator access." }, { status: 503 }) };
  }
}
