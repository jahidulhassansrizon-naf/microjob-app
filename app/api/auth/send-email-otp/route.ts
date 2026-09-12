import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, phoneNumber, country, identifier } = body;

    // ইমেইল অথবা আইডেন্টিফায়ার চেক করা
    const targetEmail =
      email || (identifier && identifier.includes("@") ? identifier : null);

    if (!targetEmail) {
      return NextResponse.json(
        { message: "Email address or valid identifier is required!" },
        { status: 400 },
      );
    }

    const cleanEmail = targetEmail.toString().toLowerCase().trim();
    const cleanPhone = phoneNumber ? phoneNumber.toString().trim() : "";
    const finalIdentifier = identifier
      ? identifier.toString().trim()
      : cleanEmail;

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already registered!" },
        { status: 400 },
      );
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // ডাটাবেজে সেভ করার সময় identifier ফিল্ডটি যুক্ত করে দেওয়া হলো যাতে ValidatorError না আসে
    await Otp.deleteMany({
      $or: [{ email: cleanEmail }, { identifier: finalIdentifier }],
    });

    await Otp.create({
      email: cleanEmail,
      phoneNumber: cleanPhone,
      identifier: finalIdentifier,
      otp: otpCode,
    });

    console.log(`========================================`);
    console.log(`[DEV MODE] OTP for ${finalIdentifier} is: ${otpCode}`);
    console.log(`========================================`);

    if (GOOGLE_SCRIPT_URL) {
      try {
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #FF5D00; margin-bottom: 10px;">SohozKaj Email Verification</h2>
            <p style="color: #333; font-size: 14px;">Hello,</p>
            <p style="color: #555; font-size: 14px;">Your verification code for SohozKaj account registration is:</p>
            <div style="background-color: #fff3ec; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #FF5D00; letter-spacing: 6px; font-size: 32px; margin: 0;">${otpCode}</h1>
            </div>
            <p style="color: #777; font-size: 12px;">This code is valid for 5 minutes. Do not share this code with anyone.</p>
          </div>
        `;

        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            subject: `${otpCode} is your SohozKaj verification code`,
            html: emailHTML,
          }),
        });
      } catch (scriptErr) {
        console.error(
          "Google Script fetch error (ignored for fallback):",
          scriptErr,
        );
      }
    }

    return NextResponse.json(
      { message: `OTP sent successfully to ${finalIdentifier}` },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("API send-email-otp error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
