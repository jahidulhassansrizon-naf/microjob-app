import test from "node:test";
import assert from "node:assert/strict";
import { createCipheriv, hkdfSync, randomBytes } from "node:crypto";
import {
  decryptPipraPayApiKey,
  encryptPipraPayApiKey,
} from "../lib/serverPipraPaySettings";

const originalEncryptionKey = process.env.PIPRAPAY_ENCRYPTION_KEY;
const originalJwtSecret = process.env.JWT_SECRET;
const testKey = randomBytes(32).toString("hex");

function restoreEnv() {
  if (originalEncryptionKey === undefined) delete process.env.PIPRAPAY_ENCRYPTION_KEY;
  else process.env.PIPRAPAY_ENCRYPTION_KEY = originalEncryptionKey;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
}

test("new PipraPay API keys use the dedicated encryption key and round-trip", () => {
  process.env.PIPRAPAY_ENCRYPTION_KEY = testKey;
  delete process.env.JWT_SECRET; // A dedicated key must work even when JWT_SECRET is absent.

  const encrypted = encryptPipraPayApiKey("piprapay-secret-value");
  assert.equal(encrypted.version, 2);
  assert.notEqual(encrypted.ciphertext, Buffer.from("piprapay-secret-value").toString("base64"));
  assert.equal(decryptPipraPayApiKey(encrypted), "piprapay-secret-value");
  restoreEnv();
});

test("saving fails clearly when the dedicated key is missing or malformed", () => {
  delete process.env.PIPRAPAY_ENCRYPTION_KEY;
  assert.throws(() => encryptPipraPayApiKey("secret"), /PIPRAPAY_ENCRYPTION_KEY/);

  process.env.PIPRAPAY_ENCRYPTION_KEY = "not-a-64-character-hex-key";
  assert.throws(() => encryptPipraPayApiKey("secret"), /64 hexadecimal characters/);
  restoreEnv();
});

test("legacy Step 5 version 1 credentials remain readable", () => {
  const jwtSecret = "legacy-jwt-secret-used-only-for-compatibility";
  process.env.JWT_SECRET = jwtSecret;
  process.env.PIPRAPAY_ENCRYPTION_KEY = testKey;

  const legacyKey = Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(jwtSecret, "utf8"),
      Buffer.from("SebaLagbe/PipraPay", "utf8"),
      Buffer.from("sebalagbe:piprapay:api-key:v1", "utf8"),
      32,
    ),
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", legacyKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update("legacy-piprapay-key", "utf8"),
    cipher.final(),
  ]);
  const legacyEncrypted = {
    version: 1,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };

  assert.equal(decryptPipraPayApiKey(legacyEncrypted), "legacy-piprapay-key");
  restoreEnv();
});

test("AES-GCM rejects tampered ciphertext", () => {
  process.env.PIPRAPAY_ENCRYPTION_KEY = testKey;
  const encrypted = encryptPipraPayApiKey("piprapay-secret-value");
  const tamperedBytes = Buffer.from(encrypted.ciphertext, "base64");
  tamperedBytes[0] ^= 0xff;
  const tampered = { ...encrypted, ciphertext: tamperedBytes.toString("base64") };

  assert.throws(() => decryptPipraPayApiKey(tampered));
  restoreEnv();
});
