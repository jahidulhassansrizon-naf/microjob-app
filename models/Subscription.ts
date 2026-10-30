import mongoose, { Schema, models, model, Types } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: String,
      required: true,
      enum: ["1-month", "3-month", "6-month", "1-year"],
    },

    planName: {
      type: String,
      required: true,
    },

    months: {
      type: Number,
      required: true,
      min: 1,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    invoiceId: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },

    paymentProvider: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    // PipraPay V2 may return invoice_id separately from pp_id.
    providerInvoiceId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transactionId: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    // Sender details are provided by the user and must be checked by an admin.
    senderNumber: {
      type: String,
      default: "",
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Separate normalized value provides a race-safe duplicate TrxID constraint.
    // Records created before this field existed are ignored by the sparse index.
    transactionIdKey: {
      type: String,
      default: undefined,
      unique: true,
      sparse: true,
      select: false,
    },

    reviewStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: String,
      default: "",
      trim: true,
    },

    reviewNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "ERROR", "CANCELLED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    accessStatus: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

if (process.env.NODE_ENV === "development") {
  delete (models as any).Subscription;
}

const Subscription =
  models.Subscription || model("Subscription", SubscriptionSchema);

export default Subscription;
