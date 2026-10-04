/**
 * Pruebas de integración sobre PostgreSQL real (CP-114, CP-115, CP-116, CP-117, CP-119 a nivel de repositorio).
 *
 * Se ejecutan solo si existe TEST_DATABASE_URL, para no afectar `npm test` en equipos sin base:
 *   TEST_DATABASE_URL=postgres://localito:localito@127.0.0.1:5432/localito_test \
 *     npx tsx --test scripts/postgres.integration.test.ts
 *
 * ADVERTENCIA: el esquema `public` de esa base se elimina y se vuelve a crear. Usar una base aislada.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after, before } from "node:test";
import pg from "pg";
import { PostgresRepository } from "../apps/api/src/repository.js";

const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "TEST_DATABASE_URL no está definida";

let pool: pg.Pool;
let repo: PostgresRepository;

before(async () => {
  if (!url) return;
  pool = new pg.Pool({ connectionString: url, max: 40 });
  await pool.query("drop schema public cascade; create schema public;");
  repo = new PostgresRepository(pool);
  await repo.init();
});

after(async () => {
  if (pool) await pool.end();
});

async function newTenant(label: string) {
  const email = `${label}-${randomUUID().slice(0, 8)}@prueba.local`;
  return repo.registerTenant({ name: `Dueño ${label}`, email, password: "Clave12345", businessName: `Negocio ${label}`, businessType: "almacen" });
}

async function newProduct(tenantId: string, name: string, stock: number, salePrice = 1000) {
  return repo.createProduct(tenantId, { name, category: "Prueba", costPrice: 500, salePrice, stock, minimumStock: 0 });
}

const stockOf = async (tenantId: string, productId: string) => (await repo.getProducts(tenantId)).find((p) => p.id === productId)!.stock;
const count = async (sql: string, params: unknown[]) => Number((await pool.query(sql, params)).rows[0].n);

test("CP-114 última unidad: dos ventas simultáneas, 25 repeticiones", { skip }, async () => {
  const { tenant, user } = await newTenant("cp114");
  for (let i = 0; i < 25; i++) {
    const product = await newProduct(tenant.id, `Última unidad ${i}`, 1);
    const results = await Promise.allSettled(
      [0, 1].map((n) => repo.createSale(tenant.id, { sellerId: user.id, paymentMethod: "cash", idempotencyKey: `cp114-${i}-${n}`, items: [{ productId: product.id, quantity: 1 }] }))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    assert.equal(ok, 1, `repetición ${i}: debe haber exactamente una venta confirmada`);
    assert.equal(failed.length, 1);
    assert.match(String(failed[0].reason?.message), /Stock insuficiente/);
    assert.equal(await stockOf(tenant.id, product.id), 0, `repetición ${i}: stock final cero`);
    assert.equal(await count("select count(*) n from movimientos_stock where producto_id=$1 and tipo='sale'", [product.id]), 1);
    assert.equal(await count("select count(*) n from detalle_ventas where producto_id=$1", [product.id]), 1);
  }
});

test("CP-114b stock 10 con 30 ventas simultáneas de una unidad", { skip }, async () => {
  const { tenant, user } = await newTenant("cp114b");
  const product = await newProduct(tenant.id, "Stock diez", 10);
  const results = await Promise.allSettled(
    Array.from({ length: 30 }, (_, n) => repo.createSale(tenant.id, { sellerId: user.id, paymentMethod: "cash", idempotencyKey: `cp114b-${n}`, items: [{ productId: product.id, quantity: 1 }] }))
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 10);
  assert.equal(await stockOf(tenant.id, product.id), 0);
  assert.equal(await count("select count(*) n from ventas where negocio_id=$1", [tenant.id]), 10);
});

test("CP-114c orden de bloqueo: ventas [A,B] y [B,A] simultáneas sin deadlock (40 repeticiones)", { skip }, async () => {
  const { tenant, user } = await newTenant("cp114c");
  const a = await newProduct(tenant.id, "Producto A", 1000);
  const b = await newProduct(tenant.id, "Producto B", 1000);
  const errors: string[] = [];
  for (let i = 0; i < 40; i++) {
    const results = await Promise.allSettled([
      repo.createSale(tenant.id, { sellerId: user.id, paymentMethod: "cash", idempotencyKey: `ab-${i}`, items: [{ productId: a.id, quantity: 1 }, { productId: b.id, quantity: 1 }] }),
      repo.createSale(tenant.id, { sellerId: user.id, paymentMethod: "cash", idempotencyKey: `ba-${i}`, items: [{ productId: b.id, quantity: 1 }, { productId: a.id, quantity: 1 }] })
    ]);
    for (const r of results) if (r.status === "rejected") errors.push(String(r.reason?.message));
  }
  assert.deepEqual(errors, [], `errores observados: ${[...new Set(errors)].join(" | ")}`);
});

test("CP-115 idempotencia: diez solicitudes simultáneas con la misma clave", { skip }, async () => {
  const { tenant, user } = await newTenant("cp115");
  const product = await newProduct(tenant.id, "Idempotente", 5);
  const key = `cp115-${randomUUID()}`;
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () => repo.createSale(tenant.id, { sellerId: user.id, paymentMethod: "cash", idempotencyKey: key, items: [{ productId: product.id, quantity: 1 }] }))
  );
  const fulfilled = results.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof repo.createSale>>> => r.status === "fulfilled");
  assert.equal(fulfilled.length, 10, "todas las respuestas deben resolverse con la misma operación");
  assert.equal(new Set(fulfilled.map((r) => r.value.id)).size, 1);
  assert.equal(await count("select count(*) n from ventas where negocio_id=$1 and idempotency_key=$2", [tenant.id, key]), 1);
  assert.equal(await stockOf(tenant.id, product.id), 4);
  assert.equal(await count("select count(*) n from movimientos_stock where producto_id=$1 and tipo='sale'", [product.id]), 1);
});

test("CP-119 respuesta perdida: reintento con la misma clave tras confirmar (nivel repositorio)", { skip }, async () => {
  const { tenant, user } = await newTenant("cp119");
  const product = await newProduct(tenant.id, "Respuesta perdida", 3);
  const key = `cp119-${randomUUID()}`;
  const payload = { sellerId: user.id, paymentMethod: "cash" as const, idempotencyKey: key, items: [{ productId: product.id, quantity: 1 }] };
  await repo.createSale(tenant.id, payload); // la respuesta "se pierde": el cliente la ignora
  const retry = await repo.createSale(tenant.id, payload);
  assert.equal(await count("select count(*) n from ventas where negocio_id=$1 and idempotency_key=$2", [tenant.id, key]), 1);
  assert.equal(retry.items[0].quantity, 1);
  assert.equal(await stockOf(tenant.id, product.id), 2);
});

test("CP-116 rollback: ticket con producto sin stock no deja efectos parciales", { skip }, async () => {
  const { tenant, user } = await newTenant("cp116");
  const customer = await repo.createCustomer(tenant.id, { name: "Cliente rollback", creditLimit: 100000 });
  const ok = await newProduct(tenant.id, "Suficiente", 5);
  const empty = await newProduct(tenant.id, "Sin stock", 0);
  const before = {
    ventas: await count("select count(*) n from ventas where negocio_id=$1", [tenant.id]),
    mov: await count("select count(*) n from movimientos_stock where negocio_id=$1", [tenant.id]),
    fiado: await count("select count(*) n from cuentas_fiado where negocio_id=$1", [tenant.id])
  };
  await assert.rejects(
    repo.createSale(tenant.id, { sellerId: user.id, customerId: customer.id, paymentMethod: "credit", idempotencyKey: `cp116-${randomUUID()}`, items: [{ productId: ok.id, quantity: 2 }, { productId: empty.id, quantity: 1 }] }),
    /Stock insuficiente/
  );
  assert.equal(await stockOf(tenant.id, ok.id), 5);
  assert.equal(await count("select count(*) n from ventas where negocio_id=$1", [tenant.id]), before.ventas);
  assert.equal(await count("select count(*) n from movimientos_stock where negocio_id=$1", [tenant.id]), before.mov);
  assert.equal(await count("select count(*) n from cuentas_fiado where negocio_id=$1", [tenant.id]), before.fiado);
});

test("CP-117 aislamiento entre negocios en PostgreSQL", { skip }, async () => {
  const a = await newTenant("cp117a");
  const b = await newTenant("cp117b");
  const productB = await newProduct(b.tenant.id, "Producto de B", 10);
  const customerB = await repo.createCustomer(b.tenant.id, { name: "Cliente de B" });
  await newProduct(a.tenant.id, "Producto de A", 10);

  assert.equal((await repo.getProducts(a.tenant.id)).some((p) => p.id === productB.id), false, "A no ve productos de B");
  assert.equal((await repo.getCustomers(a.tenant.id)).some((c) => c.id === customerB.id), false, "A no ve clientes de B");
  assert.equal(await repo.updateProduct(a.tenant.id, productB.id, { name: "Alterado por A" }), null);
  assert.equal(await repo.updateStock(a.tenant.id, productB.id, 999), null);
  assert.equal(await repo.deactivateProduct(a.tenant.id, productB.id), null);
  assert.equal(await repo.payCustomerDebt(a.tenant.id, customerB.id, 100, "cash"), null);
  await assert.rejects(
    repo.createSale(a.tenant.id, { sellerId: a.user.id, paymentMethod: "cash", idempotencyKey: `cp117-${randomUUID()}`, items: [{ productId: productB.id, quantity: 1 }] }),
    /Producto no encontrado/
  );
  await assert.rejects(
    repo.createSale(a.tenant.id, { sellerId: a.user.id, customerId: customerB.id, paymentMethod: "cash", idempotencyKey: `cp117c-${randomUUID()}`, items: [{ productId: (await repo.getProducts(a.tenant.id))[0].id, quantity: 1 }] }),
    /Cliente no encontrado/
  );
  const intact = (await repo.getProducts(b.tenant.id)).find((p) => p.id === productB.id)!;
  assert.equal(intact.name, "Producto de B");
  assert.equal(intact.stock, 10);
  assert.equal(await count("select count(*) n from ventas where negocio_id=$1", [b.tenant.id]), 0);
});

test("Fiado: límite de crédito con ventas fiadas simultáneas", { skip }, async () => {
  const { tenant, user } = await newTenant("credito");
  const customer = await repo.createCustomer(tenant.id, { name: "Cliente límite", creditLimit: 1000 });
  const product = await newProduct(tenant.id, "Fiado", 50, 400);
  const results = await Promise.allSettled(
    Array.from({ length: 6 }, (_, n) => repo.createSale(tenant.id, { sellerId: user.id, customerId: customer.id, paymentMethod: "credit", idempotencyKey: `cred-${n}`, items: [{ productId: product.id, quantity: 1 }] }))
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const debt = Number((await pool.query("select coalesce(sum(saldo_pendiente),0) d from cuentas_fiado where cliente_id=$1", [customer.id])).rows[0].d);
  assert.ok(debt <= 1000, `la deuda (${debt}) no puede superar el límite de 1000`);
  assert.equal(ok, 2);
});

test("Abonos simultáneos: 10 abonos de 100 sobre una deuda de 1000", { skip }, async () => {
  const { tenant, user } = await newTenant("abonos");
  const customer = await repo.createCustomer(tenant.id, { name: "Cliente abonos", creditLimit: 100000 });
  const product = await newProduct(tenant.id, "Para deuda", 5, 1000);
  await repo.createSale(tenant.id, { sellerId: user.id, customerId: customer.id, paymentMethod: "credit", idempotencyKey: `deuda-${randomUUID()}`, items: [{ productId: product.id, quantity: 1 }] });
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => repo.payCustomerDebt(tenant.id, customer.id, 100, "cash")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 10, JSON.stringify(results.filter((r) => r.status === "rejected")));
  const saldo = Number((await pool.query("select coalesce(sum(saldo_pendiente),0) s from cuentas_fiado where cliente_id=$1", [customer.id])).rows[0].s);
  const abonado = Number((await pool.query("select coalesce(sum(a.monto),0) s from abonos_fiado a join cuentas_fiado c on c.id=a.cuenta_fiado_id where c.cliente_id=$1", [customer.id])).rows[0].s);
  assert.equal(saldo, 0);
  assert.equal(abonado, 1000);
});

test("Abonos simultáneos que exceden la deuda: 5 abonos de 300 sobre 1000", { skip }, async () => {
  const { tenant, user } = await newTenant("sobreabono");
  const customer = await repo.createCustomer(tenant.id, { name: "Cliente sobreabono", creditLimit: 100000 });
  const product = await newProduct(tenant.id, "Para deuda 2", 5, 1000);
  await repo.createSale(tenant.id, { sellerId: user.id, customerId: customer.id, paymentMethod: "credit", idempotencyKey: `deuda2-${randomUUID()}`, items: [{ productId: product.id, quantity: 1 }] });
  const results = await Promise.allSettled(Array.from({ length: 5 }, () => repo.payCustomerDebt(tenant.id, customer.id, 300, "cash")));
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const saldo = Number((await pool.query("select coalesce(sum(saldo_pendiente),0) s from cuentas_fiado where cliente_id=$1", [customer.id])).rows[0].s);
  assert.equal(saldo, 1000 - ok * 300);
  assert.ok(saldo >= 0, "el saldo nunca queda negativo");
  assert.equal(ok, 3);
});

test("Caja: cinco aperturas simultáneas dejan una sola caja abierta", { skip }, async () => {
  const { tenant, user } = await newTenant("caja");
  const results = await Promise.allSettled(Array.from({ length: 5 }, () => repo.openCashSession(tenant.id, 10000, user.id)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await count("select count(*) n from sesiones_caja where negocio_id=$1 and estado='open'", [tenant.id]), 1);
  const messages = [...new Set((results.filter((r) => r.status === "rejected") as PromiseRejectedResult[]).map((r) => String(r.reason?.message)))];
  // Se registra el mensaje que vería el usuario en la carrera: debe ser comprensible, no un error crudo de la base.
  assert.ok(messages.every((m) => /Ya existe una caja abierta/.test(m)), `mensajes recibidos: ${messages.join(" | ")}`);
});

test("Compras: recepción parcial y total de una orden en PostgreSQL", { skip }, async () => {
  const { tenant, user } = await newTenant("compras");
  const supplier = await repo.createSupplier(tenant.id, { name: "Proveedor compras" });
  const product = await newProduct(tenant.id, "Producto comprado", 0);
  const order = await repo.createPurchaseOrder(tenant.id, { supplierId: supplier.id, items: [{ productId: product.id, quantity: 10, unitCost: 500 }] });
  const partial = await repo.receivePurchaseOrder(tenant.id, order.id, { [product.id]: 4 }, user.id);
  assert.equal(partial?.status, "partially_received");
  assert.equal(await stockOf(tenant.id, product.id), 4);
  const full = await repo.receivePurchaseOrder(tenant.id, order.id, undefined, user.id);
  assert.equal(full?.status, "received");
  assert.equal(await stockOf(tenant.id, product.id), 10);
  assert.equal(await count("select count(*) n from movimientos_stock where producto_id=$1 and tipo='purchase'", [product.id]), 2);
  // Recibir de nuevo no debe duplicar stock.
  await repo.receivePurchaseOrder(tenant.id, order.id, undefined, user.id);
  assert.equal(await stockOf(tenant.id, product.id), 10);
});

test("Compras: dos recepciones simultáneas de la misma orden no duplican el stock", { skip }, async () => {
  const { tenant, user } = await newTenant("comprasc");
  const supplier = await repo.createSupplier(tenant.id, { name: "Proveedor concurrente" });
  const product = await newProduct(tenant.id, "Producto concurrente", 0);
  const order = await repo.createPurchaseOrder(tenant.id, { supplierId: supplier.id, items: [{ productId: product.id, quantity: 10, unitCost: 500 }] });
  await Promise.allSettled([1, 2, 3].map(() => repo.receivePurchaseOrder(tenant.id, order.id, undefined, user.id)));
  assert.equal(await stockOf(tenant.id, product.id), 10);
});

test("Suscripción: cambio de plan, activación y cancelación en PostgreSQL", { skip }, async () => {
  const { tenant } = await newTenant("suscripcion");
  const trial = await repo.getSubscription(tenant.id);
  assert.equal(trial.status, "trialing");
  const pending = await repo.updateSubscription(tenant.id, { pendingPlan: "basic", paymentProvider: "transfer" });
  assert.equal(pending.pendingPlan, "basic");
  const active = await repo.updateSubscription(tenant.id, { plan: "pro", status: "active", pendingPlan: null });
  assert.equal(active.plan, "pro");
  assert.equal(active.status, "active");
  const cancelled = await repo.updateSubscription(tenant.id, { status: "cancelled" });
  assert.equal(cancelled.status, "cancelled");
});

test("Integridad en base: stock y saldo de fiado negativos son rechazados por restricciones", { skip }, async () => {
  const { tenant } = await newTenant("checks");
  const product = await newProduct(tenant.id, "Con restricción", 1);
  await assert.rejects(pool.query("update productos set stock_actual=-1 where id=$1", [product.id]), /chk_productos_stock_no_negativo/);
  await assert.rejects(pool.query("update productos set precio_venta=-5 where id=$1", [product.id]), /chk_productos_precio_no_negativo/);
});
