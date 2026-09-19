import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function decodeBase64Image(dataUrl: string): Buffer {
  const parts = dataUrl.split(",");

  if (parts.length !== 2) {
    throw new Error("Invalid image data.");
  }

  return Buffer.from(parts[1], "base64");
}

function uploadToCloudinary(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "sohozkaj-ai-photos",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary returned no upload result."));
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
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;

    if (contentType.includes("application/json")) {
      const body = await req.json();

      const image = typeof body?.image === "string" ? body.image.trim() : "";

      if (!image) {
        return NextResponse.json(
          {
            success: false,
            error: "No image provided.",
            message: "No image provided.",
          },
          { status: 400 },
        );
      }

      if (image.startsWith("http://") || image.startsWith("https://")) {
        const result = await cloudinary.uploader.upload(image, {
          folder: "sohozkaj-ai-photos",
          resource_type: "image",
        });

        return NextResponse.json({
          success: true,
          url: result.secure_url,
          imageUrl: result.secure_url,
          publicId: result.public_id || null,
        });
      }

      if (!image.startsWith("data:")) {
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported image format.",
            message: "Unsupported image format.",
          },
          { status: 400 },
        );
      }

      buffer = decodeBase64Image(image);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: "No image file provided.",
            message: "No image file provided.",
          },
          { status: 400 },
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected file is not an image.",
            message: "Selected file is not an image.",
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();

      buffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported request content type.",
          message: "Unsupported request content type.",
        },
        { status: 415 },
      );
    }

    if (!buffer.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Image data is empty.",
          message: "Image data is empty.",
        },
        { status: 400 },
      );
    }

    const result = await uploadToCloudinary(buffer);

    if (!result?.secure_url) {
      throw new Error("Cloudinary did not return an image URL.");
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      imageUrl: result.secure_url,
      publicId: result.public_id || null,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    const message =
      error instanceof Error ? error.message : "Image upload failed.";

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
