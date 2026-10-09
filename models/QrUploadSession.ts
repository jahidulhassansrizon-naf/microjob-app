import mongoose, { Document, Model, Schema } from "mongoose";

export type QrUploadStatus = "pending" | "uploading" | "uploaded" | "consumed";

export interface IQrUploadSession extends Document {
  tokenHash: string;
  userId: mongoose.Types.ObjectId;
  /** Absent while waiting for a photo; set temporarily during upload and after upload for cleanup. */
  expiresAt?: Date;
  status: QrUploadStatus;
  imageData?: Buffer;
  mimeType?: string;
  originalFileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QrUploadSessionSchema = new Schema<IQrUploadSession>(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: false },
    status: {
      type: String,
      enum: ["pending", "uploading", "uploaded", "consumed"],
      default: "pending",
      required: true,
      index: true,
    },
    imageData: { type: Buffer, select: false },
    mimeType: { type: String, select: false },
    originalFileName: { type: String, default: "mobile-photo.jpg" },
  },
  { timestamps: true, collection: "ai_editor_qr_upload_sessions" },
);

QrUploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const QrUploadSession: Model<IQrUploadSession> =
  mongoose.models.QrUploadSession ||
  mongoose.model<IQrUploadSession>("QrUploadSession", QrUploadSessionSchema);

export default QrUploadSession;
