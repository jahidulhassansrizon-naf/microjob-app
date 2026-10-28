import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { connectDB } from "@/lib/db";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import PresenceSession from "@/models/PresenceSession";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;

function normalizeLiveKitUrl(value: string) {
  const input = value.trim();
  const parsed = new URL(input);
  if (parsed.protocol === "https:") parsed.protocol = "wss:";
  else if (parsed.protocol === "http:") parsed.protocol = "ws:";
  if (parsed.protocol !== "wss:" && parsed.protocol !== "ws:") {
    throw new Error("LIVEKIT_URL must use ws:// or wss:// (https:// is also accepted and converted to wss://).");
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function roomNameForSession(sessionId: string) {
  const hash = createHash("sha256").update(sessionId).digest("hex").slice(0, 32);
  return `sohojhub-live-${hash}`;
}

export async function POST(request: Request) {
  const adminAuth = await requireAdmin(request);
  const isAdmin = !adminAuth.response;
  const userAuth = isAdmin ? null : getVerifiedRequestSession(request);

  if (!isAdmin && (!userAuth || userAuth.role !== "user")) {
    return adminAuth.response || NextResponse.json({ success: false, message: "Please sign in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const viewerId = typeof body.viewerId === "string" ? body.viewerId : "";
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  if (!ID_PATTERN.test(sessionId) || !ID_PATTERN.test(viewerId)) {
    return NextResponse.json({ success: false, message: "Invalid live session." }, { status: 400 });
  }
  if (!isAdmin && !ID_PATTERN.test(requestId)) {
    return NextResponse.json({ success: false, message: "Invalid screen-share request." }, { status: 400 });
  }

  const liveKitUrl = process.env.LIVEKIT_URL?.trim();
  const liveKitApiKey = process.env.LIVEKIT_API_KEY?.trim();
  const liveKitApiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
    return NextResponse.json(
      {
        success: false,
        code: "LIVEKIT_NOT_CONFIGURED",
        message: "LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on this hosting environment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const serverUrl = normalizeLiveKitUrl(liveKitUrl);
    await connectDB();
    const now = new Date();
    const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);

    const query: Record<string, any> = {
      sessionId,
      lastHeartbeatAt: { $gte: cutoff },
      expiresAt: { $gt: now },
      screenShareAdminViewerId: viewerId,
    };

    if (isAdmin) {
      query.screenShareStatus = "sharing";
    } else {
      query.userId = userAuth!.userId;
      query.screenShareRequestId = requestId;
      query.screenShareStatus = { $in: ["requested", "sharing"] };
    }

    const presence = await PresenceSession.findOne(query)
      .select("userId sessionId screenShareStatus screenShareRequestId screenShareAdminViewerId")
      .lean() as any;

    if (!presence) {
      return NextResponse.json(
        { success: false, message: "This live-share request is no longer active, or you are not authorized to join it." },
        { status: 403, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const room = roomNameForSession(sessionId);
    const identity = isAdmin
      ? `admin-${viewerId}`
      : `user-${userAuth!.userId}-${sessionId.slice(0, 16)}`;
    const token = new AccessToken(liveKitApiKey, liveKitApiSecret, {
      identity,
      name: isAdmin ? "Seba Lagbe Admin Viewer" : "Seba Lagbe User Screen",
      ttl: "5m",
    });

    token.addGrant({
      roomJoin: true,
      room,
      // Live website mirroring uses rrweb events, not video tracks.
      // Participants can exchange data but cannot publish audio/video tracks.
      canSubscribe: true,
      canPublish: false,
      canPublishSources: [],
      canPublishData: true,
      canUpdateOwnMetadata: false,
    });

    const participantToken = await token.toJwt();
    // Keep the viewer lease fresh while the authenticated admin obtains a valid token.
    if (isAdmin) {
      await PresenceSession.updateOne(
        { sessionId, screenShareAdminViewerId: viewerId, screenShareStatus: "sharing" },
        { $set: { screenShareLastViewerPingAt: now } },
      );
    }

    return NextResponse.json(
      { success: true, serverUrl, token: participantToken },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("LiveKit token creation error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Could not create a LiveKit connection token." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
