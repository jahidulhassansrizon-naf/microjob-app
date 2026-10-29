import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QrUploadSession from "@/models/QrUploadSession";
import { requireActiveSubscription, requireToolAccess } from "@/app/api/_lib/requireActiveSubscription";
import { hashQrUploadToken, noStoreHeaders } from "../_lib";

export const runtime = "nodejs";

// Manual Editor is a free tool: its "Upload from phone" QR only needs a logged-in user.
// Every other caller (AI Editor, AI Template, ...) still requires an active subscription.
async function isFreeManualEditorRequest(request: Request): Promise<boolean> {
  try {
    const body = await request.clone().json();
    return body?.scope === "manual-editor";
  } catch {
    return false;
  }
}


export async function POST(request: Request) {
  // Check the database ban flag before allowing even the free manual-editor QR flow.
  const toolAccess = await requireToolAccess(request);
  if (!toolAccess.ok) return toolAccess.response;

  let access: { ok: true; userId: string } | { ok: false; response: NextResponse };
  if (await isFreeManualEditorRequest(request)) {
    access = { ok: true, userId: toolAccess.userId };
  } else {
    access = await requireActiveSubscription(request);
  }
  if (!access.ok) return access.response;
  if (!mongoose.isValidObjectId(access.userId)) {
    return NextResponse.json({ success: false, code: "INVALID_USER_SESSION", message: "This upload session requires a regular user account." }, { status: 403, headers: noStoreHeaders() });
  }

  try {
    await connectDB();
    const now = new Date();
    const userId = new mongoose.Types.ObjectId(access.userId);

    // Expire only sessions whose transfer/temporary image cleanup window has elapsed.
    await QrUploadSession.deleteMany({ expiresAt: { $lte: now } });

    // Keep one waiting QR per user. A newly opened editor replaces an older unused QR.
    // Pending sessions have no expiresAt field, so they remain active until replaced or used.
    await QrUploadSession.deleteMany({
      userId,
      status: "pending",
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    });

    const activeCount = await QrUploadSession.countDocuments({
      userId,
      status: { $in: ["uploading", "uploaded"] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    });
    if (activeCount >= 5) {
      return NextResponse.json(
        { success: false, code: "TOO_MANY_UPLOAD_SESSIONS", message: "Finish an existing phone photo transfer before starting another one." },
        { status: 429, headers: noStoreHeaders() },
      );
    }

    const token = randomBytes(32).toString("base64url");
    await QrUploadSession.create({
      tokenHash: hashQrUploadToken(token),
      userId,
      // No expiresAt on a pending session: its QR remains active until one upload succeeds.
      status: "pending",
    });

    return NextResponse.json(
      { success: true, token },
      { status: 201, headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Could not create AI Editor QR upload session:", error);
    return NextResponse.json(
      { success: false, code: "QR_UPLOAD_SESSION_FAILED", message: "Could not start a secure photo upload." },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
