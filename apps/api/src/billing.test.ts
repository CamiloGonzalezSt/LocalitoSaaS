import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import type { BillingCheckout } from "@localito/shared";
import {
  BillingConfigError,
  classifyWebpayReturn,
  commitWebpayTransaction,
  createBuyOrder,
  createMercadoPagoPreference,
  createWebpayTransaction,
  evaluateMercadoPagoPayment,
  evaluateWebpayCommit,
  getMercadoPagoPayment,
  resolveMercadoPagoConfig,
  resolveWebpayConfig,
  verifyMercadoPagoSignature,
  WEBPAY_INTEGRATION_API_KEY,
  WEBPAY_INTEGRATION_COMMERCE_CODE
} from "./billing.js";
import { MemoryRepository } from "./repository.js";

type Call = { url: string; init?: RequestInit };
function fakeFetch(body: unknown, status = 200) {
  const calls: Call[] = [];
  const fetcher = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  };
  return { fetcher, calls };
}

test("Webpay uses the public integration credentials unless production is configured", () => {
  const config = resolveWebpayConfig({});
  assert.equal(config.environment, "integration");
  assert.equal(config.baseUrl, "https://webpay3gint.transbank.cl");
  assert.equal(config.commerceCode, WEBPAY_INTEGRATION_COMMERCE_CODE);
  assert.equal(config.apiKey, WEBPAY_INTEGRATION_API_KEY);
  assert.throws(() => resolveWebpayConfig({ WEBPAY_ENVIRONMENT: "production" }), BillingConfigError);
  assert.equal(resolveWebpayConfig({ WEBPAY_ENVIRONMENT: "production", WEBPAY_COMMERCE_CODE: "1", WEBPAY_API_KEY: "k" }).baseUrl, "https://webpay3g.transbank.cl");
});

test("Mercado Pago requires an access token and defaults to sandbox", () => {
  assert.throws(() => resolveMercadoPagoConfig({}), /MERCADOPAGO_ACCESS_TOKEN/);
  const config = resolveMercadoPagoConfig({ MERCADOPAGO_ACCESS_TOKEN: " APP_USR-123 " });
  assert.equal(config.accessToken, "APP_USR-123");
  assert.equal(config.sandbox, true);
  assert.equal(resolveMercadoPagoConfig({ MERCADOPAGO_ACCESS_TOKEN: "x", MERCADOPAGO_SANDBOX: "false" }).sandbox, false);
});

test("buy orders fit the 26 character Webpay limit and are unique", () => {
  const orders = new Set(Array.from({ length: 200 }, () => createBuyOrder()));
  assert.equal(orders.size, 200);
  for (const order of orders) assert.ok(order.length <= 26 && /^[A-Z0-9]+$/.test(order), order);
});

test("Webpay create and commit send the Transbank headers and payload", async () => {
  const config = resolveWebpayConfig({});
  const created = fakeFetch({ token: "tok123", url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" });
  const result = await createWebpayTransaction({ buyOrder: "LOC1", sessionId: "s".repeat(80), amount: 19990, returnUrl: "http://localhost:3000/billing/webpay/return" }, config, created.fetcher);
  assert.deepEqual(result, { token: "tok123", url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" });
  assert.equal(created.calls[0].url, "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions");
  assert.equal(created.calls[0].init?.method, "POST");
  const headers = created.calls[0].init?.headers as Record<string, string>;
  assert.equal(headers["Tbk-Api-Key-Id"], WEBPAY_INTEGRATION_COMMERCE_CODE);
  assert.equal(headers["Tbk-Api-Key-Secret"], WEBPAY_INTEGRATION_API_KEY);
  const body = JSON.parse(String(created.calls[0].init?.body));
  assert.equal(body.amount, 19990);
  assert.equal(body.session_id.length, 61);

  const committed = fakeFetch({ status: "AUTHORIZED", response_code: 0, amount: 19990, buy_order: "LOC1" });
  await commitWebpayTransaction("tok 123", config, committed.fetcher);
  assert.equal(committed.calls[0].init?.method, "PUT");
  assert.ok(committed.calls[0].url.endsWith("/transactions/tok%20123"));
});

test("Webpay gateway errors surface as readable messages", async () => {
  const failing = fakeFetch({ error_message: "Invalid value for parameter: amount" }, 422);
  await assert.rejects(createWebpayTransaction({ buyOrder: "LOC1", sessionId: "s", amount: 1, returnUrl: "http://x" }, resolveWebpayConfig({}), failing.fetcher), /Webpay rechazó la solicitud \(Invalid value/);
});

test("Webpay returns are classified per Transbank flows", () => {
  assert.deepEqual(classifyWebpayReturn({ token_ws: "abc" }), { kind: "commit", token: "abc" });
  assert.deepEqual(classifyWebpayReturn({ TBK_TOKEN: "abc", TBK_ORDEN_COMPRA: "LOC1", TBK_ID_SESION: "s" }), { kind: "aborted", token: "abc", buyOrder: "LOC1" });
  assert.deepEqual(classifyWebpayReturn({ TBK_ORDEN_COMPRA: "LOC1", TBK_ID_SESION: "s" }), { kind: "timeout", buyOrder: "LOC1" });
  assert.deepEqual(classifyWebpayReturn({}), { kind: "invalid" });
});

test("Webpay commits only approve the exact order and amount", () => {
  const checkout = { amount: 9990, buyOrder: "LOC1" };
  assert.equal(evaluateWebpayCommit(checkout, { status: "AUTHORIZED", response_code: 0, amount: 9990, buy_order: "LOC1" }).status, "approved");
  assert.equal(evaluateWebpayCommit(checkout, { status: "FAILED", response_code: -1, amount: 9990, buy_order: "LOC1" }).status, "rejected");
  assert.equal(evaluateWebpayCommit(checkout, { status: "AUTHORIZED", response_code: 0, amount: 10, buy_order: "LOC1" }).status, "failed");
  assert.equal(evaluateWebpayCommit(checkout, { status: "AUTHORIZED", response_code: 0, amount: 9990, buy_order: "OTHER" }).status, "failed");
});

test("Mercado Pago preferences skip auto_return on localhost and pick the right init point", async () => {
  const config = resolveMercadoPagoConfig({ MERCADOPAGO_ACCESS_TOKEN: "APP_USR-test" });
  const local = fakeFetch({ id: "pref-1", init_point: "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-1", sandbox_init_point: "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=pref-1" });
  const result = await createMercadoPagoPreference({ checkoutId: "c1", title: "Localito Pro", amount: 19990, returnUrl: "http://localhost:3000/billing/mercadopago/return?checkout=c1", notificationUrl: "http://localhost:3000/billing/mercadopago/webhook" }, config, local.fetcher);
  assert.equal(result.redirectUrl, "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-1");
  const body = JSON.parse(String(local.calls[0].init?.body));
  assert.equal(body.auto_return, undefined);
  assert.equal(body.notification_url, undefined);
  assert.equal(body.external_reference, "c1");
  assert.deepEqual(body.items[0], { id: "c1", title: "Localito Pro", quantity: 1, currency_id: "CLP", unit_price: 19990 });
  assert.equal((local.calls[0].init?.headers as Record<string, string>).Authorization, "Bearer APP_USR-test");

  const legacy = fakeFetch({ id: "pref-2", init_point: "https://prod", sandbox_init_point: "https://sandbox" });
  const publicResult = await createMercadoPagoPreference({ checkoutId: "c2", title: "Pro", amount: 1, returnUrl: "https://localito-saas.vercel.app/api/billing/mercadopago/return?checkout=c2", notificationUrl: "https://localito-saas.vercel.app/api/billing/mercadopago/webhook" }, resolveMercadoPagoConfig({ MERCADOPAGO_ACCESS_TOKEN: "TEST-123" }), legacy.fetcher);
  assert.equal(publicResult.redirectUrl, "https://sandbox");
  const publicBody = JSON.parse(String(legacy.calls[0].init?.body));
  assert.equal(publicBody.auto_return, "approved");
  assert.equal(publicBody.notification_url, "https://localito-saas.vercel.app/api/billing/mercadopago/webhook");
});

test("Mercado Pago payments are validated against reference, currency and amount", async () => {
  const checkout = { id: "c1", amount: 19990 };
  assert.equal(evaluateMercadoPagoPayment(checkout, { status: "approved", external_reference: "c1", transaction_amount: 19990, currency_id: "CLP" }).status, "approved");
  assert.equal(evaluateMercadoPagoPayment(checkout, { status: "approved", external_reference: "other", transaction_amount: 19990 }).status, "failed");
  assert.equal(evaluateMercadoPagoPayment(checkout, { status: "approved", external_reference: "c1", transaction_amount: 100 }).status, "failed");
  assert.equal(evaluateMercadoPagoPayment(checkout, { status: "in_process", external_reference: "c1" }).status, "pending");
  assert.equal(evaluateMercadoPagoPayment(checkout, { status: "rejected", status_detail: "cc_rejected_other_reason", external_reference: "c1" }).status, "rejected");
  await assert.rejects(getMercadoPagoPayment("../users/me", resolveMercadoPagoConfig({ MERCADOPAGO_ACCESS_TOKEN: "x" }), fakeFetch({}).fetcher), /inválido/);
});

test("Mercado Pago webhook signatures follow the x-signature manifest", () => {
  const secret = "secreto-de-prueba";
  const ts = "1742505638683";
  const manifest = `id:123456;request-id:req-1;ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  assert.equal(verifyMercadoPagoSignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "123456", secret }), true);
  assert.equal(verifyMercadoPagoSignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-2", dataId: "123456", secret }), false);
  assert.equal(verifyMercadoPagoSignature({ signature: "ts=1", requestId: "req-1", dataId: "123456", secret }), false);
  assert.equal(verifyMercadoPagoSignature({ signature: undefined, dataId: "123456", secret }), false);
});

test("billing checkouts transition from pending only once", async () => {
  const repo = new MemoryRepository();
  const now = new Date().toISOString();
  const checkout: BillingCheckout = { id: randomUUID(), tenantId: randomUUID(), plan: "pro", provider: "webpay", environment: "integration", amount: 19990, currency: "CLP", status: "pending", buyOrder: createBuyOrder(), createdAt: now, updatedAt: now };
  await repo.createBillingCheckout(checkout);
  await repo.updateBillingCheckout(checkout.id, { externalToken: "tok" });
  assert.equal((await repo.findBillingCheckout({ externalToken: "tok" }))?.id, checkout.id);
  assert.equal((await repo.findBillingCheckout({ buyOrder: checkout.buyOrder }))?.id, checkout.id);
  const first = await repo.updateBillingCheckout(checkout.id, { status: "approved" }, "pending");
  const second = await repo.updateBillingCheckout(checkout.id, { status: "rejected" }, "pending");
  assert.equal(first?.status, "approved");
  assert.equal(second, null);
  assert.equal((await repo.getBillingCheckout(checkout.id))?.status, "approved");
});
