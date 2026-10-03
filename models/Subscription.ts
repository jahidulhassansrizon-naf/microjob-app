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

    transactionId: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "ERROR", "CANCELLED"],
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
