import mongoose, { Schema, model, models } from "mongoose";

const SavedFormSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    formData: {
      type: Schema.Types.Mixed, // ফর্মের যেকোনো ফিল্ডের ডেটা অবজেক্ট হিসেবে সেভ করার জন্য
      required: true,
    },
  },
  {
    timestamps: true, // এটি তৈরি হলে অটোমেটিক createdAt এবং updatedAt টাইমস্ট্যাম্প যোগ করবে
  },
);

const SavedForm = models.SavedForm || model("SavedForm", SavedFormSchema);

export default SavedForm;
