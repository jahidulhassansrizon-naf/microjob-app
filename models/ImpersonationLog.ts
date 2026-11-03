import mongoose, { Schema, type Document, type Model } from "mongoose";

/**
 * Audit trail for admin "Login as this user" sessions.
 *
 * Every impersonation is logged here: which admin started it, which user
 * account was entered, when it started, when it ended (or expired), and why.
 * This record is the accountability trade-off for not having a shared
 * "universal password" — nobody can enter a user's account silently.
 */
export interface IImpersonationLog extends Document {
  adminId: string;
  adminEmail: string;
  adminFullName: string;
  targetUserId: mongoose.Types.ObjectId;
  targetEmail: string;
  targetFullName: string;
  startedAt: Date;
  expiresAt: Date;
  hardCapAt: Date;
  endedAt: Date | null;
  endedReason: "stopped" | "expired" | "revoked" | null;
  ipAddress: string;
  userAgent: string;
}

const ImpersonationLogSchema = new Schema<IImpersonationLog>(
  {
    adminId: { type: String, required: true, index: true },
    adminEmail: { type: String, default: "" },
    adminFullName: { type: String, default: "" },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetEmail: { type: String, default: "" },
    targetFullName: { type: String, default: "" },
    startedAt: { type: Date, required: true, default: Date.now },
    // Current known expiry of the live session; pushed forward by the
    // heartbeat route while the admin stays active, capped by hardCapAt.
    expiresAt: { type: Date, required: true },
    // Fixed at session start: the absolute latest this session can ever run
    // to, regardless of activity.
    hardCapAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    endedReason: { type: String, enum: ["stopped", "expired", "revoked", null], default: null },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

ImpersonationLogSchema.index({ startedAt: -1 });

const ImpersonationLog: Model<IImpersonationLog> =
  mongoose.models.ImpersonationLog ||
  mongoose.model<IImpersonationLog>("ImpersonationLog", ImpersonationLogSchema);

export default ImpersonationLog;
