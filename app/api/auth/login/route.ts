import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { phoneNumber, password } = await req.json();
    const formattedInput = phoneNumber ? String(phoneNumber).toLowerCase().trim() : "";

    const user = await User.findOne({
      $or: [{ phoneNumber: phoneNumber }, { email: formattedInput }],
    });

    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid password!" },
        { status: 400 },
      );
    }

    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response = NextResponse.json(
      {
        message: "Login successful!",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          district: user.district,
          country: user.country,
          profileImageUrl: user.profileImageUrl || "",
          profileImagePublicId: user.profileImagePublicId || "",
        },
      },
      { status: 200 },
    );

    // Keep an HttpOnly session cookie as well, so server-side subscription/payment
    // endpoints that read the token cookie continue to work alongside localStorage auth.
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: "Server error", error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
