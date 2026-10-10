import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Subscription from "@/models/Subscription";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

// Gemini / Playwright generation can take some time.
export const maxDuration = 300;

const RENDER_URL = (process.env.GEMINI_RENDER_URL || "").replace(/\/+$/, "");
const RENDER_KEY = process.env.GEMINI_RENDER_KEY || "";

const REQUEST_TIMEOUT_MS = 330_000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Gemini template generation failed.";
}

async function getUserImage(formData: FormData): Promise<{
  blob: Blob;
  filename: string;
}> {
  const uploadedImage = formData.get("image");

  if (
    uploadedImage &&
    typeof uploadedImage === "object" &&
    "arrayBuffer" in uploadedImage
  ) {
    const file = uploadedImage as File;

    if (file.type && !file.type.toLowerCase().startsWith("image/")) {
      throw new Error("Uploaded user photo is not an image.");
    }

    if (!file.size) {
      throw new Error("Uploaded user photo is empty.");
    }

    return {
      blob: file,
      filename: file.name || "user-photo.jpg",
    };
  }

  throw new Error("No user photo was provided.");
}

async function getTemplateImage(formData: FormData): Promise<{
  blob: Blob;
  filename: string;
}> {
  const templateImageValue = formData.get("templateImage");

  if (typeof templateImageValue !== "string") {
    throw new Error("No template image was provided.");
  }

  const templateImageUrl = templateImageValue.trim();

  if (!templateImageUrl) {
    throw new Error("Template image URL is empty.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(templateImageUrl);
  } catch {
    throw new Error("The provided template image URL is invalid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("The template image URL must use HTTP or HTTPS.");
  }

  const response = await fetch(parsedUrl.toString(), {
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch template image (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";

  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("The template URL does not point to an image.");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("Fetched template image is empty.");
  }

  const extension = contentType.includes("png")
    ? ".png"
    : contentType.includes("webp")
      ? ".webp"
      : ".jpg";

  return {
    blob: new Blob([blob], { type: contentType }),
    filename: `template${extension}`,
  };
}

async function callRenderService(
  userImage: Blob,
  userFilename: string,
  templateImage: Blob,
  templateFilename: string,
  prompt: string,
): Promise<string> {
  if (!RENDER_URL) {
    throw new Error("GEMINI_RENDER_URL is not set on the website server.");
  }

  const body = new FormData();

  // User's own photo
  body.append("image", userImage, userFilename);

  // Selected AI template/reference image
  body.append("templateImage", templateImage, templateFilename);

  body.append("prompt", prompt);

  const headers: Record<string, string> = {};

  if (RENDER_KEY) {
    headers["x-api-key"] = RENDER_KEY;
  }

  const response = await fetch(`${RENDER_URL}/template-edit`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const rawText = await response.text();

  let data: {
    success?: boolean;
    image?: string;
    error?: string;
  } | null = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    // Render service may return HTML/text while waking up.
  }

  if (!response.ok || !data?.success || !data.image) {
    const detail =
      data?.error ||
      `Render service returned ${response.status}. ${rawText.slice(0, 300)}`;

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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };

    if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user session." },
        { status: 401 },
      );
    }

    await connectDB();

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

    return null;
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
  if (subscriptionGuard) return subscriptionGuard;

  try {
    const formData = await req.formData();

    const promptValue = formData.get("prompt");
    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "No template generation prompt was provided.",
        },
        { status: 400 },
      );
    }

    const userImage = await getUserImage(formData);
    const templateImage = await getTemplateImage(formData);

    const image = await callRenderService(
      userImage.blob,
      userImage.filename,
      templateImage.blob,
      templateImage.filename,
      prompt,
    );

    return NextResponse.json({
      success: true,
      provider: "gemini-playwright-template",
      image,
    });
  } catch (error) {
    console.error("Gemini template-generation route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
