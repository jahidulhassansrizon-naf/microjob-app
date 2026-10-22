import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const PAGE_SIZE = 25;
const MAX_MESSAGE_LENGTH = 2000;

function serializeMessage(message: any) {
  return {
    id: String(message._id),
    text: String(message.text || ""),
    senderRole: message.senderRole === "admin" ? "admin" : "user",
    createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString(),
    readByAdmin: Boolean(message.readByAdmin),
    readByUser: Boolean(message.readByUser),
  };
}

function escapedRegex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

async function getTargetUser(userId: string) {
  if (!mongoose.isValidObjectId(userId)) return null;
  return User.findById(userId).select("fullName email phoneNumber profileImageUrl createdAt lastSeenAt role").lean();
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    await connectDB();
    const url = new URL(request.url);
    if (url.searchParams.get("summary") === "1") {
      const summary = await ChatConversation.aggregate([
        { $group: { _id: null, unreadTotal: { $sum: "$unreadForAdmin" } } },
      ]);
      return NextResponse.json({ success: true, unreadTotal: Number(summary[0]?.unreadTotal || 0) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const userId = (url.searchParams.get("userId") || "").trim();
    if (userId) {
      const user = await getTargetUser(userId);
      if (!user || user.role === "admin") return NextResponse.json({ success: false, message: "That user could not be found." }, { status: 404 });

      const conversation = await ChatConversation.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      const beforeRaw = url.searchParams.get("before");
      const beforeDate = beforeRaw ? new Date(beforeRaw) : null;
      const filter: Record<string, unknown> = { conversationId: conversation._id };
      if (beforeDate && !Number.isNaN(beforeDate.getTime())) filter.createdAt = { $lt: beforeDate };
      const fetched = await ChatMessage.find(filter).sort({ createdAt: -1, _id: -1 }).limit(PAGE_SIZE + 1).lean();
      const hasMore = fetched.length > PAGE_SIZE;
      const selected = fetched.slice(0, PAGE_SIZE);
      await ChatMessage.updateMany(
        { conversationId: conversation._id, senderRole: "user", readByAdmin: false },
        { $set: { readByAdmin: true } },
      );
      await ChatConversation.updateOne({ _id: conversation._id }, { $set: { unreadForAdmin: 0 } });

      return NextResponse.json(
        {
          success: true,
          user: {
            id: String(user._id),
            fullName: user.fullName || "Unnamed user",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            profileImageUrl: user.profileImageUrl || "",
            isOnline: Boolean(user.lastSeenAt && Date.now() - new Date(user.lastSeenAt).getTime() < 90_000),
          },
          unreadCount: 0,
          hasConversation: fetched.length > 0,
          hasMore,
          messages: selected.reverse().map((message: any) => serializeMessage(
            message.senderRole === "user" ? { ...message, readByAdmin: true } : message,
          )),
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const q = (url.searchParams.get("q") || "").trim().slice(0, 120);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const filter: Record<string, unknown> = { role: { $ne: "admin" } };
    if (q) {
      const regex = escapedRegex(q);
      filter.$or = [{ fullName: regex }, { email: regex }, { phoneNumber: regex }];
    }
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("fullName email phoneNumber profileImageUrl createdAt lastSeenAt")
        .sort({ lastSeenAt: -1, createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);
    const userIds = users.map((user: any) => user._id);
    const conversations = userIds.length
      ? await ChatConversation.find({ userId: { $in: userIds } }).lean()
      : [];
    const byUserId = new Map(conversations.map((conversation: any) => [String(conversation.userId), conversation]));
    const rows = users.map((user: any) => {
      const conversation: any = byUserId.get(String(user._id));
      return {
        id: String(user._id),
        fullName: user.fullName || "Unnamed user",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        profileImageUrl: user.profileImageUrl || "",
        isOnline: Boolean(user.lastSeenAt && Date.now() - new Date(user.lastSeenAt).getTime() < 90_000),
        lastMessage: conversation?.lastMessage || "",
        lastMessageAt: conversation?.lastMessageAt || null,
        lastSenderRole: conversation?.lastSenderRole || null,
        unreadCount: Number(conversation?.unreadForAdmin || 0),
        hasConversation: Boolean(conversation && (conversation.lastMessageAt || conversation.lastMessage)),
      };
    });

    return NextResponse.json(
      { success: true, users: rows, pagination: { page, limit: PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin chat load error:", error);
    return NextResponse.json({ success: false, message: "Could not load user chats right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!mongoose.isValidObjectId(userId)) return NextResponse.json({ success: false, message: "Select a valid user first." }, { status: 400 });
    if (!text) return NextResponse.json({ success: false, message: "Write a message before sending." }, { status: 400 });
    if (text.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ success: false, message: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }, { status: 400 });

    await connectDB();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role === "admin") return NextResponse.json({ success: false, message: "That user could not be found." }, { status: 404 });
    const conversation = await ChatConversation.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const created = await ChatMessage.create({
      conversationId: conversation._id,
      userId: user._id,
      senderRole: "admin",
      senderId: auth.admin?.id || "env-admin",
      text,
      readByAdmin: true,
      readByUser: false,
    });
    await ChatConversation.updateOne(
      { _id: conversation._id },
      {
        $set: { lastMessage: text, lastMessageAt: created.createdAt, lastSenderRole: "admin" },
        $inc: { unreadForUser: 1 },
      },
    );
    return NextResponse.json({ success: true, message: serializeMessage(created) }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin chat send error:", error);
    return NextResponse.json({ success: false, message: "The message could not be sent. Please try again." }, { status: 500 });
  }
}


/** Permanently deletes one chat message or clears a user's full chat history. */
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const messageId = typeof body?.messageId === "string" ? body.messageId.trim() : "";
    const action = body?.action;

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ success: false, message: "Select a valid user first." }, { status: 400 });
    }
    if (action !== "delete-message" && action !== "clear") {
      return NextResponse.json({ success: false, message: "Choose whether to delete one message or clear the chat." }, { status: 400 });
    }
    if (action === "delete-message" && !mongoose.isValidObjectId(messageId)) {
      return NextResponse.json({ success: false, message: "Invalid message ID." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role === "admin") {
      return NextResponse.json({ success: false, message: "That user could not be found." }, { status: 404 });
    }

    const conversation = await ChatConversation.findOne({ userId: user._id }).select("_id");
    if (!conversation) {
      if (action === "clear") {
        // Also remove any orphaned/legacy messages if the conversation row is missing.
        const orphaned = await ChatMessage.deleteMany({ userId: user._id });
        return NextResponse.json({
          success: true,
          message: orphaned.deletedCount ? "All remaining chat messages were permanently deleted." : "This chat is already empty.",
          deletedCount: Number(orphaned.deletedCount || 0),
          lastMessage: "",
          lastMessageAt: null,
          lastSenderRole: null,
          unreadCount: 0,
        }, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }
      return NextResponse.json({ success: false, message: "The message could not be found in this user's chat." }, { status: 404 });
    }

    let deletedCount = 0;
    let deletedMessageId = "";
    if (action === "delete-message") {
      const message = await ChatMessage.findOne({ _id: messageId, userId: user._id, conversationId: conversation._id }).select("_id").lean();
      if (!message) {
        return NextResponse.json({ success: false, message: "The message could not be found in this user's chat." }, { status: 404 });
      }
      await ChatMessage.deleteOne({ _id: message._id });
      deletedCount = 1;
      deletedMessageId = String(message._id);
    } else {
      const result = await ChatMessage.deleteMany({
        $or: [{ conversationId: conversation._id }, { userId: user._id }],
      });
      deletedCount = Number(result.deletedCount || 0);
    }

    const [latest, unreadForAdmin, unreadForUser] = await Promise.all([
      ChatMessage.findOne({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).select("text createdAt senderRole").lean(),
      ChatMessage.countDocuments({ conversationId: conversation._id, senderRole: "user", readByAdmin: false }),
      ChatMessage.countDocuments({ conversationId: conversation._id, senderRole: "admin", readByUser: false }),
    ]);
    await ChatConversation.updateOne(
      { _id: conversation._id },
      { $set: {
        lastMessage: latest?.text || "",
        lastMessageAt: latest?.createdAt || null,
        lastSenderRole: latest?.senderRole || "user",
        unreadForAdmin,
        unreadForUser,
      } },
    );

    return NextResponse.json({
      success: true,
      message: action === "clear" ? "All chat messages were permanently deleted." : "Message permanently deleted.",
      action,
      deletedCount,
      deletedMessageId,
      lastMessage: latest?.text || "",
      lastMessageAt: latest?.createdAt || null,
      lastSenderRole: latest?.senderRole || null,
      unreadCount: unreadForAdmin,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin chat delete error:", error);
    return NextResponse.json({ success: false, message: "Could not delete these chat messages." }, { status: 500 });
  }
}
