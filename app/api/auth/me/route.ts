import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ENV_ADMIN_USER_ID, getAdminCredentials, isCurrentAdminToken, type AdminTokenClaims } from "@/lib/adminCredentials";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const JWT_SECRET = process.env.JWT_SECRET || "";
const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

function getToken(req: Request) {
  const cookiePair = req.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (cookiePair) {
    try { return decodeURIComponent(cookiePair.slice("token=".length)); } catch { return cookiePair.slice("token=".length); }
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice("Bearer ".length).trim() || null;
  return null;
}

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET.trim()) return NextResponse.json({ message: "Secure authentication is not configured on the server." }, { status: 503, headers: NO_STORE });
    const token = getToken(req);
    if (!token) return NextResponse.json({ message: "No token provided!" }, { status: 401, headers: NO_STORE });
    let decoded: AdminTokenClaims & { userId?: string; sessionVersion?: number };
    try { decoded = jwt.verify(token, JWT_SECRET) as typeof decoded; }
    catch { return NextResponse.json({ message: "Invalid or expired token!" }, { status: 401, headers: NO_STORE }); }

    const isEnvAdmin = decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID;
    if (isEnvAdmin) {
      if (!isCurrentAdminToken(decoded)) return NextResponse.json({ message: "The configured Main Admin credentials changed. Please sign in again." }, { status: 401, headers: NO_STORE });
      const admin = getAdminCredentials();
      return NextResponse.json({ user: {
        id: ENV_ADMIN_USER_ID,
        fullName: admin.fullName,
        email: admin.email,
        phoneNumber: "",
        country: "",
        district: "",
        role: "admin",
        isRootAdmin: true,
        isPrimaryAdmin: true,
        isBanned: false,
        profileImageUrl: "",
        profileImagePublicId: "",
      } }, { status: 200, headers: NO_STORE });
    }

    if (typeof decoded.userId !== "string" || !mongoose.isValidObjectId(decoded.userId)) return NextResponse.json({ message: "Invalid token payload!" }, { status: 401, headers: NO_STORE });
    await connectDB();
    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) return NextResponse.json({ message: "User not found!" }, { status: 404, headers: NO_STORE });
    if (Number(decoded.sessionVersion || 0) !== Number((user as any).sessionVersion || 0)) return NextResponse.json({ message: "Your session has been reset. Please log in again." }, { status: 401, headers: NO_STORE });
    const { sessionVersion: _sessionVersion, passwordChangedAt: _passwordChangedAt, ...safeUser } = user as any;
    return NextResponse.json({ user: {
      ...safeUser,
      id: String(user._id),
      role: user.role === "admin" ? "admin" : "user",
      isBanned: user.isBanned === true,
      isRootAdmin: false,
      isPrimaryAdmin: false,
    } }, { status: 200, headers: NO_STORE });
  } catch (error: unknown) {
    console.error("Authentication check failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Authentication check failed." }, { status: 500, headers: NO_STORE });
  }
}
