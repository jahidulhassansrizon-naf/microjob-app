import test from "node:test";
import assert from "node:assert/strict";
import {
  authenticateLogin,
  normalizeLoginIdentifier,
  type LoginDeps,
} from "../lib/loginCore";

type TestUser = {
  _id: string;
  password: string;
  role: "user" | "admin";
  isPrimaryAdmin?: boolean;
};

function createHarness(options?: { ipAllowed?: boolean; initialFailures?: number; limit?: number }) {
  let failures = options?.initialFailures ?? 0;
  let ipChecks = 0;
  let failedChecks = 0;
  let recordedFailures = 0;
  let clearedFailures = 0;
  let findCalls = 0;
  const user: TestUser = {
    _id: "user-1",
    password: "stored-hash",
    role: "admin",
    isPrimaryAdmin: true,
  };
  const limit = options?.limit ?? 10;

  const deps: LoginDeps<TestUser> = {
    checkIpRateLimit: async () => {
      ipChecks += 1;
      return options?.ipAllowed === false
        ? { allowed: false, retryAfterSeconds: 30 }
        : { allowed: true };
    },
    checkIdentifierFailureLimit: async () => {
      failedChecks += 1;
      return failures >= limit
        ? { allowed: false, retryAfterSeconds: 45 }
        : { allowed: true };
    },
    recordIdentifierFailure: async () => {
      failures += 1;
      recordedFailures += 1;
    },
    clearIdentifierFailures: async () => {
      failures = 0;
      clearedFailures += 1;
    },
    findUser: async () => {
      findCalls += 1;
      return user;
    },
    comparePassword: async (plain, hash) => plain === "correct-password" && hash === "stored-hash",
  };

  return {
    deps,
    stats: () => ({ failures, ipChecks, failedChecks, recordedFailures, clearedFailures, findCalls }),
  };
}

test("successful logins from multiple devices do not consume the shared account-failure budget", async () => {
  const harness = createHarness();
  const body = { identifier: "Admin@Example.com", password: "correct-password" };

  const results = await Promise.all(
    Array.from({ length: 12 }, () => authenticateLogin(harness.deps, body)),
  );

  assert.ok(results.every((result) => result.kind === "ok"));
  assert.equal(harness.stats().recordedFailures, 0);
  assert.equal(harness.stats().clearedFailures, 12);
  assert.equal(harness.stats().ipChecks, 12);
});

test("failed password attempts increment the identifier failure counter", async () => {
  const harness = createHarness();
  const result = await authenticateLogin(harness.deps, {
    identifier: "admin@example.com",
    password: "wrong-password",
  });

  assert.deepEqual(result, { kind: "invalid_credentials", category: "password_mismatch" });
  assert.equal(harness.stats().recordedFailures, 1);
  assert.equal(harness.stats().failures, 1);
  assert.equal(harness.stats().clearedFailures, 0);
});

test("an account is temporarily blocked after the configured number of failed attempts", async () => {
  const harness = createHarness({ initialFailures: 10, limit: 10 });
  const result = await authenticateLogin(harness.deps, {
    identifier: "admin@example.com",
    password: "correct-password",
  });

  assert.deepEqual(result, { kind: "rate_limited", retryAfterSeconds: 45 });
  assert.equal(harness.stats().findCalls, 0);
  assert.equal(harness.stats().recordedFailures, 0);
});

test("IP abuse limit is enforced before database lookup", async () => {
  const harness = createHarness({ ipAllowed: false });
  const result = await authenticateLogin(harness.deps, {
    identifier: "admin@example.com",
    password: "correct-password",
  });

  assert.deepEqual(result, { kind: "rate_limited", retryAfterSeconds: 30 });
  assert.equal(harness.stats().findCalls, 0);
});

test("successful credentials clear prior failures for the identifier", async () => {
  const harness = createHarness({ initialFailures: 9, limit: 10 });
  const result = await authenticateLogin(harness.deps, {
    identifier: "admin@example.com",
    password: "correct-password",
  });

  assert.equal(result.kind, "ok");
  assert.equal(harness.stats().failures, 0);
  assert.equal(harness.stats().clearedFailures, 1);
});

test("email identifier normalization trims and lowercases input", () => {
  assert.equal(normalizeLoginIdentifier("  Admin@Example.COM  "), "admin@example.com");
  assert.equal(normalizeLoginIdentifier({ $ne: "" }), null);
  assert.equal(normalizeLoginIdentifier("  "), null);
});
