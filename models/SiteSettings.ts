import mongoose, { Schema, models, model } from "mongoose";
import { DEFAULT_SITE_SETTINGS } from "@/lib/siteSettings";

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    settings: {
      type: Schema.Types.Mixed,
      required: true,
      default: DEFAULT_SITE_SETTINGS,
    },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, minimize: false },
);

if (process.env.NODE_ENV === "development") {
  delete (models as any).SiteSettings;
}

const SiteSettings = models.SiteSettings || model("SiteSettings", SiteSettingsSchema);
export default SiteSettings;
