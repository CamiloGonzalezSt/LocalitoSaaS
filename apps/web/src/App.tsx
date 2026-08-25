import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Camera,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  Home,
  LogIn,
  LogOut,
  ListPlus,
  Menu,
  MessageCircle,
  Minus,
  Package,
  PackagePlus,
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
  Store,
  Trash2,
  Users,
  WalletCards,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BootstrapData,
  CashRegisterClosure,
  CashRegisterSummary,
  Customer,
  PaymentMethod,
  Product,
  ReportSummary,
  Sale,
  SaleItem,
  Tenant,
  User
} from "@localito/shared";
import { mergeQuickSaleTicket } from "@localito/shared";
import { api, flushOfflineQueue } from "./lib/api";
import type { AuthSession } from "./lib/api";
import { OperationsView } from "./OperationsView";
import { PlatformAdminView } from "./PlatformAdminView";
import { InventorySetupView } from "./InventorySetupView";
import { QuickSaleView } from "./QuickSaleView";

type View = "dashboard" | "sale" | "scan" | "product_create" | "setup" | "products" | "customers" | "operations" | "reports" | "settings" | "platform";

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
  sku: string;
  variant: string;
  unit: NonNullable<Product["unit"]>;
  unitsPerPack: string;
  expiryDate: string;
  trackStock: boolean;
};

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  creditLimit: string;
  creditDays: string;
  creditBlocked: boolean;
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

type LoginMode = "login" | "forgot" | "reset";

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
  { id: "sale", label: "Vender", icon: ShoppingCart },
  { id: "scan", label: "Venta Rápida", icon: Camera },
  { id: "product_create", label: "Nuevo producto", icon: PackagePlus },
  { id: "setup", label: "Carga inicial", icon: ListPlus },
  { id: "products", label: "Inventario", icon: Package },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "operations", label: "Negocio", icon: Settings },
  { id: "reports", label: "Reportes", icon: BarChart3 }
];

const paymentOptions: Array<{ id: PaymentMethod; label: string; icon: LucideIcon }> = [
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "transfer", label: "Transferencia", icon: Smartphone },
  { id: "webpay", label: "Webpay", icon: WalletCards },
  { id: "credit", label: "Fiado", icon: ReceiptText },
  { id: "mixed", label: "Mixto", icon: CreditCard }
];

const emptyProductForm: ProductFormState = {
  name: "",
  brand: "",
  category: "Abarrotes",
  barcode: "",
  costPrice: "",
  salePrice: "",
  stock: "",
  minimumStock: "",
  sku: "",
  variant: "",
  unit: "unit",
  unitsPerPack: "1",
  expiryDate: "",
  trackStock: true
};

const emptyCustomerForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  creditLimit: "",
  creditDays: "30",
  creditBlocked: false
};

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  role: "seller",
  password: ""
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
    credit: 0,
    mixed: 0
  }
};

const demoCredentials = [
  {
    label: "Dueño Don Pepe",
    email: String(import.meta.env.VITE_DEMO_OWNER_EMAIL ?? "donpepe@localito.demo"),
    password: String(import.meta.env.VITE_DEMO_OWNER_PASSWORD ?? "Duoc2026")
  },
  {
    label: "Vendedor Don Pepe",
    email: String(import.meta.env.VITE_DEMO_SELLER_EMAIL ?? "donpepe+vendedor@localito.demo"),
    password: String(import.meta.env.VITE_DEMO_SELLER_PASSWORD ?? "Duoc2026V")
  }
].filter((credential) => credential.email && credential.password);
const showDemoCredentials = demoCredentials.length > 0;

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

function productImageUrl(product: Product) {
  if (product.imageUrl) return product.imageUrl;

  const category = product.category.toLocaleLowerCase("es");
  if (category.includes("cerveza")) return "/products/cerveza.png";
  if (category.includes("vino") || category.includes("espumante")) return "/products/vino.png";
  if (category.includes("destilado") || category.includes("coctel")) return "/products/destilado.png";
  if (category.includes("bebida") || category.includes("refresco") || category.includes("jugo")) return "/products/bebida.png";
  return "/products/snack.png";
}

function paymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
  webpay: "Webpay",
  credit: "Fiado",
  mixed: "Pago mixto"
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

function isSystemAdminUser(user: User | null) {
  return user?.role === "system_admin";
}

function userInitials(user: User) {
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function readPasswordResetToken() {
  if (typeof window === "undefined") return "";
  const fragmentToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("reset_token")?.trim();
  return fragmentToken || "";
}

function inventorySetupWasDismissed(tenantId: string) {
  try {
    const progress = JSON.parse(localStorage.getItem(`localito-inventory-setup:${tenantId}`) ?? "null") as { status?: string } | null;
    return progress?.status === "dismissed" || progress?.status === "completed";
  } catch {
    return false;
  }
}

function removePasswordResetTokenFromUrl() {
  const url = new URL(window.location.href);
  const fragmentParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  if (fragmentParams.has("reset_token")) {
    fragmentParams.delete("reset_token");
    url.hash = fragmentParams.toString() ? `#${fragmentParams.toString()}` : "";
  }

  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegisterSummary>(emptyCashRegister);
  const [cashClosures, setCashClosures] = useState<CashRegisterClosure[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [ticket, setTicket] = useState<SaleItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>({
    message: "Cargando Localito...",
    tone: "success"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: demoCredentials[0]?.email ?? "",
    password: demoCredentials[0]?.password ?? ""
  });
  const [passwordResetToken, setPasswordResetToken] = useState(readPasswordResetToken);
  const [loginMode, setLoginMode] = useState<LoginMode>(() => readPasswordResetToken() ? "reset" : "login");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [cashClosureNote, setCashClosureNote] = useState("");
  const [lastDebtCharge, setLastDebtCharge] = useState<DebtChargeState | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock),
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
  const isSystemAdmin = isSystemAdminUser(currentUser);
  const visibleNavItems: NavItem[] = isSystemAdmin
    ? [{ id: "platform", label: "Locales y usuarios", icon: Store }]
    : navItems
        .filter((item) => (isOwner || item.id !== "reports") && (isOwner || item.id !== "product_create") && (isOwner || item.id !== "setup"))
        .map((item) => item.id === "operations" && !isOwner ? { ...item, label: "Caja", icon: Banknote } : item);
  const mobilePrimaryIds: View[] = isOwner
    ? ["dashboard", "sale", "scan", "products"]
    : ["sale", "scan", "dashboard", "operations"];
  const mobileNavItems = isSystemAdmin ? [] : visibleNavItems.filter((item) => mobilePrimaryIds.includes(item.id));
  const mobileMoreItems = isSystemAdmin ? [] : visibleNavItems.filter((item) => !mobilePrimaryIds.includes(item.id));

  function navigateTo(view: View) {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  }

  function saveSession(session: AuthSession) {
    localStorage.setItem("localito-session", JSON.stringify(session));
    localStorage.setItem("localito-token", session.token);
    setCurrentUser(session.user);
    setTenant(session.tenant);
  }

  async function loadWorkspace(message?: string, sessionUser: User | null = currentUser) {
    try {
      if (sessionUser?.role === "system_admin") {
        setActiveView("platform");
        if (message) setNotice({ message, tone: "success" });
        return;
      }
      const syncResult = await flushOfflineQueue();
      const response = await api.bootstrap();
      applyWorkspace(response.data);
      if (sessionUser?.role === "owner" && response.data.products.length === 0 && !inventorySetupWasDismissed(response.data.tenant.id)) {
        setActiveView("setup");
      }
      if (message || syncResult.synced > 0) setNotice({ message: syncResult.synced > 0 ? `${syncResult.synced} operaciones pendientes sincronizadas.` : message!, tone: "success" });
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
    setCashRegister(data.cashRegister);
    setCashClosures(data.cashClosures);
    setSummary(data.summary);
    setSelectedCustomerId((current) => current || data.customers[0]?.id || "");
  }

  useEffect(() => {
    if (passwordResetToken) {
      setNotice({ message: "Ingresa una nueva contraseña para recuperar tu acceso.", tone: "success" });
      setIsLoading(false);
      return;
    }

    const storedSession = localStorage.getItem("localito-session");
    if (!storedSession) {
      setNotice({ message: "Inicia sesion para operar el local.", tone: "success" });
      setIsLoading(false);
      return;
    }

    try {
      const restored = JSON.parse(storedSession) as AuthSession;
      saveSession(restored);
      if (restored.user.role === "seller") setActiveView("sale");
      void loadWorkspace("Sesion restaurada.", restored.user);
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

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice((current) => current === notice ? null : current);
    }, 2_000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeView]);

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
      if (response.data.user.role === "seller") setActiveView("sale");
      await loadWorkspace(`Bienvenido, ${response.data.user.name}.`, response.data.user);
    } catch (error) {
      setIsLoading(false);
      setNotice({ message: error instanceof Error ? error.message : "No se pudo iniciar sesion.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setNotice({ message: "Ingresa el correo de tu cuenta.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.requestPasswordReset(normalizedEmail);
      setLoginForm((current) => ({ ...current, email: normalizedEmail, password: "" }));
      setLoginMode("login");
      setNotice({ message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo enviar el enlace de recuperación.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmPasswordReset(password: string, passwordConfirmation: string) {
    if (!passwordResetToken) {
      setNotice({ message: "El enlace de recuperación no es válido.", tone: "error" });
      return;
    }
    if (password !== passwordConfirmation) {
      setNotice({ message: "Las contraseñas no coinciden.", tone: "warning" });
      return;
    }
    if (password.length < 10 || !/[a-z]/i.test(password) || !/\d/.test(password)) {
      setNotice({ message: "La contraseña debe tener al menos 10 caracteres, letras y números.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.confirmPasswordReset(passwordResetToken, password);
      localStorage.removeItem("localito-session");
      localStorage.removeItem("localito-token");
      removePasswordResetTokenFromUrl();
      setPasswordResetToken("");
      setLoginMode("login");
      setLoginForm({ email: "", password: "" });
      setNotice({ message: "Contraseña actualizada. Ya puedes iniciar sesión.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo restablecer la contraseña.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function returnToLogin() {
    if (passwordResetToken) {
      removePasswordResetTokenFromUrl();
      setPasswordResetToken("");
      window.location.reload();
      return;
    }
    setLoginMode("login");
  }

  function logout() {
    void api.logout().catch(() => undefined);
    localStorage.removeItem("localito-session");
    localStorage.removeItem("localito-token");
    setCurrentUser(null);
    setTenant(null);
    setUsers([]);
    setProducts([]);
    setCustomers([]);
    setSales([]);
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
    if (product.trackStock !== false && currentQuantity >= product.stock) {
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

  function addQuickSaleToTicket(detectedItems: Array<{ productId: string; quantity: number }>) {
    try {
      const result = mergeQuickSaleTicket(products, ticket, detectedItems);
      setTicket(result.ticket);
      setNotice({ message: `${result.units} ${result.units === 1 ? "producto agregado" : "productos agregados"} al ticket. Revisa y cobra con el flujo habitual.`, tone: "success" });
      navigateTo("sale");
      return true;
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudieron agregar los productos al ticket.", tone: "warning" });
      return false;
    }
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

  async function confirmSale(options?: { discount?: number; notes?: string; payments?: Array<{ method: "cash" | "card" | "transfer" | "webpay" | "credit"; amount: number }> }) {
    if (ticket.length === 0) {
      setNotice({ message: "Agrega al menos un producto antes de confirmar la venta.", tone: "warning" });
      return;
    }

    if ((paymentMethod === "credit" || options?.payments?.some((payment) => payment.method === "credit")) && !selectedCustomerId) {
      setNotice({ message: "Selecciona un cliente para registrar la venta fiada.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const saleResponse = await api.createSale({
        paymentMethod,
        customerId: paymentMethod === "credit" || options?.payments?.some((payment) => payment.method === "credit") ? selectedCustomerId : undefined,
        discount: options?.discount,
        notes: options?.notes,
        payments: options?.payments,
        items: ticket.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      });
      setLastReceipt(saleResponse.data);

      if (paymentMethod === "webpay") {
        const webpay = await api.createWebpayPayment(saleResponse.data.total, undefined, saleResponse.data.id);
        setNotice({
          message: `Venta registrada. Link Webpay demo: ${webpay.data.redirectUrl}`,
          tone: "success"
        });
      } else {
        setNotice({ message: `Venta registrada por ${formatCLP(saleResponse.data.total)}.`, tone: "success" });
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
        minimumStock: numberFromInput(productForm.minimumStock),
        sku: productForm.sku.trim(),
        variant: productForm.variant.trim(),
        unit: productForm.unit,
        unitsPerPack: numberFromInput(productForm.unitsPerPack) || 1,
        expiryDate: productForm.expiryDate || undefined,
        trackStock: productForm.trackStock
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
      minimumStock: String(product.minimumStock),
      sku: product.sku ?? "",
      variant: product.variant ?? "",
      unit: product.unit ?? "unit",
      unitsPerPack: String(product.unitsPerPack ?? 1),
      expiryDate: product.expiryDate ?? "",
      trackStock: product.trackStock !== false
    });
    setActiveView("product_create");
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
        address: customerForm.address.trim(),
        notes: customerForm.notes.trim(),
        creditLimit: numberFromInput(customerForm.creditLimit),
        creditDays: numberFromInput(customerForm.creditDays) || 30,
        creditBlocked: customerForm.creditBlocked
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
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      creditLimit: String(customer.creditLimit ?? 0),
      creditDays: String(customer.creditDays ?? 30),
      creditBlocked: customer.creditBlocked ?? false
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

    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password) {
      setNotice({ message: "Nombre, correo y clave inicial son obligatorios para crear usuario.", tone: "warning" });
      return;
    }
    if (
      userForm.password.length < 10 ||
      userForm.password.length > 128 ||
      !/[a-z]/i.test(userForm.password) ||
      !/\d/.test(userForm.password)
    ) {
      setNotice({ message: "La clave inicial debe tener entre 10 y 128 caracteres, letras y números.", tone: "warning" });
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

  async function returnSale(sale: Sale) {
    if (!isOwner || sale.status === "cancelled" || sale.status === "refunded") return;
    const item = sale.items[0]; if (!item) return;
    const quantity = Number(window.prompt(`Cantidad a devolver de ${item.productName} (máximo ${item.quantity})`, "1"));
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > item.quantity) { setNotice({ message: "Cantidad de devolución inválida.", tone: "warning" }); return; }
    const reason = window.prompt("Motivo de la devolución", "Cambio o producto devuelto")?.trim(); if (!reason) return;
    setIsBusy(true);
    try { await api.returnSale(sale.id, [{ productId: item.productId, quantity }], reason); await loadWorkspace("Devolución registrada y stock restaurado."); }
    catch (error) { setNotice({ message: error instanceof Error ? error.message : "No se pudo devolver la venta.", tone: "error" }); }
    finally { setIsBusy(false); }
  }

  if (!currentUser) {
    return (
      <LoginView
        loginForm={loginForm}
        mode={loginMode}
        showDemoCredentials={showDemoCredentials}
        notice={notice}
        isBusy={isBusy || isLoading}
        onForm={setLoginForm}
        onLogin={() => void login()}
        onForgot={() => setLoginMode("forgot")}
        onRequestReset={(email) => void requestPasswordReset(email)}
        onConfirmReset={(password, confirmation) => void confirmPasswordReset(password, confirmation)}
        onReturnToLogin={returnToLogin}
      />
    );
  }

  return (
    <div className={`app-shell ${isSystemAdmin ? "platform-shell" : "business-shell"}`}>
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <img className="official-logo sidebar-logo" src="/logo.png" alt="Localito" />
          <div><strong>Localito</strong><small>Tu negocio, más claro</small></div>
        </div>
        <div className="store-switcher">
          <Store size={18} />
          <div><small>{isSystemAdmin ? "Plataforma" : "Local activo"}</small><strong>{tenant?.name ?? "Localito"}</strong></div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          <span className="sidebar-label">{isSystemAdmin ? "ADMINISTRACIÓN" : "TU NEGOCIO"}</span>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return <button className={activeView === item.id ? "sidebar-item active" : "sidebar-item"} key={item.id} type="button" onClick={() => navigateTo(item.id)}><Icon size={19}/><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="sidebar-account">
          <span className="avatar-mini">{userInitials(currentUser)}</span>
          <div><strong>{currentUser.name}</strong><small>{currentUser.role === "system_admin" ? "Admin plataforma" : currentUser.role === "owner" ? "Dueño" : "Vendedor"}</small></div>
          {!isSystemAdmin && <button className="sidebar-icon-button" type="button" onClick={() => navigateTo("settings")} aria-label="Configuración"><Settings size={18}/></button>}
          <button className="sidebar-icon-button" type="button" onClick={logout} aria-label="Cerrar sesión"><LogOut size={18}/></button>
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">{isSystemAdmin ? "Administración de Localito" : `Hola, ${currentUser.name.split(" ")[0]}`}</p>
          <h1>{viewTitle(activeView, isOwner, isSystemAdmin)}</h1>
          <p className="session-line">
            <Store size={15}/>
            <span>{tenant?.name ?? "Localito"}</span>
            <span className="role-pill">{currentUser.role === "system_admin" ? "Admin plataforma" : currentUser.role === "owner" ? "Dueño" : "Vendedor"}</span>
          </p>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={() => void loadWorkspace("Datos refrescados.")} aria-label="Refrescar">
            <RefreshCw size={20} />
          </button>
          {!isSystemAdmin && <button
              className="icon-button"
              type="button"
              onClick={() => navigateTo("settings")}
              aria-label={isOwner ? "Configuracion" : "Mi perfil"}
            >
              <Settings size={21} />
            </button>}
          <button className="icon-button" type="button" onClick={logout} aria-label="Cerrar sesion">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {!!mobileNavItems.length && <nav className="bottom-nav" aria-label="Navegación móvil" style={{ gridTemplateColumns: `repeat(${mobileNavItems.length + (mobileMoreItems.length ? 1 : 0)}, minmax(0, 1fr))` }}>
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activeView === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
        {mobileMoreItems.length > 0 && <button className={mobileMoreItems.some((item) => item.id === activeView) || activeView === "settings" ? "nav-item active" : "nav-item"} type="button" onClick={() => setIsMobileMenuOpen(true)}><Menu size={20}/><span>Más</span></button>}
      </nav>}

      {isMobileMenuOpen && <div className="mobile-menu-backdrop" role="presentation" onClick={() => setIsMobileMenuOpen(false)}>
        <section className="mobile-menu-sheet" role="dialog" aria-modal="true" aria-label="Más opciones" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-menu-heading"><div><span>Más opciones</span><strong>{tenant?.name ?? "Localito"}</strong></div><button className="icon-button" type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Cerrar"><X size={20}/></button></div>
          <div className="mobile-menu-grid">
            {mobileMoreItems.map((item) => { const Icon = item.icon; return <button className={activeView === item.id ? "mobile-menu-item active" : "mobile-menu-item"} key={item.id} type="button" onClick={() => navigateTo(item.id)}><Icon size={21}/><span>{item.label}</span></button>; })}
            <button className={activeView === "settings" ? "mobile-menu-item active" : "mobile-menu-item"} type="button" onClick={() => navigateTo("settings")}><Settings size={21}/><span>{isOwner ? "Configuración" : "Mi cuenta"}</span></button>
            <button className="mobile-menu-item danger" type="button" onClick={logout}><LogOut size={21}/><span>Cerrar sesión</span></button>
          </div>
        </section>
      </div>}

      <main className="content">
        {notice && <section className={`notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notice.message}</span>
        </section>}

        {isLoading && <p className="empty-state">Conectando con la API de Localito...</p>}

        {!isLoading && activeView === "platform" && isSystemAdmin && <PlatformAdminView />}

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
            onStartSale={() => navigateTo("sale")}
            onOpenScan={() => navigateTo("scan")}
            onOpenStock={() => navigateTo("products")}
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
            onConfirm={(options) => void confirmSale(options)}
            onSuspend={() => {
              localStorage.setItem("localito-suspended-cart", JSON.stringify(ticket));
              setTicket([]);
              setNotice({ message: "Carrito guardado para retomarlo después.", tone: "success" });
            }}
            onRestore={() => {
              try { setTicket(JSON.parse(localStorage.getItem("localito-suspended-cart") ?? "[]") as SaleItem[]); setNotice({ message: "Carrito recuperado.", tone: "success" }); } catch { setNotice({ message: "No se pudo recuperar el carrito.", tone: "error" }); }
            }}
            onScan={() => setActiveView("scan")}
            lastReceipt={lastReceipt}
            onPrintReceipt={printLastReceipt}
            onShareReceipt={() => void shareLastReceipt()}
          />
        )}

        {!isLoading && activeView === "scan" && (
          <QuickSaleView products={products} onAddToSale={addQuickSaleToTicket} onOpenSale={() => navigateTo("sale")} />
        )}

        {!isLoading && activeView === "product_create" && isOwner && (
          <ProductsView
            mode="create"
            products={products}
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

        {!isLoading && activeView === "setup" && isOwner && tenant && (
          <InventorySetupView
            tenant={tenant}
            products={products}
            onRefresh={() => loadWorkspace()}
            onNavigate={navigateTo}
            onFinish={() => { navigateTo("dashboard"); setNotice({ message: "Inventario inicial configurado. Ya puedes comenzar a vender.", tone: "success" }); }}
            onSkip={() => { navigateTo("dashboard"); setNotice({ message: "Puedes retomar la carga inicial desde el menú cuando quieras.", tone: "success" }); }}
          />
        )}

        {!isLoading && activeView === "products" && (
          <ProductsView
            mode="stock"
            products={products}
            searchTerm={searchTerm}
            productForm={productForm}
            isBusy={isBusy}
            editingProductId={editingProductId}
            canManageProducts={isOwner}
            onSearch={setSearchTerm}
            onForm={setProductForm}
            onCreate={() => void createProduct()}
            onCancelEdit={() => { setEditingProductId(null); setProductForm(emptyProductForm); }}
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
            onReturnSale={(sale) => void returnSale(sale)}
          />
        )}

        {!isLoading && activeView === "operations" && (
          <OperationsView products={products} canManage={isOwner} onRefresh={() => loadWorkspace()} />
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

function viewTitle(view: View, isOwner: boolean, isSystemAdmin: boolean) {
  const labels: Record<View, string> = {
    dashboard: "Panel del día",
    sale: "Vender",
    scan: "Venta Rápida",
    product_create: "Crear producto",
    setup: "Configurar inventario",
    products: "Inventario",
    customers: "Clientes y fiado",
    operations: "Tu negocio",
    reports: isOwner ? "Reportes" : "Cierre de caja",
    settings: isOwner ? "Configuracion" : "Mi perfil",
    platform: isSystemAdmin ? "Locales y usuarios" : "Administración"
  };
  return labels[view];
}

function LoginView({
  loginForm,
  mode,
  showDemoCredentials,
  notice,
  isBusy,
  onForm,
  onLogin,
  onForgot,
  onRequestReset,
  onConfirmReset,
  onReturnToLogin
}: {
  loginForm: LoginFormState;
  mode: LoginMode;
  showDemoCredentials: boolean;
  notice: NoticeState | null;
  isBusy: boolean;
  onForm: (value: LoginFormState) => void;
  onLogin: () => void;
  onForgot: () => void;
  onRequestReset: (email: string) => void;
  onConfirmReset: (password: string, confirmation: string) => void;
  onReturnToLogin: () => void;
}) {
  const [recoveryEmail, setRecoveryEmail] = useState(loginForm.email);
  const [resetForm, setResetForm] = useState({ password: "", confirmation: "" });
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const title = mode === "reset" ? "Nueva contraseña" : mode === "forgot" ? "Recuperar acceso" : "Bienvenido de vuelta";

  useEffect(() => {
    const usesPrecisePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (usesPrecisePointer) firstFieldRef.current?.focus();
    if (mode !== "reset") setResetForm({ password: "", confirmation: "" });
  }, [mode]);
  return (
    <main className="login-shell">
      <section className="login-story" aria-label="Bienvenida a Localito">
        <div className="story-brand"><img className="official-logo story-logo" src="/logo.png" alt="Localito" /></div>
        <div className="story-copy">
          <span>EL CORAZÓN DE TU NEGOCIO</span>
          <h2>Vende, ordena y decide con tranquilidad.</h2>
          <p>Una plataforma cercana para tener tus ventas, productos y caja siempre claros.</p>
        </div>
        <div className="story-features">
          <span><ShoppingCart size={18}/> Ventas simples</span>
          <span><Package size={18}/> Stock al día</span>
          <span><BarChart3 size={18}/> Decisiones claras</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-brand">
          <img className="official-logo login-logo" src="/logo.png" alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">Localito</p>
            <h1>{title}</h1>
          </div>
        </div>

        {notice && <section className={`notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notice.message}</span>
        </section>}

        {mode === "login" && <form
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
              ref={firstFieldRef}
              onChange={(event) => onForm({ ...loginForm, email: event.target.value })}
              placeholder="correo@localito.cl"
              type="email"
              inputMode="email"
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>
          <label className="field">
            Contraseña
            <input
              value={loginForm.password}
              onChange={(event) => onForm({ ...loginForm, password: event.target.value })}
              placeholder="Contraseña"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
          <button className="primary-action full" type="submit" disabled={isBusy}>
            <LogIn size={20} />
            <span>{isBusy ? "Entrando..." : "Iniciar sesion"}</span>
          </button>
          <button className="secondary-action full" type="button" disabled={isBusy} onClick={() => {
            setRecoveryEmail(loginForm.email);
            onForgot();
          }}>Olvidé mi contraseña</button>
        </form>}

        {mode === "forgot" && <form className="login-form" onSubmit={(event) => {
          event.preventDefault();
          onRequestReset(recoveryEmail);
        }}>
          <p className="helper-text">Te enviaremos un enlace seguro al correo asociado a tu cuenta.</p>
          <label className="field">
            Correo
            <input
              type="email"
              ref={firstFieldRef}
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              placeholder="correo@localito.cl"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          <button className="primary-action full" type="submit" disabled={isBusy}>{isBusy ? "Enviando..." : "Enviar enlace"}</button>
          <button className="secondary-action full" type="button" onClick={onReturnToLogin} disabled={isBusy}>Volver al ingreso</button>
        </form>}

        {mode === "reset" && <form className="login-form" onSubmit={(event) => {
          event.preventDefault();
          onConfirmReset(resetForm.password, resetForm.confirmation);
        }}>
          <p className="helper-text">Usa al menos 10 caracteres e incluye letras y números.</p>
          <label className="field">
            Nueva contraseña
            <input
              type="password"
              ref={firstFieldRef}
              value={resetForm.password}
              onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="field">
            Confirmar contraseña
            <input
              type="password"
              value={resetForm.confirmation}
              onChange={(event) => setResetForm({ ...resetForm, confirmation: event.target.value })}
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="primary-action full" type="submit" disabled={isBusy}>{isBusy ? "Actualizando..." : "Guardar nueva contraseña"}</button>
          <button className="secondary-action full" type="button" onClick={onReturnToLogin} disabled={isBusy}>Volver al ingreso</button>
        </form>}

        {mode === "login" && showDemoCredentials && <div className="quick-login">
          {demoCredentials.map((credential) => (
            <button
              className="secondary-action"
              type="button"
              key={credential.email}
              onClick={() => onForm({ email: credential.email, password: credential.password })}
            >
              <Users size={18} />
              <span className="quick-login-copy">
                <strong>{credential.label}</strong>
                <small>{credential.email}</small>
                <small>Clave: {credential.password}</small>
              </span>
            </button>
          ))}
        </div>}

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
  onOpenScan,
  onOpenStock
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
  onOpenStock: () => void;
}) {
  const heroAmount = canViewManagementMetrics ? summary.totalSales : cashRegister.receivedTotal;

  return (
    <div className="stack dashboard-stack">
      <section className="hero-panel dashboard-hero">
        <div className="hero-copy">
          <span>HOY EN TU NEGOCIO</span>
          <strong>¿Qué quieres hacer ahora?</strong>
          <p>
            Hoy llevas {formatCLP(heroAmount)} en {cashRegister.salesCount} ventas y tienes {lowStockProducts.length} productos por revisar.
          </p>
        </div>
        <div className="hero-actions">
          <button className="quick-action sell" type="button" onClick={onStartSale}>
            <ShoppingCart size={22} />
            <span>Nueva venta</span>
          </button>
          <button className="quick-action scan" type="button" onClick={onOpenScan}>
            <Camera size={22} />
            <span>Venta Rápida</span>
          </button>
          <button className="quick-action stock" type="button" onClick={onOpenStock}>
            <Package size={22} />
            <span>Revisar stock</span>
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
  onSuspend,
  onRestore,
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
  onConfirm: (options?: { discount?: number; notes?: string; payments?: Array<{ method: "cash" | "card" | "transfer" | "webpay" | "credit"; amount: number }> }) => void;
  onSuspend: () => void;
  onRestore: () => void;
  onScan: () => void;
  lastReceipt: Sale | null;
  onPrintReceipt: () => void;
  onShareReceipt: () => void;
}) {
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [cashPart, setCashPart] = useState("");
  const discountedTotal = Math.max(0, ticketTotal - numberFromInput(discount));
  const cardPart = Math.max(0, discountedTotal - numberFromInput(cashPart));

  function submitSale() {
    const payments = paymentMethod === "mixed" ? [{ method: "cash" as const, amount: numberFromInput(cashPart) }, { method: "card" as const, amount: cardPart }].filter((payment) => payment.amount > 0) : undefined;
    onConfirm({ discount: numberFromInput(discount), notes: notes.trim() || undefined, payments });
  }

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
          <span>Venta Rápida con foto</span>
        </button>
        <div className="list product-list">
          {products.map((product) => (
            <button className="product-button" type="button" key={product.id} onClick={() => onAdd(product)}>
              <span className="product-thumb">
                <img src={productImageUrl(product)} alt="" aria-hidden="true" />
              </span>
              <div className="product-button-copy">
                <strong>{product.name}</strong>
                <p>
                  {product.category} - Stock {product.stock}
                </p>
              </div>
              <span className="product-price">{formatCLP(product.salePrice)}</span>
            </button>
          ))}
        </div>
      </section>

      {ticket.length > 0 && <button className="mobile-cart-summary" type="button" onClick={() => document.getElementById("sale-ticket")?.scrollIntoView({ behavior: "smooth" })}>
        <span><ShoppingCart size={20}/><strong>{ticket.reduce((sum, item) => sum + item.quantity, 0)} productos</strong></span>
        <strong>{formatCLP(discountedTotal)}</strong>
        <span>Ver carrito</span>
      </button>}

      <section className="panel ticket-panel" id="sale-ticket">
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
                  <Minus size={17} />
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

        {paymentMethod === "mixed" && <div className="form-grid"><label className="field">Parte en efectivo<input value={cashPart} onChange={(event) => setCashPart(event.target.value)} inputMode="numeric" placeholder="Monto efectivo" /></label><div className="report-metric"><span>Parte en tarjeta</span><strong>{formatCLP(cardPart)}</strong></div></div>}

        <div className="form-grid"><label className="field">Descuento<input value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="numeric" placeholder="Monto descuento" /></label><label className="field">Nota de venta<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pedido, encargo u observación" /></label></div>

        <div className="ticket-total">
          <span>Total</span>
          <strong>{formatCLP(discountedTotal)}</strong>
        </div>

        <button className="primary-action full" type="button" onClick={submitSale} disabled={isBusy}>
          <CheckCircle2 size={20} />
          <span>{isBusy ? "Registrando..." : `Cobrar ${formatCLP(discountedTotal)}`}</span>
        </button>
        <div className="action-grid"><button className="secondary-action" type="button" onClick={onSuspend} disabled={!ticket.length}>Guardar carrito</button><button className="secondary-action" type="button" onClick={onRestore}>Recuperar carrito</button></div>

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

function ProductsView({
  mode,
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
  mode: "create" | "stock";
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryOptions = useMemo(() => {
    const categories = new Map<string, { label: string; count: number }>();

    for (const product of products) {
      const label = product.category.trim() || "Sin categoria";
      const id = label.toLocaleLowerCase("es");
      const current = categories.get(id);
      categories.set(id, { label: current?.label ?? label, count: (current?.count ?? 0) + 1 });
    }

    return [...categories.entries()]
      .map(([id, category]) => ({ id, ...category }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [products]);
  const inventoryProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es");

    return products.filter((product) => {
      const productCategory = (product.category.trim() || "Sin categoria").toLocaleLowerCase("es");
      const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;
      const matchesSearch = !normalizedSearch || [product.name, product.brand, product.category, product.barcode, product.sku]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);
  const visibleLowStock = inventoryProducts.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock).length;
  const visibleStockValue = inventoryProducts.reduce((sum, product) => sum + product.stock * product.salePrice, 0);

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryOptions.some((category) => category.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoryOptions, selectedCategory]);

  function clearInventoryFilters() {
    setSelectedCategory("all");
    onSearch("");
  }

  return (
    <div className="stack">
      {mode === "create" && canManageProducts && (
        <section className="panel product-form-panel">
          <div className="section-heading">
            <h2>{editingProductId ? "Editar producto" : "Crear producto"}</h2>
            <span>{editingProductId ? "Actualización" : "Catálogo del local"}</span>
          </div>
          <div className="form-grid">
            <input value={productForm.name} onChange={(event) => onForm({ ...productForm, name: event.target.value })} placeholder="Nombre" />
            <input value={productForm.brand} onChange={(event) => onForm({ ...productForm, brand: event.target.value })} placeholder="Marca" />
            <input value={productForm.category} onChange={(event) => onForm({ ...productForm, category: event.target.value })} placeholder="Categoria" list="product-category-options" />
            <datalist id="product-category-options">
              {categoryOptions.map((category) => <option value={category.label} key={category.id} />)}
            </datalist>
            <input value={productForm.barcode} onChange={(event) => onForm({ ...productForm, barcode: event.target.value })} placeholder="Codigo de barras" />
            <input value={productForm.costPrice} onChange={(event) => onForm({ ...productForm, costPrice: event.target.value })} placeholder="Costo" inputMode="numeric" />
            <input value={productForm.salePrice} onChange={(event) => onForm({ ...productForm, salePrice: event.target.value })} placeholder="Precio venta" inputMode="numeric" />
            <input value={productForm.stock} onChange={(event) => onForm({ ...productForm, stock: event.target.value })} placeholder="Stock" inputMode="numeric" />
            <input value={productForm.minimumStock} onChange={(event) => onForm({ ...productForm, minimumStock: event.target.value })} placeholder="Stock minimo" inputMode="numeric" />
            <input value={productForm.sku} onChange={(event) => onForm({ ...productForm, sku: event.target.value })} placeholder="SKU interno" />
            <input value={productForm.variant} onChange={(event) => onForm({ ...productForm, variant: event.target.value })} placeholder="Variante / formato" />
            <select value={productForm.unit} onChange={(event) => onForm({ ...productForm, unit: event.target.value as ProductFormState["unit"] })}>
              <option value="unit">Unidad</option><option value="kg">Kilogramo</option><option value="gram">Gramo</option><option value="liter">Litro</option><option value="pack">Pack</option><option value="box">Caja</option>
            </select>
            <input value={productForm.unitsPerPack} onChange={(event) => onForm({ ...productForm, unitsPerPack: event.target.value })} placeholder="Unidades por pack" inputMode="numeric" />
            <label className="field">Vencimiento<input type="date" value={productForm.expiryDate} onChange={(event) => onForm({ ...productForm, expiryDate: event.target.value })} /></label>
            <label className="field checkbox-field"><input type="checkbox" checked={productForm.trackStock} onChange={(event) => onForm({ ...productForm, trackStock: event.target.checked })} /> Controlar stock de este producto</label>
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

      {mode === "stock" && <section className="panel inventory-panel">
        <div className="section-heading compact-heading">
          <h2>Inventario</h2>
          <span>{inventoryProducts.length === products.length ? `${products.length} productos` : `${inventoryProducts.length} de ${products.length}`}</span>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar producto, marca o codigo" />
        </div>
        <div className="inventory-filters">
          <div className="inventory-filter-heading">
            <strong>Categorias</strong>
            {(selectedCategory !== "all" || searchTerm) && <button type="button" onClick={clearInventoryFilters}>Limpiar filtros</button>}
          </div>
          <div className="category-filter-list" role="group" aria-label="Filtrar inventario por categoria">
            <button
              className={selectedCategory === "all" ? "category-filter active" : "category-filter"}
              type="button"
              aria-pressed={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
            >
              <span>Todos</span>
              <small>{products.length}</small>
            </button>
            {categoryOptions.map((category) => (
              <button
                className={selectedCategory === category.id ? "category-filter active" : "category-filter"}
                type="button"
                aria-pressed={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                key={category.id}
              >
                <span>{category.label}</span>
                <small>{category.count}</small>
              </button>
            ))}
          </div>
        </div>
        {!canManageProducts && <p className="helper-text">Vista solo lectura para vendedores.</p>}
        <div className="inventory-strip" aria-label="Resumen de inventario visible">
          <div>
            <span>Visibles</span>
            <strong>{inventoryProducts.length}</strong>
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
          {inventoryProducts.map((product) => (
            <ProductRow
              product={product}
              key={product.id}
              canManageProducts={canManageProducts}
              onAdjustStock={onAdjustStock}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
          {inventoryProducts.length === 0 && (
            <div className="inventory-empty-state">
              <Search size={22} />
              <div>
                <strong>No encontramos productos</strong>
                <p>Prueba otra busqueda o vuelve a ver todo el inventario.</p>
              </div>
              <button className="secondary-action small" type="button" onClick={clearInventoryFilters}>Ver todos</button>
            </div>
          )}
        </div>
      </section>}
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
          <input value={customerForm.notes} onChange={(event) => onForm({ ...customerForm, notes: event.target.value })} placeholder="Observaciones" />
          <input value={customerForm.creditLimit} onChange={(event) => onForm({ ...customerForm, creditLimit: event.target.value })} placeholder="Limite de fiado (0 = sin limite)" inputMode="numeric" />
          <input value={customerForm.creditDays} onChange={(event) => onForm({ ...customerForm, creditDays: event.target.value })} placeholder="Dias para pagar" inputMode="numeric" />
          {canManageCustomers && <label className="field checkbox-field"><input type="checkbox" checked={customerForm.creditBlocked} onChange={(event) => onForm({ ...customerForm, creditBlocked: event.target.checked })} /> Bloquear nuevos fiados</label>}
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
  onCancelSale,
  onReturnSale
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
  onReturnSale: (sale: Sale) => void;
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
                    <button className="secondary-action small" type="button" onClick={() => onReturnSale(sale)} disabled={sale.status === "cancelled" || sale.status === "refunded"}>
                      <RefreshCw size={16} /><span>Devolver</span>
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
              placeholder="Clave inicial segura"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
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
  const isLow = product.trackStock !== false && product.stock <= product.minimumStock;
  const stockGap = Math.max(0, product.minimumStock - product.stock);

  return (
    <div className={isLow ? "product-row stock-card low" : "product-row stock-card"}>
      <div className="product-visual">
        <img src={productImageUrl(product)} alt="" aria-hidden="true" />
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
          <button className="icon-button stock-edit-action" type="button" onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`}>
            <Edit3 size={17} />
            <span>Editar</span>
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
