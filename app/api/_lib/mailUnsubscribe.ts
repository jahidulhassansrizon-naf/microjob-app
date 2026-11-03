import crypto from "crypto";
import mongoose, { Schema } from "mongoose";
import { connectDB } from "@/lib/db";

/**
 * Marketing e-mail opt-outs. Stored in its own collection (keyed by e-mail) so no
 * change to the User model is needed. Links are signed with an HMAC so nobody can
 * unsubscribe somebody else by guessing an address.
 */

const schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true },
);

const EmailOptOut: mongoose.Model<any> =
  (mongoose.models.EmailOptOut as mongoose.Model<any>) || mongoose.model("EmailOptOut", schema);

function secret(): string {
  const value = (process.env.JWT_SECRET || "").trim();
  if (!value) throw new Error("JWT_SECRET is required to sign unsubscribe links.");
  return value;
}

function sign(email: string): string {
  return crypto.createHmac("sha256", secret()).update(`unsubscribe:${email}`).digest("hex").slice(0, 32);
}

export function siteBaseUrl(fallbackOrigin = ""): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  return (configured || fallbackOrigin).replace(/\/+$/, "");
}

export function buildUnsubscribeUrl(baseUrl: string, email: string): string {
  const clean = email.trim().toLowerCase();
  const e = Buffer.from(clean, "utf8").toString("base64url");
  return `${baseUrl}/api/unsubscribe?e=${e}&t=${sign(clean)}`;
}

export function readUnsubscribeToken(e: string | null, t: string | null): string | null {
  if (!e || !t) return null;
  try {
    const email = Buffer.from(e, "base64url").toString("utf8").trim().toLowerCase();
    if (!email || email.length > 254) return null;
    const expected = Buffer.from(sign(email));
    const given = Buffer.from(t);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    return email;
  } catch {
    return null;
  }
}

export async function addOptOut(email: string): Promise<void> {
  await connectDB();
  await EmailOptOut.updateOne({ email: email.toLowerCase() }, { $setOnInsert: { email: email.toLowerCase() } }, { upsert: true });
}

export async function listOptOuts(): Promise<string[]> {
  await connectDB();
  const rows: Array<{ email?: string }> = await EmailOptOut.find({}).select("email").lean();
  return rows.map((row) => String(row.email || "").toLowerCase()).filter(Boolean);
}

/**
 * Headers that mailbox providers (Gmail, Yahoo, Outlook) look for on bulk mail.
 * One-click needs an https link; on plain http (local dev) only the mailto form is added.
 */
export function unsubscribeHeaders(unsubscribeUrl: string, mailtoAddress: string): Record<string, string> {
  const parts: string[] = [];
  const headers: Record<string, string> = {};
  if (unsubscribeUrl.startsWith("https://")) {
    parts.push(`<${unsubscribeUrl}>`);
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  if (mailtoAddress) parts.push(`<mailto:${mailtoAddress}?subject=unsubscribe>`);
  if (parts.length) headers["List-Unsubscribe"] = parts.join(", ");
  return headers;
}
