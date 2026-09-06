const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String }, // ইমেইল OTP-এর সুবিধার জন্য required তুলে দেওয়া হলো
    email: { type: String }, // জিমেইল OTP সেভ করার জন্য ফিল্ড যুক্ত করা হলো
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // ৫ মিনিট পর অটো ডিলিট হবে
  },
  { timestamps: true },
);

module.exports = mongoose.model("Otp", otpSchema);
