import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { AuditEvent, CashMovement, CashSession, DebtAccount, Product, PurchaseOrder, StockMovement, Supplier } from "@localito/shared";
import { api } from "./lib/api";
import { InvoiceImportPanel } from "./InvoiceImportPanel";
import { readProductImportFile, validateProductImportRows } from "./productImport";

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export function OperationsView({ products, onRefresh, canManage, mode = "all" }: { products: Product[]; onRefresh: () => Promise<void>; canManage: boolean; mode?: "all" | "invoice" }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [debts, setDebts] = useState<DebtAccount[]>([]);
  const [reminders, setReminders] = useState<Array<{ debt: DebtAccount; message: string; whatsappUrl?: string }>>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [openingAmount, setOpeningAmount] = useState("0");
  const [countedAmount, setCountedAmount] = useState("");
  const [movementType, setMovementType] = useState<CashMovement["type"]>("expense");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementCategory, setMovementCategory] = useState("Operación general");
  const [message, setMessage] = useState("Cargando gestión avanzada...");
  const [busy, setBusy] = useState(false);

  const overdue = useMemo(() => debts.filter((debt) => debt.status === "overdue" && debt.balance > 0), [debts]);
  const expenseTotals = useMemo(() => {
    const totals = new Map<string, number>();
    cashMovements.filter((movement) => movement.type === "expense").forEach((movement) => totals.set(movement.category ?? "Operación general", (totals.get(movement.category ?? "Operación general") ?? 0) + movement.amount));
    return [...totals.entries()].sort((left, right) => right[1] - left[1]);
  }, [cashMovements]);
  const reorderSuggestions = useMemo(
    () =>
      products
        .filter((product) => product.active && product.trackStock !== false && product.stock <= product.minimumStock)
        .map((product) => ({ product, suggested: Math.max(1, product.minimumStock * 2 - product.stock) }))
        .sort((left, right) => left.product.stock - right.product.stock),
    [products]
  );
  const expiringSoon = useMemo(() => {
    const today = new Date();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    return products
      .filter((product) => product.active && product.expiryDate)
      .filter((product) => {
        const expiry = new Date(`${product.expiryDate}T23:59:59`);
        return expiry >= today && expiry <= limit;
      })
      .sort((left, right) => String(left.expiryDate).localeCompare(String(right.expiryDate)));
  }, [products]);

  async function load() {
    try {
      const [sessionResponse, movementResponse] = await Promise.all([api.getCashSession(), api.getCashMovements()]);
      setCashSession(sessionResponse.data); setCashMovements(movementResponse.data);
      if (canManage) {
        const [debtResponse, reminderResponse, supplierResponse, purchaseResponse, stockResponse, auditResponse] = await Promise.all([
          api.getDebts(), api.getDebtReminders(), api.getSuppliers(), api.getPurchases(), api.getStockMovements(), api.getAuditEvents()
        ]);
        setDebts(debtResponse.data); setReminders(reminderResponse.data); setSuppliers(supplierResponse.data); setPurchases(purchaseResponse.data); setStockMovements(stockResponse.data); setAudit(auditResponse.data);
        setPurchaseSupplierId((value) => value || supplierResponse.data[0]?.id || "");
        setPurchaseProductId((value) => value || products[0]?.id || "");
      }
      setMessage("Caja actualizada.");
    } catch (error) { setMessage(error instanceof Error ? `No pudimos actualizar la caja: ${error.message}` : "No pudimos actualizar la caja."); }
  }

  useEffect(() => { void load(); }, [canManage]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try { await action(); await Promise.all([load(), onRefresh()]); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo completar la operación."); } finally { setBusy(false); }
  }

  function exportProducts() {
    const header = "nombre,marca,categoria,codigo_barras,costo,precio,stock,minimo";
    const rows = products.map((product) => [product.name, product.brand ?? "", product.category, product.barcode ?? "", product.costPrice, product.salePrice, product.stock, product.minimumStock].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" })); link.download = `localito-productos-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  async function importProducts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true);
    try {
      const parsed = await readProductImportFile(file);
      const validation = validateProductImportRows(parsed);
      if (!validation.validRows.length) throw new Error(validation.issues[0]?.reason ?? "El archivo no contiene productos válidos.");
      const response = await api.importProducts({ clientImportId: crypto.randomUUID(), rows: validation.validRows });
      await Promise.all([load(), onRefresh()]);
      setMessage(`${response.data.created.length} productos importados${response.data.skipped.length || validation.issues.length ? `; ${response.data.skipped.length + validation.issues.length} filas omitidas` : ""}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo importar el CSV."); } finally { setBusy(false); event.target.value = ""; }
  }

  if (mode === "invoice") {
    return <div className="stack"><section className="panel"><div className="section-heading"><h2>Ingresar mercadería con factura</h2><span>{message}</span></div><p className="helper-text">Toma o sube una foto, revisa cada producto y confirma sus precios de venta antes de aumentar el stock.</p></section>{canManage ? <InvoiceImportPanel products={products} suppliers={suppliers} onImported={async () => { await Promise.all([load(), onRefresh()]); }} /> : <section className="panel"><p className="empty-state">Esta función requiere Localito Pro y permisos de dueño.</p></section>}</div>;
  }

  return <div className="stack">
    <section className="panel"><div className="section-heading"><h2>{canManage ? "Centro de gestión" : "Operación de caja"}</h2><span>{message}</span></div><p className="helper-text">{canManage ? "Caja por turno, compras, reposición, vencimientos, fiado y trazabilidad en un mismo lugar." : "Apertura, movimientos, cierre de turno y recordatorios de fiado."}</p></section>

    {canManage && <InvoiceImportPanel products={products} suppliers={suppliers} onImported={async () => { await Promise.all([load(), onRefresh()]); }} />}

    <section className="panel">
      <div className="section-heading"><h2>Caja por turno</h2><span>{cashSession ? `Abierta ${new Date(cashSession.openedAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}` : "Cerrada"}</span></div>
      {!cashSession ? <div className="form-grid"><input inputMode="numeric" value={openingAmount} onChange={(event) => setOpeningAmount(event.target.value)} placeholder="Monto inicial"/><button className="primary-action" disabled={busy} onClick={() => run(() => api.openCashSession(Number(openingAmount)), "Caja abierta.")}>Abrir caja</button></div> : <>
        <div className="report-grid"><div className="report-metric"><span>Monto inicial</span><strong>{money(cashSession.openingAmount)}</strong></div><div className="report-metric"><span>Movimientos</span><strong>{cashMovements.filter((item) => item.sessionId === cashSession.id).length}</strong></div></div>
        <div className="form-grid"><select value={movementType} onChange={(event) => setMovementType(event.target.value as CashMovement["type"])}><option value="expense">Gasto operativo</option><option value="withdrawal">Retiro</option><option value="deposit">Ingreso</option></select><select value={movementCategory} onChange={(event) => setMovementCategory(event.target.value)}><option>Operación general</option><option>Arriendo</option><option>Servicios básicos</option><option>Sueldos</option><option>Compras y reposición</option><option>Transporte</option><option>Impuestos</option><option>Otros</option></select><input inputMode="numeric" value={movementAmount} onChange={(event) => setMovementAmount(event.target.value)} placeholder="Monto"/><input value={movementReason} onChange={(event) => setMovementReason(event.target.value)} placeholder="Motivo"/><button className="secondary-action" disabled={busy} onClick={() => run(() => api.addCashMovement(movementType, Number(movementAmount), movementReason, movementCategory), "Movimiento registrado.")}>Registrar</button></div>
        <div className="form-grid"><input inputMode="numeric" value={countedAmount} onChange={(event) => setCountedAmount(event.target.value)} placeholder="Efectivo contado"/><button className="primary-action" disabled={busy} onClick={() => run(() => api.closeCashSession(Number(countedAmount), "Cierre desde gestión"), "Caja cerrada y conciliada.")}>Cerrar y conciliar</button></div>
      </>}
    </section>

    <section className="panel"><div className="section-heading"><h2>Gastos operativos</h2><span>{money(expenseTotals.reduce((sum, [, amount]) => sum + amount, 0))}</span></div><div className="list">{expenseTotals.map(([category, amount]) => <div className="row" key={category}><strong>{category}</strong><strong className="debt">{money(amount)}</strong></div>)}{!expenseTotals.length && <p className="empty-state">Registra gastos en una caja abierta para ver el resumen por categoría.</p>}</div></section>

    {canManage && <section className="panel"><div className="section-heading"><h2>Proveedores</h2><span>{suppliers.length}</span></div><div className="form-grid"><input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Nombre del proveedor"/><input value={supplierPhone} onChange={(event) => setSupplierPhone(event.target.value)} placeholder="Teléfono"/><button className="primary-action" disabled={busy || !supplierName.trim()} onClick={() => run(() => api.createSupplier({ name: supplierName, phone: supplierPhone }), "Proveedor creado.")}>Agregar proveedor</button></div><div className="list">{suppliers.map((supplier) => <div className="row" key={supplier.id}><div><strong>{supplier.name}</strong><p>{supplier.phone ?? "Sin teléfono"}</p></div></div>)}</div></section>}

    {canManage && <section className="panel">
      <div className="section-heading"><h2>Alertas inteligentes</h2><span>{reorderSuggestions.length + expiringSoon.length}</span></div>
      <div className="list">
        {reorderSuggestions.slice(0, 8).map(({ product, suggested }) => <div className="row" key={`reorder-${product.id}`}><div><strong>Reponer {product.name}</strong><p>Stock {product.stock} · mínimo {product.minimumStock} · sugerido {suggested} unidades</p></div><button className="secondary-action small" onClick={() => { setPurchaseProductId(product.id); setPurchaseQuantity(String(suggested)); }}>Preparar compra</button></div>)}
        {expiringSoon.slice(0, 8).map((product) => <div className="row" key={`expiry-${product.id}`}><div><strong>Próximo a vencer: {product.name}</strong><p>Vence {product.expiryDate} · stock {product.stock}</p></div></div>)}
        {!reorderSuggestions.length && !expiringSoon.length && <p className="empty-state">Sin alertas de reposición ni vencimientos a 30 días.</p>}
      </div>
    </section>}

    {canManage && <section className="panel"><div className="section-heading"><h2>Qué comprar</h2><span>{purchases.length} órdenes</span></div><div className="form-grid"><select value={purchaseSupplierId} onChange={(event) => setPurchaseSupplierId(event.target.value)}>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><select value={purchaseProductId} onChange={(event) => setPurchaseProductId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input inputMode="numeric" value={purchaseQuantity} onChange={(event) => setPurchaseQuantity(event.target.value)} placeholder="Cantidad"/><input inputMode="numeric" value={purchaseCost} onChange={(event) => setPurchaseCost(event.target.value)} placeholder="Costo unitario"/><button className="primary-action" disabled={busy || !purchaseSupplierId || !purchaseProductId} onClick={() => run(() => api.createPurchase({ supplierId: purchaseSupplierId, items: [{ productId: purchaseProductId, quantity: Number(purchaseQuantity), unitCost: Number(purchaseCost) }] }), "Orden creada.")}>Crear orden</button></div><div className="list">{purchases.slice(0, 8).map((purchase) => <div className="row" key={purchase.id}><div><strong>{purchase.supplierName} · {money(purchase.total)}</strong><p>{purchase.status} · {purchase.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}</p></div>{purchase.status !== "received" && purchase.status !== "cancelled" && <button className="secondary-action small" disabled={busy} onClick={() => run(() => api.receivePurchase(purchase.id), "Mercadería recibida y stock actualizado.")}>Recibir</button>}</div>)}</div></section>}

    <section className="panel"><div className="section-heading"><h2>Fiados vencidos</h2><span>{overdue.length}</span></div><div className="list">{overdue.map((debt) => { const reminder = reminders.find((item) => item.debt.id === debt.id); return <div className="row" key={debt.id}><div><strong>{debt.customerName}</strong><p>Venció {debt.dueDate}</p></div><strong className="debt">{money(debt.balance)}</strong>{reminder?.whatsappUrl && <a className="secondary-action small" href={reminder.whatsappUrl} target="_blank" rel="noreferrer">Recordar</a>}</div>; })}{!overdue.length && <p className="empty-state">No hay deudas vencidas.</p>}</div></section>

    {canManage && <section className="panel"><div className="section-heading"><h2>Datos y trazabilidad</h2><span>{audit.length} eventos</span></div><div className="form-grid"><button className="secondary-action" onClick={exportProducts}>Exportar productos CSV</button><label className="secondary-action">Importar productos CSV<input className="capture-input" type="file" accept=".csv,text/csv" onChange={(event) => void importProducts(event)} /></label><button className="secondary-action" onClick={() => void load()}>Actualizar historial</button></div><div className="list">{audit.slice(0, 10).map((event) => <div className="row" key={event.id}><div><strong>{event.userName ?? "Sistema"} · {event.action}</strong><p>{event.entity} · {new Date(event.createdAt).toLocaleString("es-CL")}</p></div></div>)}</div><p className="helper-text">Movimientos de stock registrados: {stockMovements.length}.</p></section>}
  </div>;
}
