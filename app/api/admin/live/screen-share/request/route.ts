import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { connectDB } from "@/lib/db";
import PresenceSession from "@/models/PresenceSession";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 }); }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const viewerId = typeof body.viewerId === "string" ? body.viewerId : "";
  const action = body.action === "stop" ? "stop" : "request";
  if (!ID_PATTERN.test(sessionId) || !ID_PATTERN.test(viewerId)) {
    return NextResponse.json({ success: false, message: "Invalid live session." }, { status: 400 });
  }

  try {
    await connectDB();
    const now = new Date();
    const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);
    const presence = await PresenceSession.findOne({
      sessionId,
      lastHeartbeatAt: { $gte: cutoff },
      expiresAt: { $gt: now },
    }).select("userId screenShareStatus screenShareAdminViewerId").lean() as any;

    if (!presence) {
      return NextResponse.json({ success: false, message: "This user is no longer online." }, { status: 404 });
    }
    if (action === "request" && ["requested", "sharing"].includes(String(presence.screenShareStatus)) && presence.screenShareAdminViewerId && presence.screenShareAdminViewerId !== viewerId) {
      return NextResponse.json({ success: false, message: "This user already has an active screen-share request in another admin tab." }, { status: 409 });
    }
    if (action === "stop" && presence.screenShareAdminViewerId && presence.screenShareAdminViewerId !== viewerId) {
      return NextResponse.json({ success: false, message: "This live share belongs to another viewer session." }, { status: 409 });
    }

    if (action === "stop") {
      await PresenceSession.updateOne({ sessionId }, { $set: { screenShareStatus: "stopped", screenShareLastViewerPingAt: now } });
      return NextResponse.json({ success: true, status: "stopped" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const requestId = randomUUID();
    await PresenceSession.updateOne(
      { sessionId },
      { $set: {
        screenShareStatus: "requested",
        screenShareRequestId: requestId,
        screenShareAdminViewerId: viewerId,
        screenShareRequestedAt: now,
        screenShareLastViewerPingAt: now,
      } },
    );
    return NextResponse.json({ success: true, requestId, status: "requested" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Live screen request error:", error);
    return NextResponse.json({ success: false, message: "Could not request live screen sharing." }, { status: 500 });
  }
}
