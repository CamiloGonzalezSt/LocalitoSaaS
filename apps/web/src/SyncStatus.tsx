import { useEffect, useRef, useState } from "react";
import { Cloud, CloudOff, Download, RefreshCw } from "lucide-react";
import { flushOfflineQueue } from "./lib/api";
import { queueEntries, syncScope, type SyncOptions } from "./lib/offline";

export function SyncStatus({ onSynced }: { onSynced: () => Promise<void> }) {
  const [cached, setCached] = useState(false);
  const [, render] = useState(0), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const working = useRef(false), refresh = useRef(onSynced);
  refresh.current = onSynced;
  let entries: ReturnType<typeof queueEntries> = [], readError = "";
  try { entries = queueEntries(); } catch (error) { readError = (error as Error).message; }
  const scope = syncScope(), last = scope && localStorage.getItem(scope.key + ":last");
  const legacy = localStorage.getItem("localito-offline-queue");
  const rejected = entries.filter(entry => entry.rejected).length;

  async function sync(options: SyncOptions = {}) {
    if (working.current) return;
    working.current = true; setBusy(true); setError("");
    try { const result = await flushOfflineQueue(options); if (result.synced) await refresh.current(); }
    catch (error) { setError((error as Error).message); }
    finally { working.current = false; setBusy(false); render(value => value + 1); }
  }
  function downloadBackup() {
    try {
      const current = syncScope();
      if (!current) throw new Error("Inicia sesión para descargar las ventas pendientes.");
      const blob = new Blob([JSON.stringify({ format: "localito-pending-sales-v1", exportedAt: new Date().toISOString(), account: current.key, queue: localStorage.getItem(current.key) ?? "[]" }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url; anchor.download = `localito-ventas-pendientes-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError((error as Error).message); }
  }
  useEffect(() => {
    const cache = (event: Event) => setCached(Boolean((event as CustomEvent).detail));
    const update = () => render(value => value + 1);
    const online = () => { update(); void sync(); };
    window.addEventListener("localito-cache", cache);
    window.addEventListener("online", online); window.addEventListener("offline", update); window.addEventListener("storage", update); window.addEventListener("localito-sync", update);
    const timer = window.setInterval(() => { if (navigator.onLine) void sync(); }, 60000);
    return () => { clearInterval(timer); window.removeEventListener("localito-cache", cache); window.removeEventListener("online", online); window.removeEventListener("offline", update); window.removeEventListener("storage", update); window.removeEventListener("localito-sync", update); };
  }, []);

  return <div className="sync-status"><button className="secondary-action small" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{navigator.onLine && !cached ? <Cloud size={17}/> : <CloudOff size={17}/>} {readError ? "Revisar sincronización" : entries.length ? `${entries.length} ${entries.length === 1 ? "venta pendiente" : "ventas pendientes"}` : cached ? "Datos guardados · sin conexión" : navigator.onLine ? "Sin pendientes" : "Sin conexión"}</button>
    {open && <section aria-label="Sincronización" className="sync-detail"><div className="section-heading"><h2>Sincronización</h2><div className="row-actions"><button className="icon-button" title="Descargar respaldo de ventas pendientes" aria-label="Descargar respaldo de ventas pendientes" onClick={downloadBackup}><Download size={18}/></button><button className="secondary-action small" disabled={busy || !navigator.onLine || Boolean(readError)} onClick={() => void sync({ retryRejected: true })}><RefreshCw size={17}/>{busy ? "Sincronizando..." : "Reintentar"}</button></div></div>
      <p>{last ? `Última sincronización: ${new Date(last).toLocaleString("es-CL")}` : "No hay sincronizaciones registradas en esta cuenta."}</p>
      {rejected > 0 && <p role="status">{rejected} {rejected === 1 ? "venta requiere" : "ventas requieren"} revisión. Las demás ventas pueden sincronizarse.</p>}
      {entries.map(entry => <details className="sync-entry" key={entry.id}><summary><strong>Venta #{entry.id.slice(0, 8)}</strong><span>{entry.rejected ? "Requiere revisión" : "Pendiente"} · {new Date(entry.createdAt).toLocaleString("es-CL")}</span></summary><div><p>{entry.attempts} intentos{entry.httpStatus ? ` · respuesta ${entry.httpStatus}` : ""}</p>{entry.error && <p role="alert">{entry.error}</p>}<ul>{(JSON.parse(entry.body).items as Array<{ productId: string; quantity: number }>).map((item, index) => <li key={index}>{item.quantity} unidades · producto #{item.productId.slice(0, 12)}</li>)}</ul><button className="secondary-action small" disabled={busy || !navigator.onLine || Boolean(readError)} onClick={() => void sync({ retryRejected: true, entryId: entry.id })}><RefreshCw size={16}/>Reintentar esta venta</button></div></details>)}
      {legacy && legacy !== "[]" && <p role="alert">Hay operaciones antiguas sin cuenta identificada. Se conservaron y requieren revisión antes de enviarse.</p>}
      {(readError || error) && <p role="alert">{readError || error}</p>}
    </section>}
  </div>;
}
