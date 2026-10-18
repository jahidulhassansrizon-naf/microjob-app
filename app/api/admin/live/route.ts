import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PresenceSession from "@/models/PresenceSession";
import User from "@/models/User";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";

/** Returns current online browser sessions only; it does not create activity logs. */
export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    await connectDB();
    const now = new Date();
    const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);
    const sessions = await PresenceSession.find({
      lastHeartbeatAt: { $gte: cutoff },
      expiresAt: { $gt: now },
    })
      .sort({ lastHeartbeatAt: -1 })
      .select("userId sessionId lastHeartbeatAt")
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
        fullName: user.fullName || "Sohoj Hub user",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        profileImageUrl: user.profileImageUrl || "",
        lastHeartbeatAt: session.lastHeartbeatAt || null,
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
