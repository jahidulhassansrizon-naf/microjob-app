import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { ChatImage, purgeExpiredChatImages } from "@/app/_lib/chatImages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ imageId: string }> };

/** Serves a chat photo to the user it belongs to, or to an admin, until it expires (2 minutes). */
export async function GET(request: Request, context: RouteContext) {
  const { imageId } = await context.params;
  if (!mongoose.isValidObjectId(imageId)) {
    return NextResponse.json({ success: false, message: "Photo not found." }, { status: 404 });
  }

  let ownerOnly: string | null = null;
  const session = await getVerifiedRequestSession(request).catch(() => null);
  if (session && session.role === "user" && mongoose.isValidObjectId(session.userId)) {
    ownerOnly = String(session.userId);
  } else {
    const admin = await requireAdmin(request);
    if (admin.response) return admin.response;
  }

  try {
    await connectDB();
    await purgeExpiredChatImages();
    const image: any = await ChatImage.findById(imageId);
    if (!image || image.expiresAt.getTime() <= Date.now() || (ownerOnly && String(image.userId) !== ownerOnly)) {
      return NextResponse.json({ success: false, message: "এই ছবিটি আর নেই।" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(image.data), {
      status: 200,
      headers: {
        "Content-Type": image.mime,
        "Content-Length": String(image.data.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("Chat image load error:", error);
    return NextResponse.json({ success: false, message: "Could not load this photo." }, { status: 500 });
  }
}
