// Siembra compras recibidas sobre la base de prueba para CP-118 (respaldo y restauración).
import { randomUUID } from "node:crypto";
import pg from "pg";
import { PostgresRepository } from "../apps/api/src/repository.js";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Defina TEST_DATABASE_URL (base aislada de prueba).");
const pool = new pg.Pool({ connectionString: url, max: 5 });
const repo = new PostgresRepository(pool);
async function main() {
  const { tenant, user } = await repo.registerTenant({ name: "Dueño respaldo", email: `resp-${randomUUID().slice(0, 8)}@prueba.local`, password: "Clave12345", businessName: "Negocio respaldo", businessType: "almacen" });
  const supplier = await repo.createSupplier(tenant.id, { name: "Proveedor de prueba" });
  const product = await repo.createProduct(tenant.id, { name: "Producto compra", category: "Prueba", costPrice: 400, salePrice: 900, stock: 0, minimumStock: 0 });
  const order = await repo.createPurchaseOrder(tenant.id, { supplierId: supplier.id, items: [{ productId: product.id, quantity: 20, unitCost: 450 }] });
  await repo.receivePurchaseOrder(tenant.id, order.id, undefined, user.id);
  await repo.createSale(tenant.id, { sellerId: user.id, paymentMethod: "cash", idempotencyKey: `resp-${randomUUID()}`, items: [{ productId: product.id, quantity: 3 }] });
  console.log(JSON.stringify({ tenant: tenant.id, order: order.id, stock: (await repo.getProducts(tenant.id))[0].stock }));
  await pool.end();
}
main().catch((error) => { console.error(error); process.exit(1); });
