import mongoose, { Schema, models, model } from "mongoose";

const UddoktaPaySettingsSchema = new Schema(
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
  delete (models as any).UddoktaPaySettings;
}

const UddoktaPaySettings = models.UddoktaPaySettings || model("UddoktaPaySettings", UddoktaPaySettingsSchema);
export default UddoktaPaySettings;
