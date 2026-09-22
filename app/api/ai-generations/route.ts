import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import AIGeneration from "@/models/AIGeneration";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

const CLOUDINARY_FOLDER = "sohozkaj-ai-photos";

type GenerationBody = {
  url?: unknown;
  originalUrl?: unknown;
  size?: unknown;
  sizeType?: unknown;
  widthPx?: unknown;
  heightPx?: unknown;
  dpi?: unknown;
  bgColor?: unknown;
  clothingStyle?: unknown;
  clothingColor?: unknown;
  editingGuides?: unknown;
  side?: unknown;
  publicId?: unknown;
  source?: unknown;
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

  if (!token) throw new Error("AUTH_REQUIRED");

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId?: string;
    [key: string]: unknown;
  };
  const userId = typeof decoded.userId === "string" ? decoded.userId : "";

  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  return userId;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function toGuides(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function normalizeSide(value: unknown): "left" | "right" | "single" {
  return value === "left" || value === "right" ? value : "single";
}

function normalizeSource(
  value: unknown,
): "ai-editor" | "manual-editor" | undefined {
  if (value === "ai-editor" || value === "manual-editor") return value;
  if (value === undefined || value === null || value === "") return undefined;
  throw new Error("INVALID_SOURCE");
}

function extractPublicIdFromCloudinaryUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);

    const validHost =
      url.hostname === "res.cloudinary.com" ||
      url.hostname.endsWith(".res.cloudinary.com");

    if (!validHost) return null;

    const parts = url.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));

    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const afterUpload = parts.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((part) => /^v\d+$/.test(part));
    const publicPathParts =
      versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;

    if (!publicPathParts.length) return null;

    const publicId = publicPathParts.join("/").replace(/\.[a-z0-9]+$/i, "");

    return publicId || null;
  } catch {
    return null;
  }
}

function validateCloudinaryUrl(imageUrl: string, publicId: string) {
  try {
    const url = new URL(imageUrl);
    const validHost =
      url.hostname === "res.cloudinary.com" ||
      url.hostname.endsWith(".res.cloudinary.com");

    return (
      validHost &&
      url.protocol === "https:" &&
      publicId.startsWith(`${CLOUDINARY_FOLDER}/`) &&
      url.pathname.includes(`/${CLOUDINARY_FOLDER}/`)
    );
  } catch {
    return false;
  }
}

function serializeGeneration(item: any) {
  return {
    id: String(item._id),
    url: item.url,
    originalUrl: item.originalUrl || item.url,
    size: item.size || "35×45 mm",
    sizeType: item.sizeType || "Passport",
    widthPx: Number(item.widthPx || 0) || undefined,
    heightPx: Number(item.heightPx || 0) || undefined,
    dpi: Number(item.dpi || 0) || undefined,
    bgColor: item.bgColor || "#FFFFFF",
    clothingStyle: item.clothingStyle || "Default Clothing",
    clothingColor: item.clothingColor || "",
    editingGuides: Array.isArray(item.editingGuides) ? item.editingGuides : [],
    side: item.side || "single",
    publicId: item.publicId || "",
    source: item.source || undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function buildPayload(body: GenerationBody, requireUrl = true) {
  const url = toStringValue(body.url);
  const originalUrl = toStringValue(body.originalUrl);

  if (requireUrl && !url) {
    throw new Error("IMAGE_URL_REQUIRED");
  }

  const payload: Record<string, unknown> = {};

  if (url) {
    const publicIdFromUrl = extractPublicIdFromCloudinaryUrl(url);
    if (!publicIdFromUrl) throw new Error("INVALID_CLOUDINARY_URL");

    const suppliedPublicId = toStringValue(body.publicId);
    const publicId = suppliedPublicId || publicIdFromUrl;

    if (!validateCloudinaryUrl(url, publicId)) {
      throw new Error("INVALID_CLOUDINARY_ASSET");
    }

    payload.url = url;
    payload.publicId = publicId;
  }

  if (body.originalUrl !== undefined) payload.originalUrl = originalUrl;
  if (body.size !== undefined) payload.size = toStringValue(body.size);
  if (body.sizeType !== undefined)
    payload.sizeType = toStringValue(body.sizeType);

  if (body.widthPx !== undefined) {
    const value = toOptionalNumber(body.widthPx);
    if (value !== undefined) payload.widthPx = Math.max(1, Math.round(value));
  }

  if (body.heightPx !== undefined) {
    const value = toOptionalNumber(body.heightPx);
    if (value !== undefined) payload.heightPx = Math.max(1, Math.round(value));
  }

  if (body.dpi !== undefined) {
    const value = toOptionalNumber(body.dpi);
    if (value !== undefined) payload.dpi = Math.max(1, Math.round(value));
  }

  if (body.bgColor !== undefined)
    payload.bgColor = toStringValue(body.bgColor, "#FFFFFF");
  if (body.clothingStyle !== undefined)
    payload.clothingStyle = toStringValue(
      body.clothingStyle,
      "Default Clothing",
    );
  if (body.clothingColor !== undefined)
    payload.clothingColor = toStringValue(body.clothingColor);
  if (body.editingGuides !== undefined)
    payload.editingGuides = toGuides(body.editingGuides);
  if (body.side !== undefined) payload.side = normalizeSide(body.side);
  if (body.source !== undefined) payload.source = normalizeSource(body.source);

  return payload;
}

function throwHttpError(errorCode: string) {
  const map: Record<string, { status: number; message: string }> = {
    AUTH_REQUIRED: { status: 401, message: "Authentication required." },
    INVALID_USER_ID: { status: 401, message: "Invalid user session." },
    IMAGE_URL_REQUIRED: {
      status: 400,
      message: "Generated image URL is required.",
    },
    INVALID_CLOUDINARY_URL: {
      status: 400,
      message:
        "Generated image must be stored in Cloudinary before it is saved.",
    },
    INVALID_CLOUDINARY_ASSET: {
      status: 400,
      message: "Invalid Cloudinary generation asset.",
    },
    INVALID_SOURCE: {
      status: 400,
      message: "Invalid generation source.",
    },
  };
  return map[errorCode];
}

async function deleteCloudinaryAsset(publicId: string) {
  if (!publicId) return "skipped";

  getCloudinaryConfig();

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "upload",
    invalidate: true,
  });

  if (result?.result === "ok" || result?.result === "not found") {
    return result.result;
  }

  throw new Error(
    `Cloudinary delete returned: ${String(result?.result || "unknown")}.`,
  );
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get("source")?.trim() || "";

    if (
      sourceParam &&
      sourceParam !== "ai-editor" &&
      sourceParam !== "manual-editor"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid generation source." },
        { status: 400 },
      );
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query: Record<string, unknown> = { userId: userObjectId };

    if (sourceParam === "manual-editor") {
      query.source = "manual-editor";
    } else if (sourceParam === "ai-editor") {
      // Records created before source separation have no source. Keep those
      // in AI Editor so existing AI history is not lost, while Manual Editor
      // remains strictly scoped to manual-editor records.
      query.$or = [
        { source: "ai-editor" },
        { source: { $exists: false } },
        { source: null },
      ];
    }

    const generations = await AIGeneration.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: generations.map(serializeGeneration),
    });
  } catch (error: unknown) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error) {
      const known = throwHttpError(error.message);
      if (known)
        return NextResponse.json(
          { success: false, error: known.message },
          { status: known.status },
        );
    }

    console.error("AI generations GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load recent generations." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as
      | GenerationBody
      | GenerationBody[];
    const items = Array.isArray(body) ? body : [body];

    if (items.length > 10) {
      return NextResponse.json(
        { success: false, error: "Too many generations in one request." },
        { status: 400 },
      );
    }

    const payloads = items.map((item) => buildPayload(item, true));

    await connectDB();

    const created = await AIGeneration.insertMany(
      payloads.map((payload) => ({
        ...payload,
        userId: new mongoose.Types.ObjectId(userId),
      })),
    );

    return NextResponse.json(
      {
        success: true,
        data: created.map(serializeGeneration),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error) {
      const known = throwHttpError(error.message);
      if (known)
        return NextResponse.json(
          { success: false, error: known.message },
          { status: known.status },
        );
    }

    console.error("AI generations POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save generated photo." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Valid generation ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as GenerationBody;
    const payload = buildPayload(body, false);

    if (!Object.keys(payload).length) {
      return NextResponse.json(
        { success: false, error: "No generation changes were provided." },
        { status: 400 },
      );
    }

    await connectDB();

    const existingGeneration = await AIGeneration.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existingGeneration) {
      return NextResponse.json(
        { success: false, error: "Generation not found." },
        { status: 404 },
      );
    }

    const oldPublicId = existingGeneration.publicId || "";

    const generation = await AIGeneration.findOneAndUpdate(
      {
        _id: id,
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    if (!generation) {
      return NextResponse.json(
        { success: false, error: "Generation not found." },
        { status: 404 },
      );
    }

    // When the generated image itself changes, remove the previous Cloudinary
    // asset after MongoDB has been updated successfully. This prevents old
    // generated images from accumulating in Cloudinary.
    const newPublicId = generation.publicId || "";
    if (oldPublicId && oldPublicId !== newPublicId) {
      try {
        await deleteCloudinaryAsset(oldPublicId);
      } catch (cleanupError) {
        console.error(
          "Failed to remove previous Cloudinary AI generation asset:",
          cleanupError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: serializeGeneration(generation),
    });
  } catch (error: unknown) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error) {
      const known = throwHttpError(error.message);
      if (known)
        return NextResponse.json(
          { success: false, error: known.message },
          { status: known.status },
        );
    }

    console.error("AI generations PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update generated photo." },
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
        { success: false, error: "Valid generation ID is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const generation = await AIGeneration.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!generation) {
      return NextResponse.json(
        { success: false, error: "Generation not found." },
        { status: 404 },
      );
    }

    let cloudinaryStatus = "skipped";
    if (generation.publicId) {
      cloudinaryStatus = await deleteCloudinaryAsset(generation.publicId);
    }

    await AIGeneration.deleteOne({ _id: generation._id });

    return NextResponse.json({
      success: true,
      message: "Generated photo deleted successfully.",
      cloudinary: cloudinaryStatus,
    });
  } catch (error: unknown) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    if (error instanceof Error) {
      const known = throwHttpError(error.message);
      if (known)
        return NextResponse.json(
          { success: false, error: known.message },
          { status: known.status },
        );
    }

    console.error("AI generations DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete generated photo." },
      { status: 500 },
    );
  }
}
