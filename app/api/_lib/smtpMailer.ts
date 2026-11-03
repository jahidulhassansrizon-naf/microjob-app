import crypto from "crypto";
import mongoose, { Schema } from "mongoose";
import { connectDB } from "@/lib/db";

/**
 * SMTP mail settings (managed from Admin -> Email & SMTP).
 * The password is stored encrypted (AES-256-GCM) and is never sent back to the browser.
 */

export type SmtpSettingsPublic = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  enabled: boolean;
  passwordConfigured: boolean;
  updatedAt: string | null;
  updatedBy: string;
};

export type SmtpSettingsRuntime = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  enabled: boolean;
};

export type OutgoingMail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const schema = new Schema(
  {
    key: { type: String, default: "primary", unique: true },
    host: { type: String, default: "" },
    port: { type: Number, default: 465 },
    secure: { type: Boolean, default: true },
    username: { type: String, default: "" },
    passwordEncrypted: { type: String, default: null, select: false },
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
    replyTo: { type: String, default: "" },
    enabled: { type: Boolean, default: false },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

const SmtpSettings: mongoose.Model<any> =
  (mongoose.models.SmtpSettings as mongoose.Model<any>) ||
  mongoose.model("SmtpSettings", schema);

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------
function encryptionKey(): Buffer {
  const explicit = (process.env.SMTP_ENCRYPTION_KEY || process.env.PIPRAPAY_ENCRYPTION_KEY || "").trim();
  if (/^[0-9a-fA-F]{64}$/.test(explicit)) return Buffer.from(explicit, "hex");
  const secret = process.env.JWT_SECRET || "";
  if (!secret.trim()) throw new Error("JWT_SECRET is required to protect the SMTP password.");
  return crypto.createHash("sha256").update(`smtp-settings:${secret}`).digest();
}

function encryptPassword(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptPassword(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Stored SMTP password is corrupted.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------
export async function getSmtpSettingsPublic(): Promise<SmtpSettingsPublic> {
  await connectDB();
  const doc: any = await SmtpSettings.findOne({ key: "primary" }).select("+passwordEncrypted").lean();
  return {
    host: doc?.host || "",
    port: Number(doc?.port) || 465,
    secure: doc ? Boolean(doc.secure) : true,
    username: doc?.username || "",
    fromEmail: doc?.fromEmail || "",
    fromName: doc?.fromName || "",
    replyTo: doc?.replyTo || "",
    enabled: Boolean(doc?.enabled),
    passwordConfigured: Boolean(doc?.passwordEncrypted),
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    updatedBy: doc?.updatedBy || "",
  };
}

let runtimeCache: { value: SmtpSettingsRuntime | null; at: number } | null = null;
const CACHE_MS = 30_000;

export function clearSmtpSettingsCache() {
  runtimeCache = null;
}

/** Full settings incl. decrypted password. Server-side use only. */
export async function getSmtpSettingsRuntime(options: { fresh?: boolean } = {}): Promise<SmtpSettingsRuntime | null> {
  if (!options.fresh && runtimeCache && Date.now() - runtimeCache.at < CACHE_MS) return runtimeCache.value;
  await connectDB();
  const doc: any = await SmtpSettings.findOne({ key: "primary" }).select("+passwordEncrypted").lean();
  let value: SmtpSettingsRuntime | null = null;
  if (doc?.host && doc?.passwordEncrypted && doc?.fromEmail) {
    value = {
      host: doc.host,
      port: Number(doc.port) || 465,
      secure: Boolean(doc.secure),
      username: doc.username || doc.fromEmail,
      password: decryptPassword(doc.passwordEncrypted),
      fromEmail: doc.fromEmail,
      fromName: doc.fromName || "",
      replyTo: doc.replyTo || "",
      enabled: Boolean(doc.enabled),
    };
  }
  runtimeCache = { value, at: Date.now() };
  return value;
}

export type SmtpSettingsInput = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  enabled: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HOST_RE = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/;
const hasLineBreak = (v: string) => /[\r\n]/.test(v);

export function validateSmtpInput(body: any): { ok: true; value: SmtpSettingsInput } | { ok: false; message: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, message: "Valid SMTP settings are required." };
  const host = String(body.host ?? "").trim().toLowerCase();
  const port = Number.parseInt(String(body.port ?? ""), 10);
  const username = String(body.username ?? "").trim();
  const password = typeof body.password === "string" ? body.password : "";
  const fromEmail = String(body.fromEmail ?? "").trim();
  const fromName = String(body.fromName ?? "").trim();
  const replyTo = String(body.replyTo ?? "").trim();

  if (!host || host.length > 253 || !HOST_RE.test(host)) return { ok: false, message: "Enter a valid SMTP host (for example smtp.gmail.com)." };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, message: "Enter a valid SMTP port (465 or 587)." };
  if (!username || username.length > 254 || hasLineBreak(username)) return { ok: false, message: "Enter the SMTP username (usually your email address)." };
  if (password && (password.length > 512 || hasLineBreak(password))) return { ok: false, message: "The SMTP password format is invalid." };
  if (!EMAIL_RE.test(fromEmail) || fromEmail.length > 254) return { ok: false, message: "Enter a valid 'From' email address." };
  if (fromName.length > 80 || hasLineBreak(fromName) || /[<>"]/.test(fromName)) return { ok: false, message: "The sender name is invalid (max 80 characters, no < > or quotes)." };
  if (replyTo && (!EMAIL_RE.test(replyTo) || replyTo.length > 254)) return { ok: false, message: "The Reply-To email address is invalid." };

  return {
    ok: true,
    value: { host, port, secure: Boolean(body.secure), username, password: password || undefined, fromEmail, fromName, replyTo, enabled: Boolean(body.enabled) },
  };
}

export async function saveSmtpSettings(input: SmtpSettingsInput, updatedBy: string): Promise<void> {
  await connectDB();
  const existing: any = await SmtpSettings.findOne({ key: "primary" }).select("+passwordEncrypted").lean();
  if (!input.password && !existing?.passwordEncrypted) {
    throw new Error("Enter the SMTP password (Gmail: use an App Password) before saving.");
  }
  const update: Record<string, unknown> = {
    host: input.host,
    port: input.port,
    secure: input.secure,
    username: input.username,
    fromEmail: input.fromEmail,
    fromName: input.fromName,
    replyTo: input.replyTo,
    enabled: input.enabled,
    updatedBy,
  };
  if (input.password) update.passwordEncrypted = encryptPassword(input.password);
  await SmtpSettings.updateOne({ key: "primary" }, { $set: update, $setOnInsert: { key: "primary" } }, { upsert: true });
  clearSmtpSettingsCache();
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------
const SMTP_TIMEOUT_MS = 15_000;

export function formatFrom(settings: Pick<SmtpSettingsRuntime, "fromEmail" | "fromName">): string {
  return settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail;
}

export function friendlySmtpError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown SMTP error";
  const code = (error as { code?: string } | null)?.code || "";
  if (/Invalid login|535|Username and Password not accepted|AUTH/i.test(raw)) {
    return "SMTP login failed. Check the username and password (Gmail needs a 16-character App Password, not your normal password).";
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "Could not reach the SMTP server. Check the host and port.";
  }
  if (code === "ETIMEDOUT" || code === "ESOCKET" || /timeout/i.test(raw)) {
    return "The SMTP server did not respond in time. Check host, port and the SSL/TLS option (465 = SSL on, 587 = SSL off).";
  }
  if (/wrong version number|ssl/i.test(raw)) {
    return "SSL/TLS mismatch. Use port 465 with SSL on, or port 587 with SSL off.";
  }
  return raw.slice(0, 240);
}

async function createTransport(settings: SmtpSettingsRuntime) {
  // @ts-ignore - nodemailer is installed with `npm i nodemailer` (types are optional)
  const mod: any = await import("nodemailer");
  const nodemailer: any = mod.default ?? mod;
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.username, pass: settings.password },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS * 2,
  });
}

/** Opens one connection and sends many mails through it (used for campaigns). */
export async function openSmtpSender(settings: SmtpSettingsRuntime) {
  const transport = await createTransport(settings);
  return {
    async send(mail: OutgoingMail) {
      const info = await transport.sendMail({
        from: formatFrom(settings),
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        ...(settings.replyTo ? { replyTo: settings.replyTo } : {}),
      });
      return { messageId: typeof info?.messageId === "string" ? info.messageId : undefined };
    },
    async verify() {
      await transport.verify();
    },
    close() {
      try {
        transport.close();
      } catch {
        // ignore
      }
    },
  };
}

export async function sendViaSmtp(settings: SmtpSettingsRuntime, mail: OutgoingMail) {
  const sender = await openSmtpSender(settings);
  try {
    return await sender.send(mail);
  } finally {
    sender.close();
  }
}
