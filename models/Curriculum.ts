import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICurriculumChapter {
  key: string;
  label: string;
  order: number;
}

export interface ICurriculumSubject {
  key: string;
  label: string;
  order: number;
  chapters: ICurriculumChapter[];
}

export interface ICurriculum extends Document {
  curriculumYear: number;
  level: "primary" | "secondary" | "higher-secondary";
  classKey: string;
  classLabel: string;
  subjects: ICurriculumSubject[];
  source: {
    authority: "NCTB" | "mixed";
    url?: string;
    verifiedAt?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<ICurriculumChapter>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const SubjectSchema = new Schema<ICurriculumSubject>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    chapters: { type: [ChapterSchema], default: [] },
  },
  { _id: false },
);

const CurriculumSchema = new Schema<ICurriculum>(
  {
    curriculumYear: { type: Number, required: true, index: true },
    level: {
      type: String,
      enum: ["primary", "secondary", "higher-secondary"],
      required: true,
      index: true,
    },
    classKey: { type: String, required: true, trim: true, index: true },
    classLabel: { type: String, required: true, trim: true },
    subjects: { type: [SubjectSchema], default: [] },
    source: {
      authority: {
        type: String,
        enum: ["NCTB", "mixed"],
        required: true,
        default: "NCTB",
      },
      url: { type: String, default: "", trim: true },
      verifiedAt: { type: Date },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "curriculum" },
);

CurriculumSchema.index({ curriculumYear: 1, classKey: 1 }, { unique: true });

const Curriculum: Model<ICurriculum> =
  mongoose.models.Curriculum ||
  mongoose.model<ICurriculum>("Curriculum", CurriculumSchema);

export default Curriculum;
