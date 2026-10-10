import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
import {
  isCurrentAdminToken,
  type AdminTokenClaims,
} from "@/lib/adminCredentials";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const secret = process.env.JWT_SECRET;
  const token = (await cookies()).get("token")?.value;

  if (!secret?.trim() || !token) {
    redirect("/login?redirect=%2Fadmin");
  }

  let decoded: AdminTokenClaims;
  try {
    decoded = jwt.verify(token, secret) as AdminTokenClaims;
  } catch {
    redirect("/login?redirect=%2Fadmin");
  }

  if (!isCurrentAdminToken(decoded)) {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
