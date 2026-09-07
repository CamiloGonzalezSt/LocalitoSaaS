import type { DebtAccount, PaymentMethod, Product, Sale } from "@localito/shared";

export type InventoryFilter = "all" | "low" | "out" | "expiring" | "expired";
export type CustomerFilter = "clients" | "credit" | "pending" | "overdue";

export const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", webpay: "Webpay",
  mercadopago: "Mercado Pago", credit: "Fiado", mixed: "Pago mixto"
};

export function businessDay(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function matchesInventoryFilter(product: Product, filter: InventoryFilter, today = businessDay()) {
  if (product.active === false) return false;
  if (filter === "all") return true;
  if (filter === "low") return product.trackStock !== false && product.stock <= product.minimumStock;
  if (filter === "out") return product.trackStock !== false && product.stock <= 0;
  if (!product.expiryDate || product.stock <= 0) return false;
  const expiry = product.expiryDate.slice(0, 10);
  if (filter === "expired") return expiry < today;
  // Calendar days, independent of Chile's daylight-saving transitions.
  const limit = new Date(`${today}T12:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + 30);
  return expiry >= today && expiry <= limit.toISOString().slice(0, 10);
}

export function overdueDebts(debts: DebtAccount[], today = businessDay()) {
  return debts.filter(debt => debt.balance > 0 && debt.status !== "paid" && debt.status !== "cancelled" &&
    (debt.dueDate ? debt.dueDate.slice(0, 10) < today : debt.status === "overdue"));
}

export function recentSales(sales: Sale[]) {
  return sales.filter(sale => sale.status !== "cancelled")
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, 6);
}

export function dashboardDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
