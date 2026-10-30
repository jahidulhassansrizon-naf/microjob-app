import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ENV_ADMIN_USER_ID, isCurrentAdminToken, type AdminTokenClaims } from "@/lib/adminCredentials";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const JWT_SECRET = process.env.JWT_SECRET || "";
const HEADERS = { "Cache-Control": "no-store, max-age=0" };

function getToken(request: Request) {
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (pair) { try { return decodeURIComponent(pair.slice("token=".length)); } catch { return pair.slice("token=".length); } }
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim() || null;
  return null;
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token || !JWT_SECRET.trim()) return NextResponse.json({ success: false, message: "Not signed in." }, { status: 401, headers: HEADERS });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenClaims & { userId?: string; sessionVersion?: number };
    const isEnvAdmin = decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID;
    if (isEnvAdmin) {
      if (!isCurrentAdminToken(decoded)) return NextResponse.json({ success: false, message: "Main Admin session is no longer valid." }, { status: 401, headers: HEADERS });
      return NextResponse.json({ success: true }, { headers: HEADERS });
    }
    if (typeof decoded.userId !== "string" || !mongoose.isValidObjectId(decoded.userId)) return NextResponse.json({ success: false, message: "Invalid login session." }, { status: 401, headers: HEADERS });
    await connectDB();
    const version = Number(decoded.sessionVersion || 0);
    const updated = await User.updateOne({ _id: decoded.userId, sessionVersion: version }, { $set: { lastSeenAt: new Date() } });
    if (!updated.matchedCount) return NextResponse.json({ success: false, message: "Your session is invalid or has been revoked." }, { status: 401, headers: HEADERS });
    return NextResponse.json({ success: true }, { headers: HEADERS });
  } catch (error) {
    if (error instanceof Error && error.name === "JsonWebTokenError") return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401, headers: HEADERS });
    console.error("User activity heartbeat error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "Could not update activity." }, { status: 500, headers: HEADERS });
  }
}
