import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import User from "@/models/User";
import { createChatImageMessage } from "@/app/_lib/chatImages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A signed-in user sends a photo to the admin. The photo is deleted after 2 minutes. */
export async function POST(request: Request) {
  const session = await getVerifiedRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, message: "Please log in to use chat." }, { status: 401 });
  }
  if (session.role !== "user" || !mongoose.isValidObjectId(session.userId)) {
    return NextResponse.json({ success: false, message: "Only user accounts can use this chat endpoint." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    await connectDB();
    const user = await User.findById(session.userId).select("_id role").lean();
    if (!user) return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    if (user.role === "admin") {
      return NextResponse.json({ success: false, message: "Admin accounts cannot use the user chat endpoint." }, { status: 403 });
    }

    const result = await createChatImageMessage({
      file: file instanceof File ? file : null,
      userId: user._id,
      senderRole: "user",
      senderId: String(user._id),
    });
    if (!result.ok) return NextResponse.json({ success: false, message: result.message }, { status: result.status });
    return NextResponse.json({ success: true, message: result.message }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("User chat image upload error:", error);
    return NextResponse.json({ success: false, message: "ছবি পাঠানো যায়নি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
