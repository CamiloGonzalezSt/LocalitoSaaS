import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, PackagePlus, ShoppingCart, Users } from "lucide-react";
import type { CashRegisterSummary, CashSession, DebtAccount, Product, ReportSummary, Sale } from "@localito/shared";
import { contextualGreeting, formatCLP } from "./lib/format";
import { businessDay, dashboardDateTime, matchesInventoryFilter, overdueDebts, recentSales } from "./lib/dashboard";
import type { CustomerFilter, InventoryFilter } from "./lib/dashboard";
import { RecentSales } from "./RecentSales";
import "./dashboard.css";

type Props = {
  businessName: string;
  userName: string;
  products: Product[];
  summary: ReportSummary;
  sales: Sale[];
  cashRegister: CashRegisterSummary;
  cashSession?: CashSession;
  debts: DebtAccount[];
  canOperate: boolean;
  canViewCustomers: boolean;
  onStartSale: () => void;
  onAddProduct: () => void;
  onOpenCash: () => void;
  onOpenStock: (filter: InventoryFilter) => void;
  onOpenCustomers: (filter: CustomerFilter) => void;
};

export function DashboardView({ businessName, userName, products, summary, sales, cashRegister, cashSession, debts, canOperate, canViewCustomers, onStartSale, onAddProduct, onOpenCash, onOpenStock, onOpenCustomers }: Props) {
  const openSession = cashSession?.status === "open" ? cashSession : undefined;
  const today = businessDay();
  const overdue = canViewCustomers ? overdueDebts(debts, today) : [];
  const overdueCustomers = new Set(overdue.map(debt => debt.customerId)).size;
  const inventoryAlerts = ([
    { filter: "out", title: "Sin stock", caption: "Productos agotados", tone: "urgent" },
    { filter: "low", title: "Stock bajo", caption: "En el mínimo o por debajo", tone: "warning" },
    { filter: "expired", title: "Vencidos", caption: "Con existencias por revisar", tone: "urgent" },
    { filter: "expiring", title: "Por vencer", caption: "Hoy y próximos 30 días", tone: "warning" }
  ] as const).map(alert => ({ ...alert, count: products.filter(product => matchesInventoryFilter(product, alert.filter, today)).length })).filter(alert => alert.count > 0);
  const recent = recentSales(sales);
  const hasAlerts = inventoryAlerts.length > 0 || overdue.length > 0;

  return <div className="stack dashboard-stack home-workspace">
    <header className="home-heading">
      <div><p>{contextualGreeting()}, {userName.trim().split(/\s+/)[0]}</p><h2>{businessName}</h2></div>
      <button className="primary-action" type="button" onClick={onStartSale} disabled={!canOperate}><ShoppingCart size={20}/> Vender</button>
    </header>

    <section className="home-shift" aria-labelledby="home-shift-title">
      <div className="home-shift-heading">
        <div><span className={`home-status ${openSession ? "open" : "closed"}`}><Banknote size={16}/>{openSession ? "Caja abierta" : "Sin turno abierto"}</span><h2 id="home-shift-title">Resumen de caja</h2><p>{openSession ? `Apertura: ${dashboardDateTime(openSession.openedAt)}${openSession.openedByName ? ` · ${openSession.openedByName}` : ""}` : "No hay una apertura de caja registrada."}</p></div>
        <button className="secondary-action" type="button" onClick={onOpenCash}><Banknote size={18}/>{openSession ? "Ver caja" : "Ir a caja"}<ArrowRight size={16}/></button>
      </div>
      <div className="home-totals">
        <div className="home-sales-total"><span>Ventas del período de caja</span><strong>{formatCLP(cashRegister.grossTotal)}</strong><small>{cashRegister.salesCount} {cashRegister.salesCount === 1 ? "venta" : "ventas"} · Ticket promedio {formatCLP(cashRegister.averageTicket)}</small></div>
        <div className="home-cash-total"><span>Efectivo esperado</span><strong>{formatCLP(cashRegister.expectedCash ?? cashRegister.totalsByMethod.cash)}</strong><small>Base {formatCLP(cashRegister.openingAmount ?? 0)} · Entradas {formatCLP(cashRegister.cashDeposits ?? 0)} · Salidas {formatCLP(cashRegister.cashWithdrawals ?? 0)}</small></div>
      </div>
      <div className="home-payment-summary">
        <div><span>Cobrado en ventas</span><strong>{formatCLP(cashRegister.receivedTotal)}</strong></div>
        <div><span>Efectivo en ventas</span><strong>{formatCLP(cashRegister.totalsByMethod.cash)}</strong></div>
        <div><span>Fiado del período</span><strong>{formatCLP(cashRegister.creditTotal)}</strong></div>
      </div>
    </section>

    {(products.length === 0 || recent.length === 0) && <section className="home-onboarding" aria-label="Puesta en marcha"><PackagePlus size={22}/><div><h2>{products.length === 0 ? "Tu catálogo está vacío" : "Aún no hay ventas"}</h2><p>{products.length === 0 ? "Todavía no hay productos registrados en este local." : "Las ventas registradas aparecerán en el resumen de caja."}</p></div><button className="secondary-action" type="button" disabled={!canOperate} onClick={products.length === 0 ? onAddProduct : onStartSale}>{products.length === 0 ? <PackagePlus size={18}/> : <ShoppingCart size={18}/>} {products.length === 0 ? "Crear producto" : "Primera venta"}</button></section>}

    <section className="home-attention" aria-labelledby="home-attention-title">
      <div className="home-section-heading"><h2 id="home-attention-title">Necesitan atención</h2>{!hasAlerts && <span className="home-all-clear"><CheckCircle2 size={17}/>{canViewCustomers ? "Sin alertas de stock, vencimientos o fiado vencido" : "Sin alertas de stock o vencimientos"}</span>}</div>
      {hasAlerts && <div className="home-alerts">
        {inventoryAlerts.map(alert => <button className={`home-alert ${alert.tone}`} type="button" onClick={() => onOpenStock(alert.filter)} key={alert.filter}><AlertTriangle size={20}/><span><strong>{alert.title} <b>{alert.count}</b></strong><small>{alert.caption}</small></span><ArrowRight size={17}/></button>)}
        {overdue.length > 0 && <button className="home-alert urgent" type="button" onClick={() => onOpenCustomers("overdue")}><Users size={20}/><span><strong>Fiado vencido <b>{overdueCustomers}</b></strong><small>{formatCLP(overdue.reduce((total, debt) => total + debt.balance, 0))} · {overdueCustomers === 1 ? "cliente" : "clientes"}</small></span><ArrowRight size={17}/></button>}
      </div>}
    </section>

    <RecentSales sales={recent}/>

    <footer className="home-business-summary"><button type="button" onClick={() => onOpenStock("all")}><PackagePlus size={18}/><span>Catálogo <strong>{products.filter(product => product.active !== false).length} productos</strong></span><ArrowRight size={16}/></button>{canViewCustomers && <button type="button" onClick={() => onOpenCustomers("credit")}><Users size={18}/><span>Fiado total pendiente <strong>{formatCLP(summary.pendingDebt)}</strong></span><ArrowRight size={16}/></button>}</footer>
  </div>;
}
