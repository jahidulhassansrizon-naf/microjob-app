import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import { sendTransactionalEmail } from "@/app/api/_lib/emailDelivery";
import { renderVerifyLinkEmail } from "@/app/api/_lib/emailTemplates";
import { claimAuthCooldown, enforceAuthRateLimit, releaseAuthCooldown } from "@/app/api/_lib/authRateLimit";
import { NO_STORE_HEADERS } from "@/app/api/_lib/otpSecurity";
import { createEmailVerificationToken, getSiteOrigin } from "@/app/api/_lib/emailVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOLDOWN_MS = 60 * 1000;

function json(body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE_HEADERS, ...extra } });
}

export async function POST(req: Request) {
  let lease: string | null = null;
  let cooldownId = "";
  try {
    const session = await getVerifiedRequestSession(req);
    if (!session) return json({ message: "Invalid or expired session." }, 401);
    if (session.isRootAdmin) return json({ message: "The Main Admin email is managed from server settings." }, 403);

    await connectDB();
    const user = await User.findById(session.userId).select("email fullName isEmailVerified").lean() as
      { email?: string; fullName?: string; isEmailVerified?: boolean } | null;
    if (!user?.email) return json({ message: "No email address is available for verification." }, 404);
    if (user.isEmailVerified === true) return json({ message: "Your email is already verified.", alreadyVerified: true });

    const hourly = await enforceAuthRateLimit(req, "verify-email-hourly", 5, 60 * 60 * 1000, session.userId);
    if (!hourly.allowed) {
      return json({ message: "Too many verification emails requested. Please try again later.", retryAfterSeconds: hourly.retryAfterSeconds }, 429, { "Retry-After": String(hourly.retryAfterSeconds) });
    }
    cooldownId = session.userId;
    const cooldown = await claimAuthCooldown("verify-email", cooldownId, COOLDOWN_MS);
    if (!cooldown.allowed) {
      return json({ message: "A verification email was sent recently. Please wait a little before trying again.", retryAfterSeconds: cooldown.retryAfterSeconds }, 429, { "Retry-After": String(cooldown.retryAfterSeconds) });
    }
    const leaseToken = cooldown.leaseToken;
    lease = leaseToken;

    const token = createEmailVerificationToken(session.userId, user.email);
    if (!token) {
      await releaseAuthCooldown("verify-email", cooldownId, leaseToken).catch(() => undefined);
      return json({ message: "Email verification is not configured on the server." }, 503);
    }
    const link = `${getSiteOrigin()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    try {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Verify your email - Seba Lagbe",
        html: renderVerifyLinkEmail({ name: user.fullName, link, expiresMinutes: 30 }),
        text: `Hello ${String(user.fullName || "").slice(0, 100)}. Open this link to verify your Seba Lagbe email (valid for 30 minutes): ${link}`,
      });
      lease = null;
    } catch (error) {
      await releaseAuthCooldown("verify-email", cooldownId, leaseToken).catch(() => undefined);
      lease = null;
      console.error("[auth-email] Verification email delivery failed:", error instanceof Error ? error.message : "Unknown error");
      return json({ message: "We could not send the verification email right now. Please try again shortly." }, 502);
    }
    return json({ message: "Verification email sent. Please check your inbox and spam folder.", expiresInSeconds: 1800 });
  } catch (error) {
    if (lease && cooldownId) await releaseAuthCooldown("verify-email", cooldownId, lease).catch(() => undefined);
    console.error("[auth-email] Verification request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ message: "Could not process the verification request. Please try again." }, 500);
  }
}
