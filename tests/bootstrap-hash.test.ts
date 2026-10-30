// Requires project dependencies (npm install): proves that a hash made exactly the way
// scripts/bootstrap-primary-admin.mjs makes it (bcryptjs, cost 12) is accepted by the
// login decision logic wired to bcryptjs.compare, as in app/api/auth/login/route.ts.
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { authenticateLogin } from "../lib/loginCore";

test("7 bootstrap-style bcrypt hash verifies through the login implementation", async () => {
  const password = "Test-only-passphrase-123";
  const doc = { _id: "1", email: "admin@example.test", phoneNumber: "01700000009", role: "admin", isPrimaryAdmin: true, password: await bcrypt.hash(password, 12) };
  const deps = {
    findUser: async () => doc,
    comparePassword: (p: string, h: string) => bcrypt.compare(p, h),
  };
  assert.equal((await authenticateLogin(deps, { identifier: "ADMIN@example.test", password })).kind, "ok");
  assert.equal((await authenticateLogin(deps, { identifier: "admin@example.test", password: password + "x" })).kind, "invalid_credentials");
});
