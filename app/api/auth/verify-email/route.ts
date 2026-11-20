import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { NO_STORE_HEADERS } from "@/app/api/_lib/otpSecurity";
import { getSiteOrigin, hashEmailForVerification, readEmailVerificationToken } from "@/app/api/_lib/emailVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function back(result: "1" | "invalid") {
  return NextResponse.redirect(`${getSiteOrigin()}/settings?emailVerified=${result}`, { status: 303, headers: NO_STORE_HEADERS });
}

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    const claim = readEmailVerificationToken(token);
    if (!claim) return back("invalid");

    await connectDB();
    const user = await User.findById(claim.userId).select("email").lean() as { email?: string } | null;
    if (!user?.email) return back("invalid");
    // The link is only valid for the exact e-mail it was issued for.
    if (hashEmailForVerification(user.email) !== claim.emailHash) return back("invalid");

    // Atomic guard: only flips the flag if the e-mail is still the one that was verified.
    await User.updateOne({ _id: claim.userId, email: user.email }, { $set: { isEmailVerified: true, emailVerifiedAt: new Date() } });
    return back("1");
  } catch (error) {
    console.error("[auth-email] Verification confirm failed:", error instanceof Error ? error.message : "Unknown error");
    return back("invalid");
  }
}
