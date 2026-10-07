import { ChevronDown, Clock3, ReceiptText } from "lucide-react";
import type { Sale } from "@localito/shared";
import { formatCLP } from "./lib/format";
import { dashboardDateTime, paymentLabels } from "./lib/dashboard";
import "./recent-sales.css";

export function RecentSales({ sales }: { sales: Sale[] }) {
  return <section className="home-recent" aria-labelledby="home-recent-title">
    <div className="home-section-heading"><h2 id="home-recent-title">Últimas ventas</h2><span>{sales.length ? `${sales.length} más recientes · Hora de Chile` : "Sin registros"}</span></div>
    {sales.map(sale => <details className="home-sale" key={sale.id}>
      <summary><ReceiptText size={19}/><span className="home-sale-description"><strong>{sale.items[0]?.productName ?? "Venta"}{sale.items.length > 1 ? ` y ${sale.items.length - 1} más` : ""}</strong><small><time dateTime={sale.createdAt}>{dashboardDateTime(sale.createdAt)}</time> · {paymentLabels[sale.paymentMethod]}</small>{(sale.status === "refunded" || sale.status === "partially_refunded") && <small>{sale.status === "refunded" ? "Devuelta" : "Devolución parcial"} · {formatCLP(sale.returnedTotal ?? 0)} devuelto · importe original</small>}</span><strong className="home-sale-amount">{formatCLP(sale.total)}</strong><ChevronDown size={17}/></summary>
      <div className="home-sale-details"><ul>{sale.items.map((item, index) => <li key={`${item.productId}-${index}`}><span>{item.quantity} × {item.productName}</span><strong>{formatCLP(item.subtotal)}</strong></li>)}</ul>{Boolean(sale.discount) && <p>Descuento: {formatCLP(sale.discount ?? 0)}</p>}{sale.payments?.map((payment, index) => <p key={index}>{paymentLabels[payment.method]}: {formatCLP(payment.amount)}</p>)}</div>
    </details>)}
    {!sales.length && <p className="home-empty"><Clock3 size={20}/> Todavía no hay ventas registradas.</p>}
  </section>;
}
