import mongoose, { Document, Model, Schema } from "mongoose";

export interface IQuestionPaperItem {
  id: string;
  type: string;
  question: string;
  options: string[];
  answer?: string;
  marks: number;
}

export interface IQuestionPaper extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  className: string;
  subjectName: string;
  chapterName: string;
  selectedQuestions: IQuestionPaperItem[];
  settings: Record<string, unknown>;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionItemSchema = new Schema<IQuestionPaperItem>(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
    answer: { type: String, default: "", trim: true },
    marks: { type: Number, required: true, min: 1, max: 100 },
  },
  { _id: false },
);

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Question Paper",
      trim: true,
      maxlength: 160,
    },
    className: { type: String, default: "", trim: true, index: true },
    subjectName: { type: String, default: "", trim: true, index: true },
    chapterName: { type: String, default: "", trim: true },
    selectedQuestions: { type: [QuestionItemSchema], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
    isDraft: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "question_papers" },
);

QuestionPaperSchema.index({ userId: 1, updatedAt: -1 });

const QuestionPaper: Model<IQuestionPaper> =
  mongoose.models.QuestionPaper ||
  mongoose.model<IQuestionPaper>("QuestionPaper", QuestionPaperSchema);

export default QuestionPaper;
