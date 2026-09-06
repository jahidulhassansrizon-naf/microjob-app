const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, required: true },
    district: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
