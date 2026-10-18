import { NextResponse } from "next/server";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import { endPresenceSession, updatePresenceSnapshot } from "@/lib/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;

/**
 * Maintains only a short-lived online browser session. This endpoint no longer
 * accepts or stores page paths, click actions, or activity-sharing consent.
 */
export async function POST(request: Request) {
  const session = getVerifiedRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please sign in to update your live status." },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  if (session.role === "admin") {
    return NextResponse.json(
      { success: true, role: "admin" },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ success: false, message: "Invalid browser session." }, { status: 400 });
  }

  try {
    if (body.leave === true) {
      await endPresenceSession(session.userId, sessionId);
      return NextResponse.json(
        { success: true, role: "user", left: true },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const updated = await updatePresenceSnapshot({ userId: session.userId, sessionId });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User account was not found." },
        { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    return NextResponse.json(
      { success: true, role: "user" },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Live presence update error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update live status." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
