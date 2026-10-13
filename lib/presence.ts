import Redis from "ioredis";
import { connectDB } from "@/lib/db";
import {
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  PRESENCE_REDIS_CHANNEL,
  PRESENCE_SESSION_TTL_MS,
  PRESENCE_STALE_AFTER_MS,
} from "@/lib/presenceConstants";
import PresenceSession from "@/models/PresenceSession";
import User from "@/models/User";

export { PRESENCE_HEARTBEAT_INTERVAL_MS, PRESENCE_STALE_AFTER_MS };

export type PresenceEvent = {
  type: "presence";
  userId: string;
  isOnline: boolean;
  changedAt: string;
};

let publisher: Redis | null = null;

function getPublisher(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (!publisher || publisher.status === "end") {
    publisher = new Redis(url, {
      connectTimeout: 3_000,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => (attempt <= 3 ? Math.min(attempt * 250, 1_000) : null),
    });
    publisher.on("error", (error) => {
      console.error("Presence Redis publisher error:", error.message);
    });
  }

  return publisher;
}

/** Redis fan-out lets admin tabs on different Vercel instances get the same event. */
export async function publishPresenceEvent(userId: string, isOnline: boolean) {
  const client = getPublisher();
  if (!client) return false;

  const event: PresenceEvent = {
    type: "presence",
    userId,
    isOnline,
    changedAt: new Date().toISOString(),
  };

  try {
    await client.publish(PRESENCE_REDIS_CHANNEL, JSON.stringify(event));
    return true;
  } catch (error) {
    // The admin page also has a low-frequency database refresh as a fallback.
    console.error("Could not publish presence event:", error);
    return false;
  }
}

function freshPresenceFilter(userId: string, now: Date, excludeSessionId?: string) {
  return {
    userId,
    ...(excludeSessionId ? { sessionId: { $ne: excludeSessionId } } : {}),
    lastHeartbeatAt: { $gte: new Date(now.getTime() - PRESENCE_STALE_AFTER_MS) },
    expiresAt: { $gt: now },
  };
}

/** Open/replace this tab's lease and announce first-online transitions. */
export async function openPresenceSession(
  userId: string,
  sessionId: string,
  connectionId: string,
) {
  await connectDB();
  const now = new Date();
  const cutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);

  const [wasOnline, existingUser] = await Promise.all([
    PresenceSession.exists({
      userId,
      lastHeartbeatAt: { $gte: cutoff },
      expiresAt: { $gt: now },
    }),
    User.exists({ _id: userId }),
  ]);

  if (!existingUser) {
    await PresenceSession.deleteOne({ userId, sessionId, connectionId });
    return false;
  }

  await PresenceSession.findOneAndUpdate(
    { sessionId, userId },
    {
      $set: {
        connectionId,
        lastHeartbeatAt: now,
        expiresAt: new Date(now.getTime() + PRESENCE_SESSION_TTL_MS),
      },
      $setOnInsert: { userId, sessionId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await User.updateOne({ _id: userId }, { $set: { lastSeenAt: now } });
  if (!wasOnline) await publishPresenceEvent(userId, true);
  return true;
}

/** Renew only the current socket's lease; an older socket cannot overwrite a reconnect. */
export async function refreshPresenceSession(
  userId: string,
  sessionId: string,
  connectionId: string,
) {
  await connectDB();
  const now = new Date();
  const result = await PresenceSession.updateOne(
    { userId, sessionId, connectionId },
    {
      $set: {
        lastHeartbeatAt: now,
        expiresAt: new Date(now.getTime() + PRESENCE_SESSION_TTL_MS),
      },
    },
  );
  if (!result.matchedCount) return false;

  const userUpdate = await User.updateOne({ _id: userId }, { $set: { lastSeenAt: now } });
  return userUpdate.matchedCount > 0;
}

/** Remove only the closing socket's lease; a newer reconnect cannot be removed by an old close event. */
export async function endPresenceSession(
  userId: string,
  sessionId: string,
  connectionId: string,
) {
  await connectDB();
  const deletion = await PresenceSession.deleteOne({ userId, sessionId, connectionId });
  if (!deletion.deletedCount) return;

  const now = new Date();
  const activeSessions = await PresenceSession.find(freshPresenceFilter(userId, now))
    .sort({ lastHeartbeatAt: -1 })
    .select("lastHeartbeatAt")
    .limit(1)
    .lean();

  if (activeSessions.length) {
    await User.updateOne(
      { _id: userId },
      { $set: { lastSeenAt: activeSessions[0].lastHeartbeatAt } },
    );
    return;
  }

  await User.updateOne({ _id: userId }, { $set: { lastSeenAt: null } });
  await publishPresenceEvent(userId, false);
}

