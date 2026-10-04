import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const cookieHeader = request.headers.get("cookie");
  const pair = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return pair ? decodeURIComponent(pair.slice("token=".length)) : null;
}

function uploadProfileImage(
  buffer: Buffer,
  userId: string,
): Promise<UploadApiResponse> {
  const publicId = `sohozkaj/profile-images/${userId}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
          invalidate: true,
          use_filename: false,
          unique_filename: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed."));
            return;
          }

          resolve(result);
        },
      )
      .end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    await connectDB();
    getCloudinaryConfig();

    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 },
      );
    }

    let decoded: { userId?: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    } catch {
      return NextResponse.json(
        { success: false, message: "Your login session has expired." },
        { status: 401 },
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid login token." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please choose an image file." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, WEBP, or GIF images are supported.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Profile image must be 5 MB or smaller." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!buffer.length) {
      return NextResponse.json(
        { success: false, message: "The selected image is empty." },
        { status: 400 },
      );
    }

    const result = await uploadProfileImage(buffer, String(decoded.userId));
    const imageUrl = result.secure_url;
    const publicId = result.public_id;

    if (!imageUrl || !publicId) {
      throw new Error("Cloudinary did not return the profile image details.");
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        $set: {
          profileImageUrl: imageUrl,
          profileImagePublicId: publicId,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User account was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile photo updated successfully.",
      user: updatedUser,
      imageUrl,
      publicId,
    });
  } catch (error) {
    console.error("PROFILE IMAGE UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update profile photo.",
      },
      { status: 500 },
    );
  }
}
