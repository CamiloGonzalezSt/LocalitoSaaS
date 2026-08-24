import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { InvoiceAnalysis, InvoiceImportPayload, Product, Supplier } from "@localito/shared";
import { AlertTriangle, Camera, CheckCircle2, LoaderCircle, PackagePlus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { api } from "./lib/api";

type DraftLine = {
  clientItemId: string;
  rawDescription: string;
  existingProductId: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  quantity: string;
  unitCost: string;
  salePrice: string;
  confidence: number;
};

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);

function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
}

function suggestedSalePrice(unitCost: number) {
  return Math.max(10, Math.ceil((unitCost * 1.3) / 10) * 10);
}

async function drawCompressedImage(file: File, maxDimension: number, quality: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("El navegador no pudo preparar la foto.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

async function prepareInvoiceImage(file: File) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Usa una foto JPG, PNG o WebP.");
  let imageDataUrl = await drawCompressedImage(file, 2200, 0.86);
  if (imageDataUrl.length > 6_300_000) imageDataUrl = await drawCompressedImage(file, 1700, 0.72);
  if (imageDataUrl.length > 6_300_000) throw new Error("La foto es demasiado pesada. Baja la resolución e intenta nuevamente.");
  return imageDataUrl;
}

function initialDraft(analysis: InvoiceAnalysis, products: Product[]): DraftLine[] {
  return analysis.items.map((item) => {
    const matched = products.find((product) => product.id === item.existingProductId);
    return {
      clientItemId: item.id,
      rawDescription: item.rawDescription,
      existingProductId: matched?.id ?? "",
      name: item.name,
      brand: item.brand ?? "",
      category: item.category || "General",
      barcode: item.barcode ?? "",
      quantity: item.quantity ? String(item.quantity) : "",
      unitCost: String(item.unitCost || 0),
      salePrice: String(matched?.salePrice ?? suggestedSalePrice(item.unitCost)),
      confidence: item.confidence
    };
  });
}

export function InvoiceImportPanel({ products, suppliers, onImported }: { products: Product[]; suppliers: Supplier[]; onImported: () => Promise<void> }) {
  const [analysis, setAnalysis] = useState<InvoiceAnalysis | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierTaxId, setSupplierTaxId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [clientImportId, setClientImportId] = useState("");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("Saca una foto nítida y completa; podrás corregir todo antes de guardarlo.");
  const [busy, setBusy] = useState(false);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort((left, right) => left.localeCompare(right, "es")), [products]);
  const draftTotal = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0), [lines]);
  const canConfirm = Boolean(
    lines.length &&
    (supplierId || supplierName.trim()) &&
    lines.every((line) => Number(line.quantity) > 0 && line.unitCost.trim() !== "" && Number(line.unitCost) >= 0 && Number(line.salePrice) > 0 && (line.existingProductId || (line.name.trim() && line.category.trim())))
  );

  function updateLine(clientItemId: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => line.clientItemId === clientItemId ? { ...line, ...patch } : line));
  }

  function selectProduct(line: DraftLine, productId: string) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      const source = analysis?.items.find((item) => item.id === line.clientItemId);
      updateLine(line.clientItemId, {
        existingProductId: "",
        name: source?.name ?? line.name,
        brand: source?.brand ?? line.brand,
        category: source?.category ?? line.category,
        barcode: source?.barcode ?? line.barcode,
        salePrice: line.existingProductId ? String(suggestedSalePrice(Number(line.unitCost))) : line.salePrice
      });
      return;
    }
    updateLine(line.clientItemId, {
      existingProductId: product.id,
      name: product.name,
      brand: product.brand ?? "",
      category: product.category,
      barcode: product.barcode ?? "",
      salePrice: String(product.salePrice)
    });
  }

  async function analyzeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setFileName(file.name || "Factura fotografiada");
    setMessage("Preparando la foto y leyendo productos, cantidades y costos...");
    try {
      const imageDataUrl = await prepareInvoiceImage(file);
      const response = await api.analyzeInvoiceImage(imageDataUrl);
      const next = response.data;
      const matchingSupplier = suppliers.find((supplier) => normalizedText(supplier.name) === normalizedText(next.supplierName));
      setAnalysis(next);
      setLines(initialDraft(next, products));
      setSupplierId(matchingSupplier?.id ?? "");
      setSupplierName(matchingSupplier?.name ?? next.supplierName);
      setSupplierTaxId(next.supplierTaxId ?? "");
      setInvoiceNumber(next.invoiceNumber ?? "");
      setInvoiceDate(next.invoiceDate ?? "");
      setClientImportId(crypto.randomUUID());
      setMessage(next.warnings.length ? `Lectura terminada con ${next.warnings.length} dato${next.warnings.length === 1 ? "" : "s"} por revisar.` : "Lectura terminada. Confirma cantidades, coincidencias y precios de venta.");
    } catch (error) {
      setAnalysis(null);
      setLines([]);
      setMessage(error instanceof Error ? error.message : "No se pudo leer la factura.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAnalysis(null);
    setLines([]);
    setSupplierId("");
    setSupplierName("");
    setSupplierTaxId("");
    setInvoiceNumber("");
    setInvoiceDate("");
    setClientImportId("");
    setFileName("");
    setMessage("Saca una foto nítida y completa; podrás corregir todo antes de guardarlo.");
  }

  async function confirmImport() {
    if (!canConfirm || !analysis) return;
    setBusy(true);
    setMessage("Registrando la compra y actualizando el stock...");
    const payload: InvoiceImportPayload = {
      clientImportId,
      supplierId: supplierId || undefined,
      supplierName: supplierName.trim(),
      supplierTaxId: supplierTaxId.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      invoiceDate: invoiceDate || undefined,
      total: analysis.total,
      items: lines.map((line) => ({
        clientItemId: line.clientItemId,
        existingProductId: line.existingProductId || undefined,
        name: line.name.trim(),
        brand: line.brand.trim() || undefined,
        category: line.category.trim(),
        barcode: line.barcode.trim() || undefined,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost),
        salePrice: Number(line.salePrice)
      }))
    };
    try {
      const response = await api.importInvoice(payload);
      await onImported();
      const created = response.data.createdProductIds.length;
      reset();
      setMessage(response.data.alreadyImported ? "La factura ya estaba ingresada; no se duplicó el stock." : `Factura ingresada. Stock actualizado${created ? ` y ${created} producto${created === 1 ? " nuevo creado" : "s nuevos creados"}` : ""}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo ingresar la factura.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel invoice-ai-panel">
    <div className="section-heading invoice-ai-heading">
      <div><span className="invoice-ai-kicker"><Sparkles size={15} /> Ingreso automático</span><h2>Factura con IA</h2></div>
      {analysis && <span>{lines.length} productos</span>}
    </div>
    <p className="helper-text">Fotografía una factura de mercadería. Localito propone productos, categorías, cantidades y costos; tú confirmas el precio de venta.</p>

    {!analysis && <label className={`invoice-capture ${busy ? "disabled" : ""}`}>
      {busy ? <LoaderCircle className="spin" size={28} /> : <Camera size={28} />}
      <span><strong>{busy ? "Leyendo factura..." : "Tomar foto o elegir imagen"}</strong><small>{fileName || "JPG, PNG o WebP · imagen completa y con buena luz"}</small></span>
      <input className="capture-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={(event) => void analyzeFile(event)} />
    </label>}

    <div className={`invoice-ai-message ${analysis?.warnings.length ? "warning" : ""}`} aria-live="polite">
      {analysis?.warnings.length ? <AlertTriangle size={18} /> : busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
      <span>{message}</span>
    </div>

    {analysis && <>
      <div className="invoice-document-grid">
        <label><span>Proveedor</span><select value={supplierId} onChange={(event) => { const nextId = event.target.value; setSupplierId(nextId); const selected = suppliers.find((supplier) => supplier.id === nextId); if (selected) setSupplierName(selected.name); }}><option value="">Crear o buscar por nombre</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        <label><span>Nombre proveedor</span><input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Confirma el proveedor" disabled={Boolean(supplierId)} /></label>
        <label><span>RUT</span><input value={supplierTaxId} onChange={(event) => setSupplierTaxId(event.target.value)} placeholder="Opcional" /></label>
        <label><span>Folio factura</span><input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Recomendado para evitar duplicados" /></label>
        <label><span>Fecha</span><input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} /></label>
        <div className="invoice-total-card"><span>Total leído</span><strong>{money(analysis.total)}</strong><small>Líneas revisadas: {money(draftTotal)}</small></div>
      </div>

      {analysis.warnings.length > 0 && <div className="invoice-warning-list">{analysis.warnings.map((warning) => <p key={warning}><AlertTriangle size={15} /> {warning}</p>)}</div>}

      <div className="invoice-lines-heading"><div><strong>Revisa cada producto</strong><p>Una coincidencia verde reutiliza el producto. “Producto nuevo” lo crea en su categoría.</p></div></div>
      <div className="invoice-lines">
        {lines.map((line, index) => {
          const matched = products.find((product) => product.id === line.existingProductId);
          return <article className={`invoice-line ${line.confidence < 0.65 ? "low-confidence" : ""}`} key={line.clientItemId}>
            <div className="invoice-line-top"><div><span>Línea {index + 1}</span><strong>{line.rawDescription}</strong></div><span className={`invoice-match-badge ${matched ? "matched" : "new"}`}>{matched ? "En inventario" : "Producto nuevo"}</span></div>
            <label className="invoice-match-select"><span>Coincidencia en inventario</span><select value={line.existingProductId} onChange={(event) => selectProduct(line, event.target.value)}><option value="">+ Crear como producto nuevo</option>{products.filter((product) => product.active).map((product) => <option key={product.id} value={product.id}>{product.name} · stock {product.stock}</option>)}</select></label>
            {!matched && <div className="invoice-new-product-fields">
              <label><span>Nombre</span><input value={line.name} onChange={(event) => updateLine(line.clientItemId, { name: event.target.value })} /></label>
              <label><span>Marca</span><input value={line.brand} onChange={(event) => updateLine(line.clientItemId, { brand: event.target.value })} placeholder="Opcional" /></label>
              <label><span>Categoría</span><input list="invoice-category-options" value={line.category} onChange={(event) => updateLine(line.clientItemId, { category: event.target.value })} /></label>
              <label><span>Código de barras</span><input inputMode="numeric" value={line.barcode} onChange={(event) => updateLine(line.clientItemId, { barcode: event.target.value })} placeholder="Opcional" /></label>
            </div>}
            <div className="invoice-number-fields">
              <label><span>Cantidad recibida</span><input type="number" min="0.001" step="any" inputMode="decimal" value={line.quantity} onChange={(event) => updateLine(line.clientItemId, { quantity: event.target.value })} /></label>
              <label><span>Costo unitario</span><input type="number" min="0" step="any" inputMode="decimal" value={line.unitCost} onChange={(event) => updateLine(line.clientItemId, { unitCost: event.target.value })} /></label>
              <label className="sale-price-confirm"><span>Precio venta · confirma</span><input type="number" min="1" step="any" inputMode="decimal" value={line.salePrice} onChange={(event) => updateLine(line.clientItemId, { salePrice: event.target.value })} /></label>
              <div className="invoice-line-total"><span>Subtotal</span><strong>{money((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))}</strong></div>
            </div>
            <button className="invoice-remove-line" type="button" onClick={() => setLines((current) => current.filter((candidate) => candidate.clientItemId !== line.clientItemId))}><Trash2 size={16} /> Quitar línea</button>
          </article>;
        })}
      </div>
      <datalist id="invoice-category-options">{categories.map((category) => <option key={category} value={category} />)}</datalist>

      <div className="invoice-confirm-bar">
        <div><span>Compra a ingresar</span><strong>{money(draftTotal)}</strong><small>El stock aumenta solo después de confirmar.</small></div>
        <button className="secondary-action" type="button" disabled={busy} onClick={reset}><RotateCcw size={18} /> Otra foto</button>
        <button className="primary-action" type="button" disabled={busy || !canConfirm} onClick={() => void confirmImport()}>{busy ? <LoaderCircle className="spin" size={19} /> : <CheckCircle2 size={19} />} Confirmar e ingresar</button>
      </div>
    </>}
    {!analysis && <div className="invoice-privacy"><PackagePlus size={17} /><span>La foto se usa para extraer datos y no se guarda en Localito. La confirmación siempre es manual.</span></div>}
  </section>;
}
