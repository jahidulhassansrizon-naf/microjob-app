import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
import { ENV_ADMIN_USER_ID, type AdminTokenClaims } from "@/lib/adminCredentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

type AdminPageClaims = AdminTokenClaims & { userId?: string; sessionVersion?: number };

export default async function AdminPage() {
  const secret = process.env.JWT_SECRET;
  const token = (await cookies()).get("token")?.value;
  if (!secret?.trim() || !token) redirect("/login?redirect=%2Fadmin");

  let decoded: AdminPageClaims;
  try {
    decoded = jwt.verify(token, secret) as AdminPageClaims;
  } catch {
    redirect("/login?redirect=%2Fadmin");
  }

  if (decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID) {
    redirect("/login?redirect=%2Fadmin");
  }

  if (typeof decoded.userId !== "string" || !mongoose.isValidObjectId(decoded.userId)) {
    redirect("/dashboard");
  }

  let databaseAdmin: { role?: string; sessionVersion?: number } | null = null;
  try {
    await connectDB();
    databaseAdmin = await User.findById(decoded.userId).select("role sessionVersion").lean();
  } catch {
    redirect("/login?redirect=%2Fadmin");
  }

  if (!databaseAdmin || databaseAdmin.role !== "admin") redirect("/dashboard");
  if (Number(decoded.sessionVersion || 0) !== Number(databaseAdmin.sessionVersion || 0)) {
    redirect("/login?redirect=%2Fadmin");
  }

  return <AdminDashboardClient />;
}
