import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isCurrentAdminToken, type AdminTokenClaims } from "@/lib/adminCredentials";

export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "";

function getToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const value = authorization.slice("Bearer ".length).trim();
    if (value) return value;
  }
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice("token=".length)); }
  catch { return pair.slice("token=".length); }
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ success: false, message: "Not signed in." }, { status: 401 });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenClaims;
    if (decoded.admin === true || decoded.role === "admin") {
      if (!isCurrentAdminToken(decoded)) return NextResponse.json({ success: false, message: "Invalid administrator session." }, { status: 401 });
      // The environment-managed admin is not a registered user and is excluded
      // from customer online counts.
      return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    if (!decoded?.userId) return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401 });

    await connectDB();
    const result = await User.updateOne({ _id: decoded.userId }, { $set: { lastSeenAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const isTokenError = error instanceof Error && error.name === "JsonWebTokenError";
    if (isTokenError) return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401 });
    console.error("User activity heartbeat error:", error);
    return NextResponse.json({ success: false, message: "Could not update activity." }, { status: 500 });
  }
}
