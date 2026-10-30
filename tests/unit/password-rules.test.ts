import assert from "node:assert/strict";
import { test } from "node:test";

import { EMAIL_RE, passwordProblem } from "../../src/lib/password-rules.ts";

test("password rules", () => {
  assert.match(passwordProblem("short1") ?? "", /10 characters/);
  assert.match(passwordProblem("onlyletterslong") ?? "", /letters and numbers/);
  assert.match(passwordProblem("12345678901") ?? "", /letters and numbers/);
  assert.equal(passwordProblem("tastydal2026"), null);
  assert.match(passwordProblem("a1".repeat(40)) ?? "", /72/);
});

test("email shape", () => {
  assert.ok(EMAIL_RE.test("raphy@obio.in"));
  assert.ok(!EMAIL_RE.test("raphy@obio"));
  assert.ok(!EMAIL_RE.test("not-an-email"));
});
