import mongoose, { Schema, models, model } from "mongoose";

const PipraPaySettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    baseUrl: { type: String, required: true, trim: true },
    apiKeyEncrypted: { type: Schema.Types.Mixed, default: null, select: false },
    enabled: { type: Boolean, default: false, index: true },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, minimize: false },
);

if (process.env.NODE_ENV === "development") {
  delete (models as any).PipraPaySettings;
}

const PipraPaySettings = models.PipraPaySettings || model("PipraPaySettings", PipraPaySettingsSchema);
export default PipraPaySettings;
