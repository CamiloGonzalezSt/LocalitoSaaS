import assert from "node:assert/strict";
import test from "node:test";
import type { DebtAccount, Product, Sale } from "@localito/shared";
import { businessDay, matchesInventoryFilter, overdueDebts, paymentLabels, recentSales } from "../apps/web/src/lib/dashboard";

const product = { active: true, stock: 2, minimumStock: 3, trackStock: true } as Product;
test("inventory alerts and destination filters share stock rules", () => {
  assert.equal(matchesInventoryFilter(product, "low"), true);
  assert.equal(matchesInventoryFilter(product, "out"), false);
  assert.equal(matchesInventoryFilter({ ...product, stock: 0 }, "out"), true);
  assert.equal(matchesInventoryFilter({ ...product, trackStock: false }, "low"), false);
  assert.equal(matchesInventoryFilter({ ...product, active: false }, "all"), false);
});
test("expiry uses inclusive 30 calendar days and excludes empty stock", () => {
  const check = (expiryDate: string, filter: "expiring" | "expired" = "expiring") => matchesInventoryFilter({ ...product, expiryDate }, filter, "2026-09-05");
  assert.equal(check("2026-09-05"), true);
  assert.equal(check("2026-10-05"), true);
  assert.equal(check("2026-10-06"), false);
  assert.equal(check("2026-09-04"), false);
  assert.equal(check("2026-09-04", "expired"), true);
  assert.equal(matchesInventoryFilter({ ...product, stock: 0, expiryDate: "2026-09-05" }, "expiring", "2026-09-05"), false);
});
test("business day stays in Chile across UTC midnight", () => {
  assert.equal(businessDay(new Date("2026-09-05T02:00:00Z")), "2026-09-04");
});
test("overdue excludes paid, cancelled, zero balances and debts due today", () => {
  const debt = { id: "old", balance: 100, status: "pending", dueDate: "2026-09-04" } as DebtAccount;
  assert.deepEqual(overdueDebts([debt, { ...debt, status: "paid" }, { ...debt, status: "cancelled" }, { ...debt, balance: 0 }, { ...debt, dueDate: "2026-09-05" }], "2026-09-05"), [debt]);
});
test("recent sales are sorted without mutation and omit cancelled sales", () => {
  const sales = Array.from({ length: 9 }, (_, i) => ({ id: String(i), status: i === 8 ? "cancelled" : "active", createdAt: `2026-09-0${i + 1}T10:00:00Z` } as Sale));
  assert.deepEqual(recentSales(sales).map(sale => sale.id), ["7", "6", "5", "4", "3", "2"]);
  assert.equal(sales[0].id, "0");
  assert.equal(paymentLabels.mixed, "Pago mixto");
  assert.equal(Object.keys(paymentLabels).length, 7);
});
