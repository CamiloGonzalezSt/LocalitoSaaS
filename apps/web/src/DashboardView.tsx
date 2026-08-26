import { AlertTriangle, Banknote, PackagePlus, ShoppingCart, Store, Users } from "lucide-react";
import type { CashRegisterSummary, Customer, Product, ReportSummary, Sale } from "@localito/shared";
import { contextualGreeting, formatCLP } from "./lib/format";

type Props = {
  businessName: string;
  userName: string;
  lowStockProducts: Product[];
  summary: ReportSummary;
  sales: Sale[];
  cashRegister: CashRegisterSummary;
  topDebtor?: Customer;
  canOperate: boolean;
  canViewCustomers: boolean;
  onStartSale: () => void;
  onAddProduct: () => void;
  onOpenCash: () => void;
  onOpenStock: () => void;
  onOpenCustomers: () => void;
};

export function DashboardView({
  businessName,
  userName,
  lowStockProducts,
  summary,
  sales,
  cashRegister,
  topDebtor,
  canOperate,
  canViewCustomers,
  onStartSale,
  onAddProduct,
  onOpenCash,
  onOpenStock,
  onOpenCustomers
}: Props) {
  const outOfStock = lowStockProducts.filter((product) => product.stock <= 0);
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  return (
    <div className="stack dashboard-stack">
      <section className="panel dashboard-summary" aria-labelledby="dashboard-sales-title">
        <div className="dashboard-summary-copy">
          <span>{contextualGreeting()}, {firstName}</span>
          <p>{businessName}</p>
          <h2 id="dashboard-sales-title">Ventas de hoy</h2>
          <strong>{formatCLP(summary.totalSales)}</strong>
          <small>{cashRegister.salesCount} {cashRegister.salesCount === 1 ? "venta registrada" : "ventas registradas"}</small>
        </div>
        <div className="dashboard-primary-actions" aria-label="Acciones rápidas">
          <button className="primary-action" type="button" onClick={onStartSale} disabled={!canOperate}>
            <ShoppingCart size={21} /> Vender
          </button>
          <button className="secondary-action" type="button" onClick={onAddProduct} disabled={!canOperate}>
            <PackagePlus size={21} /> Agregar producto
          </button>
          <button className="secondary-action" type="button" onClick={onOpenCash}>
            <Banknote size={21} /> Ver caja
          </button>
        </div>
      </section>

      <section className="dashboard-secondary-metrics" aria-label="Resumen financiero del día">
        <DashboardMetric label="Efectivo esperado" value={formatCLP(cashRegister.expectedCash ?? cashRegister.totalsByMethod.cash)} />
        <DashboardMetric label="Ganancia estimada" value={formatCLP(summary.estimatedGrossProfit)} />
        <DashboardMetric label="Ticket promedio" value={formatCLP(cashRegister.averageTicket)} />
        <DashboardMetric label={canViewCustomers ? "Fiado pendiente" : "Alertas de stock"} value={canViewCustomers ? formatCLP(summary.pendingDebt) : String(lowStockProducts.length)} attention={canViewCustomers ? summary.pendingDebt > 0 : lowStockProducts.length > 0} />
      </section>

      <section className="panel attention-panel">
        <div className="section-heading">
          <div><span>RESUMEN OPERATIVO</span><h2>Necesitan atención</h2></div>
          <span>{lowStockProducts.length + (canViewCustomers && topDebtor?.debtBalance ? 1 : 0)} pendientes</span>
        </div>
        <div className="attention-grid">
          <button className="attention-card" type="button" onClick={onOpenStock}>
            <AlertTriangle size={21} />
            <span><strong>{lowStockProducts.length} con stock bajo</strong><small>{outOfStock.length ? `${outOfStock.length} sin stock` : "Ningún producto agotado"}</small></span>
          </button>
          {canViewCustomers && <button className="attention-card" type="button" onClick={onOpenCustomers}>
            <Users size={21} />
            <span><strong>{topDebtor && topDebtor.debtBalance > 0 ? topDebtor.name : "Fiados al día"}</strong><small>{topDebtor && topDebtor.debtBalance > 0 ? `Debe ${formatCLP(topDebtor.debtBalance)}` : "No hay deudas pendientes"}</small></span>
          </button>}
        </div>
        {!lowStockProducts.length && !(canViewCustomers && topDebtor && topDebtor.debtBalance > 0) && <p className="empty-state">Todo está al día. No hay alertas que revisar.</p>}
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Últimas ventas</h2><span>{sales.length} registros</span></div>
        <div className="list">
          {sales.slice(0, 4).map((sale) => <div className="row" key={sale.id}><div><strong>{sale.items.length} producto(s)</strong><p>{sale.paymentMethod === "credit" ? "Fiado" : sale.paymentMethod}</p></div><span className="amount">{formatCLP(sale.total)}</span></div>)}
          {!sales.length && <p className="empty-state"><Store size={20} /> Las ventas aparecerán aquí cuando registres la primera.</p>}
        </div>
      </section>
    </div>
  );
}

function DashboardMetric({ label, value, attention = false }: { label: string; value: string; attention?: boolean }) {
  return <article className={attention ? "dashboard-metric attention" : "dashboard-metric"}><span>{label}</span><strong>{value}</strong></article>;
}
