import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 100,
    },

    // Server-generated normalized value. Public request bodies must never set it.
    // The partial unique index handles concurrent registrations without blocking
    // legacy user documents that have not yet acquired this field.
    fullNameNormalized: {
      type: String,
      select: false,
      immutable: false,
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
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    // Exactly one trusted primary admin is provisioned with a one-time CLI script.
    // Public registration and profile endpoints must never be allowed to set this.
    isPrimaryAdmin: {
      type: Boolean,
      default: false,
    },

    // Tool access can be suspended without blocking login or normal site browsing.
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    bannedBy: {
      type: String,
      default: "",
      trim: true,
    },

    banReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240,
    },

    // Incrementing this value invalidates existing signed-in sessions.
    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
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

    // An administrator can grant paid-tool access without changing payment
    // or subscription records. The grant automatically stops at its expiry.
    manualAccessEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },

    manualAccessExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    manualAccessGrantedAt: {
      type: Date,
      default: null,
    },

    manualAccessGrantedBy: {
      type: String,
      default: "",
      trim: true,
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

UserSchema.index(
  { isPrimaryAdmin: 1 },
  {
    unique: true,
    name: "uniq_primary_admin_account",
    partialFilterExpression: { isPrimaryAdmin: true },
  },
);

UserSchema.index(
  { fullNameNormalized: 1 },
  {
    unique: true,
    name: "uniq_users_full_name_normalized",
    partialFilterExpression: { fullNameNormalized: { $type: "string" } },
  },
);

// Dev Mode-এ Mongoose Model Cache ক্লিয়ার করার জন্য
if (process.env.NODE_ENV === "development") {
  delete (models as any).User;
}

const User = models.User || model("User", UserSchema);

export default User;
