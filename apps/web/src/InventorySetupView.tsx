import { useEffect, useMemo, useState } from "react";
import type { Product, Supplier, Tenant } from "@localito/shared";
import { ArrowLeft, ArrowRight, Barcode, Check, FileSpreadsheet, Layers3, PackagePlus, ReceiptText, Sparkles, Store } from "lucide-react";
import { api } from "./lib/api";
import { InvoiceImportPanel } from "./InvoiceImportPanel";
import { ProductBulkImportPanel } from "./ProductBulkImportPanel";

type SetupMethod = "choose" | "invoice" | "csv";

function recommendedCategories(businessType: string) {
  const normalized = businessType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  if (normalized.includes("botiller") || normalized.includes("licor")) return ["Cervezas", "Vinos", "Destilados", "Bebidas", "Snacks", "Hielo"];
  if (normalized.includes("peluquer") || normalized.includes("salon")) return ["Servicios", "Shampoo", "Coloración", "Tratamientos", "Herramientas", "Accesorios"];
  if (normalized.includes("almacen") || normalized.includes("minimarket") || normalized.includes("abarrote")) return ["Abarrotes", "Bebidas", "Lácteos", "Snacks", "Aseo", "Congelados"];
  if (normalized.includes("ferreter")) return ["Herramientas", "Fijaciones", "Electricidad", "Pinturas", "Gasfitería", "Seguridad"];
  return ["Productos", "Servicios", "Accesorios", "Insumos", "Ofertas", "Otros"];
}

function saveSetupProgress(tenantId: string, status: "started" | "completed" | "dismissed", method?: string) {
  localStorage.setItem(`localito-inventory-setup:${tenantId}`, JSON.stringify({ status, method, updatedAt: new Date().toISOString() }));
}

function readSetupMethod(tenantId: string): SetupMethod {
  try {
    const progress = JSON.parse(localStorage.getItem(`localito-inventory-setup:${tenantId}`) ?? "null") as { status?: string; method?: string } | null;
    return progress?.status === "started" && (progress.method === "invoice" || progress.method === "csv") ? progress.method : "choose";
  } catch {
    return "choose";
  }
}

export function InventorySetupView({
  tenant,
  products,
  onRefresh,
  onNavigate,
  onFinish,
  onSkip
}: {
  tenant: Tenant;
  products: Product[];
  onRefresh: () => Promise<void>;
  onNavigate: (view: "product_create" | "scan" | "products") => void;
  onFinish: () => void;
  onSkip: () => void;
}) {
  const [method, setMethod] = useState<SetupMethod>(() => readSetupMethod(tenant.id));
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products]);
  const suggestedCategories = useMemo(() => recommendedCategories(tenant.businessType), [tenant.businessType]);
  const progress = products.length > 0 ? 100 : method === "choose" ? 34 : 67;

  async function loadSuppliers() {
    try {
      const response = await api.getSuppliers();
      setSuppliers(response.data);
    } catch {
      setSuppliers([]);
    }
  }

  useEffect(() => { void loadSuppliers(); }, [tenant.id]);

  function chooseMethod(next: SetupMethod) {
    setMethod(next);
    saveSetupProgress(tenant.id, "started", next);
  }

  async function refreshAfterImport(source: string) {
    saveSetupProgress(tenant.id, "started", source);
    await Promise.all([onRefresh(), loadSuppliers()]);
  }

  function finish() {
    saveSetupProgress(tenant.id, "completed", method);
    onFinish();
  }

  function skip() {
    saveSetupProgress(tenant.id, "dismissed", method);
    onSkip();
  }

  return <div className="setup-stack">
    <section className="panel setup-hero">
      <div className="setup-hero-copy">
        <span className="setup-kicker"><Sparkles size={16} /> Puesta en marcha guiada</span>
        <h2>{products.length ? "Tu inventario ya está tomando forma" : "Configuremos tu inventario inicial"}</h2>
        <p>Agrega muchos productos de una vez. Localito revisa duplicados, categorías, precios y stock antes de guardarlos.</p>
      </div>
      <div className="setup-progress-card">
        <div><span>Progreso</span><strong>{progress}%</strong></div>
        <div className="setup-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <small>{products.length ? `${products.length} ${products.length === 1 ? "producto" : "productos"} en ${categories.length} ${categories.length === 1 ? "categoría" : "categorías"}` : "Elige una forma de comenzar"}</small>
      </div>
    </section>

    <section className="panel setup-context-card">
      <div className="setup-context-main"><div className="setup-context-icon"><Store size={22} /></div><div><span>Rubro configurado</span><strong>{tenant.businessType || "Comercio general"}</strong><p>Puedes usar estas categorías sugeridas o escribir las tuyas.</p></div></div>
      <div className="setup-category-chips">{suggestedCategories.map((category) => <span key={category}>{category}</span>)}</div>
    </section>

    <div className="setup-steps" aria-label="Pasos de configuración">
      <div className="complete"><span><Check size={15} /></span><div><strong>1. Rubro</strong><small>{tenant.businessType}</small></div></div>
      <div className={method !== "choose" || products.length ? "complete" : "active"}><span>{method !== "choose" || products.length ? <Check size={15} /> : "2"}</span><div><strong>2. Cargar</strong><small>Factura, archivo o manual</small></div></div>
      <div className={products.length ? "complete" : ""}><span>{products.length ? <Check size={15} /> : "3"}</span><div><strong>3. Revisar</strong><small>Confirmar inventario</small></div></div>
    </div>

    {method === "choose" && <section className="setup-method-grid">
      <button className="setup-choice recommended" type="button" onClick={() => chooseMethod("invoice")}>
        <span className="setup-choice-tag">Recomendado</span><div className="setup-choice-icon"><ReceiptText size={25} /></div><div><strong>Fotografiar facturas</strong><p>La IA propone productos, proveedor, cantidades, costos y categorías. Tú confirmas precios.</p></div><span className="setup-choice-link">Comenzar <ArrowRight size={17} /></span>
      </button>
      <button className="setup-choice" type="button" onClick={() => chooseMethod("csv")}>
        <div className="setup-choice-icon blue"><FileSpreadsheet size={25} /></div><div><strong>Importar una plantilla CSV</strong><p>Ábrela en Excel, pega tu listado y crea hasta 500 productos en una carga.</p></div><span className="setup-choice-link">Usar plantilla <ArrowRight size={17} /></span>
      </button>
      <button className="setup-choice" type="button" onClick={() => { saveSetupProgress(tenant.id, "started", "manual"); onNavigate("product_create"); }}>
        <div className="setup-choice-icon amber"><PackagePlus size={25} /></div><div><strong>Carga manual rápida</strong><p>Úsala para productos sueltos o excepciones que no aparecen en facturas y archivos.</p></div><span className="setup-choice-link">Crear producto <ArrowRight size={17} /></span>
      </button>
    </section>}

    {method !== "choose" && <button className="setup-back" type="button" onClick={() => setMethod("choose")}><ArrowLeft size={17} /> Ver otras formas de carga</button>}
    {method === "invoice" && <InvoiceImportPanel products={products} suppliers={suppliers} onImported={() => refreshAfterImport("invoice")} />}
    {method === "csv" && <ProductBulkImportPanel businessType={tenant.businessType} onImported={() => refreshAfterImport("csv")} />}

    <section className="panel setup-finish-card">
      <div className="setup-finish-copy"><div className={products.length ? "setup-finish-icon ready" : "setup-finish-icon"}>{products.length ? <Check size={23} /> : <Layers3 size={23} />}</div><div><strong>{products.length ? "Inventario listo para revisar" : "Puedes continuar más tarde"}</strong><p>{products.length ? `Ya tienes ${products.length} productos. Revisa categorías, stock y precios antes de comenzar a vender.` : "El asistente seguirá disponible como Carga inicial en el menú."}</p></div></div>
      <div className="setup-finish-actions">
        {products.length > 0 && <button className="secondary-action" type="button" onClick={() => onNavigate("products")}><Barcode size={18} /> Revisar inventario</button>}
        <button className={products.length ? "primary-action" : "secondary-action"} type="button" onClick={products.length ? finish : skip}>{products.length ? <>Terminar configuración <ArrowRight size={18} /></> : "Hacerlo después"}</button>
      </div>
    </section>
  </div>;
}
