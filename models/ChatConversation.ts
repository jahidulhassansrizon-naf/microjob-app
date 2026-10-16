import { Schema, model, models } from "mongoose";

const ChatConversationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: { type: String, default: "", trim: true },
    lastMessageAt: { type: Date, default: null, index: true },
    lastSenderRole: { type: String, enum: ["user", "admin"], default: "user" },
    unreadForAdmin: { type: Number, default: 0, min: 0 },
    unreadForUser: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const ChatConversation =
  models.ChatConversation || model("ChatConversation", ChatConversationSchema);

export default ChatConversation;
