import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "@localito/shared";
import { emptyDraft, parseWorkspace, reconcileDraft, saleStorageKey } from "../apps/web/src/useSaleWorkspace";

const product = { id: "p1", name: "Arroz", active: true, stock: 2, salePrice: 1500, trackStock: true } as Product;
const draft = () => ({ ...emptyDraft(), discount: "100", notes: "Pedido", customerId: "customer1", items: [{ productId: "p1", productName: "Arroz", quantity: 4, unitPrice: 1000, subtotal: 4000 }] });

test("recovered tickets use current prices and available stock", () => {
  const result = reconcileDraft(draft(), [product]);
  assert.equal(result.draft.items[0].quantity, 2);
  assert.equal(result.draft.items[0].subtotal, 3000);
  assert.equal(result.draft.customerId, "customer1");
  assert.equal(result.draft.notes, "Pedido");
  assert.equal(result.changes.length, 2);
});
test("unavailable products are removed and discount cannot exceed remaining total", () => {
  const result = reconcileDraft(draft(), [{ ...product, active: false }]);
  assert.deepEqual(result.draft.items, []);
  assert.equal(result.draft.discount, "");
  assert.equal(result.changes.length, 2);
});
test("untracked stock does not reduce quantities", () => {
  const result = reconcileDraft(draft(), [{ ...product, trackStock: false, stock: 0 }]);
  assert.equal(result.draft.items[0].quantity, 4);
  assert.equal(result.draft.items[0].subtotal, 6000);
});
test("storage roundtrip preserves distinct active and held tickets", () => {
  const value = { active: draft(), held: [draft()], favorites: ["p1"] };
  assert.deepEqual(parseWorkspace(JSON.stringify(value)), value);
  assert.notEqual(value.active.id, value.held[0].id);
});
test("corrupt storage is rejected instead of loading invalid quantities", () => {
  assert.throws(() => parseWorkspace("{broken"));
  const invalid = draft();
  invalid.items[0].quantity = -2;
  assert.throws(() => parseWorkspace(JSON.stringify({ active: invalid, held: [], favorites: [] })));
});
test("storage scopes cannot collide across businesses, users or delimiters", () => {
  assert.notEqual(saleStorageKey("local1", "seller1"), saleStorageKey("local1", "seller2"));
  assert.notEqual(saleStorageKey("local1", "seller1"), saleStorageKey("local2", "seller1"));
  assert.notEqual(saleStorageKey("a:b", "c"), saleStorageKey("a", "b:c"));
});
