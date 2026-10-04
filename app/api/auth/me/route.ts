import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const tokenPair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return tokenPair
    ? decodeURIComponent(tokenPair.slice("token=".length))
    : null;
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

export async function GET(req: Request) {
  try {
    await connectDB();

    // Support both the browser's Authorization header and the login cookie.
    // This keeps /api/auth/me compatible with all existing client flows.
    const token =
      getBearerToken(req) || getTokenFromCookie(req.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        { message: "No token provided!" },
        { status: 401 },
      );
    }

    let decoded: { userId?: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    } catch {
      return NextResponse.json(
        { message: "Invalid or expired token!" },
        { status: 401 },
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "Invalid token payload!" },
        { status: 401 },
      );
    }

    const user = await User.findById(decoded.userId)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        { message: "User not found!" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        message: "Authentication check failed!",
        error: error instanceof Error ? error.message : "",
      },
      { status: 500 },
    );
  }
}
