import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScannedDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  title: string;
  imageUrl: string;
  publicId?: string;
  adjustments?: {
    blackness: number;
    contrast: number;
    brightness: number;
    rotation: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ScannedDocumentSchema: Schema = new Schema<IScannedDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
      default: "Scanned Document",
    },
    imageUrl: {
      type: String, // Cloudinary Secure URL
      required: true,
    },
    publicId: {
      type: String, // Cloudinary Public ID
    },
    adjustments: {
      blackness: { type: Number, default: 0 },
      contrast: { type: Number, default: 0 },
      brightness: { type: Number, default: 0 },
      rotation: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// Next.js / Hot-reloading এ মডেল বারবার রি-ডিক্লেয়ার হওয়া থেকে রক্ষা করার জন্য:
const ScannedDocument: Model<IScannedDocument> =
  mongoose.models.ScannedDocument ||
  mongoose.model<IScannedDocument>("ScannedDocument", ScannedDocumentSchema);

export default ScannedDocument;
