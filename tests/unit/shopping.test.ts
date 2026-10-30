import assert from "node:assert/strict";
import { test } from "node:test";

import { buildShoppingList, formatQty } from "../../src/lib/shopping.ts";

test("merges the same ingredient+unit across dishes and scales from 2 to household size", () => {
  const list = buildShoppingList(
    [
      { dish: "Dal Tadka", ingredients: [{ name: "Toor dal", quantity: 1, unit: "cup" }, { name: "Tomato", quantity: 2, unit: "pc" }] },
      { dish: "Sambar", ingredients: [{ name: "toor dal ", quantity: 0.5, unit: "cup" }] },
    ],
    4,
  );
  const dal = list.find((i) => i.name === "toor dal");
  assert.ok(dal);
  assert.equal(dal.quantity, 3); // (1 + 0.5) * 4/2
  assert.deepEqual(dal.dishes, ["Dal Tadka", "Sambar"]);
});

test("keeps different units separate and tolerates missing quantities", () => {
  const list = buildShoppingList(
    [
      { dish: "A", ingredients: [{ name: "besan", quantity: 1, unit: "cup" }, { name: "salt", quantity: null, unit: null }] },
      { dish: "B", ingredients: [{ name: "besan", quantity: 3, unit: "tbsp" }] },
    ],
    2,
  );
  assert.equal(list.filter((i) => i.name === "besan").length, 2);
  assert.equal(list.find((i) => i.name === "salt")?.quantity, null);
});

test("formatQty rounds to quarters below 10 and whole numbers above", () => {
  assert.equal(formatQty(0.7, "tsp"), "0.75 tsp");
  assert.equal(formatQty(12.4, "g"), "12 g");
  assert.equal(formatQty(null, "cup"), "");
});
