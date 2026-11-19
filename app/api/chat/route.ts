import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import User from "@/models/User";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import {
  containsImageMarker,
  deleteChatImagesForUser,
  purgeExpiredChatImages,
  purgeExpiredChatConversations,
  serializeChatMessages,
} from "@/app/_lib/chatImages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const PAGE_SIZE = 50;
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

async function getUserSession(request: Request) {
  const session = await getVerifiedRequestSession(request);
  if (!session) {
    return { session: null, response: NextResponse.json({ success: false, message: "Please log in to use chat." }, { status: 401 }) };
  }
  if (session.role !== "user" || !mongoose.isValidObjectId(session.userId)) {
    return { session: null, response: NextResponse.json({ success: false, message: "Only user accounts can use this chat endpoint." }, { status: 403 }) };
  }
  return { session, response: null };
}

export async function GET(request: Request) {
  const auth = await getUserSession(request);
  if (auth.response) return auth.response;
  if (!auth.session) return NextResponse.json({ success: false, message: "Please log in to use chat." }, { status: 401 });

  try {
    await connectDB();
    const url = new URL(request.url);
    // Cleanup is throttled inside these helpers, so fast polling does not repeat it every request.
    await purgeExpiredChatImages();
    await purgeExpiredChatConversations();

    // FAST PATH (used by the 1-2s live poll): one tiny query, no upsert, no full history reload.
    const afterRaw = url.searchParams.get("after");
    if (afterRaw && url.searchParams.get("summary") !== "1") {
      const afterDate = new Date(afterRaw);
      const conversationForPoll = await ChatConversation.findOne({ userId: auth.session.userId }).select("_id unreadForUser").lean();
      if (!conversationForPoll) {
        return NextResponse.json({ success: true, unreadCount: 0, messages: [], incremental: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }
      // $gte + client-side de-duplication so two messages in the same millisecond can never be missed.
      const fresh = await ChatMessage.find({
        conversationId: (conversationForPoll as any)._id,
        ...(Number.isNaN(afterDate.getTime()) ? {} : { createdAt: { $gte: afterDate } }),
      })
        .sort({ createdAt: 1, _id: 1 })
        .limit(PAGE_SIZE)
        .lean();
      if (Number((conversationForPoll as any).unreadForUser || 0) > 0) {
        // Only touch the database when there is actually something to mark as read.
        await Promise.all([
          ChatMessage.updateMany({ conversationId: (conversationForPoll as any)._id, senderRole: "admin", readByUser: false }, { $set: { readByUser: true } }),
          ChatConversation.updateOne({ _id: (conversationForPoll as any)._id }, { $set: { unreadForUser: 0 } }),
        ]);
      }
      return NextResponse.json(
        {
          success: true,
          unreadCount: 0,
          incremental: true,
          messages: await serializeChatMessages(
            fresh,
            (message: any) => (message.senderRole === "admin" ? { ...message, readByUser: true } : message),
          ),
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const user = await User.findById(auth.session.userId).select("_id role").lean();
    if (!user) return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ success: false, message: "Admin accounts cannot use the user chat endpoint." }, { status: 403 });

    const conversation = await ChatConversation.findOne({ userId: user._id }).lean();
    if (url.searchParams.get("summary") === "1") {
      return NextResponse.json(
        { success: true, unreadCount: Number(conversation?.unreadForUser || 0) },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const activeConversation = conversation || (await ChatConversation.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ));
    const beforeRaw = url.searchParams.get("before");
    const beforeDate = beforeRaw ? new Date(beforeRaw) : null;
    const messageFilter: Record<string, unknown> = { conversationId: activeConversation._id };
    if (beforeDate && !Number.isNaN(beforeDate.getTime())) messageFilter.createdAt = { $lt: beforeDate };

    const fetched = await ChatMessage.find(messageFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();
    const hasMore = fetched.length > PAGE_SIZE;
    const selected = fetched.slice(0, PAGE_SIZE);
    await ChatMessage.updateMany(
      { conversationId: activeConversation._id, senderRole: "admin", readByUser: false },
      { $set: { readByUser: true } },
    );
    await ChatConversation.updateOne({ _id: activeConversation._id }, { $set: { unreadForUser: 0 } });

    return NextResponse.json(
      {
        success: true,
        unreadCount: 0,
        hasMore,
        messages: await serializeChatMessages(
          selected.reverse(),
          (message: any) => (message.senderRole === "admin" ? { ...message, readByUser: true } : message),
        ),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("User chat load error:", error);
    return NextResponse.json({ success: false, message: "Could not load your chat right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getUserSession(request);
  if (auth.response) return auth.response;
  if (!auth.session) return NextResponse.json({ success: false, message: "Please log in to use chat." }, { status: 401 });

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ success: false, message: "Write a message before sending." }, { status: 400 });
    if (text.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ success: false, message: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }, { status: 400 });
    if (containsImageMarker(text)) return NextResponse.json({ success: false, message: "This message cannot be sent." }, { status: 400 });

    await connectDB();
    const user = await User.findById(auth.session.userId).select("_id role").lean();
    if (!user) return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ success: false, message: "Admin accounts cannot use the user chat endpoint." }, { status: 403 });

    const conversation = await ChatConversation.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const created = await ChatMessage.create({
      conversationId: conversation._id,
      userId: user._id,
      senderRole: "user",
      senderId: String(user._id),
      text,
      readByAdmin: false,
      readByUser: true,
    });
    await ChatConversation.updateOne(
      { _id: conversation._id },
      {
        $set: { lastMessage: text, lastMessageAt: created.createdAt, lastSenderRole: "user" },
        $inc: { unreadForAdmin: 1 },
      },
    );

    return NextResponse.json({ success: true, message: serializeMessage(created) }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("User chat send error:", error);
    return NextResponse.json({ success: false, message: "Your message could not be sent. Please try again." }, { status: 500 });
  }
}


/** Deletes the authenticated user's full support-chat history from the database. */
export async function DELETE(request: Request) {
  const auth = await getUserSession(request);
  if (auth.response) return auth.response;
  if (!auth.session) {
    return NextResponse.json({ success: false, message: "Please log in to use chat." }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(auth.session.userId).select("_id role").lean();
    if (!user) return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    if (user.role === "admin") {
      return NextResponse.json({ success: false, message: "Admin accounts cannot use the user chat endpoint." }, { status: 403 });
    }

    const conversation = await ChatConversation.findOne({ userId: user._id }).select("_id").lean();
    const messageFilters: Record<string, unknown>[] = [{ userId: user._id }];
    if (conversation) messageFilters.push({ conversationId: conversation._id });
    const deleted = await ChatMessage.deleteMany({ $or: messageFilters });
    await deleteChatImagesForUser(user._id);

    if (conversation) {
      await ChatConversation.updateOne(
        { _id: conversation._id, userId: user._id },
        {
          $set: {
            lastMessage: "",
            lastMessageAt: null,
            lastSenderRole: "user",
            unreadForAdmin: 0,
            unreadForUser: 0,
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        deletedCount: Number(deleted.deletedCount || 0),
        message: "Your complete support-chat history was permanently deleted from the database.",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("User chat history delete error:", error);
    return NextResponse.json({ success: false, message: "Could not delete your chat history. Please try again." }, { status: 500 });
  }
}
