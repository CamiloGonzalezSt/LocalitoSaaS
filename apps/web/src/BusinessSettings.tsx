import { useState } from "react";
import { ArrowUp, ArrowDown, Save } from "lucide-react";
import { defaultBusinessPreferences } from "@localito/shared";
import type { BusinessPreferences, Tenant } from "@localito/shared";
import { api } from "./lib/api";
import { FormField, FormSurface } from "./FormControls";
export const methodNames: Record<string, string> = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", webpay: "Webpay", mercadopago: "Mercado Pago", mixed: "Pago mixto", credit: "Fiado" };
export function BusinessSettings({ tenant, onSaved }: { tenant: Tenant; onSaved: (tenant: Tenant) => void }) {
  const [form, setForm] = useState<BusinessPreferences>(() => structuredClone(tenant.preferences ?? defaultBusinessPreferences));
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const order = [...form.paymentMethods, ...defaultBusinessPreferences.paymentMethods.filter(method => !form.paymentMethods.includes(method))];
  function move(index: number, delta: number) { const next = [...form.paymentMethods]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; setForm({ ...form, paymentMethods: next }); }
  async function save() { setBusy(true); setMessage(""); try { const response = await api.savePreferences(form); onSaved(response.data); setMessage("Configuración guardada."); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }
  return <FormSurface className="panel" label="Cobros y reposición" busy={busy} onSave={() => void save()}>
    <h2>Cobros y reposición</h2><div className="business-methods">
      {order.map(method => { const index = form.paymentMethods.indexOf(method); return <div className="row" key={method}><label><input type="checkbox" checked={index >= 0} onChange={event => setForm({ ...form, paymentMethods: event.target.checked ? [...form.paymentMethods, method] : form.paymentMethods.filter(item => item !== method) })}/>{methodNames[method]}</label><div className="row-actions"><button className="icon-button" type="button" aria-label={`Subir ${methodNames[method]}`} title="Subir" disabled={index <= 0} onClick={() => move(index, -1)}><ArrowUp size={16}/></button><button className="icon-button" type="button" aria-label={`Bajar ${methodNames[method]}`} title="Bajar" disabled={index < 0 || index >= form.paymentMethods.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16}/></button></div></div>; })}
    </div><h3>Datos para transferencia</h3><div className="form-grid">
      {([["name", "Banco"], ["holder", "Titular"], ["taxId", "RUT"], ["accountType", "Tipo de cuenta"], ["accountNumber", "Número de cuenta"], ["email", "Correo para comprobantes"]] as const).map(([key, label]) => <FormField key={key} label={label} type={key === "email" ? "email" : "text"} maxLength={160} value={form.bank[key]} onChange={value => setForm({ ...form, bank: { ...form.bank, [key]: value } })}/>)}
    </div><div className="form-grid"><FormField label="Plazo habitual del proveedor (días)" type="number" min="1" max="365" required value={String(form.leadDays)} onChange={value => setForm({ ...form, leadDays: Number(value) })}/><FormField label="Cobertura de reposición (días)" type="number" min="1" max="365" required value={String(form.coverageDays)} onChange={value => setForm({ ...form, coverageDays: Number(value) })}/></div>
    <button type="submit" className="primary-action"><Save size={18}/>{busy ? "Guardando..." : "Guardar cobros y reposición"}</button>{message && <p role="status">{message}</p>}
  </FormSurface>;
}
