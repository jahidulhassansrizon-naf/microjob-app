import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { createChatImageMessage } from "@/app/_lib/chatImages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The admin sends a photo to one user. The photo is deleted after 2 minutes. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const form = await request.formData();
    const userId = String(form.get("userId") || "").trim();
    const file = form.get("file");
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ success: false, message: "Select a valid user first." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role === "admin") {
      return NextResponse.json({ success: false, message: "That user could not be found." }, { status: 404 });
    }

    const result = await createChatImageMessage({
      file: file instanceof File ? file : null,
      userId: user._id,
      senderRole: "admin",
      senderId: auth.admin?.id || "unknown-admin",
    });
    if (!result.ok) return NextResponse.json({ success: false, message: result.message }, { status: result.status });
    return NextResponse.json({ success: true, message: result.message }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin chat image upload error:", error);
    return NextResponse.json({ success: false, message: "The photo could not be sent. Please try again." }, { status: 500 });
  }
}
