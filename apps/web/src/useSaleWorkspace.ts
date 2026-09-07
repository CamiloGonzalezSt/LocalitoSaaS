import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PaymentMethod, Product, SaleItem } from "@localito/shared";

export type SaleDraft = {
  id: string;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  customerId: string;
  discount: string;
  notes: string;
  cashPart: string;
  savedAt: string;
};
type Workspace = { active: SaleDraft; held: SaleDraft[]; favorites: string[] };
export function emptyDraft(): SaleDraft {
  return { id: crypto.randomUUID(), items: [], paymentMethod: "cash", customerId: "", discount: "", notes: "", cashPart: "", savedAt: new Date().toISOString() };
}
export function saleStorageKey(tenantId: string, userId: string) {
  return `localito-sales:v1:${encodeURIComponent(tenantId)}:${encodeURIComponent(userId)}`;
}
function validDraft(value: unknown): value is SaleDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as SaleDraft;
  return typeof draft.id === "string" && Array.isArray(draft.items) && draft.items.every(item =>
    item && typeof item.productId === "string" && typeof item.productName === "string" &&
    Number.isFinite(item.quantity) && item.quantity > 0 && Number.isFinite(item.unitPrice) && item.unitPrice >= 0 && Number.isFinite(item.subtotal)) &&
    ["cash", "card", "transfer", "webpay", "mercadopago", "credit", "mixed"].includes(draft.paymentMethod) &&
    [draft.customerId, draft.discount, draft.notes, draft.cashPart, draft.savedAt].every(value => typeof value === "string");
}
export function parseWorkspace(raw: string | null): Workspace {
  const empty = { active: emptyDraft(), held: [], favorites: [] };
  if (!raw) return empty;
  const parsed = JSON.parse(raw) as Workspace;
  if (!parsed || !validDraft(parsed.active) || !Array.isArray(parsed.held) || !parsed.held.every(validDraft) ||
      !Array.isArray(parsed.favorites) || !parsed.favorites.every(id => typeof id === "string")) throw new Error("Invalid saved sale");
  return parsed;
}
export function reconcileDraft(draft: SaleDraft, products: Product[]) {
  const changes: string[] = [];
  const items = draft.items.flatMap(item => {
    const product = products.find(product => product.id === item.productId && product.active !== false);
    if (!product) { changes.push(`${item.productName}: ya no disponible`); return []; }
    const quantity = product.trackStock === false ? item.quantity : Math.min(item.quantity, Math.max(0, product.stock));
    if (quantity !== item.quantity) changes.push(`${product.name}: cantidad ajustada por stock`);
    if (product.salePrice !== item.unitPrice) changes.push(`${product.name}: precio actualizado`);
    return quantity > 0 ? [{ productId: product.id, productName: product.name, quantity, unitPrice: product.salePrice, subtotal: quantity * product.salePrice }] : [];
  });
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = Math.min(Math.max(0, Number(draft.discount) || 0), total);
  if (discount !== (Number(draft.discount) || 0)) changes.push("Descuento ajustado al total");
  return { draft: { ...draft, items, discount: discount ? String(discount) : "" }, changes };
}

export function useSaleWorkspace(tenantId?: string, userId?: string) {
  const key = tenantId && userId ? saleStorageKey(tenantId, userId) : null;
  const cache = useRef<{ key: string | null; value: Workspace }>({ key: null, value: parseWorkspace(null) });
  const [, render] = useState(0);
  const [storageError, setStorageError] = useState("");

  function ensureWorkspace() {
    if (cache.current.key !== key) {
      let value = parseWorkspace(null);
      try { if (key) value = parseWorkspace(localStorage.getItem(key)); }
      catch { setStorageError("No se pudo recuperar el ticket guardado. Revisa el almacenamiento de este navegador."); }
      cache.current = { key, value };
    }
    return cache.current.value;
  }
  useEffect(() => { ensureWorkspace(); render(value => value + 1); }, [key]);

  function update(change: (workspace: Workspace) => Workspace) {
    if (!key) return;
    const next = change(ensureWorkspace());
    cache.current = { key, value: next };
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(""); }
    catch { setStorageError("No se pudo guardar el ticket en este dispositivo. No cierres ni recargues la página."); }
    render(value => value + 1);
  }
  const workspace = cache.current.key === key ? cache.current.value : { active: emptyDraft(), held: [], favorites: [] };
  function setField<K extends keyof SaleDraft>(field: K, value: SetStateAction<SaleDraft[K]>) {
    update(current => ({ ...current, active: { ...current.active, [field]: typeof value === "function" ? (value as (current: SaleDraft[K]) => SaleDraft[K])(current.active[field]) : value } }));
  }
  const setTicket: Dispatch<SetStateAction<SaleItem[]>> = value => setField("items", value);
  return {
    ...workspace, storageError, setTicket,
    setPaymentMethod: (value: PaymentMethod) => setField("paymentMethod", value),
    setCustomerId: (value: SetStateAction<string>) => setField("customerId", value),
    setDiscount: (value: string) => setField("discount", value),
    setNotes: (value: string) => setField("notes", value),
    setCashPart: (value: string) => setField("cashPart", value),
    replaceActive: (active: SaleDraft) => update(current => ({ ...current, active })),
    reset: () => update(current => ({ ...current, active: emptyDraft() })),
    hold: () => update(current => current.active.items.length ? ({ ...current, held: [...current.held, { ...current.active, savedAt: new Date().toISOString() }], active: emptyDraft() }) : current),
    resume: (id: string, active: SaleDraft) => update(current => ({ ...current, held: [...current.held.filter(draft => draft.id !== id), ...(current.active.items.length ? [{ ...current.active, savedAt: new Date().toISOString() }] : [])], active })),
    discard: (id: string) => update(current => ({ ...current, held: current.held.filter(draft => draft.id !== id) })),
    toggleFavorite: (id: string) => update(current => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter(value => value !== id) : [...current.favorites, id] }))
  };
}
