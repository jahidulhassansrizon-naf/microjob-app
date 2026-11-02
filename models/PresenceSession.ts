import { Schema, model, models } from "mongoose";

/**
 * A short-lived signed-in browser session and its optional live-screen request.
 * No page/action activity timeline is stored in this model.
 */
const PresenceSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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

// Next.js development hot reload can retain a compiled model from an earlier schema.
const cachedPresenceSession = models.PresenceSession;
const hasCurrentSchema = Boolean(
  !cachedPresenceSession?.schema.path("screenShareStatus") &&
  !cachedPresenceSession?.schema.path("consentStatus") &&
  !cachedPresenceSession?.schema.path("currentPath") &&
  !cachedPresenceSession?.schema.path("currentPage") &&
  !cachedPresenceSession?.schema.path("currentAction") &&
  !cachedPresenceSession?.schema.path("activityUpdatedAt"),
);

if (cachedPresenceSession && !hasCurrentSchema) {
  delete models.PresenceSession;
}

const PresenceSession = models.PresenceSession || model("PresenceSession", PresenceSessionSchema);

export default PresenceSession;
