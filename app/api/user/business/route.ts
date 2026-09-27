import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

const ALLOWED_BUSINESS_FIELDS = [
  "businessName",
  "businessType",
  "tradeLicense",
  "businessPhone",
  "businessAddress",
  "website",
] as const;

type AllowedBusinessField = (typeof ALLOWED_BUSINESS_FIELDS)[number];

async function updateBusinessInfo(req: Request) {
  try {
    await connectDB();

    // 1. Get Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "No token provided!" },
        { status: 401 },
      );
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json({ message: "Invalid token!" }, { status: 401 });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
    };

    if (!decoded.userId) {
      return NextResponse.json(
        { message: "Invalid token payload!" },
        { status: 401 },
      );
    }

    // 4. Read request body
    const body = await req.json();

    // 5. Only allow business fields
    const updateData: Partial<Record<AllowedBusinessField, string>> = {};

    for (const field of ALLOWED_BUSINESS_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] =
          typeof body[field] === "string"
            ? body[field].trim()
            : String(body[field]);
      }
    }

    // 6. Check if there is anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No business data provided!" },
        { status: 400 },
      );
    }

    // 7. Update user
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    // 8. Extract business object
    const businessObj = {
      businessName: updatedUser.businessName || "",
      businessType: updatedUser.businessType || "",
      tradeLicense: updatedUser.tradeLicense || "",
      businessPhone: updatedUser.businessPhone || "",
      businessAddress: updatedUser.businessAddress || "",
      website: updatedUser.website || "",
    };

    // 9. Success response
    return NextResponse.json(
      {
        message: "Business information updated successfully!",
        business: businessObj,
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("BUSINESS UPDATE ERROR:", error);

    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError"
    ) {
      return NextResponse.json(
        { message: "Invalid or expired token!" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to update business information.",
        error: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  return updateBusinessInfo(req);
}

export async function PATCH(req: Request) {
  return updateBusinessInfo(req);
}
