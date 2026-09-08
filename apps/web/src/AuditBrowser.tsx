import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { AuditEvent, AuditQuery } from "@localito/shared";
import { api } from "./lib/api";
import { formatDateTime } from "./lib/format";

const actionNames: Record<string, string> = { create: "Creación", update: "Edición", adjust_stock: "Ajuste de stock", cancel: "Anulación", return: "Devolución", deactivate: "Desactivación", close: "Cierre", open: "Apertura", bulk_import: "Importación CSV", import_invoice_ai: "Importación de factura" };
const fieldNames: Record<string, string> = { salePrice: "Precio", stock: "Stock", name: "Nombre", reason: "Motivo", quantity: "Cantidad", total: "Total", difference: "Diferencia", countedAmount: "Efectivo contado" };

export function AuditBrowser({ events: revision }: { events: AuditEvent[] }) {
  const [search, setSearch] = useState(""), [action, setAction] = useState(""), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]), [cursor, setCursor] = useState<string>(), [busy, setBusy] = useState(false), [error, setError] = useState(""), [refresh, setRefresh] = useState(0);
  const generation = useRef(0), loading = useRef(false);
  const query: AuditQuery = { search, action, limit: 25 };
  if (from) query.from = new Date(`${from}T00:00:00`).toISOString();
  if (to) { const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1); query.to = end.toISOString(); }

  useEffect(() => {
    const current = ++generation.current;
    setEvents([]); setCursor(undefined); setError(""); setBusy(true); loading.current = true;
    const timer = window.setTimeout(() => {
      if (from && to && from > to) { setError("La fecha final debe ser posterior o igual a la inicial."); setBusy(false); loading.current = false; return; }
      void api.getAuditHistory(query).then(response => {
        if (generation.current !== current) return;
        setEvents(response.data.events); setCursor(response.data.nextCursor);
      }).catch(error => { if (generation.current === current) setError(error.message); }).finally(() => { if (generation.current === current) { setBusy(false); loading.current = false; } });
    }, 250);
    return () => { clearTimeout(timer); generation.current++; };
  }, [search, action, from, to, refresh, revision]);

  async function more() {
    if (!cursor || loading.current) return;
    const current = generation.current;
    setBusy(true); loading.current = true; setError("");
    try {
      const response = await api.getAuditHistory({ ...query, cursor });
      if (generation.current !== current) return;
      setEvents(previous => [...previous, ...response.data.events.filter(event => !previous.some(item => item.id === event.id))]);
      setCursor(response.data.nextCursor);
    } catch (error) { if (generation.current === current) setError((error as Error).message); }
    finally { if (generation.current === current) { setBusy(false); loading.current = false; } }
  }

  return <section className="panel audit-browser" aria-label="Historial de cambios">
    <div className="section-heading"><h2>Historial de cambios</h2><button className="icon-button" title="Actualizar historial completo" aria-label="Actualizar historial completo" disabled={busy} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={18}/></button></div>
    <div className="form-grid">
      <label className="field">Buscar usuario o producto<input value={search} maxLength={160} onChange={event => setSearch(event.target.value)}/></label>
      <label className="field">Acción<select value={action} onChange={event => setAction(event.target.value)}><option value="">Todas</option>{Object.entries(actionNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
      <label className="field">Desde<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label>
      <label className="field">Hasta<input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)}/></label>
    </div>
    <p role="status">{busy ? "Cargando historial..." : `${events.length} eventos mostrados${cursor ? " · hay más resultados" : ""}`}</p>
    {error && <p role="alert">{error}</p>}
    {events.map(event => <details className="audit-event" key={event.id}><summary><strong>{actionNames[event.action] ?? event.action} · {String(event.details?.name ?? event.entity)}</strong><span>{event.userName ?? "Sistema"} · {formatDateTime(event.createdAt)}</span></summary><div><p>Registro: {event.entityId ?? event.id}</p>{Object.entries(event.details ?? {}).map(([key, value]) => <div key={key} className="audit-detail"><strong>{key === "before" ? "Antes" : key === "after" ? "Después" : fieldNames[key] ?? key}</strong><span>{value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value).map(([field, val]) => `${fieldNames[field] ?? field}: ${val}`).join(" · ") : String(value ?? "")}</span></div>)}</div></details>)}
    {!busy && !error && !events.length && <p className="empty-state">No hay cambios para estos filtros.</p>}
    {cursor && <button className="secondary-action" disabled={busy} onClick={() => void more()}>Mostrar más eventos</button>}
  </section>;
}
