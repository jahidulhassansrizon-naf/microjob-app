import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required!" },
        { status: 400 },
      );
    }

    const cleanEmail = email.toString().toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email address!" },
        { status: 404 },
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ identifier: cleanEmail });

    await Otp.create({
      identifier: cleanEmail,
      otp: otpCode,
    });

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

    if (GOOGLE_SCRIPT_URL) {
      try {
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #FF5D00; margin-bottom: 10px;">SohozKaj Password Reset</h2>
            <p style="color: #333; font-size: 14px;">Hello ${user.fullName || "User"},</p>
            <p style="color: #555; font-size: 14px;">You requested to reset your password. Use the following OTP code to reset it:</p>
            <div style="background-color: #fff3ec; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #FF5D00; letter-spacing: 6px; font-size: 32px; margin: 0;">${otpCode}</h1>
            </div>
            <p style="color: #777; font-size: 12px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `;

        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            subject: `${otpCode} is your SohozKaj password reset OTP`,
            html: emailHTML,
          }),
        });
      } catch (scriptErr) {
        console.error("Google Script fetch error:", scriptErr);
      }
    }

    return NextResponse.json(
      { message: `Password reset OTP code sent to ${cleanEmail}` },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("API forgot-password error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
