import mongoose, { Schema } from "mongoose";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";

/**
 * Short-lived chat photos (user <-> admin support chat).
 *
 * - The picture itself lives in its own collection (`chatimages`) so the existing
 *   ChatMessage / ChatConversation models do not have to change.
 * - The chat message that shows it is a normal ChatMessage whose text is a hidden marker
 *   (`[[chat-image:<id>]]`). The API turns that marker into an `image` object for the UI.
 * - After CHAT_IMAGE_TTL_MS (2 minutes) the picture AND its message are deleted from the
 *   database. Deletion happens on every chat request (lazy purge) and MongoDB's TTL index
 *   is a backstop, so nothing stays behind.
 */

export const CHAT_IMAGE_TTL_MS = 2 * 60 * 1000;
export const CHAT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const CHAT_IMAGE_MAX_ACTIVE_PER_USER = 6;
export const CHAT_IMAGE_PREVIEW_TEXT = "📷 ছবি / Photo";

const MARKER_PREFIX = "[[chat-image:";
const MARKER_RE = /^\[\[chat-image:([a-f0-9]{24})\]\]$/;

export const imageMarker = (id: string) => `${MARKER_PREFIX}${id}]]`;
export const parseImageMarker = (text: unknown) =>
  MARKER_RE.exec(String(text ?? "").trim())?.[1] ?? null;
/** Plain text messages may never contain the marker (it would let people fake image messages). */
export const containsImageMarker = (text: unknown) => String(text ?? "").includes(MARKER_PREFIX);
/** Text shown in conversation lists / previews. */
export const previewText = (text: unknown) =>
  parseImageMarker(text) ? CHAT_IMAGE_PREVIEW_TEXT : String(text ?? "");

const chatImageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    expiresAt: { type: Date, required: true, index: true },
    // Backstop: MongoDB removes the document itself a few minutes after it expired.
    purgeAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "chatimages" },
);
chatImageSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export const ChatImage: mongoose.Model<any> =
  (mongoose.models.ChatImage as mongoose.Model<any>) ||
  mongoose.model("ChatImage", chatImageSchema);

/** Detects the real image type from the file's first bytes (the browser-supplied type is not trusted). */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

type MessageLike = {
  _id: unknown;
  userId?: unknown;
  text?: unknown;
  senderRole?: string;
  createdAt?: unknown;
  readByAdmin?: unknown;
  readByUser?: unknown;
};

export type SerializedChatMessage = {
  id: string;
  text: string;
  senderRole: "user" | "admin";
  createdAt: string;
  readByAdmin: boolean;
  readByUser: boolean;
  image?: { id: string; mime: string; remainingMs: number };
};

function baseSerialize(message: MessageLike): SerializedChatMessage {
  return {
    id: String(message._id),
    text: String(message.text || ""),
    senderRole: message.senderRole === "admin" ? "admin" : "user",
    createdAt: message.createdAt ? new Date(message.createdAt as string | number | Date).toISOString() : new Date().toISOString(),
    readByAdmin: Boolean(message.readByAdmin),
    readByUser: Boolean(message.readByUser),
  };
}

/**
 * Serializes chat messages and turns image markers into `image` objects.
 * Messages whose picture is gone or expired are left out (and removed from the database).
 */
export async function serializeChatMessages(
  messages: MessageLike[],
  patch?: (message: MessageLike) => MessageLike,
): Promise<SerializedChatMessage[]> {
  const ids = new Set<string>();
  for (const message of messages) {
    const id = parseImageMarker(message.text);
    if (id) ids.add(id);
  }

  const now = Date.now();
  const metas = ids.size
    ? await ChatImage.find({ _id: { $in: Array.from(ids) }, expiresAt: { $gt: new Date(now) } })
        .select("_id userId mime expiresAt")
        .lean()
    : [];
  const byId = new Map<string, any>(metas.map((meta: any) => [String(meta._id), meta]));

  const result: SerializedChatMessage[] = [];
  const orphanIds: unknown[] = [];
  for (const raw of messages) {
    const message = patch ? patch(raw) : raw;
    const imageId = parseImageMarker(message.text);
    if (!imageId) {
      result.push(baseSerialize(message));
      continue;
    }
    const meta = byId.get(imageId);
    if (!meta || String(meta.userId) !== String(message.userId)) {
      orphanIds.push(message._id);
      continue;
    }
    result.push({
      ...baseSerialize(message),
      text: "",
      image: {
        id: imageId,
        mime: String(meta.mime),
        remainingMs: Math.max(0, new Date(meta.expiresAt).getTime() - now),
      },
    });
  }

  if (orphanIds.length) {
    void ChatMessage.deleteMany({ _id: { $in: orphanIds } }).catch(() => undefined);
  }
  return result;
}

/** Recalculates the conversation summary (last message + unread counters) after messages were deleted. */
export async function refreshConversationSummary(userId: unknown) {
  const conversation: any = await ChatConversation.findOne({ userId }).select("_id");
  if (!conversation) return;
  const [latest, unreadForAdmin, unreadForUser] = await Promise.all([
    ChatMessage.findOne({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).select("text createdAt senderRole").lean(),
    ChatMessage.countDocuments({ conversationId: conversation._id, senderRole: "user", readByAdmin: false }),
    ChatMessage.countDocuments({ conversationId: conversation._id, senderRole: "admin", readByUser: false }),
  ]);
  await ChatConversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: latest ? previewText((latest as any).text) : "",
        lastMessageAt: (latest as any)?.createdAt || null,
        lastSenderRole: (latest as any)?.senderRole || "user",
        unreadForAdmin,
        unreadForUser,
      },
    },
  );
}

/** Deletes every picture older than 2 minutes together with the chat messages that show them. */
export async function purgeExpiredChatImages() {
  try {
    const expired: any[] = await ChatImage.find({ expiresAt: { $lte: new Date() } })
      .select("_id userId")
      .limit(200)
      .lean();
    if (!expired.length) return 0;

    const ids = expired.map((item) => item._id);
    await ChatMessage.deleteMany({ text: { $in: ids.map((id) => imageMarker(String(id))) } });
    await ChatImage.deleteMany({ _id: { $in: ids } });

    const userIds = new Map<string, unknown>(expired.map((item) => [String(item.userId), item.userId]));
    await Promise.all(Array.from(userIds.values()).map((userId) => refreshConversationSummary(userId)));
    return ids.length;
  } catch (error) {
    console.error("Chat image purge error:", error);
    return 0;
  }
}

/** Removes the pictures (and nothing else) for one user, or for one message marker. */
export async function deleteChatImagesForUser(userId: unknown) {
  await ChatImage.deleteMany({ userId });
}
export async function deleteChatImageByMessageText(text: unknown) {
  const id = parseImageMarker(text);
  if (id) await ChatImage.deleteOne({ _id: id });
}

export type UploadResult =
  | { ok: true; message: SerializedChatMessage }
  | { ok: false; status: number; message: string };

/** Validates an uploaded picture, stores it for 2 minutes and creates the chat message that shows it. */
export async function createChatImageMessage(options: {
  file: File | null;
  userId: any;
  senderRole: "user" | "admin";
  senderId: string;
}): Promise<UploadResult> {
  const { file, userId, senderRole, senderId } = options;
  if (!file || typeof file.arrayBuffer !== "function") {
    return { ok: false, status: 400, message: "ছবি সিলেক্ট করুন।" };
  }
  if (file.size > CHAT_IMAGE_MAX_BYTES) {
    return { ok: false, status: 413, message: "ছবির সাইজ সর্বোচ্চ ৩ MB হতে পারবে।" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(buffer);
  if (!mime) {
    return { ok: false, status: 415, message: "শুধু JPG, PNG, WEBP বা GIF ছবি পাঠানো যাবে।" };
  }

  await purgeExpiredChatImages();
  const active = await ChatImage.countDocuments({ userId, expiresAt: { $gt: new Date() } });
  if (active >= CHAT_IMAGE_MAX_ACTIVE_PER_USER) {
    return { ok: false, status: 429, message: "একসাথে অনেক ছবি পাঠানো হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।" };
  }

  const conversation: any = await ChatConversation.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const expiresAt = new Date(Date.now() + CHAT_IMAGE_TTL_MS);
  const image: any = await ChatImage.create({
    userId,
    senderRole,
    mime,
    size: buffer.length,
    data: buffer,
    expiresAt,
    purgeAt: new Date(expiresAt.getTime() + 5 * 60 * 1000),
  });

  const created: any = await ChatMessage.create({
    conversationId: conversation._id,
    userId,
    senderRole,
    senderId,
    text: imageMarker(String(image._id)),
    readByAdmin: senderRole === "admin",
    readByUser: senderRole === "user",
  });
  await ChatConversation.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessage: CHAT_IMAGE_PREVIEW_TEXT, lastMessageAt: created.createdAt, lastSenderRole: senderRole },
      $inc: senderRole === "user" ? { unreadForAdmin: 1 } : { unreadForUser: 1 },
    },
  );

  return {
    ok: true,
    message: {
      ...baseSerialize(created),
      text: "",
      image: { id: String(image._id), mime, remainingMs: CHAT_IMAGE_TTL_MS },
    },
  };
}
