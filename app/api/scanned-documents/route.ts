import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import ScannedDocument from "@/models/ScannedDocument";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

const CLOUDINARY_FOLDER = "sohozkaj-ai-photos";

type JwtPayload = {
  userId?: string;
  [key: string]: unknown;
};

type Adjustments = {
  blackness: number;
  contrast: number;
  brightness: number;
  rotation: number;
};

function getCloudinaryConfig() {
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

function getTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);

  return match ? decodeURIComponent(match[1]) : null;
}

function getUserIdFromRequest(request: Request): string {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new Error("AUTH_REQUIRED");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  const userId = typeof decoded.userId === "string" ? decoded.userId : "";

  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  return userId;
}

function clamp(value: unknown, min: number, max: number, fallback = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function normalizeAdjustments(value: unknown): Adjustments {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    blackness: clamp(input.blackness, -100, 100),
    contrast: clamp(input.contrast, -100, 100),
    brightness: clamp(input.brightness, -100, 100),
    rotation: clamp(input.rotation, 0, 359),
  };
}

function isAllowedCloudinaryAsset(imageUrl: string, publicId: string) {
  try {
    const url = new URL(imageUrl);

    const validHost =
      url.hostname === "res.cloudinary.com" ||
      url.hostname.endsWith(".res.cloudinary.com");

    if (!validHost) return false;

    return (
      publicId.startsWith(`${CLOUDINARY_FOLDER}/`) &&
      url.pathname.includes(`/${CLOUDINARY_FOLDER}/`)
    );
  } catch {
    return false;
  }
}

function serializeDocument(item: any) {
  return {
    id: String(item._id),
    title: item.title,
    imageUrl: item.imageUrl,
    publicId: item.publicId || "",
    adjustments: {
      blackness: Number(item.adjustments?.blackness ?? 0),
      contrast: Number(item.adjustments?.contrast ?? 0),
      brightness: Number(item.adjustments?.brightness ?? 0),
      rotation: Number(item.adjustments?.rotation ?? 0),
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    await connectDB();

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json(
          {
            success: false,
            error: "Valid document ID is required.",
          },
          { status: 400 },
        );
      }

      filter._id = id;
    }

    if (id) {
      const document = await ScannedDocument.findOne(filter).lean();

      if (!document) {
        return NextResponse.json(
          {
            success: false,
            error: "Document not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: serializeDocument(document),
        },
        { status: 200 },
      );
    }

    const documents = await ScannedDocument.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: documents.map(serializeDocument),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_USER_ID") {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    console.error("Scanned documents GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch saved documents." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let uploadedPublicId = "";

  try {
    const userId = getUserIdFromRequest(request);

    const body = await request.json();

    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const publicId =
      typeof body?.publicId === "string" ? body.publicId.trim() : "";
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "Scanned Document";

    if (!imageUrl || !publicId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudinary imageUrl and publicId are required.",
        },
        { status: 400 },
      );
    }

    if (!isAllowedCloudinaryAsset(imageUrl, publicId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Cloudinary document asset.",
        },
        { status: 400 },
      );
    }

    const adjustments = normalizeAdjustments(body?.adjustments);

    await connectDB();

    uploadedPublicId = publicId;

    const created = await ScannedDocument.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      imageUrl,
      publicId,
      adjustments,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document saved successfully.",
        data: serializeDocument(created),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    // If Cloudinary upload happened but MongoDB persistence failed,
    // remove the uploaded asset so we don't leave an orphaned image.
    if (uploadedPublicId) {
      try {
        getCloudinaryConfig();
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
          type: "upload",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error(
          "Cloudinary rollback failed after MongoDB save error:",
          cleanupError,
        );
      }
    }

    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_USER_ID") {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    console.error("Scanned documents POST error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save scanned document." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid document ID is required.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    const publicId =
      typeof body?.publicId === "string" ? body.publicId.trim() : "";

    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "Scanned Document";

    if (!imageUrl || !publicId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudinary imageUrl and publicId are required.",
        },
        { status: 400 },
      );
    }

    if (!isAllowedCloudinaryAsset(imageUrl, publicId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Cloudinary document asset.",
        },
        { status: 400 },
      );
    }

    const adjustments = normalizeAdjustments(body?.adjustments);

    await connectDB();

    const document = await ScannedDocument.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found.",
        },
        { status: 404 },
      );
    }

    const oldPublicId = document.publicId || "";
    document.title = title;
    document.imageUrl = imageUrl;
    document.publicId = publicId;
    document.adjustments = adjustments;

    await document.save();

    // The database now points to the new asset. Clean up the previous
    // Cloudinary image afterward. A cleanup failure should not invalidate
    // the successful database update; it is logged for later reconciliation.
    let cloudinaryCleanup: "ok" | "not_needed" | "failed" = "not_needed";

    if (oldPublicId && oldPublicId !== publicId) {
      try {
        getCloudinaryConfig();

        const result = await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
          type: "upload",
          invalidate: true,
        });

        if (result?.result === "ok" || result?.result === "not found") {
          cloudinaryCleanup = "ok";
        } else {
          cloudinaryCleanup = "failed";
          console.error(
            "Old Cloudinary document cleanup returned an unexpected result:",
            result,
          );
        }
      } catch (cleanupError) {
        cloudinaryCleanup = "failed";
        console.error(
          "Failed to remove previous Cloudinary document asset after update:",
          cleanupError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Document updated successfully.",
        data: serializeDocument(document),
        cloudinaryCleanup,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_USER_ID") {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    console.error("Scanned documents PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update scanned document.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Valid document ID is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const document = await ScannedDocument.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found." },
        { status: 404 },
      );
    }

    if (!document.publicId) {
      await ScannedDocument.deleteOne({ _id: document._id });

      return NextResponse.json({
        success: true,
        message: "Document record deleted.",
        cloudinary: "skipped",
      });
    }

    getCloudinaryConfig();

    const cloudinaryResult = await cloudinary.uploader.destroy(
      document.publicId,
      {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      },
    );

    const cloudinaryStatus = cloudinaryResult?.result;

    if (cloudinaryStatus !== "ok" && cloudinaryStatus !== "not found") {
      return NextResponse.json(
        {
          success: false,
          error: `Cloudinary delete returned: ${cloudinaryStatus || "unknown"}`,
        },
        { status: 502 },
      );
    }

    await ScannedDocument.deleteOne({ _id: document._id });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully.",
      cloudinary: cloudinaryStatus,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_USER_ID") {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    console.error("Scanned documents DELETE error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete scanned document." },
      { status: 500 },
    );
  }
}
