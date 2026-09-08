import type { Product, PurchaseOrder, Sale } from "@localito/shared";
export function planReplenishment(products: Product[], sales: Sale[], purchases: PurchaseOrder[], leadDays: number, coverageDays: number, now = Date.now()) {
  const units = new Map<string, number>();
  for (const sale of sales) {
    const time = Date.parse(sale.createdAt);
    if (sale.status !== "active" || time < now - 30 * 86400000 || time > now) continue;
    for (const item of sale.items) units.set(item.productId, (units.get(item.productId) ?? 0) + item.quantity);
  }
  const incoming = new Map<string, number>();
  for (const purchase of purchases.filter(purchase => ["ordered", "partially_received"].includes(purchase.status))) {
    for (const item of purchase.items) incoming.set(item.productId, (incoming.get(item.productId) ?? 0) + Math.max(0, item.quantity - item.receivedQuantity));
  }
  return products.filter(product => product.active && product.trackStock !== false).map(product => {
    const sold = units.get(product.id) ?? 0, daily = sold / 30, onOrder = incoming.get(product.id) ?? 0;
    const target = Math.max(product.minimumStock * 2, Math.ceil(daily * (leadDays + coverageDays)));
    const quantity = Math.max(0, Math.ceil(target - product.stock - onOrder));
    return { product, sold, daily, onOrder, quantity, daysLeft: daily > 0 ? product.stock / daily : null, slow: sold === 0 && product.stock > 0 };
  }).sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
}
