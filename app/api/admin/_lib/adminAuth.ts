import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  getAdminCredentials,
  isCurrentAdminToken,
  type AdminTokenClaims,
} from "@/lib/adminCredentials";

const JWT_SECRET = process.env.JWT_SECRET || "";

function getToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice("Bearer ".length).trim();
    if (bearer) return bearer;
  }
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice("token=".length)); }
  catch { return pair.slice("token=".length); }
}

export type AdminIdentity = { id: string; fullName: string; email: string; phoneNumber: string };

export async function requireAdmin(request: Request): Promise<{
  admin: AdminIdentity | null;
  response: NextResponse | null;
}> {
  const configured = getAdminCredentials();
  if (!configured.email || !configured.password) {
    return {
      admin: null,
      response: NextResponse.json(
        { success: false, code: "ADMIN_CREDENTIALS_NOT_CONFIGURED", message: "Set ADMIN_EMAIL and ADMIN_PASSWORD in the server environment." },
        { status: 503 },
      ),
    };
  }
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET?.trim()) {
    return {
      admin: null,
      response: NextResponse.json(
        { success: false, code: "JWT_SECRET_NOT_CONFIGURED", message: "Set a strong JWT_SECRET in the server environment before enabling admin access." },
        { status: 503 },
      ),
    };
  }

  const token = getToken(request);
  if (!token) {
    return { admin: null, response: NextResponse.json({ success: false, message: "Please log in to continue." }, { status: 401 }) };
  }

  let decoded: AdminTokenClaims;
  try { decoded = jwt.verify(token, JWT_SECRET) as AdminTokenClaims; }
  catch {
    return { admin: null, response: NextResponse.json({ success: false, message: "Your login session is invalid or expired." }, { status: 401 }) };
  }

  if (!isCurrentAdminToken(decoded)) {
    return { admin: null, response: NextResponse.json({ success: false, message: "You do not have permission to access the admin area." }, { status: 403 }) };
  }

  return {
    admin: { id: "env-admin", fullName: configured.fullName, email: configured.email, phoneNumber: "" },
    response: null,
  };
}
