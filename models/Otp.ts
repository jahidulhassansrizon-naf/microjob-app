import mongoose, { Schema, model, models } from "mongoose";

const OtpSchema = new Schema(
  {
    identifier: {
      type: String, // ফোন নম্বর অথবা ইমেইল অ্যাড্রেস
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // ৫ মিনিট (৩০০ সেকেন্ড) পর ডাটাবেস থেকে অটোমেটিক মুছে যাবে
    },
  },
  { timestamps: true },
);

const Otp = models.Otp || model("Otp", OtpSchema);

export default Otp;
