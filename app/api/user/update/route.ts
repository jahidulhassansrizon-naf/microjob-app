import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "";

const ALLOWED_FIELDS = [
  "fullName",
  "phoneNumber",
  "email",
  "country",
  "district",
  "profession",
  "gender",
  "dob",
  "address",
  "thana",
  "postcode",
  "about",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

async function updateProfile(req: Request) {
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

    // 5. Only allow profile fields
    const updateData: Partial<Record<AllowedField, string>> = {};

    for (const field of ALLOWED_FIELDS) {
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
        { message: "No profile data provided!" },
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

    // 8. User not found
    if (!updatedUser) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    // 9. Success
    return NextResponse.json(
      {
        message: "Profile updated successfully!",
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);

    // Duplicate email / phone error
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return NextResponse.json(
        {
          message: `${duplicateField || "Email or phone number"} already exists!`,
        },
        { status: 409 },
      );
    }

    // JWT error
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError"
    ) {
      return NextResponse.json(
        {
          message: "Invalid or expired token!",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to update your profile",
        error: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  return updateProfile(req);
}

export async function PATCH(req: Request) {
  return updateProfile(req);
}
