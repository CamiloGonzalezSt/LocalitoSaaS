import { useEffect, useMemo, useState } from "react";
import { Search, ReceiptText, RefreshCw, MessageCircle, Copy } from "lucide-react";
import type { AuditEvent, BusinessPreferences, Customer, Product, PurchaseOrder, Sale } from "@localito/shared";
import { api } from "./lib/api";
import { formatCLP, formatDateTime } from "./lib/format";
import { methodNames } from "./BusinessSettings";
import { planReplenishment } from "./lib/replenishment";
import type { PurchaseProposalLine } from "./lib/inventory";

export function ReplenishmentPanel({ products, sales, purchases, preferences, onProposal }: { products: Product[]; sales: Sale[]; purchases: PurchaseOrder[]; preferences: BusinessPreferences; onProposal: (lines: PurchaseProposalLine[]) => void }) {
  const [lead, setLead] = useState(preferences.leadDays), [coverage, setCoverage] = useState(preferences.coverageDays), [mode, setMode] = useState("reorder"), [limit, setLimit] = useState(20);
  const forecast = useMemo(() => planReplenishment(products, sales, purchases, lead, coverage), [products, sales, purchases, lead, coverage]);
  const filtered = forecast.filter(line => mode === "slow" ? line.slow : line.quantity > 0);
  return <section className="panel"><h2>Reposición por ventas</h2><div className="form-grid"><label className="field">Plazo del proveedor (días)<input type="number" min="1" max="365" value={lead} onChange={event => setLead(Math.max(1, Math.min(365, Number(event.target.value) || 1)))}/></label><label className="field">Cobertura (días)<input type="number" min="1" max="365" value={coverage} onChange={event => setCoverage(Math.max(1, Math.min(365, Number(event.target.value) || 1)))}/></label></div>
    <nav className="section-tabs"><button type="button" className={mode === "reorder" ? "active" : ""} onClick={() => { setMode("reorder"); setLimit(20); }}>Por reponer</button><button type="button" className={mode === "slow" ? "active" : ""} onClick={() => { setMode("slow"); setLimit(20); }}>Sin ventas en 30 días</button></nav>
    <div className="list">{filtered.slice(0, limit).map(line => <div className="row" key={line.product.id}><div><strong>{line.product.name}</strong><p>{line.sold} vendidos / 30 días · stock {line.product.stock} · en camino {line.onOrder}</p><small>{line.daysLeft === null ? "Sin demanda registrada en el período" : `Cobertura actual: ${line.daysLeft.toFixed(1)} días`}</small></div><div><strong>{line.quantity} por comprar</strong><button className="secondary-action small" type="button" disabled={!line.quantity} onClick={() => onProposal([{ productId: line.product.id, productName: line.product.name, quantity: line.quantity, unitCost: line.product.costPrice }])}><ReceiptText size={16}/>Preparar compra</button></div></div>)}</div>
    {!filtered.length && <p className="empty-state">Sin productos en este filtro.</p>}{filtered.length > limit && <button className="secondary-action" onClick={() => setLimit(limit + 20)}>Mostrar más</button>}
  </section>;
}

export { AuditBrowser } from "./AuditBrowser";

export function CustomerStatement({ customers }: { customers: Customer[] }) {
  const [id, setId] = useState(""), [data, setData] = useState<Awaited<ReturnType<typeof api.getStatement>>["data"]>(), [message, setMessage] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [version, setVersion] = useState(0);
  useEffect(() => { let current = true; setData(undefined); setError(""); if (!id) return; setBusy(true); void api.getStatement(id).then(response => { if (!current) return; setData(response.data); setMessage(`Hola ${response.data.customer.name}, tu saldo pendiente es ${formatCLP(response.data.customer.debtBalance)}. ¿Podemos coordinar tu abono? Gracias.`); }).catch(error => { if (current) setError(error.message); }).finally(() => { if (current) setBusy(false); }); return () => { current = false; }; }, [id, version]);
  const phone = data?.customer.phone?.replace(/\D/g, "") ?? "";
  const normalizedPhone = phone.length === 9 ? `56${phone}` : phone;
  return <section className="panel customer-statement"><div className="section-heading"><h2>Estado de cuenta</h2><button className="icon-button" title="Actualizar estado de cuenta" aria-label="Actualizar estado de cuenta" disabled={!id || busy} onClick={() => setVersion(version + 1)}><RefreshCw size={18}/></button></div>
    <label className="field">Cliente del estado de cuenta<select aria-label="Cliente del estado de cuenta" value={id} onChange={event => setId(event.target.value)}><option value="">Seleccionar cliente</option>{customers.map(customer => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>
    {busy && <p role="status">Cargando estado de cuenta...</p>}{error && <p role="alert">{error}</p>}
    {data && <><div className="checkout-change"><span>Saldo pendiente</span><strong>{formatCLP(data.customer.debtBalance)}</strong></div><h3>Deudas y vencimientos</h3>{data.debts.map(debt => <div className="row" key={debt.id}><div><strong>{debt.status === "overdue" ? "Vencida" : debt.balance === 0 ? "Pagada" : "Pendiente"}</strong><p>{debt.dueDate ? `Vencimiento: ${debt.dueDate}` : "Sin vencimiento"} · original {formatCLP(debt.originalAmount)}</p></div><strong>{formatCLP(debt.balance)}</strong></div>)}{!data.debts.length && <p>Sin deudas registradas.</p>}
      <h3>Abonos</h3>{data.payments.map(payment => <div className="row" key={payment.id}><div><strong>{methodNames[payment.method]}</strong><p>{formatDateTime(payment.createdAt)} · {payment.status === "approved" ? "Aprobado" : payment.status}</p></div><strong>{formatCLP(payment.amount)}</strong></div>)}{!data.payments.length && <p>Sin abonos registrados.</p>}
      {data.customer.debtBalance > 0 && <div className="reminder-preview"><label className="field">Recordatorio para revisar<textarea aria-label="Recordatorio para revisar" value={message} onChange={event => setMessage(event.target.value)}/></label><div className="row-actions"><button className="secondary-action" disabled={!message.trim()} onClick={() => navigator.clipboard.writeText(message).then(() => setError("Mensaje copiado.")).catch(() => setError("No se pudo copiar el mensaje."))}><Copy size={17}/>Copiar</button>{/^\d{10,15}$/.test(normalizedPhone) ? <a className="secondary-action" href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"><MessageCircle size={17}/>Abrir WhatsApp</a> : <span>Agrega un teléfono válido al cliente.</span>}</div></div>}
    </>}
  </section>;
}
