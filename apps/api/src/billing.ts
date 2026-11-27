import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { BillingCheckout, BillingCheckoutStatus, BillingProvider } from "@localito/shared";

/**
 * Integración de pago de planes con Webpay Plus (Transbank) y Mercado Pago
 * Checkout Pro. Por defecto todo corre en ambientes de prueba: Webpay usa las
 * credenciales públicas de integración y Mercado Pago las credenciales de
 * prueba de la cuenta vendedora configurada en MERCADOPAGO_ACCESS_TOKEN.
 */

type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

// Credenciales públicas del ambiente de integración de Transbank.
export const WEBPAY_INTEGRATION_COMMERCE_CODE = "597055555532";
export const WEBPAY_INTEGRATION_API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";
const WEBPAY_HOSTS = {
  integration: "https://webpay3gint.transbank.cl",
  production: "https://webpay3g.transbank.cl"
} as const;
const WEBPAY_TRANSACTIONS_PATH = "/rswebpaytransaction/api/webpay/v1.2/transactions";
const MERCADOPAGO_DEFAULT_API = "https://api.mercadopago.com";
const GATEWAY_TIMEOUT_MS = 15_000;

export class BillingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingConfigError";
  }
}

export class BillingGatewayError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "BillingGatewayError";
  }
}

export interface WebpayConfig {
  environment: "integration" | "production";
  baseUrl: string;
  commerceCode: string;
  apiKey: string;
}

export interface MercadoPagoConfig {
  apiBaseUrl: string;
  accessToken: string;
  sandbox: boolean;
  webhookSecret?: string;
}

export function resolveWebpayConfig(env: Env = process.env): WebpayConfig {
  const environment = env.WEBPAY_ENVIRONMENT?.trim().toLowerCase() === "production" ? "production" : "integration";
  const commerceCode = env.WEBPAY_COMMERCE_CODE?.trim();
  const apiKey = env.WEBPAY_API_KEY?.trim();
  if (environment === "production" && (!commerceCode || !apiKey)) {
    throw new BillingConfigError("Webpay en producción requiere WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY.");
  }
  return {
    environment,
    // WEBPAY_API_BASE_URL solo existe para pruebas automatizadas con una pasarela falsa.
    baseUrl: env.WEBPAY_API_BASE_URL?.trim().replace(/\/+$/, "") || WEBPAY_HOSTS[environment],
    commerceCode: commerceCode || WEBPAY_INTEGRATION_COMMERCE_CODE,
    apiKey: apiKey || WEBPAY_INTEGRATION_API_KEY
  };
}

export function resolveMercadoPagoConfig(env: Env = process.env): MercadoPagoConfig {
  const accessToken = env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new BillingConfigError("Mercado Pago no está configurado. Agrega MERCADOPAGO_ACCESS_TOKEN con el Access Token de prueba de tu cuenta vendedora.");
  }
  const forced = env.MERCADOPAGO_SANDBOX?.trim().toLowerCase();
  const sandbox = forced ? forced !== "false" && forced !== "0" : true;
  return {
    apiBaseUrl: env.MERCADOPAGO_API_BASE_URL?.trim().replace(/\/+$/, "") || MERCADOPAGO_DEFAULT_API,
    accessToken,
    sandbox,
    webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || undefined
  };
}

export function isMercadoPagoConfigured(env: Env = process.env) {
  return Boolean(env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

/** Orden de compra corta y única. Webpay acepta máximo 26 caracteres. */
export function createBuyOrder(now = Date.now()) {
  return `LOC${now.toString(36).toUpperCase()}${randomBytes(4).toString("hex").toUpperCase()}`.slice(0, 26);
}

export function isLocalUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".localhost");
  } catch {
    return true;
  }
}

async function gatewayFetch(fetcher: FetchLike, url: string, init: RequestInit, gatewayName: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetcher(url, { ...init, signal: controller.signal });
  } catch (error) {
    throw new BillingGatewayError(`No pudimos conectar con ${gatewayName}. Intenta nuevamente en unos minutos.`);
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  let payload: Record<string, unknown> = {};
  try { payload = text ? JSON.parse(text) as Record<string, unknown> : {}; } catch { payload = { raw: text.slice(0, 300) }; }
  if (!response.ok) {
    const detail = typeof payload.error_message === "string" ? payload.error_message : typeof payload.message === "string" ? payload.message : `HTTP ${response.status}`;
    console.error(`[billing] ${gatewayName} respondió ${response.status}: ${detail}`);
    throw new BillingGatewayError(`${gatewayName} rechazó la solicitud (${detail}).`, response.status);
  }
  return payload;
}

// ---------------------------------------------------------------------------
// Webpay Plus
// ---------------------------------------------------------------------------

function webpayHeaders(config: WebpayConfig) {
  return {
    "Tbk-Api-Key-Id": config.commerceCode,
    "Tbk-Api-Key-Secret": config.apiKey,
    "Content-Type": "application/json"
  };
}

export async function createWebpayTransaction(
  input: { buyOrder: string; sessionId: string; amount: number; returnUrl: string },
  config = resolveWebpayConfig(),
  fetcher: FetchLike = fetch
) {
  const payload = await gatewayFetch(fetcher, `${config.baseUrl}${WEBPAY_TRANSACTIONS_PATH}`, {
    method: "POST",
    headers: webpayHeaders(config),
    body: JSON.stringify({
      buy_order: input.buyOrder,
      session_id: input.sessionId.slice(0, 61),
      amount: Math.round(input.amount),
      return_url: input.returnUrl
    })
  }, "Webpay");
  if (typeof payload.token !== "string" || typeof payload.url !== "string") {
    throw new BillingGatewayError("Webpay no devolvió un token de pago.");
  }
  return { token: payload.token, url: payload.url };
}

export interface WebpayCommitResult {
  status?: string;
  response_code?: number;
  amount?: number;
  buy_order?: string;
  session_id?: string;
  authorization_code?: string;
  payment_type_code?: string;
  installments_number?: number;
  transaction_date?: string;
  card_detail?: { card_number?: string };
}

export async function commitWebpayTransaction(token: string, config = resolveWebpayConfig(), fetcher: FetchLike = fetch) {
  return await gatewayFetch(fetcher, `${config.baseUrl}${WEBPAY_TRANSACTIONS_PATH}/${encodeURIComponent(token)}`, {
    method: "PUT",
    headers: webpayHeaders(config)
  }, "Webpay") as WebpayCommitResult;
}

/** Consulta el estado de una transacción ya confirmada (útil si el commit se repite). */
export async function getWebpayTransactionStatus(token: string, config = resolveWebpayConfig(), fetcher: FetchLike = fetch) {
  return await gatewayFetch(fetcher, `${config.baseUrl}${WEBPAY_TRANSACTIONS_PATH}/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: webpayHeaders(config)
  }, "Webpay") as WebpayCommitResult;
}

/** Interpreta el resultado del commit contra el checkout que esperábamos cobrar. */
export function evaluateWebpayCommit(checkout: Pick<BillingCheckout, "amount" | "buyOrder">, result: WebpayCommitResult): { status: BillingCheckoutStatus; detail: string } {
  if (result.buy_order !== checkout.buyOrder) return { status: "failed", detail: "La orden de compra no coincide." };
  if (Number(result.amount) !== checkout.amount) return { status: "failed", detail: "El monto autorizado no coincide con el plan." };
  if (result.status === "AUTHORIZED" && Number(result.response_code) === 0) return { status: "approved", detail: "Pago autorizado por Webpay." };
  return { status: "rejected", detail: `Webpay rechazó el pago (${result.status ?? "sin estado"}, código ${result.response_code ?? "?"}).` };
}

export function sanitizeWebpayResponse(result: WebpayCommitResult) {
  return {
    status: result.status,
    responseCode: result.response_code,
    authorizationCode: result.authorization_code,
    paymentTypeCode: result.payment_type_code,
    installments: result.installments_number,
    cardLast4: result.card_detail?.card_number,
    transactionDate: result.transaction_date
  };
}

/**
 * Clasifica el retorno de Webpay. Flujos documentados por Transbank:
 * normal (token_ws), anulado por el usuario (TBK_TOKEN + TBK_ORDEN_COMPRA)
 * y timeout (solo TBK_ORDEN_COMPRA / TBK_ID_SESION).
 */
export function classifyWebpayReturn(params: Record<string, unknown>) {
  const read = (key: string) => typeof params[key] === "string" && (params[key] as string).trim() ? (params[key] as string).trim() : undefined;
  const tokenWs = read("token_ws");
  const tbkToken = read("TBK_TOKEN");
  const buyOrder = read("TBK_ORDEN_COMPRA");
  if (tokenWs) return { kind: "commit" as const, token: tokenWs };
  if (tbkToken) return { kind: "aborted" as const, token: tbkToken, buyOrder };
  if (buyOrder) return { kind: "timeout" as const, buyOrder };
  return { kind: "invalid" as const };
}

// ---------------------------------------------------------------------------
// Mercado Pago Checkout Pro
// ---------------------------------------------------------------------------

export async function createMercadoPagoPreference(
  input: {
    checkoutId: string;
    title: string;
    amount: number;
    payerEmail?: string;
    returnUrl: string;
    notificationUrl?: string;
  },
  config = resolveMercadoPagoConfig(),
  fetcher: FetchLike = fetch
) {
  const publicReturn = !isLocalUrl(input.returnUrl);
  const body: Record<string, unknown> = {
    items: [{ id: input.checkoutId, title: input.title, quantity: 1, currency_id: "CLP", unit_price: Math.round(input.amount) }],
    external_reference: input.checkoutId,
    back_urls: { success: input.returnUrl, failure: input.returnUrl, pending: input.returnUrl },
    statement_descriptor: "LOCALITO",
    metadata: { checkout_id: input.checkoutId }
  };
  // Mercado Pago rechaza auto_return y notificaciones hacia localhost.
  if (publicReturn) body.auto_return = "approved";
  if (input.notificationUrl && !isLocalUrl(input.notificationUrl)) body.notification_url = input.notificationUrl;
  if (input.payerEmail) body.payer = { email: input.payerEmail };

  const payload = await gatewayFetch(fetcher, `${config.apiBaseUrl}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.checkoutId
    },
    body: JSON.stringify(body)
  }, "Mercado Pago");

  const initPoint = typeof payload.init_point === "string" ? payload.init_point : undefined;
  const sandboxInitPoint = typeof payload.sandbox_init_point === "string" ? payload.sandbox_init_point : undefined;
  // Los tokens antiguos "TEST-..." usan sandbox_init_point; las cuentas de prueba
  // actuales (APP_USR de un vendedor de prueba) pagan sobre init_point.
  const redirectUrl = config.accessToken.startsWith("TEST-") ? sandboxInitPoint ?? initPoint : initPoint ?? sandboxInitPoint;
  if (typeof payload.id !== "string" || !redirectUrl) throw new BillingGatewayError("Mercado Pago no devolvió el enlace de pago.");
  return { preferenceId: payload.id, redirectUrl };
}

export interface MercadoPagoPayment {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  payment_type_id?: string;
  payment_method_id?: string;
  date_approved?: string;
}

export async function getMercadoPagoPayment(paymentId: string, config = resolveMercadoPagoConfig(), fetcher: FetchLike = fetch) {
  if (!/^\d{1,30}$/.test(paymentId)) throw new BillingGatewayError("Identificador de pago de Mercado Pago inválido.");
  return await gatewayFetch(fetcher, `${config.apiBaseUrl}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${config.accessToken}` }
  }, "Mercado Pago") as MercadoPagoPayment;
}

export function evaluateMercadoPagoPayment(checkout: Pick<BillingCheckout, "id" | "amount">, payment: MercadoPagoPayment): { status: BillingCheckoutStatus; detail: string } {
  if (payment.external_reference !== checkout.id) return { status: "failed", detail: "El pago no corresponde a este checkout." };
  if (payment.currency_id && payment.currency_id !== "CLP") return { status: "failed", detail: "La moneda del pago no es CLP." };
  if (payment.status === "approved") {
    if (Math.round(Number(payment.transaction_amount)) !== checkout.amount) return { status: "failed", detail: "El monto pagado no coincide con el plan." };
    return { status: "approved", detail: "Pago aprobado por Mercado Pago." };
  }
  if (payment.status === "pending" || payment.status === "in_process" || payment.status === "authorized") {
    return { status: "pending", detail: `Pago en revisión (${payment.status_detail ?? payment.status}).` };
  }
  if (payment.status === "cancelled") return { status: "cancelled", detail: "Pago cancelado en Mercado Pago." };
  return { status: "rejected", detail: `Mercado Pago rechazó el pago (${payment.status_detail ?? payment.status ?? "sin estado"}).` };
}

export function sanitizeMercadoPagoPayment(payment: MercadoPagoPayment) {
  return {
    paymentId: payment.id != null ? String(payment.id) : undefined,
    status: payment.status,
    statusDetail: payment.status_detail,
    paymentType: payment.payment_type_id,
    paymentMethod: payment.payment_method_id,
    dateApproved: payment.date_approved
  };
}

/**
 * Valida la firma x-signature de los webhooks de Mercado Pago. Solo se exige
 * cuando MERCADOPAGO_WEBHOOK_SECRET está configurado; igual se vuelve a
 * consultar el pago a la API antes de activar cualquier plan.
 */
export function verifyMercadoPagoSignature(input: { signature?: string; requestId?: string; dataId?: string; secret: string }) {
  if (!input.signature || !input.dataId) return false;
  const parts = Object.fromEntries(input.signature.split(",").map((part) => {
    const [key, ...rest] = part.split("=");
    return [key.trim(), rest.join("=").trim()];
  }));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const dataId = /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  let manifest = `id:${dataId};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(v1, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function providerLabel(provider: BillingProvider) {
  return provider === "webpay" ? "Webpay" : "Mercado Pago";
}
