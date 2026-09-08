import type { SaleCreationPayload } from "./repository.js";

const methods = new Set(["cash", "card", "transfer", "webpay", "mercadopago", "credit", "mixed"]);
function invalid(message: string): never { throw Object.assign(new Error(message), { status: 400 }); }
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const money = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function assertSalePayload(value: unknown): asserts value is SaleCreationPayload {
  if (!record(value) || !Array.isArray(value.items) || !value.items.length || value.items.length > 500) invalid("La venta requiere entre 1 y 500 productos.");
  if (typeof value.paymentMethod !== "string" || !methods.has(value.paymentMethod)) invalid("Medio de pago invalido.");
  const products = new Set<string>();
  for (const item of value.items) {
    if (!record(item) || typeof item.productId !== "string" || !item.productId.trim() || item.productId.length > 160 || typeof item.quantity !== "number" || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1_000_000) invalid("Cada producto debe tener una cantidad positiva y valida.");
    if (products.has(item.productId)) invalid("Un producto no puede repetirse en la venta; agrupa su cantidad.");
    products.add(item.productId);
  }
  if (value.discount !== undefined && !money(value.discount)) invalid("El descuento debe ser un monto entero no negativo.");
  for (const [field, max] of [["customerId", 160], ["idempotencyKey", 160], ["notes", 1000]] as const) {
    if (value[field] !== undefined && (typeof value[field] !== "string" || value[field].length > max || (field !== "notes" && !value[field].trim()))) invalid(`El campo ${field} tiene un formato invalido.`);
  }
  if (value.payments !== undefined) {
    if (!Array.isArray(value.payments) || !value.payments.length || value.payments.length > 6) invalid("El detalle de pagos debe contener entre 1 y 6 medios.");
    const used = new Set<string>();
    for (const payment of value.payments) {
      if (!record(payment) || typeof payment.method !== "string" || !methods.has(payment.method) || payment.method === "mixed" || !money(payment.amount) || payment.amount === 0) invalid("Cada pago debe tener un medio valido y un monto entero positivo.");
      if (used.has(payment.method)) invalid("Un medio de pago no puede repetirse en el detalle.");
      used.add(payment.method);
    }
    if (value.paymentMethod !== "mixed" && (value.payments.length !== 1 || value.payments[0].method !== value.paymentMethod)) invalid("El detalle no coincide con el medio de pago de la venta.");
  }
  if (value.paymentMethod === "mixed" && (!Array.isArray(value.payments) || value.payments.length < 2)) invalid("El pago mixto requiere al menos dos medios de pago.");
}

export function settleSale(body: SaleCreationPayload, subtotal: number) {
  const discount = body.discount ?? 0;
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) invalid("El total debe ser un monto valido en pesos enteros.");
  if (discount > subtotal) invalid("El descuento no puede superar el subtotal.");
  const total = subtotal - discount;
  const payments = body.payments;
  if (payments && payments.reduce((sum, payment) => sum + payment.amount, 0) !== total) invalid("La suma de los medios de pago debe coincidir con el total de la venta.");
  const creditAmount = payments?.find(payment => payment.method === "credit")?.amount ?? (body.paymentMethod === "credit" ? total : 0);
  return { discount, total, payments, creditAmount };
}
