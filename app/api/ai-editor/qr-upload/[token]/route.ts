import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QrUploadSession from "@/models/QrUploadSession";
import User from "@/models/User";
import { detectRasterImageMime, hashQrUploadToken, isValidQrUploadToken, noStoreHeaders, QR_UPLOAD_DATA_CLEANUP_TTL_MS, QR_UPLOAD_IN_PROGRESS_TTL_MS, QR_UPLOAD_MAX_BYTES, safeUploadFileName } from "../_lib";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ token: string }> };

async function getTokenHash(context: RouteContext): Promise<string | null> {
  const { token } = await context.params;
  if (!isValidQrUploadToken(token)) return null;
  return hashQrUploadToken(token);
}

async function checkSessionOwnerAccess(tokenHash: string) {
  const session = await QrUploadSession.findOne({ tokenHash }).select("userId").lean();
  if (!session) return null;
  const owner = await User.findById(session.userId).select("role isBanned").lean();
  if (!owner || (owner.role !== "admin" && owner.isBanned === true)) {
    return NextResponse.json(
      { success: false, code: "USER_BANNED", message: "Tool access for this account has been disabled." },
      { status: 403, headers: noStoreHeaders() },
    );
  }
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const tokenHash = await getTokenHash(context);
  if (!tokenHash) {
    return NextResponse.json({ success: false, code: "INVALID_UPLOAD_TOKEN" }, { status: 404, headers: noStoreHeaders() });
  }

  try {
    await connectDB();
    const ownerAccessError = await checkSessionOwnerAccess(tokenHash);
    if (ownerAccessError) return ownerAccessError;
    const now = new Date();
    const url = new URL(request.url);
    if (url.searchParams.get("download") === "1") {
      const session = await QrUploadSession.findOne({
        tokenHash,
        status: "uploaded",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      })
        .select("+imageData +mimeType originalFileName status expiresAt")
        .exec();
      if (!session || !session.imageData) {
        return NextResponse.json({ success: false, code: "PHOTO_NOT_READY" }, { status: 409, headers: noStoreHeaders() });
      }
      const imageBytes = Buffer.from(session.imageData as Uint8Array);
      const mime = session.mimeType || "image/jpeg";
      return new Response(new Uint8Array(imageBytes), {
        status: 200,
        headers: noStoreHeaders({
          "Content-Type": mime,
          "Content-Length": String(imageBytes.byteLength),
          "Content-Disposition": "inline; filename=\"mobile-photo\"",
          "X-Upload-File-Name": encodeURIComponent(session.originalFileName || "mobile-photo.jpg"),
        }),
      });
    }

    const session = await QrUploadSession.findOne({
      tokenHash,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    })
      .select("status expiresAt originalFileName")
      .lean();
    if (!session) {
      await QrUploadSession.deleteOne({ tokenHash, expiresAt: { $lte: now } }).catch(() => undefined);
      return NextResponse.json({ success: false, code: "UPLOAD_SESSION_EXPIRED" }, { status: 410, headers: noStoreHeaders() });
    }
    return NextResponse.json({
      success: true,
      status: session.status,
      expiresAt: session.expiresAt,
      originalFileName: session.originalFileName || null,
    }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Could not read AI Editor QR upload session:", error);
    return NextResponse.json({ success: false, code: "UPLOAD_SESSION_UNAVAILABLE" }, { status: 503, headers: noStoreHeaders() });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const tokenHash = await getTokenHash(context);
  if (!tokenHash) {
    return NextResponse.json({ success: false, code: "INVALID_UPLOAD_TOKEN" }, { status: 404, headers: noStoreHeaders() });
  }

  try {
    await connectDB();
    const ownerAccessError = await checkSessionOwnerAccess(tokenHash);
    if (ownerAccessError) return ownerAccessError;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      if (body?.action !== "consume") {
        return NextResponse.json({ success: false, code: "INVALID_ACTION" }, { status: 400, headers: noStoreHeaders() });
      }
      const now = new Date();
      const consumed = await QrUploadSession.findOneAndUpdate(
        {
          tokenHash,
          status: "uploaded",
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        { $set: { status: "consumed" }, $unset: { imageData: 1, mimeType: 1, originalFileName: 1 } },
        { new: true },
      ).select("status").lean();
      if (consumed) return NextResponse.json({ success: true, status: "consumed" }, { headers: noStoreHeaders() });
      const existing = await QrUploadSession.findOne({
        tokenHash,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      }).select("status").lean();
      if (existing?.status === "consumed") return NextResponse.json({ success: true, status: "consumed" }, { headers: noStoreHeaders() });
      return NextResponse.json({ success: false, code: "PHOTO_NOT_READY" }, { status: 409, headers: noStoreHeaders() });
    }

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, code: "UNSUPPORTED_CONTENT_TYPE" }, { status: 415, headers: noStoreHeaders() });
    }
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > QR_UPLOAD_MAX_BYTES + 256 * 1024) {
      return NextResponse.json({ success: false, code: "IMAGE_SIZE_INVALID", message: "The image must be smaller than 4 MB." }, { status: 413, headers: noStoreHeaders() });
    }

    const current = await QrUploadSession.findOne({
      tokenHash,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).select("status expiresAt").lean();
    if (!current) return NextResponse.json({ success: false, code: "UPLOAD_SESSION_EXPIRED" }, { status: 410, headers: noStoreHeaders() });
    if (current.status !== "pending") return NextResponse.json({ success: false, code: "UPLOAD_LINK_ALREADY_USED" }, { status: 409, headers: noStoreHeaders() });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, code: "IMAGE_REQUIRED" }, { status: 400, headers: noStoreHeaders() });
    }
    if (file.size <= 0 || file.size > QR_UPLOAD_MAX_BYTES) {
      return NextResponse.json({ success: false, code: "IMAGE_SIZE_INVALID", message: "The image must be smaller than 4 MB." }, { status: 413, headers: noStoreHeaders() });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = detectRasterImageMime(bytes);
    if (!mime || (file.type && !["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase()))) {
      return NextResponse.json({ success: false, code: "UNSUPPORTED_IMAGE", message: "Choose a JPG, PNG, or WebP image." }, { status: 415, headers: noStoreHeaders() });
    }

    const now = new Date();
    const reserved = await QrUploadSession.findOneAndUpdate(
      {
        tokenHash,
        status: "pending",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
      { $set: { status: "uploading", expiresAt: new Date(now.getTime() + QR_UPLOAD_IN_PROGRESS_TTL_MS) } },
      { new: true },
    ).select("_id").lean();
    if (!reserved) return NextResponse.json({ success: false, code: "UPLOAD_LINK_ALREADY_USED" }, { status: 409, headers: noStoreHeaders() });

    try {
      const uploadedAt = new Date();
      const result = await QrUploadSession.updateOne(
        { _id: reserved._id, status: "uploading", expiresAt: { $gt: uploadedAt } },
        {
          $set: {
            imageData: bytes,
            mimeType: mime,
            originalFileName: safeUploadFileName(file.name),
            status: "uploaded",
            // Uploaded bytes are temporary and are automatically removed if the desktop disconnects.
            expiresAt: new Date(uploadedAt.getTime() + QR_UPLOAD_DATA_CLEANUP_TTL_MS),
          },
        },
      );
      if (!result.modifiedCount) throw new Error("Upload session expired while receiving the image.");
    } catch (error) {
      await QrUploadSession.updateOne(
        { _id: reserved._id, status: "uploading" },
        { $set: { status: "pending" }, $unset: { expiresAt: 1 } },
      ).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({ success: true, status: "uploaded" }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    console.error("AI Editor QR photo upload failed:", error);
    return NextResponse.json({ success: false, code: "QR_PHOTO_UPLOAD_FAILED", message: "Upload failed. Please try again." }, { status: 500, headers: noStoreHeaders() });
  }
}
