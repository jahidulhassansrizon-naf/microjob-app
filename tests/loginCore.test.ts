import test from "node:test";
import assert from "node:assert/strict";
import { authenticateLogin } from "../lib/loginCore";

test("valid database sub-admin login works without a login rate limiter", async () => {
  const result = await authenticateLogin({
    findUser: async () => ({ _id: "0123456789abcdef01234567", password: "hash", role: "admin" }),
    comparePassword: async (plain, hash) => plain === "correct-password" && hash === "hash",
  }, { identifier: " SubAdmin@Example.com ", password: "correct-password" });
  assert.equal(result.kind, "ok");
});

test("wrong password is rejected without rate-limit dependency", async () => {
  const result = await authenticateLogin({
    findUser: async () => ({ _id: "0123456789abcdef01234567", password: "hash", role: "admin" }),
    comparePassword: async () => false,
  }, { identifier: "admin@example.com", password: "wrong-password" });
  assert.deepEqual(result, { kind: "invalid_credentials", category: "password_mismatch" });
});

test("unknown user is rejected without rate-limit dependency", async () => {
  const result = await authenticateLogin({
    findUser: async () => null,
    comparePassword: async () => false,
  }, { identifier: "missing@example.com", password: "some-password" });
  assert.deepEqual(result, { kind: "invalid_credentials", category: "user_not_found" });
});

test("non-string identifiers and empty passwords are rejected", async () => {
  const deps = {
    findUser: async () => null,
    comparePassword: async () => false,
  };
  assert.equal((await authenticateLogin(deps, { identifier: { $ne: "" }, password: "x" })).kind, "bad_request");
  assert.equal((await authenticateLogin(deps, { identifier: "admin@example.com", password: "" })).kind, "bad_request");
});
