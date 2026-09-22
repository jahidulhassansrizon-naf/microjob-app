import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAIGeneration extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  originalUrl?: string;
  size?: string;
  sizeType?: string;
  widthPx?: number;
  heightPx?: number;
  dpi?: number;
  bgColor?: string;
  clothingStyle?: string;
  clothingColor?: string;
  editingGuides?: string[];
  side?: "left" | "right" | "single";
  publicId?: string;
  source?: "ai-editor" | "manual-editor";
  createdAt: Date;
  updatedAt: Date;
}

const AIGenerationSchema = new Schema<IAIGeneration>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    originalUrl: {
      type: String,
      default: "",
      trim: true,
    },
    size: {
      type: String,
      default: "",
      trim: true,
    },
    sizeType: {
      type: String,
      default: "",
      trim: true,
    },
    widthPx: {
      type: Number,
      min: 1,
    },
    heightPx: {
      type: Number,
      min: 1,
    },
    dpi: {
      type: Number,
      min: 1,
    },
    bgColor: {
      type: String,
      default: "#FFFFFF",
      trim: true,
    },
    clothingStyle: {
      type: String,
      default: "Default Clothing",
      trim: true,
    },
    clothingColor: {
      type: String,
      default: "",
      trim: true,
    },
    editingGuides: {
      type: [String],
      default: [],
    },
    side: {
      type: String,
      enum: ["left", "right", "single"],
      default: "single",
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["ai-editor", "manual-editor"],
    },
  },
  {
    timestamps: true,
    collection: "ai_generations",
  },
);

AIGenerationSchema.index({ userId: 1, createdAt: -1 });

const AIGeneration: Model<IAIGeneration> =
  mongoose.models.AIGeneration ||
  mongoose.model<IAIGeneration>("AIGeneration", AIGenerationSchema);

export default AIGeneration;
