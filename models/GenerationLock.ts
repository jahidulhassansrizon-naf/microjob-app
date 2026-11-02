import { Schema, model, models } from "mongoose";

/**
 * One row per user while an image generation is running.
 * The unique userId index is what guarantees "one image at a time per account",
 * even across several browser tabs or serverless instances. The TTL index removes
 * a lock that was never released (for example if the server function was killed).
 */
const GenerationLockSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, trim: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

GenerationLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GenerationLock = models.GenerationLock || model("GenerationLock", GenerationLockSchema);
export default GenerationLock;
