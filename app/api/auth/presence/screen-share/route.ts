import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import PresenceSession from "@/models/PresenceSession";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;

export async function GET(request: Request) {
  const auth = await getVerifiedRequestSession(request);
  if (!auth || auth.role !== "user") {
    return NextResponse.json({ success: false, message: "Please sign in as a user." }, { status: 401 });
  }
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || "";
  if (!ID_PATTERN.test(sessionId)) return NextResponse.json({ success: false, message: "Invalid session." }, { status: 400 });

  try {
    await connectDB();
    const now = new Date();
    const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);
    let row = await PresenceSession.findOne({ userId: auth.userId, sessionId, lastHeartbeatAt: { $gte: cutoff }, expiresAt: { $gt: now } })
      .select("screenShareStatus screenShareRequestId screenShareAdminViewerId screenShareLastViewerPingAt")
      .lean() as any;
    if (!row) return NextResponse.json({ success: true, status: "idle" }, { headers: { "Cache-Control": "no-store, max-age=0" } });

    const status = String(row.screenShareStatus || "idle");
    const lastPing = row.screenShareLastViewerPingAt ? new Date(row.screenShareLastViewerPingAt).getTime() : 0;
    if ((status === "requested" || status === "sharing") && lastPing && now.getTime() - lastPing > 60_000) {
      await PresenceSession.updateOne({ userId: auth.userId, sessionId }, { $set: { screenShareStatus: "stopped" } });
      return NextResponse.json({ success: true, status: "stopped" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    return NextResponse.json({
      success: true,
      status,
      ...(status === "requested" || status === "sharing" ? {
        requestId: row.screenShareRequestId || "",
        viewerId: row.screenShareAdminViewerId || "",
      } : {}),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("User screen-share status error:", error);
    return NextResponse.json({ success: false, message: "Could not read screen-share status." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getVerifiedRequestSession(request);
  if (!auth || auth.role !== "user") {
    return NextResponse.json({ success: false, message: "Please sign in as a user." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 }); }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const viewerId = typeof body.viewerId === "string" ? body.viewerId : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!ID_PATTERN.test(sessionId) || !ID_PATTERN.test(requestId) || !ID_PATTERN.test(viewerId) || !["started", "declined", "stopped"].includes(action)) {
    return NextResponse.json({ success: false, message: "Invalid screen-share response." }, { status: 400 });
  }

  try {
    await connectDB();
    const now = new Date();
    const row = await PresenceSession.findOne({ userId: auth.userId, sessionId, screenShareRequestId: requestId, screenShareAdminViewerId: viewerId })
      .select("screenShareStatus")
      .lean() as any;
    if (!row || !["requested", "sharing"].includes(String(row.screenShareStatus))) {
      return NextResponse.json({ success: false, message: "This screen-share request is no longer active." }, { status: 409 });
    }
    const nextStatus = action === "started" ? "sharing" : action === "declined" ? "declined" : "stopped";
    await PresenceSession.updateOne(
      { userId: auth.userId, sessionId, screenShareRequestId: requestId, screenShareAdminViewerId: viewerId },
      { $set: { screenShareStatus: nextStatus, ...(action === "started" ? { screenShareLastViewerPingAt: now } : {}) } },
    );
    return NextResponse.json({ success: true, status: nextStatus }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("User screen-share response error:", error);
    return NextResponse.json({ success: false, message: "Could not update screen-share status." }, { status: 500 });
  }
}
