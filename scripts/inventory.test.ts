import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "@localito/shared";
import { suggestedReplenishment } from "../apps/web/src/lib/inventory";

const product = { stock: 2, minimumStock: 5, costPrice: 800 } as Product;

test("replenishment suggestion targets twice the minimum stock", () => {
  assert.equal(suggestedReplenishment(product), 8);
  assert.equal(suggestedReplenishment({ ...product, stock: 10 }), 1);
  assert.equal(suggestedReplenishment({ ...product, minimumStock: 0, stock: 0 }), 1);
});

test("proposal source keeps the product cost as a reference", () => {
  const line = { productId: "p1", productName: "Arroz", quantity: suggestedReplenishment(product), unitCost: product.costPrice };
  assert.deepEqual(line, { productId: "p1", productName: "Arroz", quantity: 8, unitCost: 800 });
});
