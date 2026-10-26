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
          <div style="margin:0;padding:32px 12px;background:#f5f7ff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e7eaf3;border-radius:22px;overflow:hidden;">
              <tr>
                <td style="padding:26px 28px 22px;background:#ffffff;border-bottom:1px solid #eef0f7;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td valign="middle" style="width:44px;height:44px;border-radius:13px;background:#4f46e5;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);color:#ffffff;text-align:center;font-size:15px;font-weight:800;">SS</td>
                    <td valign="middle" style="padding-left:12px;">
                      <div style="font-size:21px;line-height:1.15;font-weight:800;letter-spacing:-.6px;color:#111827;">Studio <span style="color:#4f46e5;">Seba</span></div>
                      <a href="https://sohojhub.vercel.app/" style="display:inline-block;margin-top:5px;font-size:9px;font-weight:700;letter-spacing:0;color:#94a3b8;text-decoration:none;">STUDIO SEBA</a>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr><td style="padding:30px 28px 28px;">
                <div style="display:inline-block;margin-bottom:16px;padding:7px 11px;border:1px solid #dbeafe;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;">SECURE EMAIL VERIFICATION</div>
                <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25;letter-spacing:-.5px;color:#111827;">Verify your email</h1>
                <p style="margin:0 0 10px;font-size:14px;line-height:1.75;color:#475569;">Hello,</p>
                <p style="margin:0;font-size:14px;line-height:1.75;color:#475569;">Use this one-time code to finish creating your Studio Seba account.</p>
                <div style="margin:24px 0;padding:23px 12px;text-align:center;border:1px solid #e0e7ff;border-radius:16px;background:#f5f3ff;">
                  <div style="margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:2px;color:#64748b;">YOUR 6-DIGIT CODE</div>
                  <div style="font-size:34px;line-height:1.2;font-weight:800;letter-spacing:9px;color:#4f46e5;">${otpCode}</div>
                </div>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:#64748b;">This code expires in <strong style="color:#334155;">5 minutes</strong>. For your security, never share it with anyone.</p>
                <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">If you did not try to create a Studio Seba account, you can safely ignore this email.</p>
              </td></tr>
              <tr><td style="padding:17px 28px;background:#f8fafc;border-top:1px solid #eef0f7;font-size:11px;line-height:1.6;color:#94a3b8;">© ${new Date().getFullYear()} Studio Seba · Your everyday digital workspace</td></tr>
            </table>
          </div>
        `;

        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            subject: `${otpCode} is your Studio Seba verification code`,
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
