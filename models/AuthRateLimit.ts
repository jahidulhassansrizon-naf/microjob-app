import { Schema, model, models } from "mongoose";

const AuthRateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    count: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    leaseToken: { type: String, select: false },
  },
  { timestamps: true },
);

AuthRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthRateLimit = models.AuthRateLimit || model("AuthRateLimit", AuthRateLimitSchema);

export default AuthRateLimit;
