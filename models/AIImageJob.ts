import mongoose, {
  Schema,
  type Document,
  type Model,
} from "mongoose";

export type AIImageJobOperation = "edit-image" | "template-edit";
export type AIImageJobSource =
  | "ai-editor"
  | "ai-template"
  | "bulk-photo-edit";
export type AIImageJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export interface IAIImageJob extends Document {
  userId: mongoose.Types.ObjectId;
  operation: AIImageJobOperation;
  source: AIImageJobSource;
  status: AIImageJobStatus;
  idempotencyKey: string;
  prompt: string;
  sourceImageUrl: string;
  temporarySourcePublicId?: string;
  templateImageUrl?: string;
  temporaryTemplatePublicId?: string;
  resultUrl?: string;
  resultPublicId?: string;
  queueMessageId?: string;
  attempts: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIImageJobSchema = new Schema<IAIImageJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    operation: {
      type: String,
      enum: ["edit-image", "template-edit"],
      required: true,
    },
    source: {
      type: String,
      enum: ["ai-editor", "ai-template", "bulk-photo-edit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      required: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 256,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },
    sourceImageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    temporarySourcePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    templateImageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    temporaryTemplatePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    resultUrl: {
      type: String,
      default: "",
      trim: true,
    },
    resultPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    queueMessageId: {
      type: String,
      default: "",
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    errorMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
    collection: "ai_image_jobs",
  },
);

AIImageJobSchema.index({ userId: 1, createdAt: -1 });
AIImageJobSchema.index({ status: 1, createdAt: 1 });
AIImageJobSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true },
);

const AIImageJob: Model<IAIImageJob> =
  mongoose.models.AIImageJob ||
  mongoose.model<IAIImageJob>("AIImageJob", AIImageJobSchema);

export default AIImageJob;
