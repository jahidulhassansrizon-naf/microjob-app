import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ENV_ADMIN_USER_ID } from "@/lib/adminCredentials";

const JWT_SECRET = process.env.JWT_SECRET || "";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized access. Please login again." },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token payload." },
        { status: 401 },
      );
    }

    if (decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID) {
      return NextResponse.json(
        { error: "The administrator password is managed through the server's ADMIN_PASSWORD environment variable." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current and new password are required." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    // ডাটাবেস থেকে ইউজার খুঁজে বের করা
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // কারেন্ট পাসওয়ার্ডের সাথে ডাটাবেসের হ্যাশ পাসওয়ার্ড মিলানো
    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: "Current password does not match." },
        { status: 400 },
      );
    }

    // নতুন পাসওয়ার্ড হ্যাশ করে আপডেট করা
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully!" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Something went wrong while updating password.",
      },
      { status: 500 },
    );
  }
}
