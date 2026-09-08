import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MemoryRepository, type SaleCreationPayload } from "../apps/api/src/repository.js";
import { assertSalePayload } from "../apps/api/src/saleValidation.js";
import { auditSql, parseAuditQuery } from "../apps/api/src/auditQuery.js";
import { store } from "../apps/api/src/store.js";
import { enqueueSale, queueEntries, syncQueue, syncScope, SyncHttpError } from "../apps/web/src/lib/offline.js";

test("invalid sale payloads never alter stock, debt or sales", async t => {
  const repo = new MemoryRepository();
  const { tenant, user } = await repo.registerTenant({ name: "QA", email: `${randomUUID()}@test.local`, password: "Testing2026", businessName: "Validation QA", businessType: "QA" });
  const product = await repo.createProduct(tenant.id, { name: "Guarded", category: "QA", stock: 10, salePrice: 1000 });
  const valid: SaleCreationPayload = { sellerId: user.id, paymentMethod: "cash", items: [{ productId: product.id, quantity: 1 }] };
  const invalid: unknown[] = [null, {}, { ...valid, items: "bad" }, ...[-1, 0, NaN, Infinity, "2", null].map(quantity => ({ ...valid, items: [{ productId: product.id, quantity }] })), { ...valid, items: [valid.items[0], valid.items[0]] }, { ...valid, paymentMethod: "unknown" }, { ...valid, discount: -1 }, { ...valid, discount: 1001 }, { ...valid, discount: 0.5 }, { ...valid, payments: [] }, { ...valid, payments: [{ method: "cash", amount: 999 }] }, { ...valid, paymentMethod: "mixed" }, { ...valid, paymentMethod: "mixed", payments: [{ method: "cash", amount: 500 }, { method: "cash", amount: 500 }] }, { ...valid, payments: [{ method: "card", amount: 1000 }] }, { ...valid, notes: {} }, { ...valid, customerId: "foreign-customer" }];
  for (const [index, body] of invalid.entries()) await t.test(`invalid case ${index + 1}`, async () => {
    await assert.rejects(repo.createSale(tenant.id, body as SaleCreationPayload));
    assert.equal(product.stock, 10);
    assert.equal((await repo.getSales(tenant.id)).length, 0);
    assert.equal((await repo.getDebts(tenant.id)).length, 0);
    assert.equal(store.stockMovements.filter(entry => entry.tenantId === tenant.id).length, 0);
  });
  await repo.deactivateProduct(tenant.id, product.id);
  await assert.rejects(repo.createSale(tenant.id, valid), /desactivado/);
  await repo.updateProduct(tenant.id, product.id, { active: true });
  const customer = await repo.createCustomer(tenant.id, { name: "QA", creditLimit: 5000 });
  const mixed = { ...valid, idempotencyKey: randomUUID(), paymentMethod: "mixed" as const, customerId: customer.id, payments: [{ method: "cash" as const, amount: 600 }, { method: "credit" as const, amount: 400 }] };
  const first = await repo.createSale(tenant.id, mixed);
  const repeat = await repo.createSale(tenant.id, mixed);
  assert.equal(first.id, repeat.id);
  assert.equal(product.stock, 9);
  assert.equal(customer.debtBalance, 400);
  assertSalePayload({ ...valid, items: [{ productId: product.id, quantity: 0.5 }] });
  const half = await repo.createSale(tenant.id, { ...valid, items: [{ productId: product.id, quantity: 0.5 }] });
  assert.equal(half.total, 500);
});

test("audit pagination spans more than 100 entries without duplicates; cursor and search are tenant scoped", async () => {
  const repo = new MemoryRepository(), tenantId = randomUUID();
  const stamp = new Date().toISOString();
  for (let index = 0; index < 123; index++) {
    const event = await repo.recordAudit({ tenantId, action: index === 0 ? "adjust_stock" : "update", entity: "product", userName: "QA", details: { name: index === 0 ? "Ancient 100%_product" : `Product ${index}` } });
    event.createdAt = index === 0 ? "2020-01-01T12:00:00.000Z" : stamp;
  }
  const first = await repo.getAuditPage(tenantId, { limit: 25 });
  const ids = first.events.map(event => event.id);
  let cursor = first.nextCursor;
  const inserted = await repo.recordAudit({ tenantId, action: "create", entity: "product", details: {} });
  inserted.createdAt = "2099-01-01T00:00:00.000Z";
  while (cursor) { const page = await repo.getAuditPage(tenantId, { cursor, limit: 25 }); ids.push(...page.events.map(event => event.id)); cursor = page.nextCursor; }
  assert.equal(ids.length, 123);
  assert.equal(new Set(ids).size, 123);
  const found = await repo.getAuditPage(tenantId, { search: "100%_", action: "adjust_stock", from: "2020-01-01T00:00:00.000Z", to: "2020-01-02T00:00:00.000Z" });
  assert.equal(found.events.length, 1);
  assert.deepEqual((await repo.getAuditPage("foreign", { cursor: first.nextCursor })).events, []);
  for (const input of [{ limit: "0" }, { limit: "101" }, { cursor: "invalid" }, { from: "invalid" }, { action: ["update"] }, { from: stamp, to: stamp }]) assert.throws(() => parseAuditQuery(input));
  const query = parseAuditQuery({ search: "' OR 1=1 --", limit: "25", cursor: first.nextCursor });
  const sql = auditSql(tenantId, query);
  assert.equal(sql.text.includes(query.search!), false);
  assert.ok(sql.values.includes(query.search));
  assert.match(sql.text, /negocio_id = \$1 and id/);
  assert.match(sql.text, /fecha_creacion desc, a.id desc/);
});

test("offline rejection isolation, transient stops, account isolation, locks and corrupt data preservation", async () => {
  const descriptors = ["localStorage", "window", "navigator"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const data = new Map<string, string>();
  let lock = Promise.resolve<unknown>(undefined);
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { dispatchEvent: () => true } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: true, locks: { request: (_key: string, fn: () => unknown) => { const result = lock.then(fn); lock = result.catch(() => undefined); return result; } } } });
  try {
    storage.setItem("localito-session", JSON.stringify({ tenant: { id: "tenant" }, user: { id: "owner" } }));
    storage.setItem("localito-token", "test-only-token");
    const scope = syncScope()!;
    const add = (id: string) => enqueueSale(scope, JSON.stringify({ idempotencyKey: id, paymentMethod: "cash", items: [{ productId: "product", quantity: 1 }] }));
    await add("rejected"); await add("valid");
    const sent: string[] = [];
    const result = await syncQueue(async entry => { sent.push(entry.id); if (entry.id === "rejected") throw new SyncHttpError("Stock insuficiente", 409); });
    assert.deepEqual(result, { synced: 1, pending: 1 });
    assert.deepEqual(sent, ["rejected", "valid"]);
    assert.equal(queueEntries()[0].rejected, true);
    await syncQueue(async () => assert.fail("Rejected sales must not loop automatically"));
    await syncQueue(async entry => { assert.equal(entry.id, "rejected"); }, { retryRejected: true, entryId: "rejected" });
    assert.equal(queueEntries().length, 0);
    for (const status of [401, 403, 429, 500]) {
      await add("first"); await add("second"); let calls = 0;
      await syncQueue(async () => { calls++; throw new SyncHttpError("Temporary or session error", status); });
      assert.equal(calls, 1); assert.equal(queueEntries().length, 2);
      storage.setItem(scope.key, "[]");
    }
    await add("concurrent"); let sends = 0;
    await Promise.all([syncQueue(async () => { sends++; }), syncQueue(async () => { sends++; })]);
    assert.equal(sends, 1);
    await add("private");
    storage.setItem("localito-session", JSON.stringify({ tenant: { id: "other" }, user: { id: "other" } }));
    await syncQueue(async () => assert.fail("Cross account send"));
    assert.equal(queueEntries().length, 0); assert.equal(queueEntries(scope.key).length, 1);
    storage.setItem(scope.key, "not-json");
    assert.throws(() => queueEntries(scope.key), /respaldo/);
    assert.equal(storage.getItem(scope.key), "not-json");
    await assert.rejects(enqueueSale(scope, JSON.stringify({ idempotencyKey: "bad", items: [] })));
  } finally {
    for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
