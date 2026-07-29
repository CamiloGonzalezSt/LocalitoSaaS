import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Bot,
  Camera,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingCart,
  Smartphone,
  Trash2,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type {
  BootstrapData,
  CashRegisterClosure,
  CashRegisterSummary,
  Customer,
  PaymentMethod,
  Product,
  RecognitionLog,
  RecognitionResult,
  ReportSummary,
  Sale,
  SaleItem,
  Tenant,
  User
} from "@localito/shared";
import { api } from "./lib/api";
import type { AuthSession } from "./lib/api";

type View = "dashboard" | "sale" | "scan" | "products" | "customers" | "reports" | "settings";

type NoticeTone = "success" | "warning" | "error";

type ProductFormState = {
  name: string;
  brand: string;
  category: string;
  barcode: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minimumStock: string;
};

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type UserFormState = {
  name: string;
  email: string;
  role: User["role"];
  password: string;
};

type ProfileFormState = {
  name: string;
  email: string;
};

type DebtChargeState = {
  paymentId: string;
  customerId: string;
  customerName: string;
  amount: number;
  redirectUrl: string;
  createdAt: string;
};

type LoginFormState = {
  email: string;
  password: string;
};

interface NoticeState {
  message: string;
  tone: NoticeTone;
}

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "sale", label: "Venta", icon: ShoppingCart },
  { id: "scan", label: "IA", icon: Camera },
  { id: "products", label: "Stock", icon: Package },
  { id: "customers", label: "Fiado", icon: Users },
  { id: "reports", label: "Reportes", icon: BarChart3 }
];

const paymentOptions: Array<{ id: PaymentMethod; label: string; icon: LucideIcon }> = [
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "transfer", label: "Transferencia", icon: Smartphone },
  { id: "webpay", label: "Webpay", icon: WalletCards },
  { id: "credit", label: "Fiado", icon: ReceiptText }
];

const emptyProductForm: ProductFormState = {
  name: "",
  brand: "",
  category: "Abarrotes",
  barcode: "",
  costPrice: "",
  salePrice: "",
  stock: "",
  minimumStock: ""
};

const emptyCustomerForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  address: ""
};

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  role: "seller",
  password: "localito123"
};

const emptyProfileForm: ProfileFormState = {
  name: "",
  email: ""
};

const emptySummary: ReportSummary = {
  totalSales: 0,
  salesCount: 0,
  pendingDebt: 0,
  lowStockCount: 0,
  stockValue: 0
};

const emptyCashRegister: CashRegisterSummary = {
  date: new Date().toISOString().slice(0, 10),
  salesCount: 0,
  cancelledSalesCount: 0,
  grossTotal: 0,
  receivedTotal: 0,
  creditTotal: 0,
  averageTicket: 0,
  totalsByMethod: {
    cash: 0,
    card: 0,
    transfer: 0,
    webpay: 0,
    credit: 0
  }
};

const demoCredentials = [
  { label: "Dueno Caj", email: "caj.gonzalezs@duocuc.cl", password: "Duoc2026" },
  { label: "Vendedor Caj", email: "caj.gonzalezs+vendedor@duocuc.cl", password: "Duoc2026V" }
];

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

function numberFromInput(value: string, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function paymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    webpay: "Webpay",
    credit: "Fiado"
  };
  return labels[method];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function isOwnerUser(user: User | null) {
  return user?.role === "owner";
}

function userInitials(user: User) {
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [recognitionHistory, setRecognitionHistory] = useState<RecognitionLog[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegisterSummary>(emptyCashRegister);
  const [cashClosures, setCashClosures] = useState<CashRegisterClosure[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [ticket, setTicket] = useState<SaleItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [notice, setNotice] = useState<NoticeState>({
    message: "Cargando Localito...",
    tone: "success"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: demoCredentials[0].email,
    password: demoCredentials[0].password
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [scanHint, setScanHint] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [correctionProductId, setCorrectionProductId] = useState("");
  const [cashClosureNote, setCashClosureNote] = useState("");
  const [lastDebtCharge, setLastDebtCharge] = useState<DebtChargeState | null>(null);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= product.minimumStock),
    [products]
  );

  const ticketTotal = useMemo(() => ticket.reduce((sum, item) => sum + item.subtotal, 0), [ticket]);
  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;

    return products.filter((product) =>
      [product.name, product.brand, product.category, product.barcode]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [products, searchTerm]);
  const activeSales = useMemo(() => sales.filter((sale) => sale.status !== "cancelled"), [sales]);
  const cancelledSales = useMemo(() => sales.filter((sale) => sale.status === "cancelled"), [sales]);
  const topSoldProduct = useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number; amount: number }>();
    for (const sale of activeSales) {
      for (const item of sale.items) {
        const current = totals.get(item.productId) ?? { name: item.productName, quantity: 0, amount: 0 };
        current.quantity += item.quantity;
        current.amount += item.subtotal;
        totals.set(item.productId, current);
      }
    }
    return [...totals.values()].sort((a, b) => b.quantity - a.quantity)[0];
  }, [activeSales]);
  const topDebtor = useMemo(() => [...customers].sort((a, b) => b.debtBalance - a.debtBalance)[0], [customers]);
  const isOwner = isOwnerUser(currentUser);
  const visibleNavItems = navItems.map((item) =>
    item.id === "reports" && !isOwner
      ? {
          ...item,
          label: "Caja",
          icon: Banknote
        }
      : item
  );

  function saveSession(session: AuthSession) {
    localStorage.setItem("localito-session", JSON.stringify(session));
    localStorage.setItem("localito-token", session.token);
    setCurrentUser(session.user);
    setTenant(session.tenant);
  }

  async function loadWorkspace(message?: string) {
    try {
      const response = await api.bootstrap();
      applyWorkspace(response.data);
      if (message) setNotice({ message, tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo cargar la API.", tone: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  function applyWorkspace(data: BootstrapData) {
    setTenant(data.tenant);
    setUsers(data.users);
    setProducts(data.products);
    setCustomers(data.customers);
    setSales(data.sales);
    setRecognitionHistory(data.recognitionHistory);
    setCashRegister(data.cashRegister);
    setCashClosures(data.cashClosures);
    setSummary(data.summary);
    setSelectedCustomerId((current) => current || data.customers[0]?.id || "");
  }

  useEffect(() => {
    const storedSession = localStorage.getItem("localito-session");
    if (!storedSession) {
      setNotice({ message: "Inicia sesion para operar el local.", tone: "success" });
      setIsLoading(false);
      return;
    }

    try {
      saveSession(JSON.parse(storedSession) as AuthSession);
      void loadWorkspace("Sesion restaurada.");
    } catch {
      localStorage.removeItem("localito-session");
      localStorage.removeItem("localito-token");
      setNotice({ message: "Inicia sesion para operar el local.", tone: "success" });
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setProfileForm(emptyProfileForm);
      return;
    }

    setProfileForm({
      name: currentUser.name,
      email: currentUser.email
    });
  }, [currentUser?.id, currentUser?.name, currentUser?.email]);

  async function login() {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setNotice({ message: "Ingresa correo y contrasena.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    setIsLoading(true);
    try {
      const response = await api.login(loginForm.email.trim(), loginForm.password);
      saveSession(response.data);
      await loadWorkspace(`Bienvenido, ${response.data.user.name}.`);
    } catch (error) {
      setIsLoading(false);
      setNotice({ message: error instanceof Error ? error.message : "No se pudo iniciar sesion.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("localito-session");
    localStorage.removeItem("localito-token");
    setCurrentUser(null);
    setTenant(null);
    setUsers([]);
    setProducts([]);
    setCustomers([]);
    setSales([]);
    setRecognitionHistory([]);
    setCashRegister(emptyCashRegister);
    setCashClosures([]);
    setSummary(emptySummary);
    setTicket([]);
    setLastReceipt(null);
    setActiveView("dashboard");
    setNotice({ message: "Sesion cerrada. Puedes iniciar como dueno o vendedor.", tone: "success" });
  }

  function addToTicket(product: Product) {
    const currentQuantity = ticket.find((item) => item.productId === product.id)?.quantity ?? 0;
    if (currentQuantity >= product.stock) {
      setNotice({ message: `No hay mas stock disponible para ${product.name}.`, tone: "warning" });
      return;
    }

    setTicket((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.salePrice,
          subtotal: product.salePrice
        }
      ];
    });

    setNotice({ message: `${product.name} agregado al ticket.`, tone: "success" });
  }

  function removeOneFromTicket(productId: string) {
    setTicket((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1, subtotal: (item.quantity - 1) * item.unitPrice }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function confirmSale() {
    if (ticket.length === 0) {
      setNotice({ message: "Agrega al menos un producto antes de confirmar la venta.", tone: "warning" });
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomerId) {
      setNotice({ message: "Selecciona un cliente para registrar la venta fiada.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const saleResponse = await api.createSale({
        paymentMethod,
        customerId: paymentMethod === "credit" ? selectedCustomerId : undefined,
        items: ticket.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      });
      setLastReceipt(saleResponse.data);

      if (paymentMethod === "webpay") {
        const webpay = await api.createWebpayPayment(ticketTotal, undefined, saleResponse.data.id);
        setNotice({
          message: `Venta registrada. Link Webpay demo: ${webpay.data.redirectUrl}`,
          tone: "success"
        });
      } else {
        setNotice({ message: `Venta registrada por ${formatCLP(ticketTotal)}.`, tone: "success" });
      }

      setTicket([]);
      await loadWorkspace();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo registrar la venta.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function printLastReceipt() {
    if (!lastReceipt) {
      setNotice({ message: "Registra una venta antes de imprimir el comprobante.", tone: "warning" });
      return;
    }
    window.print();
  }

  async function shareLastReceipt() {
    if (!lastReceipt) {
      setNotice({ message: "Registra una venta antes de compartir el comprobante.", tone: "warning" });
      return;
    }

    const text = [
      `${tenant?.name ?? "Localito"} - comprobante no tributario`,
      `Venta #${lastReceipt.id.slice(0, 8)}`,
      `Total: ${formatCLP(lastReceipt.total)}`,
      `Pago: ${paymentMethodLabel(lastReceipt.paymentMethod)}`
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Comprobante Localito", text });
      } else {
        await navigator.clipboard.writeText(text);
        setNotice({ message: "Comprobante copiado al portapapeles.", tone: "success" });
      }
    } catch {
      setNotice({ message: "No se pudo compartir el comprobante.", tone: "warning" });
    }
  }

  function debtChargeMessage(charge: DebtChargeState) {
    return [
      `Hola ${charge.customerName}, tienes un cobro pendiente en ${tenant?.name ?? "Localito"}.`,
      `Monto: ${formatCLP(charge.amount)}.`,
      `Puedes pagar con Webpay aqui: ${charge.redirectUrl}`,
      "Gracias."
    ].join("\n");
  }

  async function copyTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function shareDebtCharge(charge: DebtChargeState) {
    const text = debtChargeMessage(charge);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cobro ${tenant?.name ?? "Localito"}`,
          text,
          url: charge.redirectUrl
        });
        setNotice({ message: `Cobro compartido para ${charge.customerName}.`, tone: "success" });
        return;
      }

      await copyTextToClipboard(text);
      setNotice({ message: "Tu dispositivo no abrio compartir, pero el cobro quedo copiado.", tone: "success" });
    } catch {
      setNotice({ message: "Cobro generado. Puedes compartirlo, copiarlo o enviarlo por WhatsApp.", tone: "warning" });
    }
  }

  async function copyDebtCharge(charge: DebtChargeState) {
    try {
      await copyTextToClipboard(debtChargeMessage(charge));
      setNotice({ message: "Mensaje de cobro copiado.", tone: "success" });
    } catch {
      setNotice({ message: "No se pudo copiar el cobro.", tone: "warning" });
    }
  }

  function openWhatsAppDebtCharge(charge: DebtChargeState) {
    const url = `https://wa.me/?text=${encodeURIComponent(debtChargeMessage(charge))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setNotice({ message: `Cobro listo para enviar por WhatsApp a ${charge.customerName}.`, tone: "success" });
  }

  async function confirmDebtCharge(charge: DebtChargeState) {
    setIsBusy(true);
    try {
      await api.confirmWebpayPayment(charge.paymentId);
      setLastDebtCharge(null);
      await loadWorkspace(`Pago Webpay demo confirmado para ${charge.customerName}. Deuda actualizada.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo confirmar el pago Webpay.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function cancelSale(sale: Sale) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede anular ventas.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const response = await api.cancelSale(sale.id, "Anulada desde demo de tesis");
      if (lastReceipt?.id === sale.id) setLastReceipt(response.data);
      await loadWorkspace("Venta anulada y stock restaurado.");
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo anular la venta.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function closeCashRegister() {
    if (!currentUser) return;

    setIsBusy(true);
    try {
      const response = await api.closeCashRegister({
        date: cashRegister.date,
        note: cashClosureNote.trim() || undefined,
        closedByUserId: currentUser.id
      });
      setCashClosureNote("");
      await loadWorkspace(`Cierre de caja registrado por ${formatCLP(response.data.receivedTotal)} recibido.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo cerrar la caja.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function createProduct() {
    if (!isOwner) {
      setNotice({ message: "El vendedor solo puede consultar stock. No puede crear ni editar productos.", tone: "warning" });
      return;
    }

    if (!productForm.name.trim() || !productForm.category.trim() || !productForm.salePrice.trim()) {
      setNotice({ message: "Nombre, categoria y precio de venta son obligatorios.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        brand: productForm.brand.trim(),
        category: productForm.category.trim(),
        barcode: productForm.barcode.trim(),
        costPrice: numberFromInput(productForm.costPrice),
        salePrice: numberFromInput(productForm.salePrice),
        stock: numberFromInput(productForm.stock),
        minimumStock: numberFromInput(productForm.minimumStock)
      };

      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
      } else {
        await api.createProduct(payload);
      }

      setEditingProductId(null);
      setProductForm(emptyProductForm);
      await loadWorkspace(editingProductId ? "Producto actualizado." : "Producto creado y disponible para venta.");
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo crear el producto.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function startEditProduct(product: Product) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede editar productos.", tone: "warning" });
      return;
    }

    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      brand: product.brand ?? "",
      category: product.category,
      barcode: product.barcode ?? "",
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minimumStock: String(product.minimumStock)
    });
    setActiveView("products");
  }

  async function deactivateProduct(product: Product) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede desactivar productos.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.deactivateProduct(product.id);
      await loadWorkspace(`${product.name} fue desactivado del inventario.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo desactivar el producto.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function adjustStock(product: Product, delta: number) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede ajustar stock manualmente.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.updateStock(product.id, Math.max(0, product.stock + delta));
      await loadWorkspace(`Stock actualizado para ${product.name}.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo actualizar stock.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function createCustomer() {
    if (editingCustomerId && !isOwner) {
      setNotice({ message: "Solo el dueno/admin puede editar clientes.", tone: "warning" });
      return;
    }

    if (!customerForm.name.trim()) {
      setNotice({ message: "El nombre del cliente es obligatorio.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const payload = {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim(),
        address: customerForm.address.trim()
      };

      if (editingCustomerId) {
        await api.updateCustomer(editingCustomerId, payload);
      } else {
        await api.createCustomer(payload);
      }

      setEditingCustomerId(null);
      setCustomerForm(emptyCustomerForm);
      await loadWorkspace(editingCustomerId ? "Cliente actualizado." : "Cliente creado para fiado y pagos.");
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo crear el cliente.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function startEditCustomer(customer: Customer) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede editar clientes.", tone: "warning" });
      return;
    }

    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? ""
    });
    setActiveView("customers");
  }

  async function deactivateCustomer(customer: Customer) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede desactivar clientes.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.deactivateCustomer(customer.id);
      await loadWorkspace(`${customer.name} fue desactivado.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo desactivar el cliente.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function payCustomerDebt(customer: Customer) {
    const amount = numberFromInput(paymentAmounts[customer.id] || "2000");
    if (amount <= 0) {
      setNotice({ message: "Ingresa un monto de abono valido.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.payCustomerDebt(customer.id, amount, "cash");
      setPaymentAmounts((current) => ({ ...current, [customer.id]: "" }));
      await loadWorkspace(`Abono registrado para ${customer.name}.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo registrar el abono.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function createDebtWebpay(customer: Customer) {
    const amount = numberFromInput(paymentAmounts[customer.id] || String(customer.debtBalance));
    if (amount <= 0) {
      setNotice({ message: "Ingresa un monto para generar Webpay.", tone: "warning" });
      return;
    }

    let chargeToShare: DebtChargeState | null = null;
    setIsBusy(true);
    try {
      const response = await api.createWebpayPayment(amount, customer.id);
      const charge: DebtChargeState = {
        paymentId: response.data.payment.id,
        customerId: customer.id,
        customerName: customer.name,
        amount,
        redirectUrl: response.data.redirectUrl,
        createdAt: new Date().toISOString()
      };
      chargeToShare = charge;
      setLastDebtCharge(charge);
      setPaymentAmounts((current) => ({ ...current, [customer.id]: "" }));
      setNotice({
        message: `Cobro Webpay demo generado para ${customer.name}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo crear Webpay.", tone: "error" });
    } finally {
      setIsBusy(false);
    }

    if (chargeToShare) void shareDebtCharge(chargeToShare);
  }

  async function createUser() {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede crear usuarios.", tone: "warning" });
      return;
    }

    if (!userForm.name.trim() || !userForm.email.trim()) {
      setNotice({ message: "Nombre y correo son obligatorios para crear usuario.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        password: userForm.password
      });
      setUserForm(emptyUserForm);
      await loadWorkspace("Usuario interno creado.");
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo crear el usuario.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function updateMyProfile() {
    if (!currentUser) return;

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setNotice({ message: "Nombre y correo son obligatorios para actualizar tu perfil.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const response = await api.updateUser(currentUser.id, {
        name: profileForm.name.trim(),
        email: profileForm.email.trim()
      });
      const updatedUser = response.data;
      setCurrentUser(updatedUser);
      setUsers((current) => current.map((localUser) => (localUser.id === updatedUser.id ? updatedUser : localUser)));

      const storedSession = localStorage.getItem("localito-session");
      if (storedSession) {
        const session = JSON.parse(storedSession) as AuthSession;
        localStorage.setItem("localito-session", JSON.stringify({ ...session, user: updatedUser }));
      }

      setNotice({ message: "Perfil actualizado.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo actualizar tu perfil.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function deactivateUser(user: User) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede desactivar usuarios.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.updateUser(user.id, { active: false });
      await loadWorkspace(`${user.name} fue desactivado.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo desactivar el usuario.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function recognizeProduct(payload?: { barcode?: string; hint?: string }) {
    setIsBusy(true);
    try {
      const response = await api.recognizeProduct(payload ?? {
        hint: scanHint.trim() || undefined,
        barcode: scanBarcode.trim() || undefined
      });
      setRecognition(response.data);
      setCorrectionProductId(response.data.productId ?? "");
      const history = await api.getRecognitionHistory();
      setRecognitionHistory(history.data);
      setNotice({ message: "Producto detectado desde la API de IA demo.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo reconocer el producto.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmRecognition(confirmed: boolean) {
    if (!recognition) return;

    setIsBusy(true);
    try {
      const product = products.find((candidate) => candidate.id === correctionProductId);
      const response = await api.confirmRecognition(recognition.id, {
        confirmed,
        productId: correctionProductId || undefined,
        userCorrection: confirmed ? undefined : product?.name ?? "Correccion manual"
      });
      setRecognition(response.data);
      const history = await api.getRecognitionHistory();
      setRecognitionHistory(history.data);
      setNotice({ message: confirmed ? "Reconocimiento confirmado." : "Correccion guardada para evidencia de IA.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo guardar la confirmacion.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function addRecognizedProduct() {
    const product = products.find((candidate) => candidate.id === recognition?.productId);
    if (!product) {
      setNotice({ message: "No se pudo agregar el producto reconocido.", tone: "error" });
      return;
    }
    addToTicket(product);
    setActiveView("sale");
  }

  if (!currentUser) {
    return (
      <LoginView
        loginForm={loginForm}
        notice={notice}
        isBusy={isBusy || isLoading}
        onForm={setLoginForm}
        onLogin={() => void login()}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">{tenant?.name ?? "Localito"}</p>
          <h1>{viewTitle(activeView, isOwner)}</h1>
          <p className="session-line">
            <span className="avatar-mini">{userInitials(currentUser)}</span>
            <span>{currentUser.name}</span>
            <span className="role-pill">{currentUser.role === "owner" ? "Dueno/admin" : "Vendedor"}</span>
          </p>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={() => void loadWorkspace("Datos refrescados.")} aria-label="Refrescar">
            <RefreshCw size={20} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setActiveView("settings")}
            aria-label={isOwner ? "Configuracion" : "Mi perfil"}
          >
            <Settings size={21} />
          </button>
          <button className="icon-button" type="button" onClick={logout} aria-label="Cerrar sesion">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Navegacion principal">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activeView === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <main className="content">
        <section className={`notice ${notice.tone}`} aria-live="polite">
          <CheckCircle2 size={18} />
          <span>{notice.message}</span>
        </section>

        {isLoading && <p className="empty-state">Conectando con la API de Localito...</p>}

        {!isLoading && activeView === "dashboard" && (
          <DashboardView
            lowStockProducts={lowStockProducts}
            summary={summary}
            sales={activeSales}
            cashRegister={cashRegister}
            topSoldProduct={topSoldProduct}
            topDebtor={topDebtor}
            cancelledSalesCount={cancelledSales.length}
            canViewManagementMetrics={isOwner}
            onStartSale={() => setActiveView("sale")}
            onOpenScan={() => setActiveView("scan")}
          />
        )}

        {!isLoading && activeView === "sale" && (
          <SaleView
            products={filteredProducts}
            ticket={ticket}
            ticketTotal={ticketTotal}
            paymentMethod={paymentMethod}
            paymentOptions={paymentOptions}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            searchTerm={searchTerm}
            isBusy={isBusy}
            onSearch={setSearchTerm}
            onAdd={addToTicket}
            onRemoveOne={removeOneFromTicket}
            onPaymentMethod={setPaymentMethod}
            onCustomer={setSelectedCustomerId}
            onConfirm={() => void confirmSale()}
            onScan={() => setActiveView("scan")}
            lastReceipt={lastReceipt}
            onPrintReceipt={printLastReceipt}
            onShareReceipt={() => void shareLastReceipt()}
          />
        )}

        {!isLoading && activeView === "scan" && (
          <ScanView
            recognition={recognition}
            scanHint={scanHint}
            scanBarcode={scanBarcode}
            products={products}
            recognitionHistory={recognitionHistory}
            correctionProductId={correctionProductId}
            isBusy={isBusy}
            onHint={setScanHint}
            onBarcode={setScanBarcode}
            onRecognize={() => void recognizeProduct()}
            onRecognizeBarcode={(barcode) => void recognizeProduct({ barcode })}
            onCorrectionProduct={setCorrectionProductId}
            onConfirmRecognition={() => void confirmRecognition(true)}
            onCorrectRecognition={() => void confirmRecognition(false)}
            onAdd={addRecognizedProduct}
            onManualSearch={() => setActiveView("sale")}
          />
        )}

        {!isLoading && activeView === "products" && (
          <ProductsView
            products={filteredProducts}
            searchTerm={searchTerm}
            productForm={productForm}
            isBusy={isBusy}
            editingProductId={editingProductId}
            canManageProducts={isOwner}
            onSearch={setSearchTerm}
            onForm={setProductForm}
            onCreate={() => void createProduct()}
            onCancelEdit={() => {
              setEditingProductId(null);
              setProductForm(emptyProductForm);
            }}
            onEdit={startEditProduct}
            onDeactivate={(product) => void deactivateProduct(product)}
            onAdjustStock={(product, delta) => void adjustStock(product, delta)}
          />
        )}

        {!isLoading && activeView === "customers" && (
          <CustomersView
            customers={customers}
            customerForm={customerForm}
            paymentAmounts={paymentAmounts}
            lastDebtCharge={lastDebtCharge}
            isBusy={isBusy}
            editingCustomerId={editingCustomerId}
            canManageCustomers={isOwner}
            onForm={setCustomerForm}
            onPaymentAmount={(customerId, value) => setPaymentAmounts((current) => ({ ...current, [customerId]: value }))}
            onCreate={() => void createCustomer()}
            onCancelEdit={() => {
              setEditingCustomerId(null);
              setCustomerForm(emptyCustomerForm);
            }}
            onEdit={startEditCustomer}
            onDeactivate={(customer) => void deactivateCustomer(customer)}
            onPayDebt={(customer) => void payCustomerDebt(customer)}
            onCreatePayment={(customer) => void createDebtWebpay(customer)}
            onShareDebtCharge={(charge) => void shareDebtCharge(charge)}
            onCopyDebtCharge={(charge) => void copyDebtCharge(charge)}
            onWhatsAppDebtCharge={openWhatsAppDebtCharge}
            onConfirmDebtCharge={(charge) => void confirmDebtCharge(charge)}
          />
        )}

        {!isLoading && activeView === "reports" && (
          <ReportsView
            products={products}
            customers={customers}
            sales={sales}
            lowStockProducts={lowStockProducts}
            summary={summary}
            cashRegister={cashRegister}
            cashClosures={cashClosures}
            cashClosureNote={cashClosureNote}
            isBusy={isBusy}
            canViewFullReports={isOwner}
            onCashClosureNote={setCashClosureNote}
            onCloseCashRegister={() => void closeCashRegister()}
            onCancelSale={(sale) => void cancelSale(sale)}
          />
        )}

        {!isLoading && activeView === "settings" && (
          <SettingsView
            tenant={tenant}
            user={currentUser}
            users={users}
            userForm={userForm}
            profileForm={profileForm}
            isBusy={isBusy}
            canManageUsers={isOwner}
            onUserForm={setUserForm}
            onProfileForm={setProfileForm}
            onSaveProfile={() => void updateMyProfile()}
            onCreateUser={() => void createUser()}
            onDeactivateUser={(userToDeactivate) => void deactivateUser(userToDeactivate)}
          />
        )}
      </main>

      <ReceiptPrintArea sale={lastReceipt} tenant={tenant} user={currentUser} customers={customers} />

    </div>
  );
}

function viewTitle(view: View, isOwner: boolean) {
  const labels: Record<View, string> = {
    dashboard: "Panel del dia",
    sale: "Nueva venta",
    scan: "Camara IA",
    products: "Inventario",
    customers: "Clientes y fiado",
    reports: isOwner ? "Reportes" : "Cierre de caja",
    settings: isOwner ? "Configuracion" : "Mi perfil"
  };
  return labels[view];
}

function LoginView({
  loginForm,
  notice,
  isBusy,
  onForm,
  onLogin
}: {
  loginForm: LoginFormState;
  notice: NoticeState;
  isBusy: boolean;
  onForm: (value: LoginFormState) => void;
  onLogin: () => void;
}) {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-icon">
            <ShoppingCart size={30} />
          </div>
          <div>
            <p className="eyebrow">Localito</p>
            <h1>Acceso del local</h1>
          </div>
        </div>

        <section className={`notice ${notice.tone}`} aria-live="polite">
          <CheckCircle2 size={18} />
          <span>{notice.message}</span>
        </section>

        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <label className="field">
            Correo
            <input
              value={loginForm.email}
              onChange={(event) => onForm({ ...loginForm, email: event.target.value })}
              placeholder="correo@localito.cl"
              inputMode="email"
              autoComplete="username"
            />
          </label>
          <label className="field">
            Contrasena
            <input
              value={loginForm.password}
              onChange={(event) => onForm({ ...loginForm, password: event.target.value })}
              placeholder="Contrasena"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <button className="primary-action full" type="submit" disabled={isBusy}>
            <LogIn size={20} />
            <span>{isBusy ? "Entrando..." : "Iniciar sesion"}</span>
          </button>
        </form>

        <div className="quick-login">
          {demoCredentials.map((credential) => (
            <button
              className="secondary-action"
              type="button"
              key={credential.email}
              onClick={() => onForm({ email: credential.email, password: credential.password })}
            >
              <Users size={18} />
              <span>{credential.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-list">
          <p>
            <strong>Duenos:</strong> caj.gonzalezs@duocuc.cl, sam.solis@duocuc.cl, al.patino@duocuc.cl
          </p>
          <p>
            <strong>Vendedores:</strong> usar el mismo correo con +vendedor antes de @duocuc.cl
          </p>
          <p>
            <strong>Claves:</strong> duenos Duoc2026, vendedores Duoc2026V
          </p>
        </div>
      </section>
    </main>
  );
}

function DashboardView({
  lowStockProducts,
  summary,
  sales,
  cashRegister,
  topSoldProduct,
  topDebtor,
  cancelledSalesCount,
  canViewManagementMetrics,
  onStartSale,
  onOpenScan
}: {
  lowStockProducts: Product[];
  summary: ReportSummary;
  sales: Sale[];
  cashRegister: CashRegisterSummary;
  topSoldProduct?: { name: string; quantity: number; amount: number };
  topDebtor?: Customer;
  cancelledSalesCount: number;
  canViewManagementMetrics: boolean;
  onStartSale: () => void;
  onOpenScan: () => void;
}) {
  const heroAmount = canViewManagementMetrics ? summary.totalSales : cashRegister.receivedTotal;

  return (
    <div className="stack">
      <section className="hero-panel dashboard-hero">
        <div className="hero-copy">
          <span>{canViewManagementMetrics ? "Ventas del dia" : "Caja recibida"}</span>
          <strong>{formatCLP(heroAmount)}</strong>
          <p>
            {cashRegister.salesCount} tickets registrados - {lowStockProducts.length} alertas de stock
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-action" type="button" onClick={onStartSale}>
            <ShoppingCart size={22} />
            <span>Nueva venta</span>
          </button>
          <button className="secondary-action" type="button" onClick={onOpenScan}>
            <Camera size={22} />
            <span>Escanear</span>
          </button>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard label={canViewManagementMetrics ? "Ventas" : "Caja recibida"} value={formatCLP(canViewManagementMetrics ? summary.totalSales : cashRegister.receivedTotal)} icon={Banknote} tone="green" />
        <StatCard label={canViewManagementMetrics ? "Fiado" : "Fiado hoy"} value={formatCLP(canViewManagementMetrics ? summary.pendingDebt : cashRegister.creditTotal)} icon={ReceiptText} tone="amber" />
        <StatCard label="Alertas" value={String(summary.lowStockCount)} icon={AlertTriangle} tone="red" />
        <StatCard label="Tickets" value={String(cashRegister.salesCount)} icon={ShoppingCart} tone="blue" />
      </div>

      <section className="panel">
        <div className="section-heading">
          <h2>Caja de hoy</h2>
          <span>{cashRegister.salesCount} ventas</span>
        </div>
        <div className="report-grid">
          <ReportMetric label="Efectivo" value={formatCLP(cashRegister.totalsByMethod.cash)} />
          <ReportMetric label="Tarjeta" value={formatCLP(cashRegister.totalsByMethod.card)} />
          <ReportMetric label="Transferencia" value={formatCLP(cashRegister.totalsByMethod.transfer)} />
          <ReportMetric label="Fiado" value={formatCLP(cashRegister.creditTotal)} tone="warning" />
        </div>
        {canViewManagementMetrics && (
          <div className="report-grid two">
            <ReportMetric label="Ticket promedio" value={formatCLP(cashRegister.averageTicket)} />
            <ReportMetric label="Anuladas" value={String(cancelledSalesCount)} />
            <ReportMetric label="Mas vendido" value={topSoldProduct ? `${topSoldProduct.name} (${topSoldProduct.quantity})` : "Sin datos"} />
            <ReportMetric label="Mayor fiado" value={topDebtor && topDebtor.debtBalance > 0 ? `${topDebtor.name} ${formatCLP(topDebtor.debtBalance)}` : "Sin deuda"} tone="warning" />
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Alertas de stock</h2>
          <span>{lowStockProducts.length} pendientes</span>
        </div>
        <div className="list">
          {lowStockProducts.map((product) => (
            <ProductAlert product={product} key={product.id} />
          ))}
          {lowStockProducts.length === 0 && <p className="empty-state">No hay productos bajo el minimo.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Ultimas ventas</h2>
          <span>{sales.length} registros</span>
        </div>
        <div className="list">
          {sales.slice(0, 4).map((sale) => (
            <div className="row" key={sale.id}>
              <div>
                <strong>{sale.items.length} producto(s)</strong>
                <p>{sale.paymentMethod === "credit" ? "Fiado" : sale.paymentMethod}</p>
              </div>
              <span className="amount">{formatCLP(sale.total)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SaleView({
  products,
  ticket,
  ticketTotal,
  paymentMethod,
  paymentOptions,
  customers,
  selectedCustomerId,
  searchTerm,
  isBusy,
  onSearch,
  onAdd,
  onRemoveOne,
  onPaymentMethod,
  onCustomer,
  onConfirm,
  onScan,
  lastReceipt,
  onPrintReceipt,
  onShareReceipt
}: {
  products: Product[];
  ticket: SaleItem[];
  ticketTotal: number;
  paymentMethod: PaymentMethod;
  paymentOptions: Array<{ id: PaymentMethod; label: string; icon: LucideIcon }>;
  customers: Customer[];
  selectedCustomerId: string;
  searchTerm: string;
  isBusy: boolean;
  onSearch: (value: string) => void;
  onAdd: (product: Product) => void;
  onRemoveOne: (productId: string) => void;
  onPaymentMethod: (value: PaymentMethod) => void;
  onCustomer: (value: string) => void;
  onConfirm: () => void;
  onScan: () => void;
  lastReceipt: Sale | null;
  onPrintReceipt: () => void;
  onShareReceipt: () => void;
}) {
  return (
    <div className="workspace-grid sale-workspace">
      <section className="panel sale-products-panel">
        <div className="section-heading compact-heading">
          <h2>Productos</h2>
          <span>{products.length} disponibles</span>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar producto, marca o codigo" />
        </div>
        <button className="inline-command" type="button" onClick={onScan}>
          <Camera size={18} />
          <span>Usar camara IA</span>
        </button>
        <div className="list product-list">
          {products.map((product) => (
            <button className="product-button" type="button" key={product.id} onClick={() => onAdd(product)}>
              <div>
                <strong>{product.name}</strong>
                <p>
                  {product.category} - Stock {product.stock}
                </p>
              </div>
              <span>{formatCLP(product.salePrice)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel ticket-panel">
        <div className="section-heading">
          <h2>Ticket</h2>
          <span>{ticket.length} items</span>
        </div>
        <div className="list ticket-list">
          {ticket.map((item) => (
            <div className="row" key={item.productId}>
              <div>
                <strong>{item.productName}</strong>
                <p>
                  {item.quantity} x {formatCLP(item.unitPrice)}
                </p>
              </div>
              <div className="row-actions">
                <span className="amount">{formatCLP(item.subtotal)}</span>
                <button className="icon-button danger" type="button" onClick={() => onRemoveOne(item.productId)} aria-label="Quitar uno">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
          {ticket.length === 0 && <p className="empty-state">Agrega productos para armar el ticket.</p>}
        </div>

        <div className="payment-methods">
          {paymentOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                className={paymentMethod === option.id ? "chip active" : "chip"}
                type="button"
                key={option.id}
                onClick={() => onPaymentMethod(option.id)}
              >
                <Icon size={16} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {paymentMethod === "credit" && (
          <label className="field">
            Cliente para fiado
            <select value={selectedCustomerId} onChange={(event) => onCustomer(event.target.value)}>
              {customers.map((customer) => (
                <option value={customer.id} key={customer.id}>
                  {customer.name} - deuda {formatCLP(customer.debtBalance)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="ticket-total">
          <span>Total</span>
          <strong>{formatCLP(ticketTotal)}</strong>
        </div>

        <button className="primary-action full" type="button" onClick={onConfirm} disabled={isBusy}>
          <CheckCircle2 size={20} />
          <span>{isBusy ? "Registrando..." : "Confirmar venta"}</span>
        </button>

        {lastReceipt && (
          <div className="receipt-card">
            <div>
              <strong>Comprobante listo</strong>
              <p>
                Venta #{lastReceipt.id.slice(0, 8)} - {formatCLP(lastReceipt.total)}
              </p>
            </div>
            <button className="secondary-action small" type="button" onClick={onPrintReceipt}>
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button className="secondary-action small" type="button" onClick={onShareReceipt}>
              <Share2 size={16} />
              <span>Compartir</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ScanView({
  recognition,
  scanHint,
  scanBarcode,
  products,
  recognitionHistory,
  correctionProductId,
  isBusy,
  onHint,
  onBarcode,
  onRecognize,
  onRecognizeBarcode,
  onCorrectionProduct,
  onConfirmRecognition,
  onCorrectRecognition,
  onAdd,
  onManualSearch
}: {
  recognition: RecognitionResult | null;
  scanHint: string;
  scanBarcode: string;
  products: Product[];
  recognitionHistory: RecognitionLog[];
  correctionProductId: string;
  isBusy: boolean;
  onHint: (value: string) => void;
  onBarcode: (value: string) => void;
  onRecognize: () => void;
  onRecognizeBarcode: (barcode: string) => void;
  onCorrectionProduct: (value: string) => void;
  onConfirmRecognition: () => void;
  onCorrectRecognition: () => void;
  onAdd: () => void;
  onManualSearch: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectedCodeRef = useRef("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("Camara lista para iniciar.");
  const [capturedPhotoName, setCapturedPhotoName] = useState("");

  function getBarcodeReader() {
    if (!barcodeReaderRef.current) {
      barcodeReaderRef.current = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 600
      });
    }

    return barcodeReaderRef.current;
  }

  function submitDetectedBarcode(rawBarcode: string, source: "photo" | "live") {
    const barcode = rawBarcode.trim();
    if (!barcode) return;

    detectedCodeRef.current = barcode;
    onBarcode(barcode);
    onRecognizeBarcode(barcode);
    setScannerMessage(
      source === "photo"
        ? `Codigo leido desde foto: ${barcode}. Buscando producto...`
        : `Codigo detectado: ${barcode}. Buscando producto...`
    );
  }

  function stopCamera() {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }

  async function startBarcodeScanner() {
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setScannerMessage("En iPhone la camara en vivo requiere HTTPS. Usa Tomar foto para la demo o publica la app con HTTPS.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMessage("Este navegador no permite camara en vivo. Usa Tomar foto o ingresa codigo/pista manual.");
      return;
    }

    try {
      detectedCodeRef.current = "";
      setIsCameraActive(true);
      setScannerMessage("Buscando codigo de barras...");

      const controls = await getBarcodeReader().decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        videoRef.current ?? undefined,
        (result, _error, controlsFromCallback) => {
          const rawValue = result?.getText();
          if (!rawValue || rawValue.trim() === detectedCodeRef.current) return;

          submitDetectedBarcode(rawValue, "live");
          controlsFromCallback.stop();
          scannerControlsRef.current = null;
          setIsCameraActive(false);
        }
      );

      scannerControlsRef.current = controls;
    } catch {
      setScannerMessage("No se pudo abrir la camara. Usa Tomar foto o revisa permisos del navegador.");
      stopCamera();
    }
  }

  function openPhotoCapture() {
    photoInputRef.current?.click();
  }

  async function handlePhotoCapture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setCapturedPhotoName(file.name || "Foto capturada");
    setScannerMessage("Leyendo codigo de barras desde la foto...");

    const imageUrl = URL.createObjectURL(file);

    try {
      const result = await getBarcodeReader().decodeFromImageUrl(imageUrl);
      submitDetectedBarcode(result.getText(), "photo");
    } catch {
      setScannerMessage("Foto capturada, pero no pude leer el codigo. Acerca el codigo de barras, usa buena luz o escribe el codigo manual.");
    } finally {
      URL.revokeObjectURL(imageUrl);
      event.target.value = "";
    }
  }

  function detectFromInputs() {
    if (!scanHint.trim() && !scanBarcode.trim()) {
      setScannerMessage("Para la demo local, escribe una pista real: nombre, marca, categoria o codigo del producto creado.");
      return;
    }

    onRecognize();
  }

  useEffect(() => stopCamera, []);

  return (
    <div className="stack">
      <section className="camera-frame">
        <div className="scan-line" />
        <video className={isCameraActive ? "scanner-video active" : "scanner-video"} ref={videoRef} playsInline muted />
        <input
          className="capture-input"
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => void handlePhotoCapture(event)}
        />
        {!isCameraActive && <Camera size={42} />}
        <p>Apunta al codigo de barras o escribe una pista para validar el flujo de reconocimiento.</p>
        <p className="scanner-message">{scannerMessage}</p>
        {capturedPhotoName && <p className="capture-summary">Foto lista: {capturedPhotoName}</p>}
        <div className="scan-controls">
          <input value={scanHint} onChange={(event) => onHint(event.target.value)} placeholder="Pista: coca, pan, arroz..." />
          <input value={scanBarcode} onChange={(event) => onBarcode(event.target.value)} placeholder="Codigo de barras opcional" />
        </div>
        <div className="action-grid scan-actions">
          <button className="primary-action compact" type="button" onClick={detectFromInputs} disabled={isBusy}>
            <Bot size={19} />
            <span>{isBusy ? "Detectando..." : "Detectar"}</span>
          </button>
          <button className="secondary-action compact" type="button" onClick={openPhotoCapture}>
            <Camera size={19} />
            <span>Tomar foto</span>
          </button>
          <button className="secondary-action compact" type="button" onClick={isCameraActive ? stopCamera : () => void startBarcodeScanner()}>
            <Camera size={19} />
            <span>{isCameraActive ? "Detener" : "Leer codigo"}</span>
          </button>
        </div>
      </section>

      {recognition && (
        <section className="panel detection-panel">
          <div className="section-heading">
            <h2>Producto detectado</h2>
            <span>{Math.round(recognition.confidence * 100)}% confianza</span>
          </div>
          <div className="detected-product">
            <div className="product-visual">
              <Package size={32} />
            </div>
            <div>
              <strong>{recognition.productName}</strong>
              <p>
                Stock {recognition.stock ?? "-"} - {formatCLP(recognition.salePrice ?? 0)}
              </p>
              <p className={recognition.needsConfirmation ? "warning-text" : "success-text"}>
                {recognition.needsConfirmation ? "Confirmacion recomendada" : "Listo para agregar"}
              </p>
            </div>
          </div>
          <label className="field">
            Confirmar o corregir producto
            <select value={correctionProductId} onChange={(event) => onCorrectionProduct(event.target.value)}>
              <option value="">Sin correccion</option>
              {products.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <div className="action-grid">
            <button className="primary-action" type="button" onClick={onAdd}>
              <Plus size={19} />
              <span>Agregar</span>
            </button>
            <button className="secondary-action" type="button" onClick={onConfirmRecognition}>
              <CheckCircle2 size={19} />
              <span>Confirmar</span>
            </button>
            <button className="secondary-action" type="button" onClick={onCorrectRecognition}>
              <Save size={19} />
              <span>Corregir</span>
            </button>
            <button className="secondary-action" type="button" onClick={onManualSearch}>
              <Search size={19} />
              <span>Buscar</span>
            </button>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Historial IA</h2>
          <span>{recognitionHistory.length} registros</span>
        </div>
        <div className="list">
          {recognitionHistory.slice(0, 5).map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.productName}</strong>
                <p>
                  {item.source} - {Math.round(item.confidence * 100)}% - {item.confirmed ? "confirmado" : "pendiente"}
                </p>
                {item.userCorrection && <p>Correccion: {item.userCorrection}</p>}
              </div>
              <span className={item.needsConfirmation ? "debt" : "paid"}>{item.needsConfirmation ? "Revisar" : "OK"}</span>
            </div>
          ))}
          {recognitionHistory.length === 0 && <p className="empty-state">Aun no hay reconocimientos registrados.</p>}
        </div>
      </section>
    </div>
  );
}

function ProductsView({
  products,
  searchTerm,
  productForm,
  isBusy,
  editingProductId,
  canManageProducts,
  onSearch,
  onForm,
  onCreate,
  onCancelEdit,
  onEdit,
  onDeactivate,
  onAdjustStock
}: {
  products: Product[];
  searchTerm: string;
  productForm: ProductFormState;
  isBusy: boolean;
  editingProductId: string | null;
  canManageProducts: boolean;
  onSearch: (value: string) => void;
  onForm: (value: ProductFormState) => void;
  onCreate: () => void;
  onCancelEdit: () => void;
  onEdit: (product: Product) => void;
  onDeactivate: (product: Product) => void;
  onAdjustStock: (product: Product, delta: number) => void;
}) {
  const visibleLowStock = products.filter((product) => product.stock <= product.minimumStock).length;
  const visibleStockValue = products.reduce((sum, product) => sum + product.stock * product.salePrice, 0);

  return (
    <div className="workspace-grid product-workspace">
      {canManageProducts && (
        <section className="panel product-form-panel">
          <div className="section-heading">
            <h2>{editingProductId ? "Editar producto" : "Crear producto"}</h2>
            <span>{editingProductId ? "Actualizacion" : "Inventario real"}</span>
          </div>
          <div className="form-grid">
            <input value={productForm.name} onChange={(event) => onForm({ ...productForm, name: event.target.value })} placeholder="Nombre" />
            <input value={productForm.brand} onChange={(event) => onForm({ ...productForm, brand: event.target.value })} placeholder="Marca" />
            <input value={productForm.category} onChange={(event) => onForm({ ...productForm, category: event.target.value })} placeholder="Categoria" />
            <input value={productForm.barcode} onChange={(event) => onForm({ ...productForm, barcode: event.target.value })} placeholder="Codigo de barras" />
            <input value={productForm.costPrice} onChange={(event) => onForm({ ...productForm, costPrice: event.target.value })} placeholder="Costo" inputMode="numeric" />
            <input value={productForm.salePrice} onChange={(event) => onForm({ ...productForm, salePrice: event.target.value })} placeholder="Precio venta" inputMode="numeric" />
            <input value={productForm.stock} onChange={(event) => onForm({ ...productForm, stock: event.target.value })} placeholder="Stock" inputMode="numeric" />
            <input value={productForm.minimumStock} onChange={(event) => onForm({ ...productForm, minimumStock: event.target.value })} placeholder="Stock minimo" inputMode="numeric" />
          </div>
          <button className="primary-action full" type="button" onClick={onCreate} disabled={isBusy}>
            {editingProductId ? <Save size={19} /> : <Plus size={19} />}
            <span>{editingProductId ? "Guardar cambios" : "Crear producto"}</span>
          </button>
          {editingProductId && (
            <button className="secondary-action full" type="button" onClick={onCancelEdit}>
              Cancelar edicion
            </button>
          )}
        </section>
      )}

      <section className="panel inventory-panel">
        <div className="section-heading compact-heading">
          <h2>Inventario</h2>
          <span>{products.length} productos</span>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar en inventario" />
        </div>
        {!canManageProducts && <p className="helper-text">Vista solo lectura para vendedores.</p>}
        <div className="inventory-strip" aria-label="Resumen de inventario visible">
          <div>
            <span>Visibles</span>
            <strong>{products.length}</strong>
          </div>
          <div>
            <span>Stock bajo</span>
            <strong>{visibleLowStock}</strong>
          </div>
          <div>
            <span>Valorizado</span>
            <strong>{formatCLP(visibleStockValue)}</strong>
          </div>
        </div>
        <div className="list stock-list">
          {products.map((product) => (
            <ProductRow
              product={product}
              key={product.id}
              canManageProducts={canManageProducts}
              onAdjustStock={onAdjustStock}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CustomersView({
  customers,
  customerForm,
  paymentAmounts,
  lastDebtCharge,
  isBusy,
  editingCustomerId,
  canManageCustomers,
  onForm,
  onPaymentAmount,
  onCreate,
  onCancelEdit,
  onEdit,
  onDeactivate,
  onPayDebt,
  onCreatePayment,
  onShareDebtCharge,
  onCopyDebtCharge,
  onWhatsAppDebtCharge,
  onConfirmDebtCharge
}: {
  customers: Customer[];
  customerForm: CustomerFormState;
  paymentAmounts: Record<string, string>;
  lastDebtCharge: DebtChargeState | null;
  isBusy: boolean;
  editingCustomerId: string | null;
  canManageCustomers: boolean;
  onForm: (value: CustomerFormState) => void;
  onPaymentAmount: (customerId: string, value: string) => void;
  onCreate: () => void;
  onCancelEdit: () => void;
  onEdit: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onPayDebt: (customer: Customer) => void;
  onCreatePayment: (customer: Customer) => void;
  onShareDebtCharge: (charge: DebtChargeState) => void;
  onCopyDebtCharge: (charge: DebtChargeState) => void;
  onWhatsAppDebtCharge: (charge: DebtChargeState) => void;
  onConfirmDebtCharge: (charge: DebtChargeState) => void;
}) {
  return (
    <div className="workspace-grid customer-workspace">
      <section className="panel">
        <div className="section-heading">
          <h2>{editingCustomerId ? "Editar cliente" : "Nuevo cliente"}</h2>
          <span>{canManageCustomers ? "Fiado" : "Alta rapida"}</span>
        </div>
        <div className="form-grid single">
          <input value={customerForm.name} onChange={(event) => onForm({ ...customerForm, name: event.target.value })} placeholder="Nombre" />
          <input value={customerForm.phone} onChange={(event) => onForm({ ...customerForm, phone: event.target.value })} placeholder="Telefono" />
          <input value={customerForm.email} onChange={(event) => onForm({ ...customerForm, email: event.target.value })} placeholder="Email" />
          <input value={customerForm.address} onChange={(event) => onForm({ ...customerForm, address: event.target.value })} placeholder="Direccion" />
        </div>
        <button className="primary-action full" type="button" onClick={onCreate} disabled={isBusy}>
          {editingCustomerId ? <Save size={19} /> : <Plus size={19} />}
          <span>{editingCustomerId ? "Guardar cliente" : "Crear cliente"}</span>
        </button>
        {editingCustomerId && canManageCustomers && (
          <button className="secondary-action full" type="button" onClick={onCancelEdit}>
            Cancelar edicion
          </button>
        )}
      </section>

      {lastDebtCharge && (
        <section className="panel payment-share-panel">
          <div className="section-heading">
            <h2>Cobro listo</h2>
            <span>{formatCLP(lastDebtCharge.amount)}</span>
          </div>
          <div className="payment-link-box">
            <strong>{lastDebtCharge.customerName}</strong>
            <p>{lastDebtCharge.redirectUrl}</p>
          </div>
          <div className="share-actions">
            <button className="primary-action compact" type="button" onClick={() => onShareDebtCharge(lastDebtCharge)}>
              <Send size={17} />
              <span>Compartir</span>
            </button>
            <button className="secondary-action compact" type="button" onClick={() => onWhatsAppDebtCharge(lastDebtCharge)}>
              <MessageCircle size={17} />
              <span>WhatsApp</span>
            </button>
            <button className="secondary-action compact" type="button" onClick={() => onCopyDebtCharge(lastDebtCharge)}>
              <Copy size={17} />
              <span>Copiar</span>
            </button>
            <button className="secondary-action compact" type="button" onClick={() => onConfirmDebtCharge(lastDebtCharge)} disabled={isBusy}>
              <CheckCircle2 size={17} />
              <span>Confirmar demo</span>
            </button>
          </div>
        </section>
      )}

      <section className="panel accounts-panel">
        <div className="section-heading">
          <h2>Cuentas por cobrar</h2>
          <span>{customers.filter((customer) => customer.debtBalance > 0).length} activas</span>
        </div>
        <div className="list">
          {customers.map((customer) => (
            <div className="customer-row" key={customer.id}>
              <div>
                <strong>{customer.name}</strong>
                <p>{customer.phone ?? "Sin telefono"}</p>
              </div>
              <span className={customer.debtBalance > 0 ? "debt" : "paid"}>{formatCLP(customer.debtBalance)}</span>
              <input
                className="amount-input"
                value={paymentAmounts[customer.id] ?? ""}
                onChange={(event) => onPaymentAmount(customer.id, event.target.value)}
                placeholder="Monto"
                inputMode="numeric"
                disabled={customer.debtBalance === 0}
              />
              <div className="customer-actions">
                {canManageCustomers && (
                  <button className="secondary-action small" type="button" onClick={() => onEdit(customer)} disabled={isBusy}>
                    <Edit3 size={16} />
                    <span>Editar</span>
                  </button>
                )}
                <button className="secondary-action small" type="button" onClick={() => onPayDebt(customer)} disabled={isBusy || customer.debtBalance === 0}>
                  <Banknote size={16} />
                  <span>Abono</span>
                </button>
                <button className="secondary-action small" type="button" onClick={() => onCreatePayment(customer)} disabled={isBusy || customer.debtBalance === 0}>
                  <Send size={16} />
                  <span>Cobrar</span>
                </button>
                {canManageCustomers && (
                  <button className="secondary-action small danger-soft" type="button" onClick={() => onDeactivate(customer)} disabled={isBusy}>
                    <Trash2 size={16} />
                    <span>Desactivar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportsView({
  products,
  customers,
  sales,
  lowStockProducts,
  summary,
  cashRegister,
  cashClosures,
  cashClosureNote,
  isBusy,
  canViewFullReports,
  onCashClosureNote,
  onCloseCashRegister,
  onCancelSale
}: {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  lowStockProducts: Product[];
  summary: ReportSummary;
  cashRegister: CashRegisterSummary;
  cashClosures: CashRegisterClosure[];
  cashClosureNote: string;
  isBusy: boolean;
  canViewFullReports: boolean;
  onCashClosureNote: (value: string) => void;
  onCloseCashRegister: () => void;
  onCancelSale: (sale: Sale) => void;
}) {
  const topProducts = [...products].sort((a, b) => b.salePrice * b.stock - a.salePrice * a.stock).slice(0, 4);
  const activeSales = sales.filter((sale) => sale.status !== "cancelled");

  return (
    <div className="stack">
      {canViewFullReports && (
        <div className="stats-grid">
          <StatCard label="Vendido" value={formatCLP(summary.totalSales)} icon={BarChart3} tone="green" />
          <StatCard label="Stock valorizado" value={formatCLP(summary.stockValue)} icon={Package} tone="blue" />
          <StatCard label="Fiado pendiente" value={formatCLP(summary.pendingDebt)} icon={ReceiptText} tone="amber" />
          <StatCard label="Caja recibida" value={formatCLP(cashRegister.receivedTotal)} icon={Banknote} tone="red" />
        </div>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Caja en vivo</h2>
          <span>{cashRegister.date}</span>
        </div>
        <div className="report-grid">
          <ReportMetric label="Efectivo" value={formatCLP(cashRegister.totalsByMethod.cash)} />
          <ReportMetric label="Tarjeta" value={formatCLP(cashRegister.totalsByMethod.card)} />
          <ReportMetric label="Transferencia" value={formatCLP(cashRegister.totalsByMethod.transfer)} />
          <ReportMetric label="Webpay" value={formatCLP(cashRegister.totalsByMethod.webpay)} />
          <ReportMetric label="Fiado" value={formatCLP(cashRegister.creditTotal)} tone="warning" />
          <ReportMetric label="Total bruto" value={formatCLP(cashRegister.grossTotal)} />
          <ReportMetric label="Ticket promedio" value={formatCLP(cashRegister.averageTicket)} />
          <ReportMetric label="Anuladas" value={String(cashRegister.cancelledSalesCount)} />
        </div>
        <label className="field">
          Observacion del cierre
          <input
            value={cashClosureNote}
            onChange={(event) => onCashClosureNote(event.target.value)}
            placeholder="Ej: turno tarde sin diferencias"
          />
        </label>
        <button className="primary-action full" type="button" onClick={onCloseCashRegister} disabled={isBusy || cashRegister.salesCount === 0}>
          <Save size={19} />
          <span>{isBusy ? "Cerrando..." : "Cerrar caja"}</span>
        </button>
        <p className="helper-text">
          El resumen se actualiza durante el dia. El boton guarda una foto formal del cierre para dejar evidencia.
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Ultimos cierres</h2>
          <span>{cashClosures.length} registros</span>
        </div>
            <div className="list">
              {cashClosures.slice(0, 5).map((closure) => (
            <div className="row report-history-row" key={closure.id}>
              <div>
                <strong>{closure.date} - {formatCLP(closure.receivedTotal)}</strong>
                <p>
                  {closure.salesCount} ventas - cerrado {formatDateTime(closure.closedAt)}
                </p>
                {closure.note && <p>{closure.note}</p>}
              </div>
              <span className="amount report-row-amount">{closure.closedByName ?? "Localito"}</span>
            </div>
          ))}
          {cashClosures.length === 0 && <p className="empty-state">Aun no hay cierres registrados.</p>}
        </div>
      </section>

      {canViewFullReports && (
        <>
          <section className="panel">
            <div className="section-heading">
              <h2>Productos relevantes</h2>
              <span>Valor en sala</span>
            </div>
            <div className="bars">
              {topProducts.map((product) => {
                const value = product.stock * product.salePrice;
                const max = Math.max(...topProducts.map((item) => item.stock * item.salePrice), 1);
                return (
                  <div className="bar-row" key={product.id}>
                    <span>{product.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(8, (value / max) * 100)}%` }} />
                    </div>
                    <strong>{formatCLP(value)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>Resumen operativo</h2>
              <span>{sales.length} ventas</span>
            </div>
            <div className="report-grid">
              <ReportMetric label="Clientes registrados" value={String(customers.length)} />
              <ReportMetric label="Productos activos" value={String(products.length)} />
              <ReportMetric label="Ventas fiadas" value={String(activeSales.filter((sale) => sale.saleType === "credit").length)} />
              <ReportMetric label="Stock bajo" value={String(lowStockProducts.length)} tone="warning" />
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>Ventas y anulaciones</h2>
              <span>{sales.length} registros</span>
            </div>
            <div className="list">
              {sales.slice(0, 8).map((sale) => (
                <div className="row report-history-row" key={sale.id}>
                  <div>
                    <strong>Venta #{sale.id.slice(0, 8)}</strong>
                    <p>
                      {formatDateTime(sale.createdAt)} - {paymentMethodLabel(sale.paymentMethod)}
                    </p>
                    {sale.status === "cancelled" && <p className="warning-text">Anulada: {sale.cancellationReason ?? "sin motivo"}</p>}
                  </div>
                  <div className="row-actions report-row-actions">
                    <span className={sale.status === "cancelled" ? "debt report-row-amount" : "amount report-row-amount"}>{formatCLP(sale.total)}</span>
                    <button className="secondary-action small danger-soft" type="button" onClick={() => onCancelSale(sale)} disabled={sale.status === "cancelled"}>
                      <Trash2 size={16} />
                      <span>Anular</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ReceiptPrintArea({
  sale,
  tenant,
  user,
  customers
}: {
  sale: Sale | null;
  tenant: Tenant | null;
  user: User;
  customers: Customer[];
}) {
  if (!sale) return <div className="print-area" aria-hidden="true" />;

  const customer = customers.find((candidate) => candidate.id === sale.customerId);

  return (
    <section className="print-area" aria-label="Comprobante de venta">
      <div className="receipt-paper">
        <div className="receipt-header">
          <h1>{tenant?.name ?? "Localito"}</h1>
          <p>{tenant?.address ?? "Direccion no registrada"}</p>
          <p>{tenant?.phone ?? "Telefono no registrado"}</p>
          <strong>Comprobante no tributario</strong>
        </div>

        <div className="receipt-meta">
          <p>
            <span>Venta</span>
            <strong>#{sale.id.slice(0, 8)}</strong>
          </p>
          <p>
            <span>Fecha</span>
            <strong>{formatDateTime(sale.createdAt)}</strong>
          </p>
          <p>
            <span>Atiende</span>
            <strong>{user.name}</strong>
          </p>
          <p>
            <span>Pago</span>
            <strong>{paymentMethodLabel(sale.paymentMethod)}</strong>
          </p>
          {customer && (
            <p>
              <span>Cliente</span>
              <strong>{customer.name}</strong>
            </p>
          )}
        </div>

        <div className="receipt-items">
          {sale.items.map((item) => (
            <div className="receipt-item" key={item.productId}>
              <div>
                <strong>{item.productName}</strong>
                <span>
                  {item.quantity} x {formatCLP(item.unitPrice)}
                </span>
              </div>
              <strong>{formatCLP(item.subtotal)}</strong>
            </div>
          ))}
        </div>

        <div className="receipt-total">
          <span>Total</span>
          <strong>{formatCLP(sale.total)}</strong>
        </div>

        <p className="receipt-note">Gracias por su compra. Este documento es un comprobante interno de Localito.</p>
      </div>
    </section>
  );
}

function SettingsView({
  tenant,
  user,
  users,
  userForm,
  profileForm,
  isBusy,
  canManageUsers,
  onUserForm,
  onProfileForm,
  onSaveProfile,
  onCreateUser,
  onDeactivateUser
}: {
  tenant: Tenant | null;
  user: User;
  users: User[];
  userForm: UserFormState;
  profileForm: ProfileFormState;
  isBusy: boolean;
  canManageUsers: boolean;
  onUserForm: (value: UserFormState) => void;
  onProfileForm: (value: ProfileFormState) => void;
  onSaveProfile: () => void;
  onCreateUser: () => void;
  onDeactivateUser: (user: User) => void;
}) {
  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <h2>Mi perfil</h2>
          <span>{user.role === "owner" ? "Dueno/admin" : "Vendedor"}</span>
        </div>
        <div className="form-grid">
          <input value={profileForm.name} onChange={(event) => onProfileForm({ ...profileForm, name: event.target.value })} placeholder="Nombre" />
          <input
            value={profileForm.email}
            onChange={(event) => onProfileForm({ ...profileForm, email: event.target.value })}
            placeholder="Correo"
            inputMode="email"
          />
        </div>
        <button className="primary-action full" type="button" onClick={onSaveProfile} disabled={isBusy}>
          <Save size={19} />
          <span>Guardar mi perfil</span>
        </button>
      </section>

      {canManageUsers && (
        <section className="panel">
          <div className="section-heading">
            <h2>Usuarios del local</h2>
            <span>{users.length} activos</span>
          </div>
          <p className="helper-text">Crea vendedores cuando cambie el personal del local. Solo el dueno/admin puede administrar estos accesos.</p>
          <div className="form-grid">
            <input value={userForm.name} onChange={(event) => onUserForm({ ...userForm, name: event.target.value })} placeholder="Nombre" />
            <input value={userForm.email} onChange={(event) => onUserForm({ ...userForm, email: event.target.value })} placeholder="Correo" inputMode="email" />
            <select value={userForm.role} onChange={(event) => onUserForm({ ...userForm, role: event.target.value as User["role"] })}>
              <option value="seller">Vendedor</option>
              <option value="owner">Dueno/admin</option>
            </select>
            <input
              value={userForm.password}
              onChange={(event) => onUserForm({ ...userForm, password: event.target.value })}
              placeholder="Clave demo"
              type="password"
            />
          </div>
          <button className="primary-action full" type="button" onClick={onCreateUser} disabled={isBusy}>
            <Plus size={19} />
            <span>Crear usuario</span>
          </button>

          <div className="list user-list">
            {users.map((localUser) => (
              <div className="row" key={localUser.id}>
                <div>
                  <strong>{localUser.name}</strong>
                  <p>
                    {localUser.email} - {localUser.role === "owner" ? "dueno/admin" : "vendedor"}
                  </p>
                </div>
                <button
                  className="secondary-action small danger-soft"
                  type="button"
                  onClick={() => onDeactivateUser(localUser)}
                  disabled={isBusy || localUser.id === user.id}
                >
                  <Trash2 size={16} />
                  <span>Desactivar</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Base tecnica</h2>
          <span>MVP conectado</span>
        </div>
        <div className="settings-list">
          <p>
            <strong>Negocio:</strong> {tenant?.name ?? "Demo"}.
          </p>
          <p>
            <strong>Sesion:</strong> {user.name} ({user.role === "owner" ? "dueno/admin" : "vendedor"}).
          </p>
          <p>
            <strong>Frontend:</strong> React + PWA mobile-first conectada a API.
          </p>
          <p>
            <strong>Backend:</strong> Node.js con API REST y almacenamiento en memoria.
          </p>
          <p>
            <strong>Datos:</strong> PostgreSQL queda como siguiente paso de persistencia.
          </p>
          <p>
            <strong>IA:</strong> Reconocimiento demo por pista/codigo listo para conectar vision real.
          </p>
          <p>
            <strong>Pagos:</strong> Webpay demo genera link de integracion.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "amber" | "red" | "blue";
}) {
  return (
    <section className={`stat-card ${tone}`}>
      <Icon size={21} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </section>
  );
}

function ReportMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warning" }) {
  return (
    <div className={`report-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProductAlert({ product }: { product: Product }) {
  return (
    <div className="alert-row">
      <AlertTriangle size={18} />
      <div>
        <strong>{product.name}</strong>
        <p>
          Quedan {product.stock}. Minimo configurado: {product.minimumStock}.
        </p>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  canManageProducts,
  onAdjustStock,
  onEdit,
  onDeactivate
}: {
  product: Product;
  canManageProducts: boolean;
  onAdjustStock: (product: Product, delta: number) => void;
  onEdit: (product: Product) => void;
  onDeactivate: (product: Product) => void;
}) {
  const isLow = product.stock <= product.minimumStock;
  const stockGap = Math.max(0, product.minimumStock - product.stock);

  return (
    <div className={isLow ? "product-row stock-card low" : "product-row stock-card"}>
      <div className="product-visual">
        <Package size={24} />
      </div>
      <div className="product-main">
        <div className="product-title-line">
          <strong>{product.name}</strong>
          <span className={isLow ? "stock-status low" : "stock-status"}>{isLow ? "Bajo" : "OK"}</span>
        </div>
        <p>{product.brand ?? "Sin marca"} · {product.category}</p>
        {product.barcode && <span className="product-code">Cod. {product.barcode}</span>}
      </div>
      <div className="product-meta">
        <div>
          <span>Stock</span>
          <strong>{product.stock}</strong>
        </div>
        <div>
          <span>Minimo</span>
          <strong>{product.minimumStock}</strong>
        </div>
        <div>
          <span>Precio</span>
          <strong>{formatCLP(product.salePrice)}</strong>
        </div>
      </div>
      {isLow && <p className="stock-warning">Faltan {stockGap} para llegar al minimo.</p>}
      {canManageProducts && (
        <div className="stock-actions">
          <button className="icon-button" type="button" onClick={() => onEdit(product)} aria-label="Editar producto">
            <Edit3 size={17} />
          </button>
          <button className="icon-button" type="button" onClick={() => onAdjustStock(product, -1)} aria-label="Bajar stock">
            <Minus size={17} />
          </button>
          <button className="icon-button" type="button" onClick={() => onAdjustStock(product, 1)} aria-label="Subir stock">
            <Plus size={17} />
          </button>
          <button className="icon-button danger" type="button" onClick={() => onDeactivate(product)} aria-label="Desactivar producto">
            <Trash2 size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
