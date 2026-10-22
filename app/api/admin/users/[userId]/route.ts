import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isConfiguredAdminEmail } from "@/lib/adminCredentials";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import AIGeneration from "@/models/AIGeneration";
import PresenceSession from "@/models/PresenceSession";
import LiveScreenSignal from "@/models/LiveScreenSignal";
import QrUploadSession from "@/models/QrUploadSession";
import QuestionPaper from "@/models/QuestionPaper";
import SavedForm from "@/models/SavedForm";
import ScannedDocument from "@/models/ScannedDocument";
import Otp from "@/models/Otp";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

/** Permanently removes a user account and its private, user-owned database records. */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { userId } = await context.params;
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId).select("_id fullName email phoneNumber role");
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found. They may already have been deleted." }, { status: 404 });
    }
    if (user.role === "admin" || isConfiguredAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: "Administrator accounts cannot be deleted from this screen." }, { status: 403 });
    }

    const id = user._id;
    const idString = String(id);

    // Remove dependent records first. The account itself is deleted last so a
    // failed cleanup does not leave a deleted login with orphaned private data.
    const presenceRows = await PresenceSession.find({ userId: id }).select("sessionId").lean();
    const sessionIds = presenceRows.map((row: any) => row.sessionId).filter(Boolean);
    const conversations = await ChatConversation.find({ userId: id }).select("_id").lean();
    const conversationIds = conversations.map((row: any) => row._id);

    await Subscription.deleteMany({ userId: id });
    await ChatMessage.deleteMany({ $or: [{ userId: id }, ...(conversationIds.length ? [{ conversationId: { $in: conversationIds } }] : [])] });
    await ChatConversation.deleteMany({ userId: id });
    await AIGeneration.deleteMany({ userId: id });
    await QrUploadSession.deleteMany({ userId: id });
    await QuestionPaper.deleteMany({ userId: id });
    await SavedForm.deleteMany({ userId: idString });
    await ScannedDocument.deleteMany({ userId: id });
    // my-files stores user-owned library metadata in an inline model collection.
    await mongoose.connection.collection("userfiles").deleteMany({ userId: id });
    await PresenceSession.deleteMany({ userId: id });
    if (sessionIds.length) await LiveScreenSignal.deleteMany({ presenceSessionId: { $in: sessionIds } });
    await Otp.deleteMany({ identifier: { $in: [String(user.email || "").trim().toLowerCase(), String(user.phoneNumber || "").trim()].filter(Boolean) } });

    await User.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: `The account for ${user.fullName || user.email} and its associated database records were permanently deleted.`,
      deletedUserId: idString,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin permanent user deletion error:", error);
    return NextResponse.json({ success: false, message: "Could not completely delete this account. The user record was not intentionally removed before cleanup." }, { status: 500 });
  }
}
