import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  ENV_ADMIN_USER_ID,
  getAdminCredentials,
  isCurrentAdminToken,
  type AdminTokenClaims,
} from "@/lib/adminCredentials";

export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "";

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const tokenPair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!tokenPair) return null;
  try { return decodeURIComponent(tokenPair.slice("token=".length)); }
  catch { return tokenPair.slice("token=".length); }
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET.trim()) {
      return NextResponse.json(
        { message: "Secure authentication is not configured on the server." },
        { status: 503 },
      );
    }

    const token = getBearerToken(req) || getTokenFromCookie(req.headers.get("cookie"));
    if (!token) return NextResponse.json({ message: "No token provided!" }, { status: 401 });

    let decoded: AdminTokenClaims;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as AdminTokenClaims;
    } catch {
      return NextResponse.json({ message: "Invalid or expired token!" }, { status: 401 });
    }

    // An environment-configured admin is not a User document in MongoDB.
    if (decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID) {
      if (!isCurrentAdminToken(decoded)) {
        return NextResponse.json({ message: "Invalid or expired administrator session." }, { status: 401 });
      }
      const admin = getAdminCredentials();
      return NextResponse.json({
        user: {
          id: ENV_ADMIN_USER_ID,
          fullName: admin.fullName,
          email: admin.email,
          phoneNumber: "",
          role: "admin",
          isRootAdmin: true,
          isBanned: false,
          profileImageUrl: "",
          profileImagePublicId: "",
        },
      }, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    if (
      typeof decoded?.userId !== "string" ||
      !mongoose.isValidObjectId(decoded.userId)
    ) {
      return NextResponse.json({ message: "Invalid token payload!" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) return NextResponse.json({ message: "User not found!" }, { status: 404 });

    if (Number((decoded as any).sessionVersion || 0) !== Number((user as any).sessionVersion || 0)) {
      return NextResponse.json({ message: "Your session has been reset. Please log in again." }, { status: 401 });
    }

    const { sessionVersion: _sessionVersion, passwordChangedAt: _passwordChangedAt, ...safeUser } = user as any;
    return NextResponse.json({
      user: {
        ...safeUser,
        id: String(user._id),
        role: user.role === "admin" ? "admin" : "user",
        isBanned: user.isBanned === true,
        isRootAdmin: false,
      },
    }, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error: unknown) {
    console.error("Authentication check failed:", error);
    return NextResponse.json(
      { message: "Authentication check failed." },
      { status: 500 },
    );
  }
}
