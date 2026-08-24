import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { ProductImportIssue, ProductImportRow } from "@localito/shared";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { api } from "./lib/api";
import { downloadProductTemplate, readProductImportFile, validateProductImportRows } from "./productImport";

export function ProductBulkImportPanel({ businessType, onImported }: { businessType: string; onImported: () => Promise<void> }) {
  const [rows, setRows] = useState<ProductImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [clientImportId, setClientImportId] = useState("");
  const [serverIssues, setServerIssues] = useState<ProductImportIssue[]>([]);
  const [message, setMessage] = useState("Descarga la plantilla, complétala en Excel y vuelve a subirla como CSV.");
  const [busy, setBusy] = useState(false);
  const validation = useMemo(() => validateProductImportRows(rows), [rows]);
  const issuesByRow = useMemo(() => new Map(validation.issues.map((issue) => [issue.rowNumber, issue.reason])), [validation.issues]);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setServerIssues([]);
    try {
      const parsed = await readProductImportFile(file);
      setRows(parsed);
      setFileName(file.name);
      setClientImportId(crypto.randomUUID());
      const checked = validateProductImportRows(parsed);
      setMessage(`${checked.validRows.length} filas listas${checked.issues.length ? ` y ${checked.issues.length} con errores que se omitirán` : ""}.`);
    } catch (error) {
      setRows([]);
      setFileName("");
      setMessage(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    } finally {
      setBusy(false);
    }
  }

  async function importValidRows() {
    if (!validation.validRows.length || !clientImportId) return;
    setBusy(true);
    setMessage("Importando productos y revisando duplicados...");
    try {
      const response = await api.importProducts({ clientImportId, rows: validation.validRows });
      setServerIssues(response.data.skipped);
      await onImported();
      setRows([]);
      setFileName("");
      setClientImportId("");
      setMessage(`${response.data.created.length} productos creados${response.data.existingProductIds.length ? `; ${response.data.existingProductIds.length} ya existían` : ""}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo importar el archivo.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="setup-method-panel bulk-import-panel">
    <div className="setup-method-heading"><div className="setup-method-icon"><FileSpreadsheet size={22} /></div><div><h3>Importar una plantilla CSV</h3><p>Puedes completarla en Excel; una sola carga admite hasta 500 productos.</p></div></div>
    <div className="bulk-import-actions">
      <button className="secondary-action" type="button" onClick={() => downloadProductTemplate(businessType)}><Download size={18} /> Descargar plantilla</button>
      <label className={`primary-action ${busy ? "disabled" : ""}`}><Upload size={18} /> {busy ? "Procesando..." : "Elegir archivo CSV"}<input className="capture-input" type="file" accept=".csv,text/csv,text/plain,application/vnd.ms-excel" disabled={busy} onChange={(event) => void selectFile(event)} /></label>
    </div>
    <p className="bulk-import-help">Columnas mínimas: <strong>nombre</strong> y <strong>precio</strong>. También acepta marca, categoría, código de barras, costo, stock, mínimo, SKU, unidad y unidades por pack.</p>
    <div className={`bulk-import-message ${validation.issues.length || serverIssues.length ? "warning" : ""}`} aria-live="polite">
      {busy ? <LoaderCircle className="spin" size={17} /> : validation.issues.length || serverIssues.length ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
      <span>{fileName ? `${fileName} · ` : ""}{message}</span>
    </div>

    {rows.length > 0 && <>
      <div className="bulk-preview-summary"><strong>{validation.validRows.length} listas</strong><span>{validation.issues.length} con error</span><small>{rows.length} filas leídas</small></div>
      <div className="bulk-preview-scroll"><table className="bulk-preview-table"><thead><tr><th>Fila</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th></tr></thead><tbody>{rows.slice(0, 12).map((row, index) => { const issue = issuesByRow.get(row.rowNumber ?? index + 2); return <tr className={issue ? "invalid" : ""} key={`${row.rowNumber}-${index}`}><td>{row.rowNumber}</td><td><strong>{row.name || "Sin nombre"}</strong><small>{row.brand || row.barcode || ""}</small></td><td>{row.category}</td><td>${Number(row.salePrice || 0).toLocaleString("es-CL")}</td><td>{row.stock ?? 0}</td><td>{issue ?? "Lista"}</td></tr>; })}</tbody></table></div>
      {rows.length > 12 && <p className="bulk-import-help">Vista previa de 12 filas. Se procesarán las {validation.validRows.length} filas válidas.</p>}
      <button className="primary-action full" type="button" disabled={busy || !validation.validRows.length} onClick={() => void importValidRows()}>{busy ? <LoaderCircle className="spin" size={18} /> : <Upload size={18} />} Importar {validation.validRows.length} productos válidos</button>
    </>}

    {serverIssues.length > 0 && <div className="bulk-server-issues"><strong>Filas no creadas</strong>{serverIssues.slice(0, 10).map((issue) => <p key={`${issue.rowNumber}-${issue.reason}`}>Fila {issue.rowNumber}{issue.name ? ` · ${issue.name}` : ""}: {issue.reason}</p>)}</div>}
  </section>;
}
