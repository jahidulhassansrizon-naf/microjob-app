import { connectDB } from "@/lib/db";
import {
  PRESENCE_SESSION_TTL_MS,
  PRESENCE_STALE_AFTER_MS,
} from "@/lib/presenceConstants";
import PresenceSession from "@/models/PresenceSession";
import User from "@/models/User";

export { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";

type PresenceInput = { userId: string; sessionId: string };

/**
 * Upserts the current short-lived online session only. Legacy activity snapshot
 * fields are explicitly unset so old local/dev records are not carried forward.
 */
export async function updatePresenceSnapshot(input: PresenceInput) {
  await connectDB();
  const now = new Date();

  // The caller has already verified the session with User.findById, so the separate
  // User.exists() round-trip was redundant. updateOne(upsert) also avoids returning the
  // whole PresenceSession document. The User update below doubles as the existence check:
  // matchedCount === 0 means the account is gone.
  const userUpdate = await User.updateOne({ _id: input.userId }, { $set: { lastSeenAt: now } });
  if (!userUpdate.matchedCount) return false;

  await PresenceSession.updateOne(
    { userId: input.userId, sessionId: input.sessionId },
    {
      $set: {
        connectionId: input.sessionId,
        lastHeartbeatAt: now,
        expiresAt: new Date(now.getTime() + PRESENCE_SESSION_TTL_MS),
      },
      $unset: {
        consentStatus: 1,
        currentPath: 1,
        currentPage: 1,
        currentAction: 1,
        activityUpdatedAt: 1,
      },
      $setOnInsert: { userId: input.userId, sessionId: input.sessionId },
    },
    { upsert: true, setDefaultsOnInsert: true, strict: false },
  );
  return true;
}

/** Remove a tab on explicit logout; other active tabs keep the user online. */
export async function endPresenceSession(userId: string, sessionId: string) {
  await connectDB();
  await PresenceSession.deleteOne({ userId, sessionId });

  const now = new Date();
  const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);
  const newest = await PresenceSession.findOne({
    userId,
    lastHeartbeatAt: { $gte: cutoff },
    expiresAt: { $gt: now },
  })
    .sort({ lastHeartbeatAt: -1 })
    .select("lastHeartbeatAt")
    .lean() as any;

  await User.updateOne(
    { _id: userId },
    { $set: { lastSeenAt: newest?.lastHeartbeatAt || null } },
  );
}
