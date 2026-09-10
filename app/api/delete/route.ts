import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 },
      );
    }

    // Cloudinary URL থেকে public_id বের করার লজিক
    const splitUrl = imageUrl.split("/");
    const uploadIndex = splitUrl.indexOf("upload");

    if (uploadIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Invalid Cloudinary URL" },
        { status: 400 },
      );
    }

    // upload/ এর পরের অংশ নেওয়া (ভার্সন নাম্বার থাকলে বাদ দেওয়া)
    const pathAfterUpload = splitUrl.slice(uploadIndex + 1);
    if (pathAfterUpload[0] && pathAfterUpload[0].startsWith("v")) {
      pathAfterUpload.shift(); // e.g. 'v17123456' বাদ দেবে
    }

    const fullPathWithExt = pathAfterUpload.join("/");
    const publicId = fullPathWithExt.substring(
      0,
      fullPathWithExt.lastIndexOf("."),
    );

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "Could not parse public_id" },
        { status: 400 },
      );
    }

    // Cloudinary থেকে ডিলিট করা
    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Cloudinary Delete Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
