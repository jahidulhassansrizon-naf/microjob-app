import mongoose, { Document, Model, Schema } from "mongoose";

export interface INctbenchImport extends Document {
  dataset: string;
  split: "train" | "test";
  rowIndex: number;

  question: string;
  answer: string;
  evidence: string;
  sourceText: string;

  chunkId: number;

  source: string;
  subject: string;
  language: string;

  classNum: number;
  gradeBand: string;
  pageNum: number;

  mappingStatus: "unmapped" | "mapped" | "rejected";

  mappedClassKey?: string;
  mappedSubjectKey?: string;
  mappedChapterKey?: string;
  mappedChapterLabel?: string;

  createdAt: Date;
  updatedAt: Date;
}

const NctbenchImportSchema = new Schema<INctbenchImport>(
  {
    dataset: {
      type: String,
      required: true,
      index: true,
    },

    split: {
      type: String,
      enum: ["train", "test"],
      required: true,
      index: true,
    },

    rowIndex: {
      type: Number,
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      default: "",
      trim: true,
    },

    evidence: {
      type: String,
      default: "",
      trim: true,
    },

    sourceText: {
      type: String,
      default: "",
    },

    chunkId: {
      type: Number,
      required: true,
      index: true,
    },

    source: {
      type: String,
      default: "",
      trim: true,
    },

    subject: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    language: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    classNum: {
      type: Number,
      required: true,
      index: true,
    },

    gradeBand: {
      type: String,
      default: "",
      trim: true,
    },

    pageNum: {
      type: Number,
      default: 0,
    },

    mappingStatus: {
      type: String,
      enum: ["unmapped", "mapped", "rejected"],
      default: "unmapped",
      index: true,
    },

    mappedClassKey: {
      type: String,
      default: "",
      trim: true,
    },

    mappedSubjectKey: {
      type: String,
      default: "",
      trim: true,
    },

    mappedChapterKey: {
      type: String,
      default: "",
      trim: true,
    },

    mappedChapterLabel: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "nctbench_import",
  },
);

NctbenchImportSchema.index(
  {
    dataset: 1,
    split: 1,
    rowIndex: 1,
  },
  {
    unique: true,
  },
);

const NctbenchImport: Model<INctbenchImport> =
  mongoose.models.NctbenchImport ||
  mongoose.model<INctbenchImport>("NctbenchImport", NctbenchImportSchema);

export default NctbenchImport;
