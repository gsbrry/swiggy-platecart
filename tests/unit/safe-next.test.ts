import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNext } from "../../src/lib/safe-next.ts";

test("allows same-site paths", () => {
  assert.equal(safeNext("/m/abc123def?x=1"), "/m/abc123def?x=1");
});

test("blocks open redirects", () => {
  for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null, 42]) {
    assert.equal(safeNext(bad), "/today", String(bad));
  }
});
