import { Edit3, Minus, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Product } from "@localito/shared";
import { FormField, FormSurface } from "./FormControls";
import { formatCLP } from "./lib/format";

type Props = {
  product: Product;
  imageUrl: string;
  canManageProducts: boolean;
  isBusy: boolean;
  selected: boolean;
  onSelect: () => void;
  onAdjustStock: (product: Product, delta: number) => void;
  onEdit: (product: Product) => void;
  onDeactivate: (product: Product) => void;
  onQuickUpdate?: (product: Product, salePrice: number, stock: number) => Promise<void>;
};

export function InventoryRow({ product, imageUrl, canManageProducts, isBusy, selected, onSelect, onAdjustStock, onEdit, onDeactivate, onQuickUpdate }: Props) {
  const tracked = product.trackStock !== false;
  const status = !tracked ? "neutral" : product.stock <= 0 ? "urgent" : product.stock <= product.minimumStock ? "warning" : "normal";
  const label = { neutral: "Sin control", urgent: "Agotado", warning: "Stock bajo", normal: "Disponible" }[status];
  const [draft, setDraft] = useState<{ price: string; stock: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = isBusy || saving;
  async function save() {
    if (!draft || !onQuickUpdate || busy) return;
    setSaving(true);
    setError("");
    try {
      await onQuickUpdate(product, Number(draft.price), tracked ? Number(draft.stock) : product.stock);
      setDraft(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron guardar los cambios. Intenta nuevamente.");
    } finally { setSaving(false); }
  }
  return <div className={`product-row inventory-compact-row ui-inventory-row${selected ? " is-selected" : ""}`}>
    <div className="inventory-select">{canManageProducts && <input type="checkbox" checked={selected} disabled={busy} onChange={onSelect} aria-label={`Seleccionar ${product.name}`} />}</div>
    <div className="inventory-product-cell">
      <img className="inventory-image" src={imageUrl} alt="" />
      <div className="inventory-identity">
        {canManageProducts ? <button className="inventory-name" type="button" disabled={busy} onClick={() => onEdit(product)} title="Editar ficha completa" aria-label={`Editar ${product.name}`}>{product.name}</button> : <strong>{product.name}</strong>}
        <small>{product.category}{product.barcode ? ` · ${product.barcode}` : ""}</small>
        <span className={`ui-stock-status ${status}`}>{label}</span>
      </div>
    </div>
    <div className="inventory-value inventory-stock"><span>Stock</span><strong>{tracked ? product.stock : "Sin control"}</strong></div>
    <div className="inventory-value inventory-minimum"><span>Mínimo</span><strong>{tracked ? product.minimumStock : "-"}</strong></div>
    <div className="inventory-value inventory-cost"><span>Costo</span><strong>{formatCLP(product.costPrice)}</strong></div>
    <div className="inventory-value inventory-price"><span>Precio</span><strong>{formatCLP(product.salePrice)}</strong></div>
    <div className="inventory-row-actions">
      {canManageProducts && <>
        <button className="icon-button" type="button" disabled={busy} onClick={() => { setError(""); setDraft({ price: String(product.salePrice), stock: String(product.stock) }); }} aria-expanded={Boolean(draft)} aria-label={`Edición rápida de ${product.name}`} title="Edición rápida"><Edit3 size={17}/></button>
        {tracked && <><button className="icon-button" type="button" disabled={busy || product.stock <= 0} onClick={() => onAdjustStock(product, -1)} aria-label={`Bajar stock de ${product.name}`} title="Restar una unidad"><Minus size={17}/></button><button className="icon-button" type="button" disabled={busy} onClick={() => onAdjustStock(product, 1)} aria-label={`Subir stock de ${product.name}`} title="Sumar una unidad"><Plus size={17}/></button></>}
        <button className="icon-button danger" type="button" disabled={busy} onClick={() => onDeactivate(product)} aria-label={`Desactivar ${product.name}`} title="Desactivar producto"><Trash2 size={17}/></button>
      </>}
    </div>
    {draft && canManageProducts && <FormSurface className="inventory-inline-editor" label={`Edición rápida de ${product.name}`} busy={busy} onSave={() => void save()}>
      <FormField label={`Precio de ${product.name}`} className="inventory-edit-price" type="number" min="1" step="1" required value={draft.price} onChange={price => setDraft({ ...draft, price })}/>
      {tracked && <FormField label={`Stock de ${product.name}`} className="inventory-edit-stock" type="number" min="0" step="any" required value={draft.stock} onChange={stock => setDraft({ ...draft, stock })}/>}
      <div className="ui-form-actions"><button className="primary-action small" type="submit" aria-label={`Guardar cambios de ${product.name}`}><Save size={17}/>{saving ? "Guardando..." : "Guardar"}</button><button className="icon-button" type="button" onClick={() => setDraft(null)} aria-label={`Cancelar cambios de ${product.name}`} title="Cancelar edición"><X size={17}/></button></div>
      {error && <p className="field-error inventory-save-error" role="alert">{error}</p>}
    </FormSurface>}
  </div>;
}
