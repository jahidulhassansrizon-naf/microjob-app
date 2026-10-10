import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { setSubscriptionAccessCookie } from "../../_lib/requireActiveSubscription";
import {
  ENV_ADMIN_USER_ID,
  getAdminCredentialVersion,
  getAdminCredentials,
  isConfiguredAdminEmail,
  safeSecretEquals,
} from "@/lib/adminCredentials";

const JWT_SECRET = process.env.JWT_SECRET || "";

function loginCookie(response: NextResponse, token: string) {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !JWT_SECRET.trim()) {
      return NextResponse.json(
        { message: "Secure authentication is not configured on the server." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const submittedIdentifier = body?.phoneNumber ?? body?.identifier ?? body?.email ?? "";
    const formattedInput = submittedIdentifier ? String(submittedIdentifier).trim().toLowerCase() : "";
    const submittedPassword = typeof body?.password === "string" ? body.password : "";

    // The single configured admin is authenticated from server-only environment
    // credentials. No database user/signup is required, and normal users cannot
    // acquire admin privileges by setting an email or a browser role.
    const admin = getAdminCredentials();
    if (admin.email && isConfiguredAdminEmail(formattedInput)) {
      if (!admin.password) {
        return NextResponse.json(
          { message: "Administrator login is not configured on the server." },
          { status: 503 },
        );
      }
      if (!safeSecretEquals(submittedPassword, admin.password)) {
        return NextResponse.json({ message: "Invalid email or password." }, { status: 400 });
      }

      const token = jwt.sign(
        {
          userId: ENV_ADMIN_USER_ID,
          email: admin.email,
          role: "admin",
          admin: true,
          adminCredentialVersion: getAdminCredentialVersion(admin.email, admin.password),
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );
      const response = NextResponse.json(
        {
          message: "Login successful!",
          // Admin JWT is only sent as an HttpOnly cookie; never expose it to JS/localStorage.
          user: {
            id: ENV_ADMIN_USER_ID,
            fullName: admin.fullName,
            phoneNumber: "",
            email: admin.email,
            role: "admin",
            profileImageUrl: "",
            profileImagePublicId: "",
          },
        },
        { status: 200 },
      );
      loginCookie(response, token);
      return response;
    }

    // Existing database-backed login flow for ordinary users remains intact.
    await connectDB();
    const user = await User.findOne({
      $or: [{ phoneNumber: submittedIdentifier }, { email: formattedInput }],
    });

    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(submittedPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid password!" }, { status: 400 });
    }

    const role = "user" as const;
    const loginAt = new Date();
    await User.updateOne(
      { _id: user._id },
      {
        $set: { role, lastLoginAt: loginAt, lastSeenAt: loginAt },
        $inc: { loginCount: 1 },
      },
    );

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
          role,
          lastLoginAt: loginAt,
          loginCount: Number(user.loginCount || 0) + 1,
        },
      },
      { status: 200 },
    );

    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: new Date() },
    })
      .sort({ expiresAt: -1, startedAt: -1 })
      .select("expiresAt")
      .lean();

    loginCookie(response, token);
    if (activeSubscription?.expiresAt) {
      setSubscriptionAccessCookie(response, String(user._id), activeSubscription.expiresAt);
    }

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
