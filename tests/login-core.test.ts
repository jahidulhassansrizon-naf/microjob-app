import test from "node:test";
import assert from "node:assert/strict";
import { authenticateLogin, normalizeLoginIdentifier, type LoginDeps } from "../lib/loginCore";

type U = { _id: string; email: string; phoneNumber: string; password: string; role: string; isPrimaryAdmin?: boolean };

// Stand-in hash: the real-bcrypt check lives in tests/bootstrap-hash.test.ts.
const hashOf = (p: string) => `hash:${p}`;
const db: U[] = [
  { _id: "1", email: "user@example.test", phoneNumber: "01700000001", password: hashOf("user-pass-123"), role: "user" },
  { _id: "2", email: "admin@example.test", phoneNumber: "01700000002", password: hashOf("admin-pass-123456"), role: "admin", isPrimaryAdmin: true },
];

function deps(over: Partial<LoginDeps<U>> = {}, calls: { find: number } = { find: 0 }): LoginDeps<U> {
  return {
    findUser: async (filter) => {
      calls.find += 1;
      const [{ phoneNumber }, { email }] = filter.$or;
      assert.equal(typeof phoneNumber, "string");
      assert.equal(typeof email, "string");
      return db.find((u) => u.phoneNumber === phoneNumber || u.email === email) ?? null;
    },
    comparePassword: async (plain, hash) => hashOf(plain) === hash,
    checkRateLimit: async () => ({ allowed: true }),
    ...over,
  };
}

test("1 ordinary user logs in", async () => {
  const r = await authenticateLogin(deps(), { identifier: "user@example.test", password: "user-pass-123" });
  assert.equal(r.kind, "ok");
});

test("2/6 database Primary Admin (promoted account) logs in through the same path as users", async () => {
  const r = await authenticateLogin(deps(), { identifier: "admin@example.test", password: "admin-pass-123456" });
  assert.equal(r.kind, "ok");
  if (r.kind === "ok") assert.equal(r.user.role, "admin");
});

test("3 wrong password is rejected as password_mismatch", async () => {
  const r = await authenticateLogin(deps(), { identifier: "admin@example.test", password: "nope" });
  assert.deepEqual(r, { kind: "invalid_credentials", category: "password_mismatch" });
});

test("4 unknown email is rejected", async () => {
  const r = await authenticateLogin(deps(), { identifier: "ghost@example.test", password: "x" });
  assert.deepEqual(r, { kind: "invalid_credentials", category: "user_not_found" });
});

test("5 email normalization: case and surrounding whitespace", async () => {
  assert.equal(normalizeLoginIdentifier("  Admin@Example.TEST \n"), "admin@example.test");
  const r = await authenticateLogin(deps(), { phoneNumber: "  ADMIN@example.test ", password: "admin-pass-123456" });
  assert.equal(r.kind, "ok");
});

test("legacy field names phoneNumber/email still accepted; phone login works", async () => {
  assert.equal((await authenticateLogin(deps(), { email: "user@example.test", password: "user-pass-123" })).kind, "ok");
  assert.equal((await authenticateLogin(deps(), { phoneNumber: "01700000001", password: "user-pass-123" })).kind, "ok");
});

test("8 object/array identifiers (NoSQL operators) never reach the database", async () => {
  const calls = { find: 0 };
  for (const bad of [{ $ne: "" }, { $gt: "" }, ["a@b.c"], 12345, true]) {
    const r = await authenticateLogin(deps({}, calls), { identifier: bad, password: "x" });
    assert.equal(r.kind, "bad_request");
  }
  assert.equal(calls.find, 0);
});

test("8 a role field in the payload is ignored; role comes only from the stored record", async () => {
  const r = await authenticateLogin(deps(), { identifier: "user@example.test", password: "user-pass-123", role: "admin", isPrimaryAdmin: true });
  assert.equal(r.kind, "ok");
  if (r.kind === "ok") assert.equal(r.user.role, "user");
});

test("non-string / oversize / empty passwords are bad requests", async () => {
  for (const password of [undefined, "", 123, { $ne: 1 }, "x".repeat(129)]) {
    assert.equal((await authenticateLogin(deps(), { identifier: "user@example.test", password })).kind, "bad_request");
  }
  assert.equal((await authenticateLogin(deps(), null)).kind, "bad_request");
});

test("11 rate limiting yields rate_limited (not a credential error) and skips the lookup", async () => {
  const calls = { find: 0 };
  const r = await authenticateLogin(
    deps({ checkRateLimit: async (scope) => (scope === "identifier" ? { allowed: false, retryAfterSeconds: 42 } : { allowed: true }) }, calls),
    { identifier: "admin@example.test", password: "admin-pass-123456" },
  );
  assert.deepEqual(r, { kind: "rate_limited", retryAfterSeconds: 42 });
  assert.equal(calls.find, 0);
});

test("infrastructure errors propagate and are NOT converted into invalid credentials", async () => {
  await assert.rejects(authenticateLogin(deps({ comparePassword: async () => { throw new Error("boom"); } }), { identifier: "user@example.test", password: "user-pass-123" }));
  await assert.rejects(authenticateLogin(deps({ findUser: async () => { throw new Error("db down"); } }), { identifier: "user@example.test", password: "x" }));
});

test("a document with no usable password hash is categorized, not crashed", async () => {
  const r = await authenticateLogin(deps({ findUser: async () => ({ _id: "9", email: "a@b.test", phoneNumber: "1", password: "", role: "user" }) }), { identifier: "a@b.test", password: "x" });
  assert.deepEqual(r, { kind: "invalid_credentials", category: "missing_password_hash" });
});
