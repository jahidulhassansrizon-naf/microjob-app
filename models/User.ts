import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    country: {
      type: String,
      default: "Bangladesh",
      trim: true,
    },

    district: {
      type: String,
      default: "",
      trim: true,
    },

    profession: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      default: "",
      trim: true,
    },

    dob: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    thana: {
      type: String,
      default: "",
      trim: true,
    },

    postcode: {
      type: String,
      default: "",
      trim: true,
    },

    about: {
      type: String,
      default: "",
      trim: true,
    },

    // Cloudinary-backed profile image for this specific user.
    profileImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    profileImagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    // Business Information Fields
    businessName: {
      type: String,
      default: "",
      trim: true,
    },

    businessType: {
      type: String,
      default: "",
      trim: true,
    },

    tradeLicense: {
      type: String,
      default: "",
      trim: true,
    },

    businessPhone: {
      type: String,
      default: "",
      trim: true,
    },

    businessAddress: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    // Role is assigned by the server. Public registration always creates users.
    // The environment-managed administrator is not stored as a User document.
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },

    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },

    loginCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    credits: {
      type: Number,
      default: 0,
      min: 0,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Dev Mode-এ Mongoose Model Cache ক্লিয়ার করার জন্য
if (process.env.NODE_ENV === "development") {
  delete (models as any).User;
}

const User = models.User || model("User", UserSchema);

export default User;
