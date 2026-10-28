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
        const safeName = String(user.fullName || "there").replace(/[&<>"']/g, (character) => {
          if (character === "&") return "&amp;";
          if (character === "<") return "&lt;";
          if (character === ">") return "&gt;";
          if (character === '"') return "&quot;";
          return "&#39;";
        });
        const emailHTML = `
          <div style="margin:0;padding:32px 12px;background:#f5f7ff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e7eaf3;border-radius:22px;overflow:hidden;">
              <tr>
                <td style="padding:26px 28px 22px;background:#ffffff;border-bottom:1px solid #eef0f7;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td valign="middle" style="width:44px;height:44px;border-radius:13px;background:#4f46e5;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);color:#ffffff;text-align:center;font-size:15px;font-weight:800;">SL</td>
                    <td valign="middle" style="padding-left:12px;">
                      <div style="font-size:21px;line-height:1.15;font-weight:800;letter-spacing:-.6px;color:#111827;">সেবা <span style="color:#4f46e5;">লাগবে</span></div>
                      <div style="margin-top:5px;font-size:9px;font-weight:700;letter-spacing:2px;color:#94a3b8;">ডিজিটাল সেবা</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr><td style="padding:30px 28px 28px;">
                <div style="display:inline-block;margin-bottom:16px;padding:7px 11px;border:1px solid #dbeafe;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;">ACCOUNT SECURITY</div>
                <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25;letter-spacing:-.5px;color:#111827;">Reset your password</h1>
                <p style="margin:0 0 10px;font-size:14px;line-height:1.75;color:#475569;">Hello ${safeName},</p>
                <p style="margin:0;font-size:14px;line-height:1.75;color:#475569;">Use this one-time code to securely reset your Seba Lagbe password.</p>
                <div style="margin:24px 0;padding:23px 12px;text-align:center;border:1px solid #e0e7ff;border-radius:16px;background:#f5f3ff;">
                  <div style="margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:2px;color:#64748b;">YOUR 6-DIGIT CODE</div>
                  <div style="font-size:34px;line-height:1.2;font-weight:800;letter-spacing:9px;color:#4f46e5;">${otpCode}</div>
                </div>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:#64748b;">This code expires in <strong style="color:#334155;">5 minutes</strong>. Never share it with anyone.</p>
                <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">If you did not request a password reset, no action is needed and your password will remain unchanged.</p>
              </td></tr>
              <tr><td style="padding:17px 28px;background:#f8fafc;border-top:1px solid #eef0f7;font-size:11px;line-height:1.6;color:#94a3b8;">© ${new Date().getFullYear()} Seba Lagbe · Your everyday digital workspace</td></tr>
            </table>
          </div>
        `;

        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            subject: `${otpCode} is your Seba Lagbe password reset code`,
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
