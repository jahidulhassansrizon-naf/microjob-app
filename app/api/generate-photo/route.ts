import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { hasActiveSubscription as hasActiveToolAccess } from "@/app/api/_lib/requireActiveSubscription";
import { requireToolAccess } from "@/app/api/_lib/requireActiveSubscription";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `sohozkaj-ai-photos/${userId}`,
            transformation: [{ width: 800, height: 800, crop: "limit" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("Cloudinary Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
