import { ArrowLeftRight, Download, History, Plus, ReceiptText, RefreshCw, ShoppingBag, Trash2, Upload, Wallet } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { AuditEvent, CashMovement, CashSession, DebtAccount, Product, PurchaseOrder, StockMovement, Supplier } from "@localito/shared";
import { api } from "./lib/api";
import { InvoiceImportPanel } from "./InvoiceImportPanel";
import { readProductImportFile, validateProductImportRows } from "./productImport";
import type { PurchaseProposalLine } from "./lib/inventory";
import { AuditBrowser, ReplenishmentPanel } from "./ManagementPanels";
import { CashReconciliation } from "./CashReconciliation";
import { defaultBusinessPreferences } from "@localito/shared";
import type { BusinessPreferences, Sale } from "@localito/shared";

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
const emptyProposal: PurchaseProposalLine[] = [];
const operationTabs = [
  { id: "shift", label: "Turno", icon: Wallet },
  { id: "movements", label: "Movimientos", icon: ArrowLeftRight },
  { id: "purchases", label: "Compras", icon: ShoppingBag },
  { id: "history", label: "Historial", icon: History }
] as const;
type OperationTab = typeof operationTabs[number]["id"];

export function OperationsView({ products, sales = [], preferences = defaultBusinessPreferences, purchaseProposal = emptyProposal, onPurchaseProposalConsumed, onRefresh, canManage, mode = "all" }: { products: Product[]; sales?: Sale[]; preferences?: BusinessPreferences; purchaseProposal?: PurchaseProposalLine[]; onPurchaseProposalConsumed?: () => void; onRefresh: () => Promise<void>; canManage: boolean; mode?: "all" | "invoice" }) {
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
  const [movementType, setMovementType] = useState<CashMovement["type"]>("expense");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementCategory, setMovementCategory] = useState("Operación general");
  const [message, setMessage] = useState("Actualizando caja...");
  const [messageError, setMessageError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [proposalLines, setProposalLines] = useState<PurchaseProposalLine[]>(purchaseProposal);
  const [activeTab, setActiveTab] = useState<OperationTab>(purchaseProposal.length && canManage ? "purchases" : "shift");
  const [movementLimit, setMovementLimit] = useState(20);
  const [purchaseLimit, setPurchaseLimit] = useState(10);
  const [focusProposal, setFocusProposal] = useState(false);
  const proposalRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabsId = useId();
  const tabs = canManage ? operationTabs : operationTabs.slice(0, 2);
  const selectedTab = tabs.some(tab => tab.id === activeTab) ? activeTab : "shift";

  useEffect(() => {
    setProposalLines(purchaseProposal);
    if (purchaseProposal.length && canManage) setActiveTab("purchases");
  }, [purchaseProposal, canManage]);
  useEffect(() => {
    if (!focusProposal || selectedTab !== "purchases") return;
    proposalRef.current?.focus({ preventScroll: true });
    proposalRef.current?.scrollIntoView({ block: "nearest" });
    setFocusProposal(false);
  }, [focusProposal, selectedTab]);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
      : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
      : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  }

  const overdue = useMemo(() => debts.filter((debt) => debt.status === "overdue" && debt.balance > 0), [debts]);
  const activeCashMovements = useMemo(
    () => cashSession ? cashMovements.filter((movement) => movement.sessionId === cashSession.id) : [],
    [cashMovements, cashSession]
  );
  const expenseTotals = useMemo(() => {
    const totals = new Map<string, number>();
    activeCashMovements.filter((movement) => movement.type === "expense").forEach((movement) => totals.set(movement.category ?? "Operación general", (totals.get(movement.category ?? "Operación general") ?? 0) + movement.amount));
    return [...totals.entries()].sort((left, right) => right[1] - left[1]);
  }, [activeCashMovements]);
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
    setMessageError(false);
    try {
      const [sessionResponse, movementResponse] = await Promise.all([api.getCashSession(), api.getCashMovements()]);
      setCashSession(sessionResponse.data); setCashMovements(movementResponse.data);
      if (canManage) {
        const [debtResponse, reminderResponse, supplierResponse, purchaseResponse, stockResponse, auditResponse] = await Promise.all([
          api.getDebts(), api.getDebtReminders(), api.getSuppliers(), api.getPurchases(), api.getStockMovements(), api.getAuditEvents()
        ]);
        setDebts(debtResponse.data); setReminders(reminderResponse.data); setSuppliers(supplierResponse.data); setPurchases(purchaseResponse.data); setStockMovements(stockResponse.data); setAudit(auditResponse.data);
        setPurchaseSupplierId((value) => value || supplierResponse.data[0]?.id || "");
        setPurchaseProductId((value) => value || products.find(product => product.active)?.id || "");
      }
      setMessage("Caja actualizada.");
      return true;
    } catch (error) { setMessageError(true); setMessage(error instanceof Error ? `No pudimos actualizar la caja: ${error.message}` : "No pudimos actualizar la caja."); return false; }
  }

  useEffect(() => { void load(); }, [canManage]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessageError(false);
    try {
      await action();
      const [updated] = await Promise.all([load(), onRefresh()]);
      if (updated) setMessage(success);
    } catch (error) { setMessageError(true); setMessage(error instanceof Error ? error.message : "No se pudo completar la operación."); } finally { setBusy(false); }
  }

  function createProposalOrder() {
    if (!purchaseSupplierId || !proposalLines.length) return;
    return run(async () => {
      await api.createPurchase({ supplierId: purchaseSupplierId, items: proposalLines.map(line => ({ productId: line.productId, quantity: line.quantity, unitCost: line.unitCost })) });
      setProposalLines([]);
      onPurchaseProposalConsumed?.();
    }, "Propuesta convertida en orden de compra.");
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
      const [updated] = await Promise.all([load(), onRefresh()]);
      if (updated) setMessage(`${response.data.created.length} productos importados${response.data.skipped.length || validation.issues.length ? `; ${response.data.skipped.length + validation.issues.length} filas omitidas` : ""}.`);
    } catch (error) { setMessageError(true); setMessage(error instanceof Error ? error.message : "No se pudo importar el CSV."); } finally { setBusy(false); event.target.value = ""; }
  }

  if (mode === "invoice") {
    return <div className="stack"><section className="panel"><div className="section-heading"><h2>Ingresar mercadería con factura</h2><span>{message}</span></div><p className="helper-text">Toma o sube una foto, revisa cada producto y confirma sus precios de venta antes de aumentar el stock.</p></section>{canManage ? <InvoiceImportPanel products={products} suppliers={suppliers} onImported={async () => { await Promise.all([load(), onRefresh()]); }} /> : <section className="panel"><p className="empty-state">Esta función requiere Localito Pro y permisos de dueño.</p></section>}</div>;
  }

  return <div className="stack operations-workspace">
    <header className="operations-header">
      <div><p className={messageError ? "field-error" : "operations-status"} role={messageError ? "alert" : "status"}>{message}</p></div>
      <button className="icon-button" type="button" aria-label="Actualizar caja" title="Actualizar caja" disabled={busy} onClick={() => void run(async () => {}, "Caja actualizada.")}><RefreshCw size={18}/></button>
    </header>
    <div className="operations-tabs" role="tablist" aria-label="Secciones de caja">
      {tabs.map((tab, index) => <button key={tab.id} ref={element => { tabRefs.current[index] = element; }} id={`${tabsId}-${tab.id}-tab`} type="button" role="tab" aria-selected={selectedTab === tab.id} aria-controls={`${tabsId}-${tab.id}`} tabIndex={selectedTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={event => moveTab(event, index)}><tab.icon size={18} aria-hidden="true"/><span>{tab.label}</span></button>)}
    </div>

    {/* Keep panels mounted so switching tabs preserves unfinished forms. */}
    <div className="operations-pane stack" id={`${tabsId}-shift`} role="tabpanel" aria-labelledby={`${tabsId}-shift-tab`} hidden={selectedTab !== "shift"} tabIndex={0}>
      <section className="panel">
        <div className="section-heading"><h2>Caja por turno</h2><span className={cashSession ? "status-badge success" : "status-badge"}>{cashSession ? `Abierta · ${new Date(cashSession.openedAt).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "Cerrada"}</span></div>
        {!cashSession ? <form className="operations-form" onSubmit={event => {
          event.preventDefault();
          if (!Number.isSafeInteger(Number(openingAmount)) || Number(openingAmount) < 0) return;
          void run(() => api.openCashSession(Number(openingAmount)), "Caja abierta.");
        }}>
          <label className="field">Monto inicial<input type="number" min="0" step="1" required inputMode="numeric" value={openingAmount} onChange={event => setOpeningAmount(event.target.value)} /></label>
          <button className="primary-action" disabled={busy}><Wallet size={18}/> Abrir caja</button>
        </form> : <>
          <div className="report-grid"><div className="report-metric"><span>Monto inicial</span><strong>{money(cashSession.openingAmount)}</strong></div><div className="report-metric"><span>Movimientos</span><strong>{activeCashMovements.length}</strong></div></div>
          <CashReconciliation sessionId={cashSession.id} revision={cashMovements.length} onClosed={async () => { const [updated] = await Promise.all([load(), onRefresh()]); if (updated) setMessage("Caja cerrada y conciliación guardada."); }}/>
        </>}
      </section>
      {canManage && <section className="panel">
        <div className="section-heading"><h2>Fiados vencidos</h2><span>{overdue.length}</span></div>
        <div className="list">{overdue.map(debt => {
          const reminder = reminders.find(item => item.debt.id === debt.id);
          return <div className="row" key={debt.id}><div><strong>{debt.customerName}</strong><p>Venció {debt.dueDate}</p></div><strong className="debt">{money(debt.balance)}</strong>{reminder?.whatsappUrl && <details><summary>Revisar recordatorio</summary><p>{reminder.message}</p><a className="secondary-action small" href={reminder.whatsappUrl} target="_blank" rel="noreferrer">Abrir WhatsApp</a></details>}</div>;
        })}{!overdue.length && <p className="empty-state">No hay deudas vencidas.</p>}</div>
      </section>}
    </div>

    <div className="operations-pane stack" id={`${tabsId}-movements`} role="tabpanel" aria-labelledby={`${tabsId}-movements-tab`} hidden={selectedTab !== "movements"} tabIndex={0}>
      <section className="panel">
        <div className="section-heading"><h2>Nuevo movimiento</h2><span>Turno actual</span></div>
        {cashSession ? <form className="operations-form" onSubmit={event => {
          event.preventDefault();
          if (!Number.isSafeInteger(Number(movementAmount)) || Number(movementAmount) <= 0 || !movementReason.trim()) return;
          void run(async () => {
            await api.addCashMovement(movementType, Number(movementAmount), movementReason.trim(), movementCategory);
            setMovementAmount(""); setMovementReason("");
          }, "Movimiento registrado.");
        }}>
          <label className="field">Tipo<select value={movementType} onChange={event => setMovementType(event.target.value as CashMovement["type"])}><option value="expense">Gasto operativo</option><option value="withdrawal">Retiro</option><option value="deposit">Ingreso</option></select></label>
          <label className="field">Categoría<select value={movementCategory} onChange={event => setMovementCategory(event.target.value)}>{["Operación general", "Arriendo", "Servicios básicos", "Sueldos", "Compras y reposición", "Transporte", "Impuestos", "Otros"].map(category => <option key={category}>{category}</option>)}</select></label>
          <label className="field">Monto<input type="number" min="1" step="1" required inputMode="numeric" value={movementAmount} onChange={event => setMovementAmount(event.target.value)}/></label>
          <label className="field">Motivo<input required maxLength={200} value={movementReason} onChange={event => setMovementReason(event.target.value)}/></label>
          <button className="primary-action" disabled={busy}><Plus size={18}/> Registrar movimiento</button>
        </form> : <div className="operations-empty"><p className="empty-state">La caja está cerrada.</p><button className="secondary-action" type="button" onClick={() => { setActiveTab("shift"); tabRefs.current[0]?.focus(); }}><Wallet size={18}/> Ir a abrir caja</button></div>}
      </section>
      {cashSession && <>
        <section className="panel cash-timeline">
          <div className="section-heading"><h2>Historial de caja</h2><span>{activeCashMovements.length} movimientos del turno</span></div>
          <div className="list">{activeCashMovements.slice(0, movementLimit).map(movement => <div className={`row cash-timeline-row ${movement.type}`} key={movement.id}><div><strong>{movement.type === "deposit" ? "Ingreso" : movement.type === "withdrawal" ? "Retiro" : "Gasto operativo"} · {movement.category ?? "Operación general"}</strong><p>{movement.reason} · {new Date(movement.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}{movement.createdByName ? ` · ${movement.createdByName}` : ""}</p></div><strong>{movement.type === "deposit" ? "+" : "-"}{money(movement.amount)}</strong></div>)}{!activeCashMovements.length && <p className="empty-state">Aún no registras movimientos manuales en este turno.</p>}</div>
          {activeCashMovements.length > movementLimit && <button className="secondary-action small" type="button" onClick={() => setMovementLimit(limit => limit + 20)}><Plus size={16}/> Ver más movimientos</button>}
        </section>
        <section className="panel">
          <div className="section-heading"><h2>Gastos del turno</h2><span>{money(expenseTotals.reduce((sum, [, amount]) => sum + amount, 0))}</span></div>
          <div className="list">{expenseTotals.map(([category, amount]) => <div className="row" key={category}><strong>{category}</strong><strong className="debt">{money(amount)}</strong></div>)}{!expenseTotals.length && <p className="empty-state">Sin gastos registrados en este turno.</p>}</div>
        </section>
      </>}
    </div>

    {canManage && <div className="operations-pane stack" id={`${tabsId}-purchases`} role="tabpanel" aria-labelledby={`${tabsId}-purchases-tab`} hidden={selectedTab !== "purchases"} tabIndex={0}>
      <section className="panel">
        <div className="section-heading"><h2>Qué comprar</h2><span>{purchases.length} órdenes</span></div>
        <label className="field operations-supplier">Proveedor<select value={purchaseSupplierId} onChange={event => setPurchaseSupplierId(event.target.value)}><option value="" disabled>Seleccionar proveedor</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        {proposalLines.length > 0 && <div className="purchase-proposal-review" ref={proposalRef} tabIndex={-1}>
          <div><h3>Propuesta lista para revisar</h3><p>{proposalLines.length} productos · {money(proposalLines.reduce((total, line) => total + line.quantity * line.unitCost, 0))}</p></div>
          <div className="purchase-proposal-lines">{proposalLines.map(line => <div className="row" key={line.productId}><div><strong>{line.productName}</strong><p>{line.quantity} unidades · costo {money(line.unitCost)}</p></div><input aria-label={`Cantidad propuesta de ${line.productName}`} type="number" min="1" step="1" value={line.quantity} onChange={event => setProposalLines(current => current.map(item => item.productId === line.productId ? { ...item, quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) } : item))}/><button className="icon-button danger" type="button" aria-label={`Quitar propuesta de ${line.productName}`} title={`Quitar ${line.productName}`} onClick={() => setProposalLines(current => current.filter(item => item.productId !== line.productId))}><Trash2 size={16}/></button></div>)}</div>
          <button className="primary-action" type="button" disabled={busy || !purchaseSupplierId} onClick={() => void createProposalOrder()}><ReceiptText size={18}/> Convertir en orden de compra</button>
        </div>}
        <form className="operations-form" onSubmit={event => {
          event.preventDefault();
          if (!purchaseSupplierId || !purchaseProductId || !Number.isSafeInteger(Number(purchaseQuantity)) || Number(purchaseQuantity) <= 0 || !Number.isSafeInteger(Number(purchaseCost)) || Number(purchaseCost) < 0) return;
          void run(() => api.createPurchase({ supplierId: purchaseSupplierId, items: [{ productId: purchaseProductId, quantity: Number(purchaseQuantity), unitCost: Number(purchaseCost) }] }), "Orden creada.");
        }}>
          <label className="field">Producto<select required value={purchaseProductId} onChange={event => setPurchaseProductId(event.target.value)}><option value="" disabled>Seleccionar producto</option>{products.filter(product => product.active).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label className="field">Cantidad<input required type="number" min="1" step="1" inputMode="numeric" value={purchaseQuantity} onChange={event => setPurchaseQuantity(event.target.value)}/></label>
          <label className="field">Costo unitario<input required type="number" min="0" step="1" inputMode="numeric" value={purchaseCost} onChange={event => setPurchaseCost(event.target.value)}/></label>
          <button className="primary-action" disabled={busy || !purchaseSupplierId || !purchaseProductId}><Plus size={18}/> Crear orden</button>
        </form>
        <div className="list">{purchases.slice(0, purchaseLimit).map(purchase => <div className="row" key={purchase.id}><div><strong>{purchase.supplierName} · {money(purchase.total)}</strong><p>{purchase.status === "received" ? "Recibida" : purchase.status === "cancelled" ? "Cancelada" : purchase.status === "draft" ? "Borrador" : "Pendiente"} · {purchase.items.map(item => `${item.productName} x${item.quantity}`).join(", ")}</p></div>{purchase.status !== "received" && purchase.status !== "cancelled" && <button className="secondary-action small" disabled={busy} onClick={() => void run(() => api.receivePurchase(purchase.id), "Mercadería recibida y stock actualizado.")}><Download size={16}/> Recibir</button>}</div>)}{!purchases.length && <p className="empty-state">Aún no hay órdenes de compra.</p>}</div>
        {purchases.length > purchaseLimit && <button className="secondary-action small" type="button" onClick={() => setPurchaseLimit(limit => limit + 10)}><Plus size={16}/> Ver más órdenes</button>}
      </section>
      <ReplenishmentPanel products={products} sales={sales} purchases={purchases} preferences={preferences} onProposal={lines => { setProposalLines(lines); setFocusProposal(true); }}/>
      <details className="operations-disclosure"><summary><ReceiptText size={18}/> Ingresar mercadería con factura</summary><InvoiceImportPanel products={products} suppliers={suppliers} onImported={async () => { await Promise.all([load(), onRefresh()]); }}/></details>
      <section className="panel">
        <div className="section-heading"><h2>Proveedores</h2><span>{suppliers.length}</span></div>
        <form className="operations-form" onSubmit={event => {
          event.preventDefault();
          if (!supplierName.trim()) return;
          void run(async () => { await api.createSupplier({ name: supplierName.trim(), phone: supplierPhone.trim() }); setSupplierName(""); setSupplierPhone(""); }, "Proveedor creado.");
        }}>
          <label className="field">Nombre del proveedor<input required maxLength={160} value={supplierName} onChange={event => setSupplierName(event.target.value)}/></label>
          <label className="field">Teléfono<input type="tel" value={supplierPhone} onChange={event => setSupplierPhone(event.target.value)}/></label>
          <button className="secondary-action" disabled={busy || !supplierName.trim()}><Plus size={18}/> Agregar proveedor</button>
        </form>
        <div className="list">{suppliers.map(supplier => <div className="row" key={supplier.id}><div><strong>{supplier.name}</strong><p>{supplier.phone || "Sin teléfono"}</p></div></div>)}</div>
      </section>
      <section className="panel">
        <div className="section-heading"><h2>Próximos vencimientos</h2><span>{expiringSoon.length}</span></div>
        <div className="list">{expiringSoon.map(product => <div className="row" key={product.id}><div><strong>{product.name}</strong><p>Vence {product.expiryDate} · stock {product.stock}</p></div></div>)}{!expiringSoon.length && <p className="empty-state">Sin vencimientos a 30 días.</p>}</div>
      </section>
    </div>}

    {canManage && <div className="operations-pane stack" id={`${tabsId}-history`} role="tabpanel" aria-labelledby={`${tabsId}-history-tab`} hidden={selectedTab !== "history"} tabIndex={0}>
      <AuditBrowser events={audit}/>
      <section className="panel">
        <div className="section-heading"><h2>Datos y trazabilidad</h2><span>{stockMovements.length} movimientos de stock</span></div>
        <div className="ui-toolbar-actions"><button className="secondary-action" type="button" onClick={exportProducts}><Download size={18}/> Exportar productos CSV</button><label className="secondary-action operations-import"><Upload size={18}/> Importar productos CSV<input disabled={busy} className="capture-input" type="file" accept=".csv,text/csv" onChange={event => void importProducts(event)} /></label></div>
      </section>
    </div>}
  </div>;
}
