import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

function configureCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function publicIdFromCloudinaryUrl(imageUrl: string): string {
  const url = new URL(imageUrl);

  if (url.hostname !== "res.cloudinary.com") {
    throw new Error("Invalid Cloudinary URL.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) throw new Error("Invalid Cloudinary upload URL.");

  let assetParts = parts.slice(uploadIndex + 1);

  // Remove transformation segments between upload/ and the version/public id.
  // A Cloudinary transformation segment commonly contains commas, colons,
  // underscores, dimensions, effects, etc. Versioned URLs give us a reliable
  // boundary, so prefer the v123... marker when present.
  const versionIndex = assetParts.findIndex((part) => /^v\d+$/.test(part));
  if (versionIndex >= 0) {
    assetParts = assetParts.slice(versionIndex + 1);
  } else {
    while (assetParts.length > 0) {
      const first = assetParts[0];
      const looksLikeTransformation =
        first.includes(",") ||
        first.includes(":") ||
        /(^|_)(w|h|c|g|q|f|e|ar|dpr|r|bo|b|fl)_/.test(first);
      if (!looksLikeTransformation) break;
      assetParts.shift();
    }
  }

  if (assetParts.length === 0)
    throw new Error("Could not parse Cloudinary public_id.");

  const last = assetParts[assetParts.length - 1];
  const dotIndex = last.lastIndexOf(".");
  if (dotIndex > 0) {
    assetParts[assetParts.length - 1] = last.slice(0, dotIndex);
  }

  const publicId = decodeURIComponent(assetParts.join("/"));
  if (!publicId) throw new Error("Could not parse Cloudinary public_id.");
  return publicId;
}

export async function POST(req: Request) {
  try {
    configureCloudinary();

    const body = await req.json();
    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const providedPublicId =
      typeof body?.publicId === "string" ? body.publicId.trim() : "";

    if (!imageUrl && !providedPublicId) {
      return NextResponse.json(
        { success: false, error: "Image URL or public_id is required." },
        { status: 400 },
      );
    }

    const publicId = providedPublicId || publicIdFromCloudinaryUrl(imageUrl);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });

    // Cloudinary returns result:"not found" when the asset is already gone.
    // Treat delete as idempotent so Firestore cleanup can still complete.
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
        error: `Cloudinary delete returned: ${result?.result || "unknown"}`,
        result,
      },
      { status: 502 },
    );
  } catch (error: unknown) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Cloud image deletion failed.",
      },
      { status: 500 },
    );
  }
}
