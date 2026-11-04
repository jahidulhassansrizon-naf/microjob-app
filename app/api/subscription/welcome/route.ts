import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * One-time paid-access popups: "your paid tools are unlocked" (only right after a payment /
 * admin grant) and "your paid access has ended" (once, after the plan runs out).
 *
 * Every paid-access grant has a stable key:
 *   - a paid / approved subscription  -> "sub:<subscriptionId>"
 *   - an admin grant (manual access)  -> "admin:<manualAccessStartedAt>"
 * Expiry popups use the same keys prefixed with "expired:" and their own seen field.
 * The key of the last grant the user has closed the popup for is stored on the user
 * (paidAccessWelcomeSeenKey). While the current key differs from it, GET reports
 * show = true, on any page and any device. POST stores the key, so the popup never
 * comes back for that grant. A renewal / new payment / fresh admin grant creates a
 * new key, so the popup appears again exactly once for it.
 */

const JWT_SECRET = process.env.JWT_SECRET || "";
const SEEN_FIELD = "paidAccessWelcomeSeenKey";
const EXPIRED_SEEN_FIELD = "paidAccessExpiredSeenKey";
/**
 * The welcome popup is only for a grant that has JUST started (payment completed or an
 * admin grant). People who bought earlier and are already using the tools never see it.
 * Optional: set PAID_WELCOME_CUTOFF (ISO date, e.g. 2026-11-03) to also ignore every grant
 * that started before the day this feature went live.
 */
const WELCOME_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const WELCOME_CUTOFF_MS = (() => {
  const ms = new Date(process.env.PAID_WELCOME_CUTOFF || "").getTime();
  return Number.isFinite(ms) ? ms : 0;
})();
const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

type TokenClaims = { userId?: string; impersonation?: boolean; admin?: boolean };

function getToken(request: Request): string | null {
  const cookiePair = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  if (cookiePair) {
    const raw = cookiePair.slice("token=".length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice("Bearer ".length).trim() || null;
  return null;
}

function authenticate(request: Request): { userId: string; impersonating: boolean } | null {
  if (!JWT_SECRET.trim()) return null;
  const token = getToken(request);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenClaims;
    if (decoded.admin === true) return null; // the env admin has no personal subscription
    if (typeof decoded.userId !== "string" || !mongoose.isValidObjectId(decoded.userId)) return null;
    return { userId: decoded.userId, impersonating: decoded.impersonation === true };
  } catch {
    return null;
  }
}

function toMs(value: unknown): number {
  if (!value) return 0;
  const ms = new Date(value as string | number | Date).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

type Grant = { key: string; startedAtMs: number; expiresAtMs: number; months: number; planName?: string };

type GrantLookup = {
  /** Access that is active right now (null when the user has none). */
  grant: Grant | null;
  /** The most recent access that ended by running out (only set when `grant` is null). */
  expired: Grant | null;
  seenKey: string;
  expiredSeenKey: string;
  /** Database accounts with role = "admin" (sub-admins) never get paid-access popups. */
  isAdmin: boolean;
};

async function findCurrentGrant(userId: string): Promise<GrantLookup> {
  const now = Date.now();
  const nowDate = new Date(now);
  const objectId = new mongoose.Types.ObjectId(userId);

  const [subscription, expiredSubscription, user] = await Promise.all([
    Subscription.findOne({
      userId,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: nowDate },
    })
      .sort({ startedAt: -1, expiresAt: -1 })
      .select("_id months planName startedAt expiresAt createdAt")
      .lean(),
    // Paid plans that ended by running out (not refunded / admin-disabled ones).
    Subscription.findOne({
      userId,
      paymentStatus: "COMPLETED",
      $or: [
        { accessStatus: "EXPIRED" },
        { accessStatus: "ACTIVE", expiresAt: { $lte: nowDate } },
      ],
    })
      .sort({ expiresAt: -1 })
      .select("_id months planName startedAt expiresAt createdAt")
      .lean(),
    // Raw collection read: the "seen" fields are not part of the Mongoose schema.
    User.collection.findOne(
      { _id: objectId },
      {
        projection: {
          manualAccessEnabled: 1,
          manualAccessExpiresAt: 1,
          manualAccessStartedAt: 1,
          manualAccessGrantedAt: 1,
          manualAccessTotalMonths: 1,
          manualAccessMonths: 1,
          role: 1,
          [SEEN_FIELD]: 1,
          [EXPIRED_SEEN_FIELD]: 1,
        },
      },
    ),
  ]);

  const isAdmin = user?.role === "admin";
  const seenKey = typeof user?.[SEEN_FIELD] === "string" ? (user[SEEN_FIELD] as string) : "";
  const expiredSeenKey =
    typeof user?.[EXPIRED_SEEN_FIELD] === "string" ? (user[EXPIRED_SEEN_FIELD] as string) : "";

  const manualExpiresMs = toMs(user?.manualAccessExpiresAt);
  const manualStartedMs = toMs(user?.manualAccessStartedAt) || toMs(user?.manualAccessGrantedAt);
  const manualMonths = Math.round(
    Number(user?.manualAccessTotalMonths || user?.manualAccessMonths || 0),
  );
  // An admin revoke sets manualAccessEnabled = false; a natural expiry leaves it true.
  const manualOn = user?.manualAccessEnabled === true && manualExpiresMs > 0;

  const candidates: Grant[] = [];

  if (subscription) {
    candidates.push({
      key: `sub:${String(subscription._id)}`,
      startedAtMs: toMs(subscription.startedAt) || toMs(subscription.createdAt),
      expiresAtMs: toMs(subscription.expiresAt),
      months: Math.round(Number(subscription.months || 0)),
      planName: String(subscription.planName || "").trim(),
    });
  }

  if (manualOn && manualExpiresMs > now) {
    // manualAccessStartedAt only changes on a fresh grant (not on an extension).
    candidates.push({
      key: `admin:${manualStartedMs}`,
      startedAtMs: manualStartedMs,
      expiresAtMs: manualExpiresMs,
      months: manualMonths,
    });
  }

  if (candidates.length === 0) {
    const ended: Grant[] = [];
    if (expiredSubscription) {
      ended.push({
        key: `expired:sub:${String(expiredSubscription._id)}`,
        startedAtMs: toMs(expiredSubscription.startedAt) || toMs(expiredSubscription.createdAt),
        expiresAtMs: toMs(expiredSubscription.expiresAt),
        months: Math.round(Number(expiredSubscription.months || 0)),
        planName: String(expiredSubscription.planName || "").trim(),
      });
    }
    if (manualOn && manualExpiresMs <= now) {
      ended.push({
        key: `expired:admin:${manualStartedMs}`,
        startedAtMs: manualStartedMs,
        expiresAtMs: manualExpiresMs,
        months: manualMonths,
      });
    }
    ended.sort((a, b) => b.expiresAtMs - a.expiresAtMs);
    return { grant: null, expired: ended[0] ?? null, seenKey, expiredSeenKey, isAdmin };
  }

  // The most recently started grant is the one the user just received.
  candidates.sort((a, b) => b.startedAtMs - a.startedAtMs);
  const grant = candidates[0];
  // Show the real end of access (a paid plan and an admin grant may overlap).
  grant.expiresAtMs = Math.max(...candidates.map((c) => c.expiresAtMs));
  return { grant, expired: null, seenKey, expiredSeenKey, isAdmin };
}

export async function GET(request: Request) {
  try {
    const auth = authenticate(request);
    if (!auth) return NextResponse.json({ success: true, show: false }, { headers: NO_STORE });
    // An admin viewing the site as a user must neither see nor consume the popup.
    if (auth.impersonating) return NextResponse.json({ success: true, show: false }, { headers: NO_STORE });

    await connectDB();
    const { grant, expired, seenKey, expiredSeenKey, isAdmin } = await findCurrentGrant(auth.userId);
    const hidden = () => NextResponse.json({ success: true, show: false }, { headers: NO_STORE });

    // Admins (database role = "admin") are staff, not customers: no welcome / expired popup.
    if (isAdmin) return hidden();

    // 1) Access ended: tell the user once, and point them to the subscription page.
    if (!grant) {
      if (!expired || expired.key === expiredSeenKey) return hidden();
      return NextResponse.json(
        {
          success: true,
          show: true,
          kind: "expired",
          key: expired.key,
          months: expired.months,
          planName: expired.planName || "",
          expiresAt: new Date(expired.expiresAtMs).toISOString(),
        },
        { headers: NO_STORE },
      );
    }

    // 2) Access just started: welcome once. Older grants (people already using their
    //    plan) are never celebrated.
    const fresh =
      grant.startedAtMs > 0 &&
      Date.now() - grant.startedAtMs <= WELCOME_WINDOW_MS &&
      grant.startedAtMs >= WELCOME_CUTOFF_MS;
    if (!fresh || grant.key === seenKey) return hidden();

    return NextResponse.json(
      {
        success: true,
        show: true,
        kind: "welcome",
        key: grant.key,
        months: grant.months,
        planName: grant.planName || "",
        expiresAt: new Date(grant.expiresAtMs).toISOString(),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("Paid access welcome lookup error:", error);
    return NextResponse.json({ success: false, show: false }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  try {
    const auth = authenticate(request);
    if (!auth) return NextResponse.json({ success: false }, { status: 401, headers: NO_STORE });
    if (auth.impersonating) return NextResponse.json({ success: true }, { headers: NO_STORE });

    const body = await request.json().catch(() => null);
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!/^(expired:)?(sub:[a-f0-9]{24}|admin:\d{1,16})$/i.test(key)) {
      return NextResponse.json({ success: false, message: "Invalid key." }, { status: 400, headers: NO_STORE });
    }

    await connectDB();
    // Admin accounts never see the popup, so there is nothing to store for them.
    const account = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(auth.userId) },
      { projection: { role: 1 } },
    );
    if (account?.role === "admin") return NextResponse.json({ success: true }, { headers: NO_STORE });
    // The key is format-checked above. Worst case a user can only silence their own popup.
    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(auth.userId) },
      { $set: { [key.startsWith("expired:") ? EXPIRED_SEEN_FIELD : SEEN_FIELD]: key } },
    );

    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("Paid access welcome dismiss error:", error);
    return NextResponse.json({ success: false }, { status: 500, headers: NO_STORE });
  }
}
