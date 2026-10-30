import test from "node:test";
import assert from "node:assert/strict";
import { getAdminCredentialVersion, isCurrentAdminToken, safeSecretEquals, ENV_ADMIN_USER_ID } from "../lib/adminCredentials";

test("ENV Main Admin token is bound to configured credentials", () => {
  const previous = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, jwt: process.env.JWT_SECRET };
  process.env.ADMIN_EMAIL = "Root@Example.com";
  process.env.ADMIN_PASSWORD = "a-long-test-password-123";
  process.env.JWT_SECRET = "test-jwt-secret-that-is-long-enough";
  try {
    const version = getAdminCredentialVersion("root@example.com", "a-long-test-password-123");
    const claims = { userId: ENV_ADMIN_USER_ID, role: "admin", admin: true, email: "root@example.com", adminCredentialVersion: version };
    assert.equal(isCurrentAdminToken(claims), true);
    assert.equal(safeSecretEquals("wrong", "a-long-test-password-123"), false);
    process.env.ADMIN_PASSWORD = "another-long-test-password-456";
    assert.equal(isCurrentAdminToken(claims), false);
  } finally {
    if (previous.email === undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL = previous.email;
    if (previous.password === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous.password;
    if (previous.jwt === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous.jwt;
  }
});
