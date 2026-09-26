import mongoose, { Document, Model, Schema } from "mongoose";

export type QuestionType =
  | "MCQ"
  | "Short"
  | "CQ"
  | "Descriptive"
  | "Written"
  | "Practical";

export type QuestionVerificationStatus =
  | "verified"
  | "reviewed"
  | "needs-review"
  | "rejected";

export type QuestionSourceType =
  | "board-question"
  | "official-sample"
  | "textbook-based"
  | "model-question"
  | "teacher-created"
  | "ai-generated";

export interface IQuestionBank extends Document {
  curriculumYear: number;
  classKey: string;
  classLabel: string;
  subjectKey: string;
  subjectLabel: string;
  chapterKey: string;
  chapterLabel: string;
  type: QuestionType;
  subType?: string;
  question: string;
  options: string[];
  answer?: string;
  marks: number;
  sourceType: QuestionSourceType;
  sourceYear?: number;
  sourceBoard?: string;
  sourceUrl?: string;
  sourceId?: string;
  verificationStatus: QuestionVerificationStatus;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    curriculumYear: { type: Number, required: true, index: true },
    classKey: { type: String, required: true, trim: true, index: true },
    classLabel: { type: String, required: true, trim: true },
    subjectKey: { type: String, required: true, trim: true, index: true },
    subjectLabel: { type: String, required: true, trim: true },
    chapterKey: { type: String, required: true, trim: true, index: true },
    chapterLabel: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["MCQ", "Short", "CQ", "Descriptive", "Written", "Practical"],
      required: true,
      index: true,
    },
    subType: { type: String, default: "", trim: true },
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
    answer: { type: String, default: "", trim: true },
    marks: { type: Number, required: true, min: 1, max: 100 },
    sourceType: {
      type: String,
      enum: [
        "board-question",
        "official-sample",
        "textbook-based",
        "model-question",
        "teacher-created",
        "ai-generated",
      ],
      required: true,
      index: true,
    },
    sourceYear: { type: Number, min: 1900, max: 2100 },
    sourceBoard: { type: String, default: "", trim: true },
    sourceUrl: { type: String, default: "", trim: true },
    sourceId: { type: String, default: "", trim: true },
    verificationStatus: {
      type: String,
      enum: ["verified", "reviewed", "needs-review", "rejected"],
      default: "needs-review",
      index: true,
    },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "question_bank" },
);

QuestionBankSchema.index({
  curriculumYear: 1,
  classKey: 1,
  subjectKey: 1,
  chapterKey: 1,
  type: 1,
  isActive: 1,
});

QuestionBankSchema.index({
  classKey: 1,
  subjectKey: 1,
  chapterKey: 1,
  verificationStatus: 1,
  createdAt: -1,
});

QuestionBankSchema.index({
  classKey: 1,
  subjectKey: 1,
  chapterKey: 1,
  type: 1,
  question: 1,
});

const QuestionBank: Model<IQuestionBank> =
  mongoose.models.QuestionBank ||
  mongoose.model<IQuestionBank>("QuestionBank", QuestionBankSchema);

export default QuestionBank;
