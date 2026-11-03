import { Schema, model, models, type Model } from "mongoose";

/**
 * One row per image-generation attempt (AI Editor / Bulk Photo Edit / AI Template).
 * Used for (1) per-user rate limiting, and (2) the admin "Generation activity" page
 * (who generated, from which IP/device, how many times).
 * Rows delete themselves after 60 days.
 */
const GenerationLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    route: { type: String, default: "", trim: true },
    ip: { type: String, default: "unknown", trim: true },
    userAgent: { type: String, default: "", trim: true },
    outcome: { type: String, enum: ["allowed", "blocked"], default: "allowed" },
    // true = image delivered, false = generation failed, null = unknown / still running
    success: { type: Boolean, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { collection: "generation_logs", versionKey: false },
);

GenerationLogSchema.index({ userId: 1, createdAt: -1 });
GenerationLogSchema.index({ ip: 1, createdAt: -1 });
GenerationLogSchema.index({ createdAt: -1 });
GenerationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

const GenerationLog: Model<any> = models.GenerationLog || model("GenerationLog", GenerationLogSchema);
export default GenerationLog;
