import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "Email, OTP code, and new password are required!" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long!" },
        { status: 400 },
      );
    }

    const cleanEmail = email.toString().toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const validOtp = await Otp.findOne({
      identifier: cleanEmail,
      otp: cleanOtp,
    });

    if (!validOtp) {
      return NextResponse.json(
        { message: "Invalid or expired OTP code!" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await Otp.deleteMany({ identifier: cleanEmail });

    return NextResponse.json(
      { message: "Password updated successfully!" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Reset Password API error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
