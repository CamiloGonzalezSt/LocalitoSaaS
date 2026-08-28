import { ArrowRight, CalendarDays, Package, ReceiptText, Search, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Customer, Product, Sale, User } from "@localito/shared";
import { formatCLP, formatDateTime } from "./lib/format";

type SearchKind = "all" | "products" | "customers" | "sales";

function normalize(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase("es");
}

function matches(query: string, ...values: Array<string | undefined>) {
  return !query || values.some((value) => normalize(value).includes(query));
}

function dateValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function SearchView({
  products,
  customers,
  sales,
  users,
  canViewBusinessRecords,
  onProduct,
  onCustomer,
  onSale
}: {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  users: User[];
  canViewBusinessRecords: boolean;
  onProduct: (product: Product) => void;
  onCustomer: (customer: Customer) => void;
  onSale: (sale: Sale) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SearchKind>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const normalizedQuery = normalize(query);
  const sellerById = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  const productResults = useMemo(() => products
    .filter((product) => product.active !== false)
    .filter((product) => matches(normalizedQuery, product.name, product.brand, product.category, product.barcode, product.sku, product.variant)), [normalizedQuery, products]);

  const customerResults = useMemo(() => canViewBusinessRecords ? customers
    .filter((customer) => customer.active !== false)
    .filter((customer) => matches(normalizedQuery, customer.name, customer.phone, customer.email, customer.address, customer.notes)) : [], [canViewBusinessRecords, customers, normalizedQuery]);

  const saleResults = useMemo(() => canViewBusinessRecords ? sales
    .filter((sale) => {
      const day = dateValue(sale.createdAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      const customer = customers.find((item) => item.id === sale.customerId);
      return matches(normalizedQuery, sale.id, sale.notes, customer?.name, sellerById.get(sale.sellerId), sale.items.map((item) => item.productName).join(" "));
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [], [canViewBusinessRecords, customers, from, normalizedQuery, sales, sellerById, to]);

  const visibleProducts = kind === "all" || kind === "products" ? productResults : [];
  const visibleCustomers = kind === "all" || kind === "customers" ? customerResults : [];
  const visibleSales = kind === "all" || kind === "sales" ? saleResults : [];
  const totalResults = visibleProducts.length + visibleCustomers.length + visibleSales.length;
  const hasFilters = Boolean(query || from || to || kind !== "all");

  function clearFilters() {
    setQuery("");
    setKind("all");
    setFrom("");
    setTo("");
  }

  return (
    <div className="stack business-search-page">
      <section className="panel business-search-hero">
        <div className="business-search-heading">
          <div><span>BÚSQUEDA CENTRAL</span><h2>Encuentra cualquier registro</h2><p>Busca productos, clientes y ventas del local desde un solo lugar.</p></div>
          <div className="business-search-total"><strong>{totalResults}</strong><span>{totalResults === 1 ? "resultado" : "resultados"}</span></div>
        </div>
        <label className="business-search-input">
          <Search size={22}/>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, código, teléfono, producto o número de venta"/>
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X size={17}/></button>}
        </label>
        <div className="business-search-controls">
          <div className="business-search-kinds" role="group" aria-label="Tipo de resultado">
            {([
              ["all", "Todo"],
              ["products", `Productos · ${productResults.length}`],
              ["customers", `Clientes · ${customerResults.length}`],
              ["sales", `Ventas · ${saleResults.length}`]
            ] as Array<[SearchKind, string]>).filter(([value]) => canViewBusinessRecords || !["customers", "sales"].includes(value)).map(([value, label]) => <button className={kind === value ? "active" : ""} type="button" key={value} onClick={() => setKind(value)}>{label}</button>)}
          </div>
          {canViewBusinessRecords && <div className="business-search-dates">
            <CalendarDays size={17}/>
            <label><span>Desde</span><input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)}/></label>
            <label><span>Hasta</span><input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)}/></label>
          </div>}
          {hasFilters && <button className="secondary-action small business-search-clear" type="button" onClick={clearFilters}>Limpiar filtros</button>}
        </div>
      </section>

      {totalResults === 0 && <section className="panel business-search-empty"><Search size={28}/><h3>No encontramos coincidencias</h3><p>Prueba con otra palabra o limpia los filtros para volver a ver los registros.</p><button className="secondary-action" type="button" onClick={clearFilters}>Ver todos</button></section>}

      {visibleProducts.length > 0 && <SearchSection title="Productos" icon={Package} count={visibleProducts.length}>
        {visibleProducts.map((product) => <button className="business-search-row" type="button" key={product.id} onClick={() => onProduct(product)}>
          <span className="business-search-icon"><Package size={19}/></span>
          <span className="business-search-copy"><strong>{product.name}</strong><small>{[product.brand, product.category, product.barcode ? `Cód. ${product.barcode}` : product.sku ? `SKU ${product.sku}` : ""].filter(Boolean).join(" · ")}</small></span>
          <span className="business-search-meta"><strong>{formatCLP(product.salePrice)}</strong><small>Stock {product.stock}</small></span>
          <ArrowRight size={18}/>
        </button>)}
      </SearchSection>}

      {visibleCustomers.length > 0 && <SearchSection title="Clientes" icon={Users} count={visibleCustomers.length}>
        {visibleCustomers.map((customer) => <button className="business-search-row" type="button" key={customer.id} onClick={() => onCustomer(customer)}>
          <span className="business-search-icon"><Users size={19}/></span>
          <span className="business-search-copy"><strong>{customer.name}</strong><small>{[customer.phone, customer.email, customer.address].filter(Boolean).join(" · ") || "Sin datos de contacto"}</small></span>
          <span className="business-search-meta"><strong>{formatCLP(customer.debtBalance)}</strong><small>Deuda actual</small></span>
          <ArrowRight size={18}/>
        </button>)}
      </SearchSection>}

      {visibleSales.length > 0 && <SearchSection title="Ventas" icon={ReceiptText} count={visibleSales.length}>
        {visibleSales.map((sale) => {
          const customer = customers.find((item) => item.id === sale.customerId);
          return <button className="business-search-row" type="button" key={sale.id} onClick={() => onSale(sale)}>
            <span className="business-search-icon"><ReceiptText size={19}/></span>
            <span className="business-search-copy"><strong>Venta #{sale.id.slice(0, 8)}</strong><small>{formatDateTime(sale.createdAt)} · {customer?.name ?? "Venta sin cliente"} · {sellerById.get(sale.sellerId) ?? "Vendedor"}</small></span>
            <span className="business-search-meta"><strong>{formatCLP(sale.total)}</strong><small>{sale.items.length} producto(s) · {sale.status === "cancelled" ? "Anulada" : "Registrada"}</small></span>
            <ArrowRight size={18}/>
          </button>;
        })}
      </SearchSection>}
    </div>
  );
}

function SearchSection({ title, icon: Icon, count, children }: { title: string; icon: LucideIcon; count: number; children: ReactNode }) {
  return <section className="panel business-search-section"><div className="section-heading"><div><span>RESULTADOS</span><h2><Icon size={20}/> {title}</h2></div><span>{count}</span></div><div className="business-search-list">{children}</div></section>;
}
