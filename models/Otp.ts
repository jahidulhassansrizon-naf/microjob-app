import { Schema, model, models } from "mongoose";

const OtpSchema = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Legacy OTPs remain readable until their five-minute TTL expires. New email
    // OTPs are stored only as otpHash; do not log or return either field.
    otp: {
      type: String,
      required: false,
      select: false,
    },
    otpHash: {
      type: String,
      required: false,
      select: false,
    },
    purpose: {
      type: String,
      enum: ["register", "password-reset", "sms"],
      required: false,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300,
    },
  },
  { timestamps: true },
);

const Otp = models.Otp || model("Otp", OtpSchema);

export default Otp;
