import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

function detectOs(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/linux/i.test(ua)) return "Linux";
  return "";
}

function detectBrowser(ua: string): string {
  if (/edg(e|a|ios)?\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "";
}

function detectDeviceType(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "Mobile";
  return "Computer";
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "";
  return ip.replace(/^::ffff:/, "");
}

function getLocation(req: Request): string {
  const city = req.headers.get("x-vercel-ip-city");
  const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "";
  let cityName = city || "";
  try { cityName = decodeURIComponent(cityName); } catch { /* keep raw */ }
  return [cityName, country].filter(Boolean).join(", ");
}

/**
 * Lists the devices signed in to this account.
 * Login is single-device (every login bumps sessionVersion and signs out all other
 * devices), so the only valid session is the one making this request. The device
 * details are read from this request; login/last-active times come from the user record.
 */
export async function GET(req: Request) {
  const session = await getVerifiedRequestSession(req);
  if (!session) {
    return NextResponse.json({ message: "Please sign in again." }, { status: 401, headers: NO_STORE });
  }

  const ua = req.headers.get("user-agent") || "";
  const os = detectOs(ua);
  const browser = detectBrowser(ua);
  const type = detectDeviceType(ua);

  let loginAt: string | undefined;
  let lastActive: string | undefined = new Date().toISOString();

  if (!session.isRootAdmin) {
    try {
      await connectDB();
      const user = await User.findById(session.userId).select("lastLoginAt lastSeenAt").lean<{ lastLoginAt?: Date; lastSeenAt?: Date }>();
      if (user?.lastLoginAt) loginAt = new Date(user.lastLoginAt).toISOString();
      if (user?.lastSeenAt) lastActive = new Date(user.lastSeenAt).toISOString();
    } catch (error) {
      console.error("[user-devices] Could not load login times:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  const device = {
    id: "current",
    deviceName: [type, os].filter(Boolean).join(" • ") || "Unknown device",
    browser,
    ipAddress: getClientIp(req),
    location: getLocation(req),
    loginAt,
    lastActive,
    current: true,
  };

  return NextResponse.json(
    { devices: [device], singleDeviceLogin: true },
    { headers: NO_STORE },
  );
}
