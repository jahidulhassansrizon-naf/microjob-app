import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

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

async function uploadBuffer(buffer: Buffer) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "sohozkaj-ai-photos",
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
  try {
    getCloudinaryConfig();

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

      if (image.startsWith("data:")) {
        buffer = getBase64Buffer(image);
      } else if (/^https?:\/\//i.test(image)) {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: "sohozkaj-ai-photos",
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

    const uploadResult = await uploadBuffer(buffer);
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
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Image upload failed.",
      },
      { status: 500 },
    );
  }
}
