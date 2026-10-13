import { Schema, model, models } from "mongoose";

/** One live browser-tab connection. Expired rows are a safety net for hard network loss. */
const PresenceSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Stable for this mounted browser tab; different tabs use different IDs.
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Changes per WebSocket connection so an old reconnect's close event cannot
    // delete a newer, already-open connection for the same tab.
    connectionId: {
      type: String,
      required: true,
      trim: true,
    },
    lastHeartbeatAt: {
      type: Date,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

PresenceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PresenceSessionSchema.index({ userId: 1, lastHeartbeatAt: -1, expiresAt: 1 });

const PresenceSession =
  models.PresenceSession || model("PresenceSession", PresenceSessionSchema);

export default PresenceSession;
