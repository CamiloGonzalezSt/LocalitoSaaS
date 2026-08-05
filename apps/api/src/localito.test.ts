import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, createSignedSessionToken, hashPassword, hashSessionToken, verifyPassword, verifySignedSessionToken } from "./auth.js";
import { MemoryRepository } from "./repository.js";
import { demoOwnerId, demoTenantId, systemAdminEmail, systemAdminId } from "./store.js";

test("passwords and sessions use non-predictable hashes", () => {
  const hash = hashPassword("ClaveSegura2026");
  assert.equal(verifyPassword("ClaveSegura2026", hash), true);
  assert.equal(verifyPassword("incorrecta", hash), false);
  const first = createSessionToken(); const second = createSessionToken();
  assert.notEqual(first, second); assert.equal(hashSessionToken(first).length, 64);
  const user = { id: "user-test", tenantId: "tenant-test", name: "Prueba", email: "prueba@localito.test", role: "owner" as const, active: true };
  const signed = createSignedSessionToken(user, 60_000, "secreto-de-prueba");
  assert.deepEqual(verifySignedSessionToken(signed, "secreto-de-prueba"), user);
  assert.equal(verifySignedSessionToken(signed, "secreto-incorrecto"), null);
});

test("tenant registration is isolated and rejects duplicate emails", async () => {
  const repository = new MemoryRepository();
  const email = `nuevo-${Date.now()}@localito.test`;
  const registered = await repository.registerTenant({ name: "Dueña prueba", email, password: "ClaveSegura2026", businessName: "Negocio aislado", businessType: "Almacén" });
  assert.equal(registered.user.tenantId, registered.tenant.id);
  assert.equal((await repository.getProducts(registered.tenant.id)).length, 0);
  const product = await repository.createProduct(registered.tenant.id, { name: "Producto privado", category: "Prueba", salePrice: 1000 });
  assert.equal((await repository.getProducts(demoTenantId)).some((candidate) => candidate.id === product.id), false);
  await assert.rejects(
    repository.registerTenant({ name: "Otra persona", email, password: "OtraClave2026", businessName: "Duplicado", businessType: "Almacén" }),
    /correo/
  );
});

test("system admin manages tenants and their users without entering store operations", async () => {
  const repository = new MemoryRepository();
  const admin = await repository.authenticate(systemAdminEmail, process.env.PLATFORM_ADMIN_PASSWORD ?? "AdminLocalito2026");
  assert.equal(admin?.user.id, systemAdminId);
  assert.equal(admin?.user.role, "system_admin");
  assert.equal((await repository.listTenants()).some((tenant) => tenant.id === admin?.user.tenantId), false);

  const suffix = Date.now();
  const created = await repository.registerTenant({ name: "Dueño nuevo", email: `dueno-${suffix}@localito.test`, password: "ClaveDueno2026", businessName: `Local ${suffix}`, businessType: "Minimarket" });
  const seller = await repository.createUser(created.tenant.id, { name: "Vendedor nuevo", email: `seller-${suffix}@localito.test`, password: "ClaveSeller2026", role: "seller" });
  assert.equal((await repository.getUsers(created.tenant.id, true)).length, 2);
  await repository.updateUser(created.tenant.id, seller.id, { active: false });
  assert.equal((await repository.getUsers(created.tenant.id)).length, 1);
  assert.equal((await repository.getUsers(created.tenant.id, true)).find((user) => user.id === seller.id)?.active, false);
  await repository.updateTenant(created.tenant.id, { active: false });
  assert.equal(await repository.authenticate(created.user.email, "ClaveDueno2026"), null);
});

test("critical business flows are consistent and idempotent", async () => {
  const repository = new MemoryRepository();
  const authentication = await repository.authenticate("caj.gonzalezs@duocuc.cl", process.env.OWNER_DEMO_PASSWORD ?? "Duoc2026");
  assert.equal(authentication?.user.id, demoOwnerId);

  const product = (await repository.getProducts(demoTenantId)).find((candidate) => candidate.stock >= 2);
  assert.ok(product);
  const initialStock = product.stock;
  const payload = { sellerId: demoOwnerId, paymentMethod: "cash" as const, idempotencyKey: `test-${Date.now()}`, items: [{ productId: product.id, quantity: 2 }] };
  const firstSale = await repository.createSale(demoTenantId, payload);
  const repeatedSale = await repository.createSale(demoTenantId, payload);
  assert.equal(firstSale.id, repeatedSale.id);
  assert.equal((await repository.getProducts(demoTenantId)).find((candidate) => candidate.id === product.id)?.stock, initialStock - 2);

  const partialReturn = await repository.returnSale(demoTenantId, firstSale.id, { items: [{ productId: product.id, quantity: 1 }], reason: "Producto dañado", userId: demoOwnerId });
  assert.equal(partialReturn?.total, product.salePrice);
  assert.equal(firstSale.status, "partially_refunded");
  assert.equal((await repository.getProducts(demoTenantId)).find((candidate) => candidate.id === product.id)?.stock, initialStock - 1);
  await assert.rejects(
    repository.returnSale(demoTenantId, firstSale.id, { items: [{ productId: product.id, quantity: 2 }], reason: "Exceso", userId: demoOwnerId }),
    /Cantidad/
  );
  await repository.cancelSale(demoTenantId, firstSale.id, "Prueba de anulación posterior");
  assert.equal((await repository.getProducts(demoTenantId)).find((candidate) => candidate.id === product.id)?.stock, initialStock);

  const limitedCustomer = await repository.createCustomer(demoTenantId, { name: "Cliente con cupo", creditLimit: 1, creditDays: 15 });
  await assert.rejects(
    repository.createSale(demoTenantId, { sellerId: demoOwnerId, customerId: limitedCustomer.id, paymentMethod: "credit", items: [{ productId: product.id, quantity: 1 }] }),
    /límite|cupo/i
  );
  assert.equal((await repository.getProducts(demoTenantId)).find((candidate) => candidate.id === product.id)?.stock, initialStock);

  const session = await repository.openCashSession(demoTenantId, 20_000, demoOwnerId);
  await repository.addCashMovement(demoTenantId, { type: "expense", amount: 1_000, reason: "Prueba", userId: demoOwnerId });
  const cashSummary = await repository.getCashRegister(demoTenantId);
  const closed = await repository.closeCashSession(demoTenantId, cashSummary.expectedCash ?? 0, "Prueba automática", demoOwnerId);
  assert.equal(session.id, closed?.id); assert.equal(closed?.difference, 0);

  const supplier = await repository.createSupplier(demoTenantId, { name: "Proveedor prueba" });
  const purchase = await repository.createPurchaseOrder(demoTenantId, { supplierId: supplier.id, items: [{ productId: product.id, quantity: 2, unitCost: product.costPrice }] });
  const received = await repository.receivePurchaseOrder(demoTenantId, purchase.id, undefined, demoOwnerId);
  assert.equal(received?.status, "received");
});
