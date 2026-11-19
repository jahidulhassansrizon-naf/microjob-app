import { getJwtSecret } from "@/lib/jwtSecurity";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const JWT_SECRET = getJwtSecret();
type JwtPayload = { userId?: string; exp?: number };

function getToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim() || null;
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice("token=".length)); } catch { return null; }
}

// Called when a customer comes back from the UddoktaPay / PipraPay checkout with the browser back arrow.
// The gateway never calls our cancel URL in that case, so the order would stay "Pending" forever.
// Only the owner's own still-unpaid UddoktaPay order is touched. If the customer really paid,
// the webhook / verify flow can still activate a CANCELLED order, so nothing is lost.
export async function POST(request: Request) {
  try {
    if (!JWT_SECRET) return NextResponse.json({ success: false }, { status: 500 });
    const token = getToken(request);
    if (!token) return NextResponse.json({ success: false }, { status: 401 });
    let decoded: JwtPayload;
    try { decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload; } catch { return NextResponse.json({ success: false }, { status: 401 }); }
    if (!decoded.userId) return NextResponse.json({ success: false }, { status: 401 });

    const body = await request.json().catch(() => null);
    const subscriptionId = String(body?.subscription_id || body?.subscriptionId || "").trim();
    if (!mongoose.isValidObjectId(subscriptionId)) return NextResponse.json({ success: false }, { status: 400 });

    await connectDB();
    const result = await Subscription.updateOne(
      { _id: subscriptionId, userId: decoded.userId, paymentProvider: { $in: ["UddoktaPay", "PipraPay"] }, paymentStatus: "PENDING", accessStatus: "PENDING" },
      { $set: { paymentStatus: "CANCELLED", accessStatus: "CANCELLED", reviewNote: "Customer left the payment checkout without paying." } },
    );
    return NextResponse.json({ success: true, cancelled: result.modifiedCount > 0 }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[UddoktaPay Abandon] error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
