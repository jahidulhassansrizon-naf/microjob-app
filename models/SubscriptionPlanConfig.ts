import { Schema, models, model } from "mongoose";

const SubscriptionPlanConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    plans: { type: [Schema.Types.Mixed], default: [] },
    updatedBy: { type: String, default: "administrator" },
  },
  { timestamps: true, minimize: false },
);

const SubscriptionPlanConfig =
  models.SubscriptionPlanConfig ||
  model("SubscriptionPlanConfig", SubscriptionPlanConfigSchema);

export default SubscriptionPlanConfig;
