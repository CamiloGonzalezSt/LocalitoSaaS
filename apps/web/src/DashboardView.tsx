import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, PackagePlus, ShoppingCart, Store, Users } from "lucide-react";
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
  const hasPendingDebt = Boolean(canViewCustomers && topDebtor && topDebtor.debtBalance > 0);
  const priority = outOfStock.length > 0
    ? { Icon: AlertTriangle, tone: "urgent", title: `${outOfStock.length} producto${outOfStock.length === 1 ? "" : "s"} sin stock`, description: "Revísalos antes de que afecten tus próximas ventas.", action: "Revisar inventario", onClick: onOpenStock, requiresOperation: false }
    : lowStockProducts.length > 0
      ? { Icon: PackagePlus, tone: "warning", title: `${lowStockProducts.length} producto${lowStockProducts.length === 1 ? "" : "s"} con stock bajo`, description: "Anticipa la reposición para mantener el negocio operativo.", action: "Ver stock bajo", onClick: onOpenStock, requiresOperation: false }
      : hasPendingDebt
        ? { Icon: Users, tone: "warning", title: "Hay un fiado pendiente", description: `${topDebtor?.name} debe ${formatCLP(topDebtor?.debtBalance ?? 0)}.`, action: "Revisar fiado", onClick: onOpenCustomers, requiresOperation: false }
        : { Icon: CheckCircle2, tone: "ready", title: "Todo está al día", description: "El negocio está listo para registrar la próxima venta.", action: "Comenzar venta", onClick: onStartSale, requiresOperation: true };
  const PriorityIcon = priority.Icon;

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
            <PackagePlus size={21} /> Crear producto
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

      <section className={`dashboard-priority-panel ${priority.tone}`} aria-label="Prioridad de hoy">
        <div className="dashboard-priority-icon"><PriorityIcon size={23} /></div>
        <div className="dashboard-priority-copy"><span>PRIORIDAD DE HOY</span><strong>{priority.title}</strong><small>{priority.description}</small></div>
        <button className="secondary-action" type="button" onClick={priority.onClick} disabled={priority.requiresOperation && !canOperate}><span>{priority.action}</span><ArrowRight size={17} /></button>
      </section>

      {(lowStockProducts.length > 0 || hasPendingDebt) && <section className="panel attention-panel">
        <div className="section-heading">
          <div><span>RESUMEN OPERATIVO</span><h2>Necesitan atención</h2></div>
          <span>{lowStockProducts.length + (hasPendingDebt ? 1 : 0)} pendientes</span>
        </div>
        <div className="attention-grid">
          {lowStockProducts.length > 0 && <button className="attention-card" type="button" onClick={onOpenStock}>
            <AlertTriangle size={21} />
            <span><strong>{lowStockProducts.length} con stock bajo</strong><small>{outOfStock.length ? `${outOfStock.length} sin stock` : "Ningún producto agotado"}</small></span>
          </button>}
          {hasPendingDebt && <button className="attention-card" type="button" onClick={onOpenCustomers}>
            <Users size={21} />
            <span><strong>{topDebtor?.name}</strong><small>Debe {formatCLP(topDebtor?.debtBalance ?? 0)}</small></span>
          </button>}
        </div>
      </section>}

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
