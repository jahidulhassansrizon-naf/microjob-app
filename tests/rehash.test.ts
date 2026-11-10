import test from "node:test";
import assert from "node:assert/strict";
import { getBcryptCost, shouldRehashToCost } from "../lib/loginCore";

test("reads bcrypt cost from hash", () => {
  assert.equal(getBcryptCost("$2b$12$UwCKAIUdT4rrPktvtkcpK.LYsY50khtCvCdqBkpFnHs1ms/Yqw2cq"), 12);
  assert.equal(getBcryptCost("$2a$10$abcdefghijklmnopqrstuv"), 10);
  assert.equal(getBcryptCost("not-a-hash"), null);
  assert.equal(getBcryptCost(undefined), null);
});

test("rehashes only hashes stronger than the target cost", () => {
  assert.equal(shouldRehashToCost("$2b$12$x", 10), true);
  assert.equal(shouldRehashToCost("$2b$10$x", 10), false);
  assert.equal(shouldRehashToCost("$2b$08$x", 10), false);
  assert.equal(shouldRehashToCost("garbage", 10), false);
});
