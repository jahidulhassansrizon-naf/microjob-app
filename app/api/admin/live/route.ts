import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PresenceSession from "@/models/PresenceSession";
import User from "@/models/User";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";

/** Returns online browser sessions and live-screen request state only; no activity details or history are returned. */
export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    await connectDB();
    const now = new Date();
    const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);

    // Keep active user-approved LiveKit requests alive while the authenticated
    // admin Live panel is polling. If the admin closes the panel, this lease
    // stops refreshing and the user's share controller will disconnect it.
    await PresenceSession.updateMany(
      {
        screenShareStatus: { $in: ["requested", "sharing"] },
        screenShareAdminViewerId: { $ne: "" },
        lastHeartbeatAt: { $gte: cutoff },
        expiresAt: { $gt: now },
      },
      { $set: { screenShareLastViewerPingAt: now } },
    );

    const sessions = await PresenceSession.find({
      lastHeartbeatAt: { $gte: cutoff },
      expiresAt: { $gt: now },
    })
      .sort({ lastHeartbeatAt: -1 })
      .select("userId sessionId lastHeartbeatAt screenShareStatus screenShareRequestId screenShareAdminViewerId")
      .limit(500)
      .lean();

    const userIds = [...new Set(sessions.map((session: any) => String(session.userId)))];
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select("fullName email phoneNumber profileImageUrl")
          .lean()
      : [];
    const usersById = new Map((users as any[]).map((user) => [String(user._id), user]));

    const liveSessions = sessions.flatMap((session: any) => {
      const userId = String(session.userId);
      const user = usersById.get(userId);
      if (!user) return [];
      return [{
        userId,
        sessionId: String(session.sessionId),
        fullName: user.fullName || "Studio Seba user",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        profileImageUrl: user.profileImageUrl || "",
        lastHeartbeatAt: session.lastHeartbeatAt || null,
        screenShareStatus: session.screenShareStatus || "idle",
        screenShareRequestId: session.screenShareRequestId || "",
        screenShareAdminViewerId: session.screenShareAdminViewerId || "",
      }];
    });

    return NextResponse.json(
      { success: true, sessions: liveSessions, generatedAt: now.toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin live sessions error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load online sessions." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
