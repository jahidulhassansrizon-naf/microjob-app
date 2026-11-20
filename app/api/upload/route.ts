import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireActiveSubscription } from "../_lib/requireActiveSubscription";
import {
  UserFacingError,
  assertFileSizeOk,
  assertRequestSizeOk,
  isTrustedImageUrl,
  MAX_UPLOAD_BYTES,
} from "@/lib/safeRemoteImage";

export const runtime = "nodejs";

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

function getBase64Buffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  return Buffer.from(match[2], "base64");
}

async function uploadBuffer(buffer: Buffer, folder: string) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        },
      )
      .end(buffer);
  });
}

export async function POST(req: Request) {
  const access = await requireActiveSubscription(req);
  if (!access.ok) return access.response;

  try {
    // Reject obviously oversized uploads before reading them into memory.
    assertRequestSizeOk(req);

    getCloudinaryConfig();

    const userFolder = `sohozkaj-ai-photos/${access.userId}`;
    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const image = typeof body?.image === "string" ? body.image : "";

      if (!image) {
        return NextResponse.json(
          { success: false, error: "No image provided." },
          { status: 400 },
        );
      }

      // A base64 string is about 1.37x bigger than the file it holds.
      if (image.length > MAX_UPLOAD_BYTES * 1.4) {
        assertFileSizeOk(MAX_UPLOAD_BYTES + 1);
      }

      if (image.startsWith("data:")) {
        buffer = getBase64Buffer(image);
      } else if (/^https?:\/\//i.test(image)) {
        // Cloudinary downloads this link itself and keeps a copy in our account, so only
        // images that already live on this site or on Cloudinary are accepted.
        const trustedUrl = isTrustedImageUrl(image, req.url);
        if (!trustedUrl) {
          return NextResponse.json(
            { success: false, error: "Only images from this site can be uploaded by link." },
            { status: 400 },
          );
        }

        const uploadResult = await cloudinary.uploader.upload(trustedUrl.toString(), {
          folder: userFolder,
          resource_type: "image",
        });

        return NextResponse.json({
          success: true,
          url: uploadResult.secure_url,
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id || null,
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Unsupported image format." },
          { status: 400 },
        );
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: "No image file provided." },
          { status: 400 },
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Only image files are supported." },
          { status: 400 },
        );
      }

      assertFileSizeOk(file.size);

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported request content type." },
        { status: 415 },
      );
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Image data is empty." },
        { status: 400 },
      );
    }

    assertFileSizeOk(buffer.length);

    const uploadResult = await uploadBuffer(buffer, userFolder);
    const imageUrl = uploadResult?.secure_url;

    if (!imageUrl) {
      throw new Error("Cloudinary did not return an image URL.");
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      imageUrl,
      publicId: uploadResult.public_id || null,
    });
  } catch (error: unknown) {
    // The real error stays in the server log; the user only gets a safe message.
    console.error("Cloudinary upload error:", error);

    if (error instanceof UserFacingError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { success: false, error: "Image upload failed. Please try again." },
      { status: 500 },
    );
  }
}
