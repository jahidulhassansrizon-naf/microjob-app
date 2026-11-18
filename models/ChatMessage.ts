import { Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    senderId: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readByAdmin: { type: Boolean, default: false },
    readByUser: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
// Admin overview/unread counts filter by { senderRole, readByAdmin } and recent createdAt.
ChatMessageSchema.index({ senderRole: 1, readByAdmin: 1 });
ChatMessageSchema.index({ createdAt: 1 });

const ChatMessage = models.ChatMessage || model("ChatMessage", ChatMessageSchema);

export default ChatMessage;
