import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import AIGeneration from "@/models/AIGeneration";
import { connectDB } from "@/lib/db";
import { hasActiveSubscription as hasActiveToolAccess } from "@/app/api/_lib/requireActiveSubscription";
import { requireToolAccess } from "@/app/api/_lib/requireActiveSubscription";

export const runtime = "nodejs";

// Gemini can take a while, and the image server may have a line of requests.
export const maxDuration = 300;

// Set these in .env.local (and in Vercel -> Settings -> Environment Variables):
//   GEMINI_RENDER_URL=<public URL of the Gemini image server (playwright-service)>
//   GEMINI_RENDER_KEY=<same value as ASK_KEY on that server>   (only if you set ASK_KEY there)
const RENDER_URL = (process.env.GEMINI_RENDER_URL || "").replace(/\/+$/, "");
const RENDER_KEY = process.env.GEMINI_RENDER_KEY || "";

// Kept a little below maxDuration so we can answer with a clean error
// before the platform kills the function.
const REQUEST_TIMEOUT_MS = 290_000;

// Error that carries the HTTP status we want to answer with.
class ServiceError extends Error {
  status: number;
  retryAfter: number;

  constructor(message: string, status = 500, retryAfter = 0) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

// One signal that aborts when ANY of the given signals aborts.
function combineSignals(...signals: Array<AbortSignal | undefined>): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (!signal) continue;

    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }

    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }

  return controller.signal;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Gemini image generation failed.";
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
  fileKey = "image",
  urlKey = "imageUrl",
): Promise<{ blob: Blob; filename: string }> {
  const uploadedImage = formData.get(fileKey);

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

  const imageUrlValue = formData.get(urlKey);
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
  secondImage?: { blob: Blob; filename: string } | null,
  clientSignal?: AbortSignal,
): Promise<string> {
  if (!RENDER_URL) {
    throw new Error("GEMINI_RENDER_URL is not set on the website server.");
  }

  const body = new FormData();
  body.append("image", blob, filename);
  if (secondImage) {
    // Dual mode: second person's photo.
    body.append("image2", secondImage.blob, secondImage.filename);
  }
  body.append("prompt", prompt);

  const headers: Record<string, string> = {};

  if (RENDER_KEY) {
    headers["x-api-key"] = RENDER_KEY;
  }

  const endpoint = secondImage ? "/edit-image-dual" : "/edit-image";

  // The signal also fires when the visitor closes the page. The image server
  // then cancels that job right away instead of finishing an image nobody
  // is waiting for, which frees its slot for the next person.
  const signal = combineSignals(
    AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    clientSignal,
  );

  let response: Response;
  let rawText: string;

  try {
    response = await fetch(`${RENDER_URL}${endpoint}`, {
      method: "POST",
      headers,
      body,
      signal,
    });

    rawText = await response.text();
  } catch (error) {
    if (clientSignal?.aborted) {
      throw new ServiceError("Request was cancelled.", 499);
    }

    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ServiceError(
        "Image generation took too long. Please try again.",
        504,
      );
    }

    throw error;
  }

  let data: { success?: boolean; image?: string; error?: string } | null = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    // Not JSON (for example an HTML error page while the service is waking up)
  }

  if (!response.ok || !data?.success || !data.image) {
    const detail =
      data?.error ||
      `Image service returned ${response.status}. ${rawText.slice(0, 200)}`;

    // 503 / 504 from the image server mean "busy" or "took too long".
    // Keep that status so the website can show a friendly retry message.
    const retryAfter = Number(response.headers.get("retry-after")) || 0;
    const status =
      response.status === 503 || response.status === 504
        ? response.status
        : 500;

    throw new ServiceError(detail, status, retryAfter);
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
  const accountAccess = await requireToolAccess(request);
  if (!accountAccess.ok) return accountAccess.response;
  const token = getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };

    if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    if (!(await hasActiveToolAccess(decoded.userId))) {
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

    // Dual mode only: a second photo (image2 / imageUrl2) is sent alongside the first.
    const hasSecondImage = formData.has("image2") || formData.has("imageUrl2");
    const secondSource = hasSecondImage
      ? await getSourceImage(formData, userId, "image2", "imageUrl2")
      : null;

    // Let each authenticated request reach the image service immediately.
    // That service gives every request its own isolated browser context and
    // keeps a fair line when many people generate at the same time.
    const image = await callRenderService(
      source.blob,
      source.filename,
      prompt,
      secondSource,
      req.signal,
    );

    return NextResponse.json({
      success: true,
      provider: "gemini-playwright-render",
      image,
    });
  } catch (error) {
    const status = error instanceof ServiceError ? error.status : 500;

    if (status === 499) {
      // The visitor left; nobody is waiting for a response.
      return NextResponse.json(
        { success: false, error: "Request was cancelled." },
        { status: 499 },
      );
    }

    console.error("Gemini image-generation route error:", error);

    const headers: Record<string, string> = {};

    if (error instanceof ServiceError && error.retryAfter) {
      headers["Retry-After"] = String(error.retryAfter);
    }

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status, headers },
    );
  }
}
