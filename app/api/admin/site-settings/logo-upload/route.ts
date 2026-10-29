import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ success: false, message: "Logo upload needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET configured on the server. You can still use an existing image URL." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Choose an image file first." }, { status: 400 });
    }
    if (!new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]).has(file.type)) {
      return NextResponse.json({ success: false, message: "Use a PNG, JPG, WEBP or AVIF image." }, { status: 415 });
    }
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "The logo image must be smaller than 5 MB." }, { status: 413 });
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: "seba-lagbe/site-branding",
        resource_type: "image",
        use_filename: false,
        unique_filename: true,
      }, (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      }).end(buffer);
    });

    if (!result?.secure_url) throw new Error("Cloudinary did not return an image URL.");
    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error("Admin logo upload failed:", error);
    return NextResponse.json({ success: false, message: "Logo upload failed. Please try again or use an image URL." }, { status: 500 });
  }
}
