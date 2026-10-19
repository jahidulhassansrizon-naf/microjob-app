import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import { connectDB } from "@/lib/db";
import { enqueueAIImageJob } from "@/lib/aiImageQueue";
import AIGeneration from "@/models/AIGeneration";
import AIImageJob, { type AIImageJobSource } from "@/models/AIImageJob";
import { requireActiveSubscription } from "@/app/api/_lib/requireActiveSubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 20_000;
const CLOUDINARY_ROOT = "sohozkaj-ai-photos";

class RequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

type CloudinaryUploadResult = {
  secure_url?: string;
  public_id?: string;
};

function configureCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary server configuration is missing.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function extractCloudinaryPublicId(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === "res.cloudinary.com" ||
        url.hostname.endsWith(".res.cloudinary.com")
      )
    ) {
      return null;
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex < 0) return null;

    let assetParts = parts.slice(uploadIndex + 1);
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

    if (!assetParts.length) return null;
    const last = assetParts.length - 1;
    assetParts[last] = assetParts[last].replace(/\.[a-z0-9]+$/i, "");
    return assetParts.join("/") || null;
  } catch {
    return null;
  }
}

async function assertOwnedImageUrl(imageUrl: string, userId: string) {
  const publicId = extractCloudinaryPublicId(imageUrl);
  if (!publicId) {
    throw new RequestError(
      "Source image must be a valid HTTPS Cloudinary image.",
      403,
    );
  }

  if (publicId.startsWith(`${CLOUDINARY_ROOT}/${userId}/`)) {
    return publicId;
  }

  const ownedGeneration = await AIGeneration.exists({
    userId: new mongoose.Types.ObjectId(userId),
    $or: [{ url: imageUrl }, { originalUrl: imageUrl }, { publicId }],
  });

  if (!ownedGeneration) {
    throw new RequestError(
      "Source image does not belong to the current account.",
      403,
    );
  }

  return publicId;
}

async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const uploadResult = await new Promise<CloudinaryUploadResult>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "image",
            use_filename: false,
            unique_filename: true,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result || {});
          },
        )
        .end(buffer);
    },
  );

  if (!uploadResult.secure_url || !uploadResult.public_id) {
    throw new Error("Cloudinary did not return the uploaded image URL.");
  }

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
}

async function fetchTemplateImage(
  templateImageValue: string,
  request: Request,
): Promise<{ buffer: Buffer; mimeType: string }> {
  let templateUrl: URL;
  const requestUrl = new URL(request.url);

  try {
    templateUrl = new URL(templateImageValue, requestUrl.origin);
  } catch {
    throw new RequestError("The template image URL is invalid.");
  }

  // Template inputs currently live in the app's public /ai-template-images folder.
  // Restrict this fetch to the same origin and exact static path to prevent SSRF.
  if (
    templateUrl.origin !== requestUrl.origin ||
    !templateUrl.pathname.startsWith("/ai-template-images/")
  ) {
    throw new RequestError("The selected template image URL is not allowed.", 403);
  }

  const response = await fetch(templateUrl, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new RequestError(
      `Could not retrieve the selected template image (${response.status}).`,
      422,
    );
  }

  const mimeType = (response.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
    throw new RequestError("The selected template must be JPEG, PNG, WebP or GIF.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new RequestError("The selected template image is empty or larger than 15 MB.");
  }

  return { buffer, mimeType };
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value !== "string" &&
      typeof value.arrayBuffer === "function" &&
      typeof value.size === "number",
  );
}

function submissionResponse(job: { _id: unknown; status: string }) {
  return NextResponse.json(
    {
      success: true,
      job: {
        id: String(job._id),
        status: job.status,
      },
    },
    { status: 202 },
  );
}

async function destroyTemporaryAsset(publicId: string | null | undefined) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("Failed to clean up temporary AI image input:", error);
  }
}

export async function POST(request: Request) {
  const access = await requireActiveSubscription(request);
  if (!access.ok) return access.response;

  const userId = access.userId;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  let temporarySourcePublicId = "";
  let temporaryTemplatePublicId = "";
  let idempotencyKey = "";

  try {
    await connectDB();
    configureCloudinary();

    const formData = await request.formData();
    const promptValue = formData.get("prompt");
    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";

    if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
      throw new RequestError(
        `Prompt is required and must not exceed ${MAX_PROMPT_LENGTH} characters.`,
      );
    }

    idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      (typeof formData.get("idempotencyKey") === "string"
        ? String(formData.get("idempotencyKey")).trim()
        : "") ||
      randomUUID();

    if (idempotencyKey.length > 256) {
      throw new RequestError("Idempotency key must not exceed 256 characters.");
    }

    const existingJob = await AIImageJob.findOne({
      userId: userObjectId,
      idempotencyKey,
    }).select("_id status");

    if (existingJob) return submissionResponse(existingJob);

    const sourceValue = formData.get("source");
    const source: AIImageJobSource =
      sourceValue === "ai-template"
        ? "ai-template"
        : sourceValue === "bulk-photo-edit"
          ? "bulk-photo-edit"
          : "ai-editor";

    const sourceImageEntry = formData.get("image");
    let sourceImageUrl = "";

    if (isUploadedFile(sourceImageEntry)) {
      const sourceMimeType = sourceImageEntry.type.toLowerCase().split(";")[0].trim();
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(sourceMimeType)) {
        throw new RequestError("Source image must be JPEG, PNG, WebP or GIF.");
      }
      if (!sourceImageEntry.size || sourceImageEntry.size > MAX_IMAGE_BYTES) {
        throw new RequestError("Source image is empty or exceeds 15 MB.");
      }

      const sourceBuffer = Buffer.from(await sourceImageEntry.arrayBuffer());
      const uploaded = await uploadImageBuffer(
        sourceBuffer,
        `${CLOUDINARY_ROOT}/${userId}/ai-job-inputs`,
      );
      sourceImageUrl = uploaded.url;
      temporarySourcePublicId = uploaded.publicId;
    } else {
      const imageUrlValue = formData.get("imageUrl");
      const imageUrl =
        typeof imageUrlValue === "string" ? imageUrlValue.trim() : "";

      if (!imageUrl) throw new RequestError("No source image was provided.");
      await assertOwnedImageUrl(imageUrl, userId);
      sourceImageUrl = imageUrl;
    }

    let templateImageUrl = "";
    if (source === "ai-template") {
      const templateValue = formData.get("templateImage");
      if (typeof templateValue !== "string" || !templateValue.trim()) {
        throw new RequestError("No template image was provided.");
      }

      const template = await fetchTemplateImage(templateValue.trim(), request);
      const uploadedTemplate = await uploadImageBuffer(
        template.buffer,
        `${CLOUDINARY_ROOT}/${userId}/ai-job-inputs/templates`,
      );
      templateImageUrl = uploadedTemplate.url;
      temporaryTemplatePublicId = uploadedTemplate.publicId;
    }

    let job;
    try {
      job = await AIImageJob.create({
        userId: userObjectId,
        operation: source === "ai-template" ? "template-edit" : "edit-image",
        source,
        status: "queued",
        idempotencyKey,
        prompt,
        sourceImageUrl,
        temporarySourcePublicId,
        templateImageUrl,
        temporaryTemplatePublicId,
        attempts: 0,
      });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        const duplicate = await AIImageJob.findOne({
          userId: userObjectId,
          idempotencyKey,
        }).select("_id status");
        if (duplicate) {
          await Promise.all([
            destroyTemporaryAsset(temporarySourcePublicId),
            destroyTemporaryAsset(temporaryTemplatePublicId),
          ]);
          temporarySourcePublicId = "";
          temporaryTemplatePublicId = "";
          return submissionResponse(duplicate);
        }
      }
      throw error;
    }

    let messageId: string;
    try {
      messageId = await enqueueAIImageJob(String(job._id));
    } catch (error) {
      await AIImageJob.deleteOne({ _id: job._id }).catch(() => {});
      await Promise.all([
        destroyTemporaryAsset(temporarySourcePublicId),
        destroyTemporaryAsset(temporaryTemplatePublicId),
      ]);
      temporarySourcePublicId = "";
      temporaryTemplatePublicId = "";
      console.error("AI image queue publish failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Could not submit the generation job. Please try again.",
        },
        { status: 503 },
      );
    }

    // Queue publishing succeeded; saving its message ID is helpful for support,
    // but a metadata-write failure must not turn an accepted job into a failure.
    void AIImageJob.updateOne(
      { _id: job._id },
      { $set: { queueMessageId: messageId } },
    ).catch((error) => {
      console.error("Could not store AI queue message ID:", error);
    });

    temporarySourcePublicId = "";
    temporaryTemplatePublicId = "";
    return submissionResponse(job);
  } catch (error) {
    await Promise.all([
      destroyTemporaryAsset(temporarySourcePublicId),
      destroyTemporaryAsset(temporaryTemplatePublicId),
    ]);

    if (error instanceof RequestError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("AI image job submission error:", error);
    return NextResponse.json(
      { success: false, error: "Could not create the generation job." },
      { status: 500 },
    );
  }
}
