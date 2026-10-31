import { isIP } from "node:net";
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

const ENCRYPTION_CONTEXT_V1 = "sebalagbe:piprapay:api-key:v1";
const ENCRYPTION_CONTEXT_V2 = "sebalagbe:piprapay:api-key:v2";
const ENCRYPTION_SALT = Buffer.from("SebaLagbe/PipraPay", "utf8");

type EncryptedSecretV1 = {
  version: 1;
  iv: string;
  authTag: string;
  ciphertext: string;
};

type EncryptedSecretV2 = {
  version: 2;
  iv: string;
  authTag: string;
  ciphertext: string;
};

type EncryptedSecret = EncryptedSecretV1 | EncryptedSecretV2;

/**
 * New PipraPay credentials are encrypted with a dedicated 256-bit key.
 * Keep this independent from JWT_SECRET so changing payment settings cannot
 * affect application authentication or existing user sessions.
 *
 * Generate the environment value with:
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getPipraPayEncryptionKey(): Buffer {
  const configuredKey = String(process.env.PIPRAPAY_ENCRYPTION_KEY || "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(configuredKey)) {
    throw new Error(
      "PIPRAPAY_ENCRYPTION_KEY must be configured as exactly 64 hexadecimal characters (32 random bytes). Generate it with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  const keyMaterial = Buffer.from(configuredKey, "hex");
  return Buffer.from(
    hkdfSync(
      "sha256",
      keyMaterial,
      ENCRYPTION_SALT,
      Buffer.from(ENCRYPTION_CONTEXT_V2, "utf8"),
      32,
    ),
  );
}

/**
 * Backward-compatibility reader for settings encrypted by Step 5, which used
 * JWT_SECRET. New credentials are never encrypted with this legacy key.
 */
function getLegacyJwtDerivedKey(): Buffer {
  const masterSecret = String(process.env.JWT_SECRET || "");
  if (masterSecret.length < 32) {
    throw new Error(
      "The previously saved PipraPay credential uses legacy JWT_SECRET encryption. Configure the original JWT_SECRET temporarily and save the API key again to migrate it.",
    );
  }
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(masterSecret, "utf8"),
      ENCRYPTION_SALT,
      Buffer.from(ENCRYPTION_CONTEXT_V1, "utf8"),
      32,
    ),
  );
}

function encryptWithKey(value: string, key: Buffer, version: 1 | 2): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    version,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  } as EncryptedSecret;
}

export function encryptPipraPayApiKey(value: string): EncryptedSecretV2 {
  const apiKey = String(value || "").trim();
  if (!apiKey) throw new Error("An API key is required.");
  return encryptWithKey(apiKey, getPipraPayEncryptionKey(), 2) as EncryptedSecretV2;
}

export function decryptPipraPayApiKey(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const encrypted = value as Partial<EncryptedSecret>;
  if (!encrypted.iv || !encrypted.authTag || !encrypted.ciphertext) return "";

  let key: Buffer;
  if (encrypted.version === 2) {
    key = getPipraPayEncryptionKey();
  } else if (encrypted.version === 1) {
    // Existing Step 5 ciphertext remains readable so deployments that saved a
    // credential before this update can re-save it and migrate to version 2.
    key = getLegacyJwtDerivedKey();
  } else {
    return "";
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

const ENCRYPTION_CONTEXT_UDDOKTAPAY_V1 = "sebalagbe:uddoktapay:api-key:v1";

function getUddoktaPayEncryptionKey(): Buffer {
  const configuredKey = String(process.env.PIPRAPAY_ENCRYPTION_KEY || "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(configuredKey)) {
    throw new Error(
      "PIPRAPAY_ENCRYPTION_KEY must be configured as exactly 64 hexadecimal characters (32 random bytes).",
    );
  }
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(configuredKey, "hex"),
      ENCRYPTION_SALT,
      Buffer.from(ENCRYPTION_CONTEXT_UDDOKTAPAY_V1, "utf8"),
      32,
    ),
  );
}

/** UddoktaPay uses a separate HKDF context so its ciphertext cannot be confused with PipraPay credentials. */
export function encryptUddoktaPayApiKey(value: string): EncryptedSecretV2 {
  const apiKey = String(value || "").trim();
  if (!apiKey) throw new Error("An UddoktaPay API key is required.");
  return encryptWithKey(apiKey, getUddoktaPayEncryptionKey(), 2) as EncryptedSecretV2;
}

export function decryptUddoktaPayApiKey(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const encrypted = value as Partial<EncryptedSecret>;
  if (encrypted.version !== 2 || !encrypted.iv || !encrypted.authTag || !encrypted.ciphertext) return "";

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getUddoktaPayEncryptionKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function validateUddoktaPayBaseUrl(value: unknown): { ok: true; baseUrl: string } | { ok: false; message: string } {
  const raw = String(value || "").trim();
  if (!raw) return { ok: false, message: "UddoktaPay Hosted Domain is required." };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, message: "Enter a valid UddoktaPay HTTPS domain." };
  }
  if (parsed.protocol !== "https:") return { ok: false, message: "UddoktaPay domain must use HTTPS." };
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return { ok: false, message: "Hosted Domain must not contain credentials, query strings or fragments." };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || !hostname.includes(".") || isIP(hostname) !== 0) {
    return { ok: false, message: "Use the public HTTPS domain of your UddoktaPay hosted panel." };
  }
  if (parsed.port && parsed.port !== "443") return { ok: false, message: "UddoktaPay domain must use the standard HTTPS port (443)." };
  const path = parsed.pathname.replace(/\/+$/, "");
  if (path && path !== "/api") return { ok: false, message: "Enter only the UddoktaPay domain, without an API path." };
  return { ok: true, baseUrl: parsed.origin };
}

export function validatePipraPayBaseUrl(value: unknown): { ok: true; baseUrl: string } | { ok: false; message: string } {
  const raw = String(value || "").trim();
  if (!raw) return { ok: false, message: "PipraPay Base URL is required." };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, message: "Enter a valid PipraPay HTTPS Base URL." };
  }
  if (parsed.protocol !== "https:") return { ok: false, message: "PipraPay Base URL must use HTTPS." };
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return { ok: false, message: "Base URL must not contain login credentials, query strings or fragments." };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    !hostname.includes(".") ||
    isIP(hostname) !== 0
  ) {
    return { ok: false, message: "Use the public HTTPS domain of your PipraPay server." };
  }
  if (parsed.port && parsed.port !== "443") {
    return { ok: false, message: "PipraPay Base URL must use the standard HTTPS port (443)." };
  }
  const path = parsed.pathname.replace(/\/+$/, "");
  if (path && path !== "/api") {
    return { ok: false, message: "Enter the API Base URL ending in /api, or the server root URL." };
  }
  return { ok: true, baseUrl: `${parsed.origin}/api` };
}
