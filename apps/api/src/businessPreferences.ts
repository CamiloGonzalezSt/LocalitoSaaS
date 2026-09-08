import type { BusinessPreferences, PaymentMethod } from "@localito/shared";
export function parsePreferences(value: unknown): BusinessPreferences {
  const body = value as BusinessPreferences;
  const allowed: PaymentMethod[] = ["cash", "card", "transfer", "webpay", "mercadopago", "mixed", "credit"];
  if (!body || !Array.isArray(body.paymentMethods) || !body.paymentMethods.length || body.paymentMethods.some(method => !allowed.includes(method)) || new Set(body.paymentMethods).size !== body.paymentMethods.length) throw new Error("Selecciona medios de pago válidos sin repetir.");
  if (body.paymentMethods.includes("mixed") && (!body.paymentMethods.includes("cash") || !body.paymentMethods.includes("card"))) throw new Error("Pago mixto requiere efectivo y tarjeta activos.");
  if (![body.leadDays, body.coverageDays].every(number => Number.isInteger(number) && number >= 1 && number <= 365)) throw new Error("Los plazos deben estar entre 1 y 365 días.");
  const bank = {} as BusinessPreferences["bank"];
  for (const key of ["name", "holder", "taxId", "accountType", "accountNumber", "email"] as const) {
    if (typeof body.bank?.[key] !== "string" || body.bank[key].length > 160) throw new Error("Revisa los datos bancarios.");
    bank[key] = body.bank[key].trim();
  }
  if (bank.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bank.email)) throw new Error("Correo bancario inválido.");
  return { paymentMethods: [...body.paymentMethods], bank, leadDays: body.leadDays, coverageDays: body.coverageDays };
}
export function validProductImage(value: unknown) {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 700000) return false;
  return /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(value) || /^https?:\/\/[^\s]+$/.test(value);
}
