import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "./lib/api";
import { formatCLP } from "./lib/format";
import { FormField, FormSurface } from "./FormControls";
import { queueEntries } from "./lib/offline";
export function CashReconciliation({ sessionId, revision, onClosed }: { sessionId: string; revision: number; onClosed: () => Promise<void> }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getReconciliation>>["data"]>(null), [counted, setCounted] = useState(""), [note, setNote] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [refresh, setRefresh] = useState(0);
  useEffect(() => { let active = true; setData(null); void api.getReconciliation().then(response => { if (active) setData(response.data); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, [sessionId, revision, refresh]);
  const difference = data && counted !== "" ? Number(counted) - data.expected : 0;
  async function close() {
    if (!data || busy) return;
    try {
      if (queueEntries().length) throw new Error("Sincroniza las ventas pendientes antes de cerrar caja.");
      setBusy(true); setError("");
      const latest = (await api.getReconciliation()).data;
      if (!latest || latest.sessionId !== sessionId) throw new Error("La caja cambió. Actualiza antes de cerrar.");
      if (latest.expected !== data.expected) { setData(latest); throw new Error("Se registraron nuevos movimientos. Revisa el efectivo esperado y confirma otra vez."); }
      await api.closeCashSession(Number(counted), note.trim() || undefined);
      await onClosed();
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <FormSurface className="cash-reconciliation" label="Conciliar turno" busy={busy} onSave={() => void close()}>
    <div className="section-heading"><h3>Conciliar turno</h3><button className="icon-button" type="button" title="Actualizar conciliación" aria-label="Actualizar conciliación" onClick={() => setRefresh(refresh + 1)}><RefreshCw size={17}/></button></div>
    {data && data.sessionId === sessionId && <><dl className="cash-breakdown">{([["Apertura", data.opening], ["Ventas en efectivo (netas)", data.salesCash], ["Abonos de fiado en efectivo", data.debtCash], ["Ingresos manuales", data.deposits], ["Gastos", -data.expenses], ["Retiros", -data.withdrawals], ["Efectivo esperado", data.expected]] as const).map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{formatCLP(amount)}</dd></div>)}</dl>
      <FormField label="Efectivo contado" type="number" min="0" step="1" required value={counted} onChange={setCounted}/><div className="checkout-change" aria-live="polite"><span>{difference < 0 ? "Faltante" : difference > 0 ? "Sobrante" : "Diferencia"}</span><strong>{counted === "" ? "—" : formatCLP(Math.abs(difference))}</strong></div>
      <FormField label="Motivo de la diferencia / nota" required={difference !== 0} value={note} maxLength={300} onChange={setNote}/>
    </>}
    <button className="primary-action" type="submit" disabled={!data || counted === "" || !Number.isSafeInteger(Number(counted)) || Number(counted) < 0 || (difference !== 0 && !note.trim())}><CheckCircle2 size={18}/>Cerrar y conciliar</button>
    {error && <p role="status">{error}</p>}
  </FormSurface>;
}
