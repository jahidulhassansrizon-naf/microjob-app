import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

function extractPublicIdFromCloudinaryUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);

    if (url.hostname !== "res.cloudinary.com") return null;

    const parts = url.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));

    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const afterUpload = parts.slice(uploadIndex + 1);

    // Cloudinary may include transformation segments and/or a version before
    // the public id. When a version exists, everything after it is the asset.
    const versionIndex = afterUpload.findIndex((part) => /^v\d+$/.test(part));
    const publicPathParts =
      versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;

    if (!publicPathParts.length) return null;

    const fullPath = publicPathParts.join("/");

    // The stored upload is an image. Remove the delivery format from the end.
    const publicId = fullPath.replace(/\.[a-z0-9]+$/i, "");

    return publicId || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudinary delete is not configured on this deployment.",
          message: "Cloudinary delete is not configured on this deployment.",
        },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required." },
        { status: 400 },
      );
    }

    const publicId = extractPublicIdFromCloudinaryUrl(imageUrl);

    // Local/data/blob URLs have nothing to delete in Cloudinary. Treat this
    // as an idempotent success so Firestore cleanup can still continue.
    if (!publicId) {
      return NextResponse.json({
        success: true,
        skipped: true,
        result: "not-cloudinary",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });

    // Cloudinary returns "not found" when the asset is already gone. That is
    // safe for a delete operation and makes the endpoint idempotent.
    if (result?.result === "ok" || result?.result === "not found") {
      return NextResponse.json({
        success: true,
        result: result.result,
        publicId,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Cloudinary delete returned: ${String(result?.result || "unknown")}.`,
        message: `Cloudinary delete returned: ${String(result?.result || "unknown")}.`,
        publicId,
      },
      { status: 502 },
    );
  } catch (error: unknown) {
    console.error("Cloudinary Delete Error:", error);

    const message =
      error instanceof Error ? error.message : "Cloudinary deletion failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
        message,
      },
      { status: 500 },
    );
  }
}
