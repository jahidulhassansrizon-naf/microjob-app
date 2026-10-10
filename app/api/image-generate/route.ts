import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Subscription from "@/models/Subscription";
import AIGeneration from "@/models/AIGeneration";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

// Gemini can take a while, and the Render Free service may need ~1 minute to wake up.
export const maxDuration = 300;

// Set these in .env.local (and in Vercel -> Settings -> Environment Variables):
//   GEMINI_RENDER_URL=https://microjob-playwright.onrender.com
//   GEMINI_RENDER_KEY=<same value as ASK_KEY on Render>   (only if you set ASK_KEY there)
const RENDER_URL = (process.env.GEMINI_RENDER_URL || "").replace(/\/+$/, "");
const RENDER_KEY = process.env.GEMINI_RENDER_KEY || "";

const REQUEST_TIMEOUT_MS = 330_000;

let geminiQueue: Promise<void> = Promise.resolve();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Gemini image generation failed.";
}

// One job at a time (the Render server also queues, this just avoids piling up).
async function withGeminiQueue<T>(job: () => Promise<T>): Promise<T> {
  const previousJob = geminiQueue;

  let release!: () => void;

  geminiQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previousJob;

  try {
    return await job();
  } finally {
    release();
  }
}

function extractCloudinaryPublicId(imageUrl: string): string | null {
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
    const publicParts =
      versionIndex >= 0
        ? afterUpload.slice(versionIndex + 1)
        : afterUpload;

    if (!publicParts.length) return null;

    const last = publicParts[publicParts.length - 1];
    publicParts[publicParts.length - 1] = last.replace(/\.[a-z0-9]+$/i, "");
    return publicParts.join("/") || null;
  } catch {
    return null;
  }
}

async function assertOwnedImageUrl(imageUrl: string, userId: string) {
  const publicId = extractCloudinaryPublicId(imageUrl);

  if (!publicId) {
    throw new Error(
      "Source image URL must be an image owned by the current account.",
    );
  }

  const ownedFolder = `sohozkaj-ai-photos/${userId}/`;
  if (publicId.startsWith(ownedFolder)) return;

  await connectDB();

  const ownedGeneration = await AIGeneration.exists({
    userId: new mongoose.Types.ObjectId(userId),
    $or: [
      { url: imageUrl },
      { originalUrl: imageUrl },
      { publicId },
    ],
  });

  if (!ownedGeneration) {
    throw new Error(
      "Source image does not belong to the current account.",
    );
  }
}

async function getSourceImage(
  formData: FormData,
  userId: string,
): Promise<{ blob: Blob; filename: string }> {
  const uploadedImage = formData.get("image");

  if (
    uploadedImage &&
    typeof uploadedImage === "object" &&
    "arrayBuffer" in uploadedImage
  ) {
    const file = uploadedImage as File;

    if (file.type && !file.type.toLowerCase().startsWith("image/")) {
      throw new Error("Uploaded source file is not an image.");
    }

    if (!file.size) {
      throw new Error("Uploaded source image is empty.");
    }

    return { blob: file, filename: file.name || "source.jpg" };
  }

  const imageUrlValue = formData.get("imageUrl");
  const imageUrl =
    typeof imageUrlValue === "string" ? imageUrlValue.trim() : "";

  if (!imageUrl) {
    throw new Error("No source image was provided.");
  }

  await assertOwnedImageUrl(imageUrl, userId);

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new Error("The provided image URL is invalid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("The provided image URL must use HTTP or HTTPS.");
  }

  const response = await fetch(parsedUrl.toString(), {
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch source image (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";

  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("The provided URL does not point to an image.");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("Fetched source image is empty.");
  }

  const extension = contentType.includes("png")
    ? ".png"
    : contentType.includes("webp")
      ? ".webp"
      : ".jpg";

  return {
    blob: new Blob([blob], { type: contentType }),
    filename: `source${extension}`,
  };
}

async function callRenderService(
  blob: Blob,
  filename: string,
  prompt: string,
): Promise<string> {
  if (!RENDER_URL) {
    throw new Error("GEMINI_RENDER_URL is not set on the website server.");
  }

  const body = new FormData();
  body.append("image", blob, filename);
  body.append("prompt", prompt);

  const headers: Record<string, string> = {};

  if (RENDER_KEY) {
    headers["x-api-key"] = RENDER_KEY;
  }

  const response = await fetch(`${RENDER_URL}/edit-image`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const rawText = await response.text();

  let data: { success?: boolean; image?: string; error?: string } | null = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    // Not JSON (for example an HTML error page while the service is waking up)
  }

  if (!response.ok || !data?.success || !data.image) {
    const detail =
      data?.error ||
      `Render service returned ${response.status}. ${rawText.slice(0, 200)}`;

    throw new Error(detail);
  }

  return data.image;
}

const JWT_SECRET = process.env.JWT_SECRET || "";

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

async function requireActiveSubscription(request: Request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };

    if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(decoded.userId),
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: new Date() },
    })
      .sort({ expiresAt: -1, startedAt: -1 })
      .lean();

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          code: "SUBSCRIPTION_REQUIRED",
          error: "An active subscription is required to use this feature.",
        },
        { status: 403 },
      );
    }

    return decoded.userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 },
      );
    }

    throw error;
  }
}

export async function POST(req: Request) {
  const subscriptionGuard = await requireActiveSubscription(req);
  if (!subscriptionGuard) {
    return NextResponse.json(
      { success: false, error: "Invalid user session." },
      { status: 401 },
    );
  }
  if (typeof subscriptionGuard !== "string") return subscriptionGuard;

  const userId = subscriptionGuard;

  try {
    const formData = await req.formData();

    const promptValue = formData.get("prompt");
    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "No editing prompt was provided.",
        },
        { status: 400 },
      );
    }

    const source = await getSourceImage(formData, userId);

    const image = await withGeminiQueue(() =>
      callRenderService(source.blob, source.filename, prompt),
    );

    return NextResponse.json({
      success: true,
      provider: "gemini-playwright-render",
      image,
    });
  } catch (error) {
    console.error("Gemini image-generation route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
