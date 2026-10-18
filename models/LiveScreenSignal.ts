import { Schema, model, models } from "mongoose";

/** Short-lived WebRTC handshake messages only. No video frames or activity history are stored. */
const LiveScreenSignalSchema = new Schema(
  {
    presenceSessionId: { type: String, required: true, index: true },
    viewerId: { type: String, required: true, index: true },
    toRole: { type: String, enum: ["user", "admin"], required: true, index: true },
    kind: { type: String, enum: ["description", "candidate", "stop"], required: true },
    payload: { type: Schema.Types.Mixed, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

LiveScreenSignalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
LiveScreenSignalSchema.index({ presenceSessionId: 1, viewerId: 1, toRole: 1, createdAt: 1 });

const LiveScreenSignal = models.LiveScreenSignal || model("LiveScreenSignal", LiveScreenSignalSchema);
export default LiveScreenSignal;
