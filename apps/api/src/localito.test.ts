import test from "node:test";
import assert from "node:assert/strict";
import { createTrialSubscription, effectiveSubscriptionStatus, hasEntitlement, mergeQuickSaleTicket, subscriptionCanMutate, subscriptionDaysRemaining } from "@localito/shared";
import { createSessionToken, createSignedSessionToken, hashPassword, hashSessionToken, passwordPolicyError, verifyPassword, verifySignedSessionToken } from "./auth.js";
import { resolveTransactionalEmailProvider } from "./email.js";
import { importInvoice, invoiceFingerprint, normalizeInvoiceImportPayload } from "./invoiceImport.js";
import { describeHttpError } from "./httpError.js";
import { bulkImportProducts, normalizeProductImportRow } from "./productImport.js";
import {
  MemoryRepository,
  persistentDemoId,
  requiresPersistentRepository,
  resolveDatabaseUrl
} from "./repository.js";
import { demoOwnerId, demoTenantId, systemAdminEmail, systemAdminId } from "./store.js";
import { extractInvoiceImage, extractQuickSaleImage, normalizeInvoiceAnalysis, normalizeQuickSaleAnalysis } from "./vision.js";
import { requestVisionJson, resolveVisionProvider } from "./visionProvider.js";

test("expected domain errors do not leak as internal server failures", () => {
  assert.deepEqual(describeHttpError(new Error("Producto no encontrado: missing")), {
    status: 404,
    publicMessage: "Producto no encontrado: missing",
    shouldLog: false
  });
  assert.equal(describeHttpError(new Error("Proveedor no encontrado.")).status, 404);
  assert.equal(describeHttpError(new Error("Stock insuficiente.")).status, 409);
  assert.equal(describeHttpError(new Error("El identificador es obligatorio.")).status, 400);
  assert.equal(describeHttpError(new Error("La importación no contiene productos.")).status, 400);
  assert.equal(describeHttpError(new Error("Puedes importar un máximo de 500 productos.")).status, 400);
  assert.equal(describeHttpError(new Error("El fiado de este cliente está bloqueado.")).status, 409);
  assert.equal(describeHttpError(new Error("La venta supera el límite de crédito.")).status, 409);
  assert.equal(describeHttpError(new Error("Venta Rápida no está configurada.")).status, 503);
  assert.equal(describeHttpError(new Error("La IA no devolvió una venta estructurada.")).status, 502);
  assert.equal(describeHttpError(new Error("Fallo inesperado")).status, 500);
});

test("production and Vercel require persistent storage", () => {
  assert.equal(requiresPersistentRepository({ NODE_ENV: "development" }), false);
  assert.equal(requiresPersistentRepository({ NODE_ENV: "production" }), true);
  assert.equal(requiresPersistentRepository({ VERCEL: "1" }), true);
});

test("database URL resolution ignores blank values and supports Vercel aliases", () => {
  assert.equal(
    resolveDatabaseUrl({ DATABASE_URL: "  ", POSTGRES_URL: " postgres://pooler/localito " }),
    "postgres://pooler/localito"
  );
  assert.equal(resolveDatabaseUrl({ SUPABASE_DB_URL: "postgres://supabase/localito" }), "postgres://supabase/localito");
  assert.equal(resolveDatabaseUrl({}), undefined);
});

test("vision provider prefers Groq and supports an explicit OpenAI fallback", () => {
  assert.equal(resolveVisionProvider({ GROQ_API_KEY: "groq-test" })?.name, "groq");
  assert.equal(resolveVisionProvider({ GROQ_API_KEY: "groq-test" })?.model, "qwen/qwen3.6-27b");
  assert.equal(resolveVisionProvider({ VISION_PROVIDER: "openai", OPENAI_API_KEY: "openai-test" })?.name, "openai");
  assert.equal(resolveVisionProvider({ VISION_PROVIDER: "groq", OPENAI_API_KEY: "openai-test" }), null);
});

test("vision provider explains the free quota retry time", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "rate limit" } }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "45" } });
  try {
    await assert.rejects(requestVisionJson({
      provider: { name: "groq", apiKey: "test", endpoint: "https://example.test", model: "test" },
      imageDataUrl: "data:image/jpeg;base64,AAAA", systemPrompt: "test", userPrompt: "test", schemaName: "test", schema: {}, maxOutputTokens: 10, timeoutMs: 1_000, operationLabel: "Prueba"
    }), /45 segundos/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("vision provider distinguishes its payload limit from a browser upload limit", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "request too large" } }), { status: 413, headers: { "Content-Type": "application/json" } });
  try {
    await assert.rejects(requestVisionJson({
      provider: { name: "groq", apiKey: "test", endpoint: "https://example.test", model: "test" },
      imageDataUrl: "data:image/jpeg;base64,AAAA", systemPrompt: "test", userPrompt: "test", schemaName: "test", schema: {}, maxOutputTokens: 10, timeoutMs: 1_000, operationLabel: "Prueba"
    }), /proveedor rechazó el tamaño total.*request too large/i);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("PostgreSQL demo seeds use stable UUIDs", () => {
  const first = persistentDemoId("prod-coca-15");
  assert.equal(first, persistentDemoId("prod-coca-15"));
  assert.notEqual(first, persistentDemoId("prod-arroz"));
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(persistentDemoId(demoTenantId), demoTenantId);
  assert.notEqual(persistentDemoId("demo-user:donpepe@localito.demo"), "00000000-0000-4000-8000-000000000102");
});

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
  assert.match(passwordPolicyError(`${"A".repeat(128)}1`) ?? "", /128/);
});

test("transactional email selects only a fully configured provider", () => {
  assert.equal(resolveTransactionalEmailProvider({}), null);
  assert.equal(
    resolveTransactionalEmailProvider({
      EMAIL_PROVIDER: "gmail",
      GMAIL_USER: "localito@gmail.com",
      GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop"
    }),
    "gmail"
  );
  assert.equal(
    resolveTransactionalEmailProvider({ EMAIL_PROVIDER: "gmail", GMAIL_USER: "localito@gmail.com" }),
    null
  );
  assert.equal(
    resolveTransactionalEmailProvider({ RESEND_API_KEY: "re_test", EMAIL_FROM: "Localito <no-reply@localito.cl>" }),
    "resend"
  );
  assert.equal(
    resolveTransactionalEmailProvider({
      EMAIL_PROVIDER: "desconocido",
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Localito <no-reply@localito.cl>"
    }),
    null
  );
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

test("new tenants receive a 30-day Pro trial with centralized entitlements", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({ name: "Dueña plan", email: `plan-${suffix}@localito.test`, password: "PlanSeguro2026", businessName: `Local plan ${suffix}`, businessType: "Almacén" });
  const subscription = await repository.getSubscription(registered.tenant.id);
  assert.equal(subscription.plan, "pro");
  assert.equal(subscription.status, "trialing");
  assert.equal(subscriptionDaysRemaining(subscription), 30);
  assert.equal(subscriptionCanMutate(subscription), true);
  assert.equal(hasEntitlement(subscription, "aiPhotoSale"), true);
  assert.equal((await repository.bootstrap(registered.tenant.id)).subscription.id, subscription.id);
});

test("plan changes gate Pro features and expired subscriptions become read-only", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({ name: "Dueño básico", email: `basic-${suffix}@localito.test`, password: "BasicoSeguro2026", businessName: `Local básico ${suffix}`, businessType: "Almacén" });
  const basic = await repository.updateSubscription(registered.tenant.id, { plan: "basic", status: "active" });
  assert.equal(hasEntitlement(basic, "sales"), true);
  assert.equal(hasEntitlement(basic, "customers"), false);
  const expired = createTrialSubscription(registered.tenant.id, new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(effectiveSubscriptionStatus(expired, new Date("2026-02-01T00:00:00.000Z")), "expired");
  assert.equal(subscriptionCanMutate(expired), false);
  assert.equal(hasEntitlement(expired, "customers"), true);
});

test("manual subscription requests never activate themselves and preserve data access", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({ name: "Dueña suscripción", email: `subscription-${suffix}@localito.test`, password: "Suscripcion2026", businessName: `Local suscripción ${suffix}`, businessType: "Almacén" });
  await repository.createCustomer(registered.tenant.id, { name: "Cliente preservado" });
  const requestedDuringTrial = await repository.updateSubscription(registered.tenant.id, { pendingPlan: "basic", paymentProvider: "manual" });
  assert.equal(requestedDuringTrial.plan, "pro");
  assert.equal(requestedDuringTrial.pendingPlan, "basic");
  assert.equal(requestedDuringTrial.status, "trialing");
  assert.equal(subscriptionCanMutate(requestedDuringTrial), true);
  const pending = await repository.updateSubscription(registered.tenant.id, { plan: "basic", status: "past_due", paymentProvider: "manual" });
  assert.equal(pending.status, "past_due");
  assert.equal(subscriptionCanMutate(pending), false);
  assert.equal(hasEntitlement(pending, "sales"), true);
  assert.equal(hasEntitlement(pending, "customers"), false);
  assert.equal((await repository.getCustomers(registered.tenant.id)).length, 1);
  const activated = await repository.updateSubscription(registered.tenant.id, { status: "active", paymentProvider: "manual" });
  assert.equal(activated.status, "active");
  assert.equal(subscriptionCanMutate(activated), true);
  assert.ok(activated.currentPeriodEndsAt);
});

test("owners can update business identity without changing tenant activation", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({ name: "Dueño negocio", email: `business-${suffix}@localito.test`, password: "NegocioSeguro2026", businessName: `Local original ${suffix}`, businessType: "Almacén" });
  const updated = await repository.updateTenant(registered.tenant.id, { name: "Local actualizado", businessType: "Botillería", address: "Calle Uno 123", phone: "+56 9 1234 5678" });
  assert.equal(updated?.name, "Local actualizado");
  assert.equal(updated?.businessType, "Botillería");
  assert.equal(updated?.address, "Calle Uno 123");
  assert.equal(updated?.phone, "+56 9 1234 5678");
  assert.equal(updated?.active, undefined);
});

test("initial inventory bulk import validates rows, avoids duplicates and is safe to retry", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({
    name: "Dueña carga inicial",
    email: `carga-${suffix}@localito.test`,
    password: "CargaSegura2026",
    businessName: `Almacén carga ${suffix}`,
    businessType: "Almacén"
  });
  const payload = {
    clientImportId: `carga-${Date.now()}-productos`,
    rows: [
      {
        rowNumber: 2,
        name: "Arroz grado 2 1 kg",
        brand: "Localito",
        category: "Abarrotes",
        barcode: "7801234567890",
        costPrice: 900,
        salePrice: 1290,
        stock: 24,
        minimumStock: 5,
        unit: "unit" as const
      },
      {
        rowNumber: 3,
        name: "Aceite vegetal 1 L",
        category: "Abarrotes",
        salePrice: 1990,
        stock: 12,
        minimumStock: 3,
        unit: "liter" as const
      },
      { rowNumber: 4, name: "Fila sin precio", category: "Abarrotes", salePrice: 0 }
    ]
  };

  const first = await bulkImportProducts(repository, registered.tenant.id, registered.user, payload);
  assert.equal(first.created.length, 2);
  assert.equal(first.skipped.length, 1);
  assert.match(first.skipped[0]?.reason ?? "", /precio de venta/);
  assert.equal((await repository.getProducts(registered.tenant.id)).length, 2);
  assert.equal(first.created[0]?.stock, 24);
  assert.equal(first.created[1]?.unit, "liter");

  const retry = await bulkImportProducts(repository, registered.tenant.id, registered.user, payload);
  assert.equal(retry.created.length, 0);
  assert.equal(retry.existingProductIds.length, 2);
  assert.equal((await repository.getProducts(registered.tenant.id)).length, 2);
  assert.ok((await repository.getAuditEvents(registered.tenant.id)).some((event) => event.action === "bulk_import"));

  await assert.rejects(
    bulkImportProducts(repository, registered.tenant.id, registered.user, {
      clientImportId: `carga-${Date.now()}-invalida`,
      rows: [{ rowNumber: 2, name: "Sin categoría", category: "", salePrice: -1 }]
    }),
    /No se pudo importar ningún producto/
  );
  assert.throws(() => normalizeProductImportRow({ name: "Producto", category: "General", salePrice: 1000, unit: "galón" }, 2), /unidad/);
});

test("password recovery is single-use, changes the password and revokes sessions", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const email = `reset-${suffix}@localito.test`;
  const registered = await repository.registerTenant({
    name: "Dueña recuperación",
    email,
    password: "ClaveAnterior2026",
    businessName: `Local reset ${suffix}`,
    businessType: "Almacén"
  });
  const sessionHash = hashSessionToken(`session-${suffix}`);
  await repository.createSession(registered.user.id, sessionHash, new Date(Date.now() + 60_000).toISOString());
  assert.equal((await repository.getSession(sessionHash))?.id, registered.user.id);

  const resetTokenHash = hashSessionToken(`reset-${suffix}`);
  assert.equal(
    (await repository.createPasswordResetToken(email, resetTokenHash, new Date(Date.now() + 60_000).toISOString()))?.email,
    email
  );
  assert.equal(
    await repository.createPasswordResetToken(email, hashSessionToken(`duplicate-${suffix}`), new Date(Date.now() + 60_000).toISOString()),
    null
  );
  assert.equal(await repository.completePasswordReset(resetTokenHash, "ClaveNueva2026"), true);
  assert.equal(await repository.completePasswordReset(resetTokenHash, "OtraClave2026"), false);
  assert.equal(await repository.authenticate(email, "ClaveAnterior2026"), null);
  assert.equal((await repository.authenticate(email, "ClaveNueva2026"))?.user.id, registered.user.id);
  assert.equal(await repository.getSession(sessionHash), null);

  const expiredTokenHash = hashSessionToken(`expired-${suffix}`);
  await repository.createPasswordResetToken(email, expiredTokenHash, new Date(Date.now() - 1_000).toISOString());
  assert.equal(await repository.completePasswordReset(expiredTokenHash, "ClaveExpirada2026"), false);
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
  const authentication = await repository.authenticate("juanita@localito.demo", process.env.OWNER_DEMO_PASSWORD ?? "Duoc2026");
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
  const financialSummary = (await repository.bootstrap(demoTenantId)).summary;
  assert.ok(financialSummary.operatingExpenses >= 1_000);
  assert.equal(financialSummary.estimatedNetResult, financialSummary.estimatedGrossProfit - financialSummary.operatingExpenses);

  const supplier = await repository.createSupplier(demoTenantId, { name: "Proveedor prueba" });
  const purchase = await repository.createPurchaseOrder(demoTenantId, { supplierId: supplier.id, items: [{ productId: product.id, quantity: 2, unitCost: product.costPrice }] });
  const received = await repository.receivePurchaseOrder(demoTenantId, purchase.id, undefined, demoOwnerId);
  assert.equal(received?.status, "received");
});

test("closing the cash register resets the dashboard period without losing its history", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({
    name: "Dueña cierre",
    email: `cierre-${suffix}@localito.test`,
    password: "CierreSeguro2026",
    businessName: `Local cierre ${suffix}`,
    businessType: "Almacén"
  });
  const product = await repository.createProduct(registered.tenant.id, {
    name: "Producto de caja",
    category: "Prueba",
    salePrice: 2_500,
    stock: 10,
    minimumStock: 1
  });

  await repository.createSale(registered.tenant.id, {
    sellerId: registered.user.id,
    paymentMethod: "cash",
    items: [{ productId: product.id, quantity: 2 }]
  });
  const beforeClosure = await repository.getCashRegister(registered.tenant.id);
  assert.equal(beforeClosure.salesCount, 1);
  assert.equal(beforeClosure.grossTotal, 5_000);

  const closure = await repository.closeCashRegister(registered.tenant.id, {
    note: "Cierre de prueba",
    closedByUserId: registered.user.id
  });
  assert.equal(closure.salesCount, 1);
  assert.equal(closure.grossTotal, 5_000);

  const afterClosure = await repository.getCashRegister(registered.tenant.id);
  assert.equal(afterClosure.salesCount, 0);
  assert.equal(afterClosure.grossTotal, 0);
  assert.equal((await repository.bootstrap(registered.tenant.id)).cashRegister.grossTotal, 0);

  await repository.openCashSession(registered.tenant.id, 10_000, registered.user.id);
  await new Promise((resolve) => setTimeout(resolve, 2));
  await repository.createSale(registered.tenant.id, {
    sellerId: registered.user.id,
    paymentMethod: "cash",
    items: [{ productId: product.id, quantity: 1 }]
  });
  const nextPeriod = await repository.getCashRegister(registered.tenant.id);
  assert.equal(nextPeriod.salesCount, 1);
  assert.equal(nextPeriod.grossTotal, 2_500);
  assert.equal((await repository.getCashClosures(registered.tenant.id))[0]?.grossTotal, 5_000);

  await repository.closeCashSession(
    registered.tenant.id,
    nextPeriod.expectedCash ?? 0,
    "Cierre y cuadratura de prueba",
    registered.user.id
  );
  const afterSessionClosure = await repository.getCashRegister(registered.tenant.id);
  assert.equal(afterSessionClosure.salesCount, 0);
  assert.equal(afterSessionClosure.grossTotal, 0);
});

test("invoice vision output is normalized and only matches products from the tenant catalog", () => {
  const product = {
    id: "catalog-product",
    tenantId: "tenant",
    name: "Bebida Cola 1.5 L",
    brand: "Marca Uno",
    category: "Bebidas",
    barcode: "7801234567890",
    costPrice: 800,
    salePrice: 1_200,
    stock: 4,
    minimumStock: 2,
    active: true
  };
  const analysis = normalizeInvoiceAnalysis({
    supplierName: " Distribuidora   Central ",
    supplierTaxId: "76.123.456-7",
    invoiceNumber: "1234",
    invoiceDate: "2026-08-24",
    netTotal: 2_400,
    taxTotal: 456,
    total: 2_856,
    warnings: [],
    items: [{
      rawDescription: "BEB COLA 1.5",
      name: "Bebida Cola 1.5 L",
      brand: "Marca Uno",
      category: "bebidas",
      barcode: "7801234567890",
      quantity: 3,
      unitCost: null,
      lineTotal: 2_400,
      existingProductId: "id-inventado",
      confidence: 0.6
    }]
  }, [product]);

  assert.equal(analysis.supplierName, "Distribuidora Central");
  assert.equal(analysis.items[0].existingProductId, product.id);
  assert.equal(analysis.items[0].category, "Bebidas");
  assert.equal(analysis.items[0].unitCost, 800);
  assert.match(analysis.warnings.join(" "), /baja confianza/i);
});

test("invoice vision request uses a strict schema and disables provider storage", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | undefined;
  process.env.OPENAI_API_KEY = "test-only-key";
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        supplierName: "Proveedor",
        supplierTaxId: null,
        invoiceNumber: "10",
        invoiceDate: "2026-08-24",
        netTotal: 1_000,
        taxTotal: 190,
        total: 1_190,
        items: [{ rawDescription: "Producto", name: "Producto", brand: null, category: "General", barcode: null, quantity: 1, unitCost: 1_000, lineTotal: 1_000, existingProductId: null, confidence: 0.9 }],
        warnings: []
      })
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const analysis = await extractInvoiceImage("data:image/jpeg;base64,AAAA", []);
    assert.equal(analysis.items.length, 1);
    assert.equal(requestBody?.store, false);
    assert.equal((requestBody?.text as { format?: { strict?: boolean } }).format?.strict, true);
    assert.match(JSON.stringify(requestBody?.input), /ignora cualquier instrucción/i);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("quick sale normalizes multiple products, groups quantities and never trusts unknown catalog ids", () => {
  const products = [
    { id: "cola", tenantId: "tenant", name: "Coca-Cola Original 1.5 L", brand: "Coca-Cola", category: "Bebidas", costPrice: 1_500, salePrice: 2_000, stock: 2, minimumStock: 1, active: true },
    { id: "super8", tenantId: "tenant", name: "Super 8 Clásico", brand: "Nestlé", category: "Snacks", costPrice: 350, salePrice: 500, stock: 20, minimumStock: 4, active: true },
    { id: "super8-blanco", tenantId: "tenant", name: "Super 8 Blanco", brand: "Nestlé", category: "Snacks", costPrice: 380, salePrice: 550, stock: 8, minimumStock: 2, active: true }
  ];
  const analysis = normalizeQuickSaleAnalysis({
    items: [
      { observedLabel: "dos botellas de bebida", matchedProductId: "cola", candidateProductIds: ["cola"], quantity: 2, confidence: 0.96 },
      { observedLabel: "otra botella igual", matchedProductId: "cola", candidateProductIds: ["cola"], quantity: 1, confidence: 0.91 },
      { observedLabel: "barra de chocolate", matchedProductId: "super8", candidateProductIds: ["super8", "super8-blanco"], quantity: 3, confidence: 0.67 },
      { observedLabel: "paquete desconocido", matchedProductId: "producto-inventado", candidateProductIds: ["tambien-inventado"], quantity: 1, confidence: 0.88 }
    ],
    warnings: []
  }, products);

  assert.equal(analysis.items.length, 3);
  assert.equal(analysis.items[0]?.productId, "cola");
  assert.equal(analysis.items[0]?.quantity, 3);
  assert.equal(analysis.items[0]?.quantityNeedsReview, true);
  assert.equal(analysis.items[0]?.salePrice, 2_000);
  assert.equal(analysis.items[0]?.stock, 2);
  assert.equal(analysis.items[0]?.status, "matched");
  assert.equal(analysis.items[1]?.status, "needs_confirmation");
  assert.deepEqual(analysis.items[1]?.candidates.map((candidate) => candidate.productId), ["super8", "super8-blanco"]);
  assert.equal(analysis.items[2]?.status, "unrecognized");
  assert.equal(analysis.items[2]?.productId, undefined);
  assert.match(analysis.warnings.join(" "), /asociar|Confirma/i);
  assert.throws(
    () => normalizeQuickSaleAnalysis({ items: [], warnings: [] }, products),
    (error: unknown) => error instanceof Error && error.message.includes("No encontramos productos") && (error as Error & { status?: number }).status === 422
  );
});

test("quick sale vision uses strict structured output, catalog context and provider privacy controls", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | undefined;
  process.env.OPENAI_API_KEY = "test-only-key";
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        items: [{ observedLabel: "Bebida cola", matchedProductId: "catalog-cola", candidateProductIds: ["catalog-cola"], quantity: 2, confidence: 0.95 }],
        warnings: []
      })
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await extractQuickSaleImage("data:image/jpeg;base64,AAAA", [{
      id: "catalog-cola",
      tenantId: "tenant",
      name: "Bebida cola 1.5 L",
      brand: "Marca",
      category: "Bebidas",
      costPrice: 1_000,
      salePrice: 1_500,
      stock: 8,
      minimumStock: 2,
      active: true
    }]);
    assert.equal(result.items[0]?.productId, "catalog-cola");
    assert.equal(result.items[0]?.salePrice, 1_500);
    assert.equal(requestBody?.store, false);
    assert.equal((requestBody?.text as { format?: { strict?: boolean } }).format?.strict, true);
    const input = JSON.stringify(requestBody?.input);
    assert.match(input, /catalog-cola/);
    assert.match(input, /No inventes productos/i);
    assert.doesNotMatch(input, /"salePrice"|"stock"/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("quick sale uses Groq vision JSON mode without sending prices or stock", async () => {
  const previousGroqKey = process.env.GROQ_API_KEY;
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const previousProvider = process.env.VISION_PROVIDER;
  const previousFetch = globalThis.fetch;
  let requestUrl = "";
  let requestBody: Record<string, unknown> | undefined;
  process.env.VISION_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "groq-test-only-key";
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        items: [{ observedLabel: "Bebida cola", matchedProductId: "groq-cola", candidateProductIds: ["groq-cola"], quantity: 2, confidence: 0.94 }],
        warnings: []
      }) } }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await extractQuickSaleImage("data:image/jpeg;base64,AAAA", [{
      id: "groq-cola", tenantId: "tenant", name: "Bebida cola 1.5 L", brand: "Marca", category: "Bebidas",
      costPrice: 1_000, salePrice: 1_500, stock: 8, minimumStock: 2, active: true
    }]);
    assert.equal(result.items[0]?.productId, "groq-cola");
    assert.equal(result.items[0]?.salePrice, 1_500);
    assert.equal(requestUrl, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(requestBody?.model, "qwen/qwen3.6-27b");
    assert.equal((requestBody?.response_format as { type?: string }).type, "json_object");
    assert.equal(requestBody?.reasoning_effort, "none");
    assert.equal(requestBody?.max_completion_tokens, 1_500);
    const schemaText = JSON.stringify(requestBody?.messages);
    assert.match(schemaText, /quantityUncertain/);
    assert.match(schemaText, /nunca adivines unidades ocultas/i);
    const messages = JSON.stringify(requestBody?.messages);
    assert.match(messages, /groq-cola/);
    assert.match(messages, /No inventes productos/i);
    assert.doesNotMatch(messages, /"salePrice"|"stock"/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousGroqKey == null) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = previousGroqKey;
    if (previousOpenAiKey == null) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousOpenAiKey;
    if (previousProvider == null) delete process.env.VISION_PROVIDER; else process.env.VISION_PROVIDER = previousProvider;
  }
});

test("quick sale reads a product created immediately before the analysis from the current tenant catalog", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({
    name: "Dueña catálogo dinámico",
    email: `catalogo-${suffix}@localito.test`,
    password: "CatalogoSeguro2026",
    businessName: `Almacén catálogo ${suffix}`,
    businessType: "Almacén"
  });
  const created = await repository.createProduct(registered.tenant.id, {
    name: "Galletas recién agregadas 120 g",
    brand: "Marca Nueva",
    category: "Snacks",
    barcode: "7809999999991",
    salePrice: 990,
    stock: 12
  });
  const currentCatalog = await repository.getProducts(registered.tenant.id);
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  let providerInput = "";
  process.env.OPENAI_API_KEY = "test-only-key";
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as { input?: unknown };
    providerInput = JSON.stringify(request.input);
    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        items: [{ observedLabel: "Galletas Marca Nueva", matchedProductId: created.id, candidateProductIds: [created.id], quantity: 1, confidence: 0.96 }],
        warnings: []
      })
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await extractQuickSaleImage("data:image/jpeg;base64,AAAA", currentCatalog);
    assert.match(providerInput, new RegExp(created.id));
    assert.match(providerInput, /Galletas recién agregadas 120 g/);
    assert.equal(result.items[0]?.productId, created.id);
    assert.equal(result.items[0]?.salePrice, 990);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("quick sale adds reviewed quantities to the existing POS ticket without changing inventory", () => {
  const products = [
    { id: "cola", tenantId: "tenant", name: "Bebida cola", category: "Bebidas", costPrice: 700, salePrice: 1_200, stock: 4, minimumStock: 1, active: true },
    { id: "snack", tenantId: "tenant", name: "Snack", category: "Snacks", costPrice: 200, salePrice: 500, stock: 10, minimumStock: 2, active: true }
  ];
  const first = mergeQuickSaleTicket(products, [], [{ productId: "cola", quantity: 2 }, { productId: "snack", quantity: 3 }]);
  assert.equal(first.units, 5);
  assert.equal(first.ticket[0]?.subtotal, 2_400);
  assert.equal(first.ticket[1]?.subtotal, 1_500);
  assert.equal(products[0]?.stock, 4);

  const merged = mergeQuickSaleTicket(products, first.ticket, [{ productId: "cola", quantity: 1 }]);
  assert.equal(merged.ticket.find((item) => item.productId === "cola")?.quantity, 3);
  assert.throws(() => mergeQuickSaleTicket(products, first.ticket, [{ productId: "cola", quantity: 3 }]), /stock registrado es 4/i);
  assert.equal(products[0]?.stock, 4);
});

test("invoice import validates review fields, receives stock once and blocks duplicate invoices", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({
    name: "Dueña factura",
    email: `factura-${suffix}@localito.test`,
    password: "ClaveFactura2026",
    businessName: `Negocio factura ${suffix}`,
    businessType: "Minimarket"
  });
  const existing = await repository.createProduct(registered.tenant.id, {
    name: "Arroz 1 kg",
    category: "Abarrotes",
    barcode: "780000000001",
    costPrice: 700,
    salePrice: 1_000,
    stock: 10
  });
  const payload = normalizeInvoiceImportPayload({
    clientImportId: `import-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    supplierName: "Distribuidora de prueba",
    supplierTaxId: "76.111.222-3",
    invoiceNumber: "F-9001",
    invoiceDate: "2026-08-24",
    total: 4_100,
    items: [
      { clientItemId: "line-1", existingProductId: existing.id, name: existing.name, category: existing.category, quantity: 3, unitCost: 700, salePrice: 1_100 },
      { clientItemId: "line-2", name: "Aceite 1 L", brand: "Marca Dos", category: "Abarrotes", barcode: "780000000002", quantity: 2, unitCost: 1_000, salePrice: 1_500 }
    ]
  });
  assert.ok(invoiceFingerprint(payload));

  const imported = await importInvoice(repository, registered.tenant.id, { id: registered.user.id, name: registered.user.name }, payload);
  assert.equal(imported.purchase.status, "received");
  assert.equal(imported.createdProductIds.length, 1);
  const afterFirst = await repository.getProducts(registered.tenant.id);
  assert.equal(afterFirst.find((product) => product.id === existing.id)?.stock, 13);
  assert.equal(afterFirst.find((product) => product.id === existing.id)?.salePrice, 1_100);
  assert.equal(afterFirst.find((product) => product.id === imported.createdProductIds[0])?.stock, 2);

  const retried = await importInvoice(repository, registered.tenant.id, { id: registered.user.id, name: registered.user.name }, payload);
  assert.equal(retried.alreadyImported, true);
  const afterRetry = await repository.getProducts(registered.tenant.id);
  assert.equal(afterRetry.find((product) => product.id === existing.id)?.stock, 13);
  assert.equal(afterRetry.find((product) => product.id === imported.createdProductIds[0])?.stock, 2);

  await assert.rejects(
    importInvoice(repository, registered.tenant.id, { id: registered.user.id, name: registered.user.name }, { ...payload, clientImportId: `second-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}` }),
    /ya está registrada/i
  );
  assert.ok((await repository.getAuditEvents(registered.tenant.id)).some((event) => event.action === "import_invoice_ai"));
});

test("invoice import rejects unsafe quantities and unconfirmed sale prices before writing", () => {
  assert.throws(
    () => normalizeInvoiceImportPayload({
      clientImportId: "invalid-import",
      supplierName: "Proveedor",
      items: [{ clientItemId: "line-1", name: "Producto", category: "General", quantity: -1, unitCost: 100, salePrice: 0 }]
    }),
    /cantidad|precio/i
  );
  const normalized = normalizeInvoiceImportPayload({
    clientImportId: "rounded-import",
    supplierName: "Proveedor",
    items: [{ clientItemId: "line-1", name: "Producto", category: "General", quantity: 2.2, unitCost: 100.6, salePrice: 151.7 }]
  });
  assert.equal(normalized.items[0].quantity, 2);
  assert.equal(normalized.items[0].unitCost, 101);
  assert.equal(normalized.items[0].salePrice, 152);
});

test("administration can reset credentials and permanently delete users without deleting sale history", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({ name: "Dueña CRUD", email: `owner-crud-${suffix}@localito.test`, password: "OwnerCrud2026", businessName: `CRUD ${suffix}`, businessType: "Almacén" });
  const seller = await repository.createUser(registered.tenant.id, { name: "Vendedor temporal", email: `seller-crud-${suffix}@localito.test`, password: "SellerCrud2026", role: "seller" });
  assert.equal((await repository.getUsers(registered.tenant.id, true)).length, 2);
  assert.equal(await repository.setUserPassword(registered.tenant.id, seller.id, "NuevaClave2026"), true);
  assert.equal((await repository.authenticate(seller.email, "SellerCrud2026")), null);
  assert.equal((await repository.authenticate(seller.email, "NuevaClave2026"))?.user.id, seller.id);
  assert.equal(await repository.deleteUser(registered.tenant.id, seller.id), true);
  assert.equal(await repository.authenticate(seller.email, "NuevaClave2026"), null);
  assert.equal((await repository.getUsers(registered.tenant.id, true)).length, 1);
});

test("platform deletion removes a tenant and all its operational data", async () => {
  const repository = new MemoryRepository();
  const suffix = `${Date.now()}-${Math.random()}`;
  const registered = await repository.registerTenant({ name: "Dueño borrado", email: `delete-${suffix}@localito.test`, password: "DeleteSeguro2026", businessName: `Borrar ${suffix}`, businessType: "Almacén" });
  await repository.createProduct(registered.tenant.id, { name: "Producto a borrar", category: "General", salePrice: 1_000, stock: 2 });
  assert.equal((await repository.listTenants()).some((tenant) => tenant.id === registered.tenant.id), true);
  assert.equal(await repository.deleteTenant(registered.tenant.id), true);
  assert.equal((await repository.listTenants()).some((tenant) => tenant.id === registered.tenant.id), false);
  assert.equal(await repository.authenticate(registered.user.email, "DeleteSeguro2026"), null);
  assert.equal((await repository.getProducts(registered.tenant.id)).length, 0);
});
