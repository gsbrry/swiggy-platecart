import assert from "node:assert/strict";
import { test } from "node:test";

import { addDays, isIsoDate, mondayOf, todayIso, weekDates, weekLabel } from "../../src/lib/dates.ts";

test("mondayOf returns the Monday of the same ISO week", () => {
  assert.equal(mondayOf("2026-10-29"), "2026-10-26"); // Thursday
  assert.equal(mondayOf("2026-10-26"), "2026-10-26"); // Monday
  assert.equal(mondayOf("2026-11-01"), "2026-10-26"); // Sunday belongs to the previous Monday
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("weekDates gives 7 consecutive days", () => {
  const days = weekDates("2026-10-26");
  assert.equal(days.length, 7);
  assert.equal(days[6], "2026-11-01");
});

test("todayIso uses India time, not UTC", () => {
  // 20:00 UTC on 31 Oct is already 1 Nov 01:30 in India.
  assert.equal(todayIso(new Date("2026-10-31T20:00:00Z")), "2026-11-01");
});

test("isIsoDate rejects junk", () => {
  assert.equal(isIsoDate("2026-10-29"), true);
  assert.equal(isIsoDate("2026-13-45"), false);
  assert.equal(isIsoDate("29/10/2026"), false);
  assert.equal(isIsoDate(undefined), false);
});

test("weekLabel shortens same-month ranges", () => {
  assert.equal(weekLabel("2026-11-02"), "2 – 8 Nov 2026");
  assert.equal(weekLabel("2026-10-26"), "26 Oct – 1 Nov 2026");
});
