import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  BarChart3,
  Camera,
  CheckCircle2,
  CircleHelp,
  Copy,
  CreditCard,
  Edit3,
  Home,
  LogIn,
  LogOut,
  ListPlus,
  EllipsisVertical,
  Moon,
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
  Store,
  Sun,
  TrendingUp,
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
  Subscription,
  SubscriptionPlan,
  User
} from "@localito/shared";
import { effectiveSubscriptionStatus, LOCALITO_PLANS, hasEntitlement, mergeQuickSaleTicket, subscriptionCanMutate, subscriptionDaysRemaining } from "@localito/shared";
import { api, flushOfflineQueue } from "./lib/api";
import type { AuthSession } from "./lib/api";
import { formatCLP, formatDateTime } from "./lib/format";
import { OperationsView } from "./OperationsView";
import { PlatformAdminView } from "./PlatformAdminView";
import { InventorySetupView } from "./InventorySetupView";
import { QuickSaleView } from "./QuickSaleView";
import { DashboardView } from "./DashboardView";
import { PlanView, SettingsView } from "./AccountViews";
import type { BusinessFormState, ProfileFormState, ThemePreference, UserFormState } from "./AccountViews";

type View = "dashboard" | "sale" | "scan" | "product_create" | "setup" | "invoice" | "products" | "customers" | "operations" | "reports" | "settings" | "plan" | "platform";

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

type LoginMode = "login" | "register" | "forgot" | "reset";

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
  { id: "products", label: "Inventario", icon: Package },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "operations", label: "Caja", icon: Banknote },
  { id: "reports", label: "Reportes", icon: BarChart3 }
];

const paymentOptions: Array<{ id: PaymentMethod; label: string; icon: LucideIcon }> = [
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card", label: "Tarjeta · terminal externo", icon: CreditCard },
  { id: "transfer", label: "Transferencia / QR externo", icon: Smartphone },
  { id: "webpay", label: "Webpay · externo", icon: WalletCards },
  { id: "mercadopago", label: "Mercado Pago · externo", icon: Smartphone },
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
  operatingExpenses: 0,
  estimatedGrossProfit: 0,
  estimatedNetResult: 0,
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
    mercadopago: 0,
    credit: 0,
    mixed: 0
  }
};

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
    card: "Tarjeta · terminal externo",
    transfer: "Transferencia / QR externo",
    webpay: "Webpay · externo",
    mercadopago: "Mercado Pago · externo",
    credit: "Fiado",
    mixed: "Pago mixto"
  };
  return labels[method];
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

function navItemIsActive(item: View, active: View) {
  if (item === active) return true;
  if (item === "sale" && active === "scan") return true;
  if (item === "products" && ["product_create", "setup", "invoice"].includes(active)) return true;
  if (item === "settings" && active === "plan") return true;
  return false;
}

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [previousView, setPreviousView] = useState<View>("dashboard");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegisterSummary>(emptyCashRegister);
  const [cashClosures, setCashClosures] = useState<CashRegisterClosure[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [theme, setTheme] = useState<ThemePreference>("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileActionsRef = useRef<HTMLDivElement>(null);
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
    email: "",
    password: ""
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

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock),
    [products]
  );

  const ticketTotal = useMemo(() => ticket.reduce((sum, item) => sum + item.subtotal, 0), [ticket]);
  const activeSales = useMemo(() => sales.filter((sale) => sale.status !== "cancelled"), [sales]);
  const cancelledSales = useMemo(() => sales.filter((sale) => sale.status === "cancelled"), [sales]);
  const topDebtor = useMemo(() => [...customers].sort((a, b) => b.debtBalance - a.debtBalance)[0], [customers]);
  const isOwner = isOwnerUser(currentUser);
  const isSystemAdmin = isSystemAdminUser(currentUser);
  const canOperate = !subscription || subscriptionCanMutate(subscription);
  const visibleNavItems: NavItem[] = isSystemAdmin
    ? [{ id: "platform", label: "Locales y usuarios", icon: Store }]
    : navItems
        .filter((item) => isOwner || ["sale", "products", "customers", "operations"].includes(item.id))
        .filter((item) => item.id !== "customers" || !subscription || hasEntitlement(subscription, "customers"))
        .filter((item) => item.id !== "reports" || !subscription || hasEntitlement(subscription, "advancedReports"));
  const mobilePrimaryIds: View[] = isOwner
    ? ["dashboard", "sale", "products", "customers", "operations"]
    : ["sale", "products", "customers", "operations"];
  const mobileNavItems = isSystemAdmin ? [] : visibleNavItems.filter((item) => mobilePrimaryIds.includes(item.id));

  function navigateTo(view: View) {
    if (view !== activeView) setPreviousView(activeView);
    setMobileMenuOpen(false);
    setActiveView(view);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function saveSession(session: AuthSession) {
    localStorage.setItem("localito-session", JSON.stringify(session));
    localStorage.setItem("localito-token", session.token);
    setCurrentUser(session.user);
    setTenant(session.tenant);
  }

  function applyTheme(preference: ThemePreference, userId = currentUser?.id) {
    const resolved = preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : preference === "system" ? "light" : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    setTheme(preference);
    if (userId) localStorage.setItem(`localito-theme:${userId}`, preference);
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
      const message = error instanceof Error ? error.message : "No se pudo cargar la API.";
      if (/debes iniciar sesi[oó]n/i.test(message)) {
        logout();
        setNotice({ message: "Tu sesión venció. Inicia sesión nuevamente.", tone: "warning" });
      } else {
        setNotice({ message, tone: "error" });
      }
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
    setSubscription(data.subscription);
    setSelectedCustomerId((current) => current || data.customers[0]?.id || "");
  }

  useEffect(() => {
    if (!currentUser) return;
    const stored = localStorage.getItem(`localito-theme:${currentUser.id}`) as ThemePreference | null;
    applyTheme(stored && ["light", "dark", "system"].includes(stored) ? stored : "light", currentUser.id);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if ((localStorage.getItem(`localito-theme:${currentUser.id}`) ?? "light") === "system") applyTheme("system", currentUser.id); };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [currentUser?.id]);

  useEffect(() => {
    if (passwordResetToken) {
      setNotice({ message: "Ingresa una nueva contraseña para recuperar tu acceso.", tone: "success" });
      setIsLoading(false);
      return;
    }

    const storedSession = localStorage.getItem("localito-session");
    if (!storedSession) {
      setNotice({ message: "Inicia sesión para operar el local.", tone: "success" });
      setIsLoading(false);
      return;
    }

    try {
      const restored = JSON.parse(storedSession) as AuthSession;
      saveSession(restored);
      if (restored.user.role === "seller") setActiveView("sale");
      void loadWorkspace("Sesión restaurada.", restored.user);
    } catch {
      localStorage.removeItem("localito-session");
      localStorage.removeItem("localito-token");
      setNotice({ message: "Inicia sesión para operar el local.", tone: "success" });
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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!mobileActionsRef.current?.contains(event.target as Node)) setMobileMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [mobileMenuOpen]);

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
      setNotice({ message: error instanceof Error ? error.message : "No se pudo iniciar sesión.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function registerAccount(payload: { businessName: string; businessType: string; ownerName: string; email: string; password: string }) {
    setIsBusy(true);
    setIsLoading(true);
    try {
      const response = await api.register(payload);
      saveSession(response.data);
      setActiveView("setup");
      await loadWorkspace("Tu local fue creado. Comenzó tu prueba Pro gratuita de 30 días.", response.data.user);
    } catch (error) {
      setIsLoading(false);
      setNotice({ message: error instanceof Error ? error.message : "No se pudo crear el local.", tone: "error" });
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
      const response = await api.requestPasswordReset(normalizedEmail);
      setLoginForm((current) => ({ ...current, email: normalizedEmail, password: "" }));
      setLoginMode(response.data.delivery === "email" ? "login" : "forgot");
      setNotice({ message: response.data.delivery === "email" ? "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." : "El correo de recuperación aún no está configurado. Solicita al administrador de Localito una clave temporal.", tone: response.data.delivery === "email" ? "success" : "warning" });
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
    setSubscription(null);
    setTicket([]);
    setLastReceipt(null);
    setPaymentMethod("cash");
    setSelectedCustomerId("");
    setSearchTerm("");
    setEditingProductId(null);
    setEditingCustomerId(null);
    setProductForm(emptyProductForm);
    setCustomerForm(emptyCustomerForm);
    setUserForm(emptyUserForm);
    setPaymentAmounts({});
    setCashClosureNote("");
    setLastDebtCharge(null);
    setActiveView("dashboard");
    setNotice({ message: "Sesión cerrada. Puedes iniciar como dueño o vendedor.", tone: "success" });
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

  async function confirmSale(options?: { discount?: number; notes?: string; payments?: Array<{ method: Exclude<PaymentMethod, "mixed">; amount: number }> }) {
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

      setNotice({
        message: `Venta registrada por ${formatCLP(saleResponse.data.total)}.`,
        tone: "success"
      });

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
      `Hola ${charge.customerName}, tienes un cobro pendiente de demostración en ${tenant?.name ?? "Localito"}.`,
      `Monto: ${formatCLP(charge.amount)}.`,
      `Enlace de prueba Webpay: ${charge.redirectUrl}`,
      "Este enlace se usa solo para la demostración académica y no procesa pagos reales.",
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
          title: `Simulación de cobro · ${tenant?.name ?? "Localito"}`,
          text,
          url: charge.redirectUrl
        });
        setNotice({ message: `Simulación de cobro compartida para ${charge.customerName}.`, tone: "success" });
        return;
      }

      await copyTextToClipboard(text);
      setNotice({ message: "Tu dispositivo no abrió compartir, pero la simulación quedó copiada.", tone: "success" });
    } catch {
      setNotice({ message: "Simulación generada. Puedes compartirla, copiarla o enviarla por WhatsApp.", tone: "warning" });
    }
  }

  async function copyDebtCharge(charge: DebtChargeState) {
    try {
      await copyTextToClipboard(debtChargeMessage(charge));
      setNotice({ message: "Mensaje de simulación copiado.", tone: "success" });
    } catch {
      setNotice({ message: "No se pudo copiar la simulación.", tone: "warning" });
    }
  }

  function openWhatsAppDebtCharge(charge: DebtChargeState) {
    const url = `https://wa.me/?text=${encodeURIComponent(debtChargeMessage(charge))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setNotice({ message: `Simulación lista para enviar por WhatsApp a ${charge.customerName}.`, tone: "success" });
  }

  async function confirmDebtCharge(charge: DebtChargeState) {
    setIsBusy(true);
    try {
      await api.confirmWebpayPayment(charge.paymentId);
      setLastDebtCharge(null);
      await loadWorkspace(`Simulación Webpay confirmada para ${charge.customerName}. Deuda actualizada.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo confirmar la simulación Webpay.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function cancelSale(sale: Sale, reason: string) {
    if (!isOwner) {
      setNotice({ message: "Solo el dueno/admin puede anular ventas.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      const response = await api.cancelSale(sale.id, reason);
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
      setNotice({ message: "Nombre, categoría y precio de venta son obligatorios.", tone: "warning" });
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

  async function payCustomerDebt(customer: Customer, method: Exclude<PaymentMethod, "credit" | "mixed">) {
    const amount = numberFromInput(paymentAmounts[customer.id] || "0");
    if (amount <= 0) {
      setNotice({ message: "Ingresa un monto de abono valido.", tone: "warning" });
      return;
    }

    setIsBusy(true);
    try {
      await api.payCustomerDebt(customer.id, amount, method);
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
      setNotice({ message: "Ingresa un monto para generar la simulación Webpay.", tone: "warning" });
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
        message: `Simulación Webpay generada para ${customer.name}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo crear la simulación Webpay.", tone: "error" });
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

  async function updateBusiness(value: BusinessFormState) {
    if (!isOwner || !tenant) return;
    if (!value.name.trim() || !value.businessType.trim()) {
      setNotice({ message: "Nombre y rubro son obligatorios para guardar el negocio.", tone: "warning" });
      return;
    }
    setIsBusy(true);
    try {
      const response = await api.updateTenant({
        name: value.name.trim(),
        businessType: value.businessType.trim(),
        address: value.address?.trim(),
        phone: value.phone?.trim()
      });
      setTenant(response.data);
      const storedSession = localStorage.getItem("localito-session");
      if (storedSession) {
        const session = JSON.parse(storedSession) as AuthSession;
        localStorage.setItem("localito-session", JSON.stringify({ ...session, tenant: response.data }));
      }
      setNotice({ message: "Datos del negocio guardados.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo guardar el negocio.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function updateManagedUser(user: User, body: Partial<User>) {
    if (!isOwner) return;
    setIsBusy(true);
    try {
      await api.updateUser(user.id, body);
      await loadWorkspace(`${user.name} fue actualizado.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo actualizar el usuario.", tone: "error" });
    } finally { setIsBusy(false); }
  }

  async function deleteManagedUser(user: User) {
    if (!isOwner || !window.confirm(`¿Eliminar definitivamente el acceso de ${user.name}?`)) return;
    setIsBusy(true);
    try {
      await api.deleteUser(user.id);
      await loadWorkspace(`${user.name} fue eliminado definitivamente.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo eliminar el usuario.", tone: "error" });
    } finally { setIsBusy(false); }
  }

  async function resetManagedUserPassword(user: User, password: string) {
    if (!isOwner) return;
    setIsBusy(true);
    try { await api.resetUserPassword(user.id, password); setNotice({ message: `Clave temporal actualizada para ${user.name}.`, tone: "success" }); }
    catch (error) { setNotice({ message: error instanceof Error ? error.message : "No se pudo actualizar la clave.", tone: "error" }); }
    finally { setIsBusy(false); }
  }

  async function returnSale(sale: Sale, items: Array<{ productId: string; quantity: number }>, reason: string) {
    if (!isOwner || sale.status === "cancelled" || sale.status === "refunded") return;
    setIsBusy(true);
    try { await api.returnSale(sale.id, items, reason); await loadWorkspace("Devolución registrada y stock restaurado."); }
    catch (error) { setNotice({ message: error instanceof Error ? error.message : "No se pudo devolver la venta.", tone: "error" }); }
    finally { setIsBusy(false); }
  }

  async function changePlan(plan: SubscriptionPlan, provider: "webpay_sandbox" | "mercadopago_sandbox" | "transfer") {
    setIsBusy(true);
    try {
      const response = await api.changePlan(plan, provider);
      setSubscription(response.data);
      setNotice({ message: provider === "transfer" ? `Solicitud de ${LOCALITO_PLANS[plan].name} registrada. Se activará cuando el administrador confirme la transferencia.` : `Pago de prueba aprobado. ${LOCALITO_PLANS[plan].name} quedó activo sin realizar un cobro real.`, tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo cambiar el plan.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  function exportBusinessData() {
    const payload = { exportedAt: new Date().toISOString(), tenant, products, customers, sales, cashClosures };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `localito-${tenant?.name.toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, "-") || "datos"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!currentUser) {
    return (
      <LoginView
        loginForm={loginForm}
        mode={loginMode}
        notice={notice}
        isBusy={isBusy || isLoading}
        onForm={setLoginForm}
        onLogin={() => void login()}
        onRegister={(payload) => void registerAccount(payload)}
        onOpenRegister={() => setLoginMode("register")}
        onShowNotice={(message) => setNotice({ message, tone: "warning" })}
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
        {!isSystemAdmin && <div className="sidebar-appearance-control">
          <span>Apariencia</span>
          <button className="theme-switch" type="button" role="switch" aria-checked={theme === "dark"} onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar entre modo claro y oscuro"><Sun size={14}/><span/><Moon size={14}/></button>
        </div>}
        {isOwner && subscription && <button className="sidebar-plan-card" type="button" onClick={() => navigateTo("plan")}><span>{effectiveSubscriptionStatus(subscription) === "trialing" ? "PRO · PRUEBA" : LOCALITO_PLANS[subscription.plan].name.toLocaleUpperCase("es")}</span><strong>{effectiveSubscriptionStatus(subscription) === "trialing" ? `${subscriptionDaysRemaining(subscription)} días restantes` : subscription.status === "active" ? "Plan activo" : "Revisar suscripción"}</strong><small>Ver mi plan</small></button>}
        <nav className="sidebar-nav" aria-label="Navegación principal">
          <span className="sidebar-label">{isSystemAdmin ? "ADMINISTRACIÓN" : "TU NEGOCIO"}</span>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return <button className={navItemIsActive(item.id, activeView) ? "sidebar-item active" : "sidebar-item"} key={item.id} type="button" onClick={() => navigateTo(item.id)}><Icon size={19}/><span>{item.label}</span></button>;
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
          {["scan", "product_create", "setup", "invoice", "plan"].includes(activeView) && <button className="back-button" type="button" onClick={() => navigateTo(previousView === activeView ? "dashboard" : previousView)}><ArrowLeft size={18}/> Volver</button>}
          <p className="eyebrow">{isSystemAdmin ? "Administración de Localito" : `Hola, ${currentUser.name.split(" ")[0]}`}</p>
          <h1>{viewTitle(activeView, isOwner, isSystemAdmin)}</h1>
          <p className="session-line">
            <Store size={15}/>
            <span>{tenant?.name ?? "Localito"}</span>
            <span className="role-pill">{currentUser.role === "system_admin" ? "Admin plataforma" : currentUser.role === "owner" ? "Dueño" : "Vendedor"}</span>
          </p>
        </div>
        <div className="topbar-actions desktop-topbar-actions">
          <button className="icon-button" type="button" onClick={() => void loadWorkspace("Datos refrescados.")} aria-label="Refrescar">
            <RefreshCw size={20} />
          </button>
          {!isSystemAdmin && <button
              className="icon-button"
              type="button"
              onClick={() => navigateTo("settings")}
              aria-label={isOwner ? "Configuración" : "Mi perfil"}
            >
              <Settings size={21} />
            </button>}
          <button className="icon-button" type="button" onClick={logout} aria-label="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
        <div className="mobile-topbar-tools">
          {!isSystemAdmin && <button className="icon-button" type="button" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema">{theme === "dark" ? <Sun size={19}/> : <Moon size={19}/>}</button>}
          <div className="mobile-actions-wrap" ref={mobileActionsRef}>
            <button className="icon-button mobile-menu-trigger" type="button" aria-label="Abrir acciones" aria-haspopup="menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><EllipsisVertical size={21}/></button>
            {mobileMenuOpen && <div className="mobile-actions-menu" role="menu">
              {!isSystemAdmin && isOwner && <button type="button" role="menuitem" onClick={() => navigateTo("reports")}><BarChart3 size={18}/><span>Reportes</span></button>}
              <button type="button" role="menuitem" onClick={() => { setMobileMenuOpen(false); void loadWorkspace("Datos refrescados."); }}><RefreshCw size={18}/><span>Actualizar datos</span></button>
              {!isSystemAdmin && <button type="button" role="menuitem" onClick={() => navigateTo("settings")}><Settings size={18}/><span>{isOwner ? "Configuración" : "Mi perfil"}</span></button>}
              <button className="danger" type="button" role="menuitem" onClick={() => { setMobileMenuOpen(false); logout(); }}><LogOut size={18}/><span>Cerrar sesión</span></button>
            </div>}
          </div>
        </div>
      </header>

      {!!mobileNavItems.length && <nav className="bottom-nav" aria-label="Navegación móvil" style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }}>
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={navItemIsActive(item.id, activeView) ? "nav-item active" : "nav-item"}
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>}

      <main className="content">
        {notice && <section className={`notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notice.message}</span>
        </section>}

        {!isSystemAdmin && isOwner && subscription && effectiveSubscriptionStatus(subscription) === "trialing" && <section className="subscription-banner"><div><strong>Prueba Pro · {subscriptionDaysRemaining(subscription)} días restantes</strong><span>Incluye todas las funciones. Al terminar, elige un plan para seguir operando.</span></div><button className="secondary-action small" type="button" onClick={() => navigateTo("plan")}>Ver mi plan</button></section>}
        {!isSystemAdmin && subscription && !subscriptionCanMutate(subscription) && <section className="notice warning"><AlertTriangle size={18}/><span>Tu suscripción no está activa. Puedes revisar toda tu información, pero las acciones están pausadas.</span>{isOwner && <button className="secondary-action small" type="button" onClick={() => navigateTo("plan")}>Elegir plan</button>}</section>}

        {isLoading && <p className="empty-state">Conectando con la API de Localito...</p>}

        {!isLoading && activeView === "platform" && isSystemAdmin && <PlatformAdminView />}

        {!isLoading && activeView === "dashboard" && (
          <DashboardView
            businessName={tenant?.name ?? "Localito"}
            userName={currentUser.name}
            lowStockProducts={lowStockProducts}
            summary={summary}
            sales={activeSales}
            cashRegister={cashRegister}
            topDebtor={topDebtor}
            canOperate={canOperate}
            canViewCustomers={!subscription || hasEntitlement(subscription, "customers")}
            onStartSale={() => navigateTo("sale")}
            onAddProduct={() => navigateTo("product_create")}
            onOpenCash={() => navigateTo("operations")}
            onOpenStock={() => navigateTo("products")}
            onOpenCustomers={() => navigateTo("customers")}
          />
        )}

        {!isLoading && activeView === "sale" && (
          <SaleView
            products={products}
            sales={activeSales}
            ticket={ticket}
            ticketTotal={ticketTotal}
            paymentMethod={paymentMethod}
            paymentOptions={subscription && !hasEntitlement(subscription, "credit") ? paymentOptions.filter((option) => option.id !== "credit") : paymentOptions}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            searchTerm={searchTerm}
            canSell={canOperate}
            isBusy={isBusy}
            onSearch={setSearchTerm}
            onAdd={addToTicket}
            onRemoveOne={removeOneFromTicket}
            onPaymentMethod={setPaymentMethod}
            onCustomer={setSelectedCustomerId}
            onConfirm={(options) => void confirmSale(options)}
            onScan={() => !canOperate || (subscription && !hasEntitlement(subscription, "aiPhotoSale")) ? navigateTo("plan") : setActiveView("scan")}
            lastReceipt={lastReceipt}
            onPrintReceipt={printLastReceipt}
            onShareReceipt={() => void shareLastReceipt()}
          />
        )}

        {!isLoading && activeView === "scan" && canOperate && (!subscription || hasEntitlement(subscription, "aiPhotoSale")) && (
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
            canManageProducts={isOwner && canOperate}
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
          <div className="stack"><section className="panel inventory-actions"><div className="inventory-actions-heading"><span>INVENTARIO</span><h2>¿Qué necesitas hacer?</h2><p>Primero revisa el catálogo; después agrega productos de a uno, por carga masiva o desde una factura.</p></div><div className="inventory-task-grid"><div className="inventory-task current"><Package size={20}/><span><strong>Revisar catálogo</strong><small>Buscar, filtrar y ajustar stock</small></span></div>{isOwner && canOperate && <button className="inventory-task primary" type="button" onClick={() => navigateTo("product_create")}><Plus size={20}/><span><strong>Agregar producto</strong><small>Crear uno de forma manual</small></span></button>}{isOwner && canOperate && <button className="inventory-task" type="button" onClick={() => navigateTo("setup")}><ListPlus size={20}/><span><strong>Cargar varios</strong><small>Importar CSV o listado</small></span></button>}{isOwner && canOperate && (!subscription || hasEntitlement(subscription, "purchases")) && <button className="inventory-task" type="button" onClick={() => navigateTo("invoice")}><ReceiptText size={20}/><span><strong>Ingresar factura</strong><small>Recibir mercadería con IA</small></span></button>}</div>{!isOwner && <p className="helper-text">Puedes buscar y revisar el inventario. Los cambios los realiza la persona dueña del local.</p>}</section><ProductsView
            mode="stock"
            products={products}
            searchTerm={searchTerm}
            productForm={productForm}
            isBusy={isBusy}
            editingProductId={editingProductId}
            canManageProducts={isOwner && canOperate}
            onSearch={setSearchTerm}
            onForm={setProductForm}
            onCreate={() => void createProduct()}
            onCancelEdit={() => { setEditingProductId(null); setProductForm(emptyProductForm); }}
            onEdit={startEditProduct}
            onDeactivate={(product) => void deactivateProduct(product)}
            onAdjustStock={(product, delta) => void adjustStock(product, delta)}
          /></div>
        )}

        {!isLoading && activeView === "customers" && (
          <CustomersView
            customers={customers}
            customerForm={customerForm}
            paymentAmounts={paymentAmounts}
            lastDebtCharge={lastDebtCharge}
            isBusy={isBusy}
            editingCustomerId={editingCustomerId}
            canOperate={canOperate}
            canManageCustomers={isOwner && canOperate}
            onForm={setCustomerForm}
            onPaymentAmount={(customerId, value) => setPaymentAmounts((current) => ({ ...current, [customerId]: value }))}
            onCreate={() => void createCustomer()}
            onCancelEdit={() => {
              setEditingCustomerId(null);
              setCustomerForm(emptyCustomerForm);
            }}
            onEdit={startEditCustomer}
            onDeactivate={(customer) => void deactivateCustomer(customer)}
            onPayDebt={(customer, method) => void payCustomerDebt(customer, method)}
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
            users={users}
            customers={customers}
            sales={sales}
            lowStockProducts={lowStockProducts}
            cashRegister={cashRegister}
            cashClosures={cashClosures}
            cashClosureNote={cashClosureNote}
            isBusy={isBusy}
            canViewFullReports={isOwner}
            onCashClosureNote={setCashClosureNote}
            onCloseCashRegister={() => void closeCashRegister()}
            onCancelSale={(sale, reason) => void cancelSale(sale, reason)}
            onReturnSale={(sale, items, reason) => void returnSale(sale, items, reason)}
          />
        )}

        {!isLoading && activeView === "operations" && (
          <OperationsView products={products} canManage={isOwner && canOperate && (!subscription || hasEntitlement(subscription, "purchases"))} onRefresh={() => loadWorkspace()} />
        )}

        {!isLoading && activeView === "invoice" && isOwner && (
          <OperationsView mode="invoice" products={products} canManage={canOperate && (!subscription || hasEntitlement(subscription, "purchases"))} onRefresh={() => loadWorkspace()} />
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
            onSaveBusiness={(value) => void updateBusiness(value)}
            onCreateUser={() => void createUser()}
            onUpdateUser={(userToUpdate, body) => void updateManagedUser(userToUpdate, body)}
            onDeleteUser={(userToDelete) => void deleteManagedUser(userToDelete)}
            onResetUserPassword={(userToUpdate, password) => void resetManagedUserPassword(userToUpdate, password)}
            onOpenPlan={() => navigateTo("plan")}
            onExport={exportBusinessData}
          />
        )}

        {!isLoading && activeView === "plan" && isOwner && subscription && <PlanView subscription={subscription} isBusy={isBusy} onSelect={(plan, provider) => void changePlan(plan, provider)} />}
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
    invoice: "Ingresar factura",
    products: "Inventario",
    customers: "Clientes",
    operations: "Caja",
    reports: isOwner ? "Reportes" : "Cierre de caja",
    settings: "Configuración",
    plan: "Mi plan",
    platform: isSystemAdmin ? "Locales y usuarios" : "Administración"
  };
  return labels[view];
}

function LoginView({
  loginForm,
  mode,
  notice,
  isBusy,
  onForm,
  onLogin,
  onRegister,
  onOpenRegister,
  onShowNotice,
  onForgot,
  onRequestReset,
  onConfirmReset,
  onReturnToLogin
}: {
  loginForm: LoginFormState;
  mode: LoginMode;
  notice: NoticeState | null;
  isBusy: boolean;
  onForm: (value: LoginFormState) => void;
  onLogin: () => void;
  onRegister: (payload: { businessName: string; businessType: string; ownerName: string; email: string; password: string }) => void;
  onOpenRegister: () => void;
  onShowNotice: (message: string) => void;
  onForgot: () => void;
  onRequestReset: (email: string) => void;
  onConfirmReset: (password: string, confirmation: string) => void;
  onReturnToLogin: () => void;
}) {
  const [recoveryEmail, setRecoveryEmail] = useState(loginForm.email);
  const [resetForm, setResetForm] = useState({ password: "", confirmation: "" });
  const [registration, setRegistration] = useState({ businessName: "", businessType: "Almacén", ownerName: "", email: "", password: "", confirmation: "", accepted: false });
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const title = mode === "reset" ? "Nueva contraseña" : mode === "forgot" ? "Recuperar acceso" : mode === "register" ? "Crea tu local" : "Bienvenido de vuelta";

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
            <span>{isBusy ? "Entrando..." : "Iniciar sesión"}</span>
          </button>
          <button className="secondary-action full" type="button" disabled={isBusy} onClick={() => {
            setRecoveryEmail(loginForm.email);
            onForgot();
          }}>Olvidé mi contraseña</button>
          <div className="auth-divider"><span>¿Primera vez en Localito?</span></div>
          <button className="social-login-button" type="button" disabled={isBusy} onClick={() => onShowNotice("El inicio con Google está fuera del alcance de la tesis y no está disponible.")}>
            <span className="google-mark" aria-hidden="true">G</span>
            <span>Continuar con Google</span>
          </button>
          <p className="register-prompt">¿Aún no tienes una cuenta? <button className="auth-register-link" type="button" disabled={isBusy} onClick={onOpenRegister}>Crea tu cuenta</button></p>
        </form>}

        {mode === "register" && <form className="login-form registration-form" onSubmit={(event) => {
          event.preventDefault();
          if (registration.password !== registration.confirmation) return;
          onRegister({ businessName: registration.businessName, businessType: registration.businessType, ownerName: registration.ownerName, email: registration.email, password: registration.password });
        }}>
          <div className="trial-offer"><CheckCircle2 size={20}/><div><strong>Prueba Localito Pro gratis por 30 días</strong><p>Incluye ventas, inventario, caja, clientes, fiado, reportes y Venta Rápida. No pedimos tarjeta.</p></div></div>
          <div className="form-grid compact-auth-grid">
            <label className="field">Nombre del negocio<input ref={firstFieldRef} value={registration.businessName} onChange={(event) => setRegistration({ ...registration, businessName: event.target.value })} required maxLength={120}/></label>
            <label className="field">Rubro<select value={registration.businessType} onChange={(event) => setRegistration({ ...registration, businessType: event.target.value })}><option>Almacén</option><option>Botillería</option><option>Minimarket</option><option>Peluquería</option><option>Otro</option></select></label>
            <label className="field">Tu nombre<input value={registration.ownerName} onChange={(event) => setRegistration({ ...registration, ownerName: event.target.value })} required autoComplete="name" maxLength={120}/></label>
            <label className="field">Correo<input type="email" value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} required autoComplete="email" maxLength={254}/></label>
            <label className="field">Contraseña<input type="password" value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} required minLength={10} maxLength={128} autoComplete="new-password"/></label>
            <label className="field">Repetir contraseña<input type="password" value={registration.confirmation} onChange={(event) => setRegistration({ ...registration, confirmation: event.target.value })} required minLength={10} maxLength={128} autoComplete="new-password"/></label>
          </div>
          {registration.confirmation && registration.password !== registration.confirmation && <p className="field-error">Las contraseñas no coinciden.</p>}
          <label className="consent-check"><input type="checkbox" checked={registration.accepted} onChange={(event) => setRegistration({ ...registration, accepted: event.target.checked })}/><span>Entiendo que al terminar los 30 días deberé elegir un plan para seguir operando. Mis datos permanecerán guardados.</span></label>
          <button className="primary-action full" type="submit" disabled={isBusy || !registration.accepted || registration.password !== registration.confirmation}>{isBusy ? "Creando local..." : "Comenzar mi mes de prueba"}</button>
          <button className="secondary-action full" type="button" onClick={onReturnToLogin} disabled={isBusy}>Ya tengo cuenta</button>
        </form>}

        {mode === "forgot" && <form className="login-form" onSubmit={(event) => {
          event.preventDefault();
          onRequestReset(recoveryEmail);
        }}>
          <p className="helper-text">Si el correo está habilitado, recibirás un enlace seguro. Si no, el administrador puede asignarte una clave temporal.</p>
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
          <button className="primary-action full" type="submit" disabled={isBusy}>{isBusy ? "Enviando..." : "Solicitar recuperación"}</button>
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

      </section>
    </main>
  );
}

function SaleView({
  products,
  sales,
  ticket,
  ticketTotal,
  paymentMethod,
  paymentOptions,
  customers,
  selectedCustomerId,
  searchTerm,
  canSell,
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
  sales: Sale[];
  ticket: SaleItem[];
  ticketTotal: number;
  paymentMethod: PaymentMethod;
  paymentOptions: Array<{ id: PaymentMethod; label: string; icon: LucideIcon }>;
  customers: Customer[];
  selectedCustomerId: string;
  searchTerm: string;
  canSell: boolean;
  isBusy: boolean;
  onSearch: (value: string) => void;
  onAdd: (product: Product) => void;
  onRemoveOne: (productId: string) => void;
  onPaymentMethod: (value: PaymentMethod) => void;
  onCustomer: (value: string) => void;
  onConfirm: (options?: { discount?: number; notes?: string; payments?: Array<{ method: Exclude<PaymentMethod, "mixed">; amount: number }> }) => void;
  onScan: () => void;
  lastReceipt: Sale | null;
  onPrintReceipt: () => void;
  onShareReceipt: () => void;
}) {
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [cashPart, setCashPart] = useState("");
  const [isChoosingPayment, setIsChoosingPayment] = useState(false);
  const [externalPaymentConfirmed, setExternalPaymentConfirmed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [featuredMode, setFeaturedMode] = useState<"popular" | "recent">("popular");
  const searchFilteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase("es");
    if (!normalized) return products;
    return products.filter((product) => [product.name, product.brand, product.category, product.barcode, product.sku]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase("es").includes(normalized)));
  }, [products, searchTerm]);
  const categoryOptions = useMemo(() => {
    const categories = new Map<string, { id: string; label: string; count: number }>();
    products.forEach((product) => {
      const label = product.category.trim() || "Sin categoría";
      const id = label.toLocaleLowerCase("es");
      const current = categories.get(id);
      categories.set(id, current ? { ...current, count: current.count + 1 } : { id, label, count: 1 });
    });
    return [...categories.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [products]);
  const categoryProducts = useMemo(() => selectedCategory === "all"
    ? searchFilteredProducts
    : searchFilteredProducts.filter((product) => (product.category.trim() || "Sin categoría").toLocaleLowerCase("es") === selectedCategory), [searchFilteredProducts, selectedCategory]);
  const featuredProducts = useMemo(() => {
    const productsById = new Map(products.map((product) => [product.id, product]));
    if (featuredMode === "popular") {
      const quantities = new Map<string, number>();
      sales.forEach((sale) => sale.items.forEach((item) => quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)));
      return [...quantities.entries()].sort((a, b) => b[1] - a[1]).map(([productId]) => productsById.get(productId)).filter((product): product is Product => Boolean(product)).slice(0, 6);
    }

    const recentIds = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).flatMap((sale) => sale.items.map((item) => item.productId));
    return [...new Set(recentIds)].map((productId) => productsById.get(productId)).filter((product): product is Product => Boolean(product)).slice(0, 6);
  }, [featuredMode, products, sales]);
  const selectedCategoryLabel = selectedCategory === "all" ? "Todos" : categoryOptions.find((category) => category.id === selectedCategory)?.label ?? "Todos";
  const visibleProducts = categoryProducts.slice(0, 60);
  const discountedTotal = Math.max(0, ticketTotal - numberFromInput(discount));
  const cardPart = Math.max(0, discountedTotal - numberFromInput(cashPart));
  const isExternalPayment = ["card", "transfer", "webpay", "mercadopago"].includes(paymentMethod);

  useEffect(() => {
    if (ticket.length === 0) {
      setIsChoosingPayment(false);
      setExternalPaymentConfirmed(false);
    }
  }, [ticket.length]);

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryOptions.some((category) => category.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoryOptions, selectedCategory]);

  useEffect(() => {
    if (searchTerm.trim()) setSelectedCategory("all");
  }, [searchTerm]);

  function submitSale() {
    const payments = paymentMethod === "mixed" ? [{ method: "cash" as const, amount: numberFromInput(cashPart) }, { method: "card" as const, amount: cardPart }].filter((payment) => payment.amount > 0) : undefined;
    onConfirm({ discount: numberFromInput(discount), notes: notes.trim() || undefined, payments });
  }

  function scrollToTicket() {
    document.getElementById("sale-ticket")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openMobileCheckout() {
    setIsChoosingPayment(true);
    setExternalPaymentConfirmed(false);
    window.setTimeout(scrollToTicket, 0);
  }

  return (
    <div className="workspace-grid sale-workspace">
      <section className="panel sale-products-panel" id="sale-product-picker">
        <div className="section-heading compact-heading">
          <div className="flow-title"><span>1</span><h2>Elige productos</h2></div>
          <span>{categoryProducts.length} disponibles</span>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar producto, marca o código" />
        </div>
        <ContextHelp title="¿Cómo preparo una venta rápida?" tips={["Busca por nombre, marca o código; también puedes elegir una categoría.", "Toca un producto para agregarlo al ticket y revisa cantidades antes de cobrar.", "Si tienes varios productos sobre el mesón, usa Venta Rápida con foto."]} />
        {!searchTerm.trim() && featuredProducts.length > 0 && <section className="sale-featured-products" aria-label="Productos frecuentes">
          <div className="sale-featured-heading"><strong>Productos frecuentes</strong><div role="group" aria-label="Tipo de productos frecuentes"><button className={featuredMode === "popular" ? "active" : ""} type="button" aria-pressed={featuredMode === "popular"} onClick={() => setFeaturedMode("popular")}><TrendingUp size={14}/> Más vendidos</button><button className={featuredMode === "recent" ? "active" : ""} type="button" aria-pressed={featuredMode === "recent"} onClick={() => setFeaturedMode("recent")}>Recientes</button></div></div>
          <div className="sale-featured-list">
            {featuredProducts.map((product) => <button className="sale-featured-product" type="button" key={product.id} onClick={() => onAdd(product)} disabled={!canSell}><img src={productImageUrl(product)} alt="" aria-hidden="true"/><span><strong>{product.name}</strong><small>{formatCLP(product.salePrice)}</small></span></button>)}
          </div>
        </section>}
        <div className="sale-category-area">
          <div className="sale-category-heading">
            <strong>{searchTerm.trim() ? "Resultados de búsqueda" : "Explora por categoría"}</strong>
            {selectedCategory !== "all" && <button type="button" onClick={() => setSelectedCategory("all")}>Ver todos</button>}
          </div>
          <div className="category-filter-list sale-category-list" role="group" aria-label="Filtrar productos de venta por categoría">
            <button className={selectedCategory === "all" ? "category-filter active" : "category-filter"} type="button" aria-pressed={selectedCategory === "all"} onClick={() => setSelectedCategory("all")}>
              <span>Todos</span><small>{products.length}</small>
            </button>
            {categoryOptions.map((category) => (
              <button className={selectedCategory === category.id ? "category-filter active" : "category-filter"} type="button" aria-pressed={selectedCategory === category.id} onClick={() => setSelectedCategory(category.id)} key={category.id}>
                <span>{category.label}</span><small>{category.count}</small>
              </button>
            ))}
          </div>
        </div>
        <button className="inline-command" type="button" onClick={onScan} disabled={!canSell}>
          <Camera size={18} />
          <span>Venta Rápida con foto</span>
        </button>
        <div className="list product-list">
          {visibleProducts.map((product) => (
            <button className="product-button" type="button" key={product.id} onClick={() => onAdd(product)} disabled={!canSell}>
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
          {categoryProducts.length === 0 && (
            <EmptyState
              icon={Search}
              title="No encontramos productos"
              description={searchTerm.trim() ? "Prueba con otro nombre, marca o código. También puedes volver a ver todo el catálogo." : `No hay productos en ${selectedCategoryLabel}. Elige otra categoría para continuar.`}
              actionLabel="Ver todo el catálogo"
              onAction={() => { onSearch(""); setSelectedCategory("all"); }}
            />
          )}
          {categoryProducts.length > visibleProducts.length && (
            <p className="helper-text">Mostrando los primeros {visibleProducts.length} de {categoryProducts.length} en {selectedCategoryLabel}. Escribe el nombre, marca o código para encontrar otro producto.</p>
          )}
        </div>
      </section>

      {ticket.length > 0 && <div className="mobile-checkout-bar" aria-label="Resumen del ticket">
        <button className="mobile-cart-summary" type="button" onClick={scrollToTicket}>
          <span><ShoppingCart size={20}/><strong>{ticket.reduce((sum, item) => sum + item.quantity, 0)} productos</strong></span>
          <strong>{formatCLP(discountedTotal)}</strong>
          <span>Revisar ticket</span>
        </button>
        <button className="mobile-checkout-action" type="button" onClick={openMobileCheckout} disabled={!canSell || isBusy}><CheckCircle2 size={18}/><span>Cobrar</span></button>
      </div>}

      <section className="panel ticket-panel" id="sale-ticket">
        <div className="section-heading">
          <div className="flow-title"><span>2</span><h2>Revisa el ticket</h2></div>
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
                <button className="icon-button" type="button" onClick={() => { const product = products.find((entry) => entry.id === item.productId); if (product) onAdd(product); }} aria-label="Agregar uno" disabled={!canSell}>
                  <Plus size={17} />
                </button>
                <button className="icon-button danger" type="button" onClick={() => onRemoveOne(item.productId)} aria-label="Quitar uno" disabled={!canSell}>
                  <Minus size={17} />
                </button>
              </div>
            </div>
          ))}
          {ticket.length === 0 && <EmptyState icon={ShoppingCart} title="Tu ticket está vacío" description="Elige un producto del catálogo o usa Venta Rápida con foto para prepararlo." actionLabel="Elegir productos" onAction={() => document.getElementById("sale-product-picker")?.scrollIntoView({ behavior: "smooth", block: "start" })} />}
        </div>

        {isChoosingPayment && <><div className="checkout-step"><span>3</span><div><strong>¿Cómo pagará?</strong><p>Registra el pago solo después de verificarlo.</p></div></div><div className="payment-methods">
          {paymentOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                className={paymentMethod === option.id ? "chip active" : "chip"}
                type="button"
                key={option.id}
                onClick={() => { onPaymentMethod(option.id); setExternalPaymentConfirmed(false); }}
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
        {isExternalPayment && <label className="external-payment-confirm"><input type="checkbox" checked={externalPaymentConfirmed} onChange={(event) => setExternalPaymentConfirmed(event.target.checked)}/><span><strong>Confirmo que el pago fue aprobado</strong><small>Revisa el terminal, QR o comprobante externo. Localito no cobra automáticamente.</small></span></label>}
        </>}

        <div className="form-grid"><label className="field">Descuento<input value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="numeric" placeholder="Monto descuento" /></label><label className="field">Nota de venta<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pedido, encargo u observación" /></label></div>

        <div className="ticket-total">
          <span>Total</span>
          <strong>{formatCLP(discountedTotal)}</strong>
        </div>

        {!isChoosingPayment ? <button className="primary-action full" type="button" onClick={() => setIsChoosingPayment(true)} disabled={isBusy || !canSell || ticket.length === 0}>
          <CheckCircle2 size={20} />
          <span>{`Cobrar ${formatCLP(discountedTotal)}`}</span>
        </button> : <div className="stack compact-stack"><button className="primary-action full" type="button" onClick={submitSale} disabled={isBusy || !canSell || (isExternalPayment && !externalPaymentConfirmed)}><CheckCircle2 size={20}/><span>{isBusy ? "Registrando..." : isExternalPayment ? "Confirmar pago y registrar venta" : `Registrar venta · ${formatCLP(discountedTotal)}`}</span></button><button className="secondary-action full" type="button" onClick={() => { setIsChoosingPayment(false); setExternalPaymentConfirmed(false); }}>Volver al ticket</button></div>}
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
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [showAdvancedProductFields, setShowAdvancedProductFields] = useState(false);
  const categoryOptions = useMemo(() => {
    const categories = new Map<string, { label: string; count: number }>();

    for (const product of products) {
      const label = product.category.trim() || "Sin categoría";
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
      const productCategory = (product.category.trim() || "Sin categoría").toLocaleLowerCase("es");
      const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;
      const matchesStock = stockFilter === "all" || (stockFilter === "out" ? product.trackStock !== false && product.stock <= 0 : product.trackStock !== false && product.stock <= product.minimumStock);
      const matchesSearch = !normalizedSearch || [product.name, product.brand, product.category, product.barcode, product.sku]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch));

      return matchesCategory && matchesStock && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);
  const visibleLowStock = inventoryProducts.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock).length;
  const visibleStockValue = inventoryProducts.reduce((sum, product) => sum + product.stock * product.salePrice, 0);
  const renderedInventoryProducts = inventoryProducts.slice(0, 60);

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryOptions.some((category) => category.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoryOptions, selectedCategory]);

  function clearInventoryFilters() {
    setSelectedCategory("all");
    setStockFilter("all");
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
          <div className="progressive-form-heading"><span>DATOS PRINCIPALES</span><p>Solo necesitas estos cuatro datos para crear y vender el producto.</p></div>
          <div className="form-grid product-form-primary-grid">
            <label className="form-field"><span>Nombre del producto</span><input value={productForm.name} onChange={(event) => onForm({ ...productForm, name: event.target.value })} placeholder="Ej. Bebida cola 1,5 L" /></label>
            <label className="form-field"><span>Categoría</span><input value={productForm.category} onChange={(event) => onForm({ ...productForm, category: event.target.value })} placeholder="Ej. Bebidas" list="product-category-options" /></label>
            <datalist id="product-category-options">
              {categoryOptions.map((category) => <option value={category.label} key={category.id} />)}
            </datalist>
            <label className="form-field"><span>Precio de venta</span><input value={productForm.salePrice} onChange={(event) => onForm({ ...productForm, salePrice: event.target.value })} placeholder="$0" inputMode="numeric" /></label>
            <label className="form-field"><span>Stock inicial</span><input value={productForm.stock} onChange={(event) => onForm({ ...productForm, stock: event.target.value })} placeholder="0" inputMode="numeric" /></label>
          </div>
          {!editingProductId && <button className="secondary-action full progressive-form-toggle" type="button" aria-expanded={showAdvancedProductFields} onClick={() => setShowAdvancedProductFields((value) => !value)}>{showAdvancedProductFields ? "Ocultar información adicional" : "Agregar información adicional"}<span>{showAdvancedProductFields ? "Marca, código y control de stock" : "Marca, código, costo, vencimiento y más"}</span></button>}
          {(showAdvancedProductFields || Boolean(editingProductId)) && <div className="progressive-form-additional"><div className="progressive-form-heading"><span>INFORMACIÓN ADICIONAL</span><p>Completa solo lo que te ayude a ordenar mejor el inventario.</p></div><div className="form-grid advanced-product-fields"><label className="form-field"><span>Marca</span><input value={productForm.brand} onChange={(event) => onForm({ ...productForm, brand: event.target.value })} placeholder="Ej. Coca-Cola" /></label><label className="form-field"><span>Código de barras</span><input value={productForm.barcode} onChange={(event) => onForm({ ...productForm, barcode: event.target.value })} placeholder="Código del envase" inputMode="numeric" /></label><label className="form-field"><span>Costo</span><input value={productForm.costPrice} onChange={(event) => onForm({ ...productForm, costPrice: event.target.value })} placeholder="$0" inputMode="numeric" /></label><label className="form-field"><span>Stock mínimo</span><input value={productForm.minimumStock} onChange={(event) => onForm({ ...productForm, minimumStock: event.target.value })} placeholder="0" inputMode="numeric" /></label><label className="form-field"><span>SKU interno</span><input value={productForm.sku} onChange={(event) => onForm({ ...productForm, sku: event.target.value })} placeholder="Código interno" /></label><label className="form-field"><span>Variante o formato</span><input value={productForm.variant} onChange={(event) => onForm({ ...productForm, variant: event.target.value })} placeholder="Ej. Sin azúcar, pack 6" /></label><label className="form-field"><span>Unidad de venta</span><select value={productForm.unit} onChange={(event) => onForm({ ...productForm, unit: event.target.value as ProductFormState["unit"] })}><option value="unit">Unidad</option><option value="kg">Kilogramo</option><option value="gram">Gramo</option><option value="liter">Litro</option><option value="pack">Pack</option><option value="box">Caja</option></select></label><label className="form-field"><span>Unidades por pack</span><input value={productForm.unitsPerPack} onChange={(event) => onForm({ ...productForm, unitsPerPack: event.target.value })} placeholder="Ej. 6" inputMode="numeric" /></label><label className="form-field"><span>Vencimiento</span><input type="date" value={productForm.expiryDate} onChange={(event) => onForm({ ...productForm, expiryDate: event.target.value })} /></label><label className="field checkbox-field"><input type="checkbox" checked={productForm.trackStock} onChange={(event) => onForm({ ...productForm, trackStock: event.target.checked })} /> Controlar stock de este producto</label></div></div>}
          <button className="primary-action full" type="button" onClick={onCreate} disabled={isBusy}>
            {editingProductId ? <Save size={19} /> : <Plus size={19} />}
            <span>{editingProductId ? "Guardar producto" : "Crear producto"}</span>
          </button>
          {editingProductId && (
            <button className="secondary-action full" type="button" onClick={onCancelEdit}>
              Cancelar edición
            </button>
          )}
        </section>
      )}

      {mode === "stock" && <section className="panel inventory-panel">
        <div className="section-heading compact-heading">
          <h2>Inventario</h2>
          <span>{inventoryProducts.length === products.length ? `${products.length} productos` : `${inventoryProducts.length} de ${products.length}`}</span>
        </div>
        <ContextHelp title="¿Cómo ordeno el inventario?" tips={["Usa categorías, stock bajo o sin stock para encontrar lo que necesitas.", "Para un producto nuevo elige Crear producto; para varios, usa Cargar varios.", "Ingresa una factura solo cuando vayas a recibir mercadería y confirmar sus datos."]} />
        <div className="search-box">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar producto, marca o código" />
        </div>
        <div className="inventory-filters">
          <div className="inventory-filter-heading">
            <strong>Categorías</strong>
            {(selectedCategory !== "all" || stockFilter !== "all" || searchTerm) && <button type="button" onClick={clearInventoryFilters}>Limpiar filtros</button>}
          </div>
          <div className="category-filter-list" role="group" aria-label="Filtrar inventario por categoría">
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
          <div className="stock-filter-list" role="group" aria-label="Filtrar inventario por stock"><button className={stockFilter === "all" ? "category-filter active" : "category-filter"} type="button" onClick={() => setStockFilter("all")}>Todo stock</button><button className={stockFilter === "low" ? "category-filter active" : "category-filter"} type="button" onClick={() => setStockFilter("low")}>Stock bajo</button><button className={stockFilter === "out" ? "category-filter active" : "category-filter"} type="button" onClick={() => setStockFilter("out")}>Sin stock</button></div>
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
          {renderedInventoryProducts.map((product) => (
            <ProductRow
              product={product}
              key={product.id}
              canManageProducts={canManageProducts}
              onAdjustStock={onAdjustStock}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
          {inventoryProducts.length > renderedInventoryProducts.length && (
            <p className="helper-text">Mostrando los primeros {renderedInventoryProducts.length} de {inventoryProducts.length}. Usa las categorías o el buscador para llegar al producto que necesitas.</p>
          )}
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
  canOperate,
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
  canOperate: boolean;
  canManageCustomers: boolean;
  onForm: (value: CustomerFormState) => void;
  onPaymentAmount: (customerId: string, value: string) => void;
  onCreate: () => void;
  onCancelEdit: () => void;
  onEdit: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onPayDebt: (customer: Customer, method: Exclude<PaymentMethod, "credit" | "mixed">) => void;
  onCreatePayment: (customer: Customer) => void;
  onShareDebtCharge: (charge: DebtChargeState) => void;
  onCopyDebtCharge: (charge: DebtChargeState) => void;
  onWhatsAppDebtCharge: (charge: DebtChargeState) => void;
  onConfirmDebtCharge: (charge: DebtChargeState) => void;
}) {
  const [customerTab, setCustomerTab] = useState<"clients" | "credit" | "pending">("clients");
  const [debtMethods, setDebtMethods] = useState<Record<string, Exclude<PaymentMethod, "credit" | "mixed">>>({});
  const visibleCustomers = customerTab === "clients" ? customers : customers.filter((customer) => customer.debtBalance > 0);
  return (
    <div className="stack"><nav className="section-tabs" aria-label="Secciones de clientes"><button className={customerTab === "clients" ? "active" : ""} type="button" onClick={() => setCustomerTab("clients")}>Clientes <span>{customers.length}</span></button><button className={customerTab === "credit" ? "active" : ""} type="button" onClick={() => setCustomerTab("credit")}>Fiado <span>{customers.filter((customer) => customer.debtBalance > 0).length}</span></button><button className={customerTab === "pending" ? "active" : ""} type="button" onClick={() => setCustomerTab("pending")}>Pendientes <span>{customers.filter((customer) => customer.debtBalance > 0).length}</span></button></nav><div className="workspace-grid customer-workspace">
      {customerTab === "clients" && <section className="panel customer-form-panel">
        <div className="section-heading">
          <h2>{editingCustomerId ? "Editar cliente" : "Nuevo cliente"}</h2>
          <span>{canManageCustomers ? "Fiado" : "Alta rápida"}</span>
        </div>
        <p className="helper-text customer-form-intro">Registra lo esencial primero. Puedes completar más datos cuando los necesites.</p>
        <ContextHelp title="¿Cómo usar clientes y fiados?" tips={["Crea al cliente antes de hacer una venta a fiado.", "Define un límite y los días acordados solo si necesitas controlarlos.", "Cuando te paguen, registra un abono para que la deuda quede al día."]} />
        <div className="form-grid customer-form-grid customer-form-primary-grid">
          <label className="form-field"><span>Nombre completo</span><input id="customer-name" value={customerForm.name} onChange={(event) => onForm({ ...customerForm, name: event.target.value })} placeholder="Ej. María González" /></label>
          <label className="form-field"><span>Teléfono</span><input value={customerForm.phone} onChange={(event) => onForm({ ...customerForm, phone: event.target.value })} placeholder="+56 9..." /></label>
          <label className="form-field"><span>Límite de fiado</span><input value={customerForm.creditLimit} onChange={(event) => onForm({ ...customerForm, creditLimit: event.target.value })} placeholder="0 = sin límite" inputMode="numeric" /></label>
          <label className="form-field"><span>Días para pagar</span><input value={customerForm.creditDays} onChange={(event) => onForm({ ...customerForm, creditDays: event.target.value })} placeholder="30" inputMode="numeric" /></label>
          {canManageCustomers && <label className="field checkbox-field"><input type="checkbox" checked={customerForm.creditBlocked} onChange={(event) => onForm({ ...customerForm, creditBlocked: event.target.checked })} /> Bloquear nuevos fiados</label>}
        </div>
        <details className="customer-additional-fields">
          <summary><span>Información adicional</span><small>Correo, dirección y observaciones</small></summary>
          <div className="form-grid customer-form-grid">
            <label className="form-field"><span>Correo (opcional)</span><input value={customerForm.email} onChange={(event) => onForm({ ...customerForm, email: event.target.value })} placeholder="cliente@correo.cl" /></label>
            <label className="form-field"><span>Dirección (opcional)</span><input value={customerForm.address} onChange={(event) => onForm({ ...customerForm, address: event.target.value })} placeholder="Calle y número" /></label>
            <label className="form-field customer-notes-field"><span>Observaciones</span><input value={customerForm.notes} onChange={(event) => onForm({ ...customerForm, notes: event.target.value })} placeholder="Datos útiles del cliente" /></label>
          </div>
        </details>
        <button className="primary-action full" type="button" onClick={onCreate} disabled={isBusy || !canOperate}>
          {editingCustomerId ? <Save size={19} /> : <Plus size={19} />}
          <span>{editingCustomerId ? "Guardar cliente" : "Crear cliente"}</span>
        </button>
        {editingCustomerId && canManageCustomers && (
          <button className="secondary-action full" type="button" onClick={onCancelEdit}>
            Cancelar edición
          </button>
        )}
      </section>}

      {customerTab === "clients" && <CustomerOverview customers={customers} />}

      {lastDebtCharge && (
        <section className="panel payment-share-panel">
          <div className="section-heading">
            <div><span>SIMULACIÓN ACADÉMICA</span><h2>Cobro de prueba listo</h2></div>
            <span>{formatCLP(lastDebtCharge.amount)}</span>
          </div>
          <div className="payment-link-box">
            <strong>{lastDebtCharge.customerName}</strong>
            <p>Enlace de demostración: {lastDebtCharge.redirectUrl}</p>
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
            <button className="secondary-action compact" type="button" onClick={() => onConfirmDebtCharge(lastDebtCharge)} disabled={isBusy || !canOperate}>
              <CheckCircle2 size={17} />
              <span>Confirmar simulación</span>
            </button>
          </div>
        </section>
      )}

      <section className="panel accounts-panel">
        <div className="section-heading">
          <h2>{customerTab === "clients" ? "Todos los clientes" : customerTab === "credit" ? "Cuentas de fiado" : "Cobros pendientes"}</h2>
          <span>{visibleCustomers.length} registros</span>
        </div>
        <div className="list">
          {visibleCustomers.map((customer) => (
            <div className="customer-row" key={customer.id}>
              <div>
                <strong>{customer.name}</strong>
                <p>{customer.phone ?? "Sin teléfono"}</p>
              </div>
              <span className={customer.debtBalance > 0 ? "debt" : "paid"}>{formatCLP(customer.debtBalance)}</span>
              <input
                className="amount-input"
                value={paymentAmounts[customer.id] ?? ""}
                onChange={(event) => onPaymentAmount(customer.id, event.target.value)}
                placeholder="Monto"
                inputMode="numeric"
                disabled={!canOperate || customer.debtBalance === 0}
              />
              <select className="debt-method-select" aria-label={`Medio del abono de ${customer.name}`} value={debtMethods[customer.id] ?? "cash"} onChange={(event) => setDebtMethods((current) => ({ ...current, [customer.id]: event.target.value as Exclude<PaymentMethod, "credit" | "mixed"> }))} disabled={!canOperate || customer.debtBalance === 0}><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option><option value="webpay">Webpay externo</option><option value="mercadopago">Mercado Pago externo</option></select>
              <div className="customer-actions">
                {canManageCustomers && (
                  <button className="secondary-action small" type="button" onClick={() => onEdit(customer)} disabled={isBusy}>
                    <Edit3 size={16} />
                    <span>Editar</span>
                  </button>
                )}
                <button className="secondary-action small" type="button" onClick={() => onPayDebt(customer, debtMethods[customer.id] ?? "cash")} disabled={isBusy || !canOperate || customer.debtBalance === 0 || numberFromInput(paymentAmounts[customer.id] ?? "0") <= 0}>
                  <Banknote size={16} />
                  <span>Abono</span>
                </button>
                <button className="secondary-action small" type="button" onClick={() => onCreatePayment(customer)} disabled={isBusy || !canOperate || customer.debtBalance === 0}>
                  <Send size={16} />
                  <span>Simular cobro</span>
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
          {visibleCustomers.length === 0 && <EmptyState icon={Users} title={customerTab === "clients" ? "Aún no has registrado clientes" : "No hay cuentas pendientes"} description={customerTab === "clients" ? "Crea tu primer cliente para guardar sus datos y administrar sus fiados." : "Cuando un cliente tenga un fiado activo, aparecerá aquí para que puedas revisarlo."} actionLabel={customerTab === "clients" ? "Crear cliente" : undefined} onAction={customerTab === "clients" ? () => document.getElementById("customer-name")?.focus() : undefined} />}
        </div>
      </section>
    </div></div>
  );
}

function CustomerOverview({ customers }: { customers: Customer[] }) {
  const activeCustomers = customers.filter((customer) => customer.active !== false);
  const customersWithDebt = activeCustomers.filter((customer) => customer.debtBalance > 0);
  const blockedCustomers = activeCustomers.filter((customer) => customer.creditBlocked);
  const totalDebt = customersWithDebt.reduce((sum, customer) => sum + customer.debtBalance, 0);

  return <aside className="panel customer-overview" aria-label="Resumen de clientes">
    <div className="section-heading"><div><span>VISTA RÁPIDA</span><h2>Resumen de clientes</h2></div><span>{activeCustomers.length} activos</span></div>
    <div className="customer-overview-metrics">
      <article><span>Clientes</span><strong>{activeCustomers.length}</strong><small>registrados</small></article>
      <article className={customersWithDebt.length ? "attention" : ""}><span>Con fiado</span><strong>{customersWithDebt.length}</strong><small>{formatCLP(totalDebt)} pendiente</small></article>
      <article><span>Bloqueados</span><strong>{blockedCustomers.length}</strong><small>sin nuevos fiados</small></article>
    </div>
    {activeCustomers.length ? <div className="customer-overview-list"><div><strong>Clientes recientes</strong><small>Accesos rápidos para revisar sus datos.</small></div>{activeCustomers.slice(0, 4).map((customer) => <div className="customer-overview-item" key={customer.id}><span>{customer.name}</span><strong className={customer.debtBalance > 0 ? "debt" : "paid"}>{customer.debtBalance > 0 ? formatCLP(customer.debtBalance) : "Al día"}</strong></div>)}</div> : <div className="customer-overview-empty"><Users size={23}/><strong>Comienza con tu primer cliente</strong><p>Cuando registres clientes, aquí verás sus fiados, deudas y datos más recientes.</p></div>}
  </aside>;
}

function ReportsView({
  products,
  users,
  customers,
  sales,
  lowStockProducts,
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
  users: User[];
  customers: Customer[];
  sales: Sale[];
  lowStockProducts: Product[];
  cashRegister: CashRegisterSummary;
  cashClosures: CashRegisterClosure[];
  cashClosureNote: string;
  isBusy: boolean;
  canViewFullReports: boolean;
  onCashClosureNote: (value: string) => void;
  onCloseCashRegister: () => void;
  onCancelSale: (sale: Sale, reason: string) => void;
  onReturnSale: (sale: Sale, items: Array<{ productId: string; quantity: number }>, reason: string) => void;
}) {
  const latestMonth = sales[0]?.createdAt.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(latestMonth);
  const [selectedClosureId, setSelectedClosureId] = useState("");
  const [saleAction, setSaleAction] = useState<{ sale: Sale; type: "cancel" | "return" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const selectedMonthLabel = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(new Date(`${selectedMonth}-01T12:00:00`));
  const monthSales = sales.filter((sale) => sale.createdAt.slice(0, 7) === selectedMonth);
  const activeSales = monthSales.filter((sale) => sale.status !== "cancelled");
  const monthTotal = activeSales.reduce((sum, sale) => sum + sale.total, 0);
  const monthUnits = activeSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const dailyTotals = [...activeSales.reduce((map, sale) => { const day = sale.createdAt.slice(8, 10); map.set(day, (map.get(day) ?? 0) + sale.total); return map; }, new Map<string, number>())].sort((a, b) => a[0].localeCompare(b[0]));
  const maxDaily = Math.max(...dailyTotals.map(([, total]) => total), 1);
  const methodTotals = activeSales.reduce((map, sale) => {
    if (sale.payments?.length) sale.payments.forEach((payment) => map.set(paymentMethodLabel(payment.method), (map.get(paymentMethodLabel(payment.method)) ?? 0) + payment.amount));
    else map.set(paymentMethodLabel(sale.paymentMethod), (map.get(paymentMethodLabel(sale.paymentMethod)) ?? 0) + sale.total);
    return map;
  }, new Map<string, number>());
  const productTotals = activeSales.reduce((map, sale) => { sale.items.forEach((item) => { const current = map.get(item.productId) ?? { name: item.productName, units: 0, amount: 0 }; current.units += item.quantity; current.amount += item.subtotal; map.set(item.productId, current); }); return map; }, new Map<string, { name: string; units: number; amount: number }>());
  const topProducts = [...productTotals.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const sellerTotals = [...activeSales.reduce((map, sale) => map.set(sale.sellerId, (map.get(sale.sellerId) ?? 0) + sale.total), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const selectedClosure = cashClosures.find((closure) => closure.id === selectedClosureId);
  const closureSales = selectedClosure ? sales.filter((sale) => sale.createdAt.slice(0, 10) === selectedClosure.date) : [];

  function openSaleAction(sale: Sale, type: "cancel" | "return") {
    setSaleAction({ sale, type }); setActionReason("");
    setReturnQuantities(Object.fromEntries(sale.items.map((item) => [item.productId, type === "return" ? 1 : 0])));
  }

  function confirmSaleAction() {
    if (!saleAction || !actionReason.trim()) return;
    if (saleAction.type === "cancel") onCancelSale(saleAction.sale, actionReason.trim());
    else {
      const items = saleAction.sale.items.map((item) => ({ productId: item.productId, quantity: Math.min(item.quantity, Math.max(0, returnQuantities[item.productId] ?? 0)) })).filter((item) => item.quantity > 0);
      if (!items.length) return;
      onReturnSale(saleAction.sale, items, actionReason.trim());
    }
    setSaleAction(null);
  }

  return (
    <div className="stack">
      <section className="reports-toolbar"><div><span>REPORTES</span><h2>Así va tu negocio</h2><p>Revisa las ventas, la caja y el historial de {selectedMonthLabel}.</p></div><label className="month-filter"><span>Período a revisar</span><input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}/></label></section>
      {canViewFullReports && (
        <section className="report-period-summary" aria-label={`Resultado de ${selectedMonthLabel}`}><div className="report-period-copy"><span>RESULTADO DEL PERÍODO</span><h3>{selectedMonthLabel}</h3><p>{activeSales.length ? `${activeSales.length} ${activeSales.length === 1 ? "venta registrada" : "ventas registradas"} en el período seleccionado.` : "Aún no se han registrado ventas en este período."}</p></div><div className="report-period-total"><span>Ventas netas</span><strong>{formatCLP(monthTotal)}</strong></div><div className="stats-grid report-stats-grid"><StatCard label="Ventas" value={String(activeSales.length)} icon={ReceiptText} tone="blue" /><StatCard label="Unidades" value={String(monthUnits)} icon={Package} tone="amber" /><StatCard label="Ticket promedio" value={formatCLP(activeSales.length ? Math.round(monthTotal / activeSales.length) : 0)} icon={Banknote} tone="green" /></div></section>
      )}

      {canViewFullReports && activeSales.length === 0 && <EmptyState icon={BarChart3} title="Aún no hay ventas en este período" description="Cambia el mes seleccionado o registra una venta para ver tendencias, medios de pago y productos más vendidos." />}

      {canViewFullReports && activeSales.length > 0 && <section className="panel report-overview"><div className="section-heading"><div><span>ANÁLISIS DEL PERÍODO</span><h2>Evolución de ventas</h2><p>Cómo se distribuyeron las ventas durante {selectedMonthLabel}.</p></div><span>{dailyTotals.length} días con ventas</span></div><div className="daily-chart" aria-label="Ventas diarias">{dailyTotals.map(([day, total]) => <div className="daily-column" key={day}><strong>{formatCLP(total)}</strong><div><span style={{ height: `${Math.max(5, total / maxDaily * 100)}%` }}/></div><small>{day}</small></div>)}</div></section>}

      {canViewFullReports && activeSales.length > 0 && <div className="report-dashboard-grid"><section className="panel"><div className="section-heading"><div><h2>Medios de pago</h2><p>Cómo se pagaron las ventas del período.</p></div><span>{formatCLP(monthTotal)}</span></div><div className="horizontal-bars">{[...methodTotals.entries()].sort((a,b)=>b[1]-a[1]).map(([label,total]) => <div className="horizontal-bar" key={label}><span>{label}</span><div><i style={{ width: `${Math.max(4, total / Math.max(monthTotal,1) * 100)}%` }}/></div><strong>{formatCLP(total)}</strong></div>)}</div></section><section className="panel"><div className="section-heading"><div><h2>Ventas por vendedor</h2><p>Participación del equipo durante el período.</p></div><span>{sellerTotals.length}</span></div><div className="seller-breakdown">{sellerTotals.map(([sellerId,total]) => <div key={sellerId}><span>{users.find((item) => item.id === sellerId)?.name ?? "Usuario eliminado"}</span><strong>{formatCLP(total)}</strong></div>)}</div></section></div>}

      <section className="panel">
        <div className="section-heading">
          <div><span>OPERACIÓN ACTUAL</span><h2>Caja de hoy</h2><p>Movimientos del turno abierto, independientes del filtro mensual.</p></div>
          <span>{cashRegister.date}</span>
        </div>
        <div className="report-grid">
          <ReportMetric label="Efectivo" value={formatCLP(cashRegister.totalsByMethod.cash)} />
          <ReportMetric label="Tarjeta" value={formatCLP(cashRegister.totalsByMethod.card)} />
          <ReportMetric label="Transferencia" value={formatCLP(cashRegister.totalsByMethod.transfer)} />
          <ReportMetric label="Webpay" value={formatCLP(cashRegister.totalsByMethod.webpay)} />
          <ReportMetric label="Mercado Pago" value={formatCLP(cashRegister.totalsByMethod.mercadopago)} />
          <ReportMetric label="Fiado" value={formatCLP(cashRegister.creditTotal)} tone="warning" />
          <ReportMetric label="Total bruto" value={formatCLP(cashRegister.grossTotal)} />
          <ReportMetric label="Ticket promedio" value={formatCLP(cashRegister.averageTicket)} />
          <ReportMetric label="Anuladas" value={String(cashRegister.cancelledSalesCount)} />
        </div>
        <label className="field">
          Observación del cierre
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
          <div><span>HISTORIAL</span><h2>Últimos cierres</h2><p>Selecciona un cierre para revisar las ventas que incluyó.</p></div>
          <span>{cashClosures.length} registros</span>
        </div>
            <div className="list closure-list">
              {cashClosures.slice(0, 5).map((closure) => (
            <button className={selectedClosureId === closure.id ? "row report-history-row selected-row" : "row report-history-row"} type="button" key={closure.id} onClick={() => setSelectedClosureId(selectedClosureId === closure.id ? "" : closure.id)}>
              <div>
                <strong>{closure.date} - {formatCLP(closure.receivedTotal)}</strong>
                <p>
                  {closure.salesCount} ventas - cerrado {formatDateTime(closure.closedAt)}
                </p>
                {closure.note && <p>{closure.note}</p>}
              </div>
              <span className="amount report-row-amount">{closure.closedByName ?? "Localito"}</span>
            </button>
          ))}
          {cashClosures.length === 0 && <p className="empty-state">Aún no hay cierres registrados.</p>}
        </div>
        {selectedClosure && <div className="closure-detail"><div className="section-heading"><h3>Detalle del cierre {selectedClosure.date}</h3><span>{closureSales.length} ventas</span></div><div className="report-grid"><ReportMetric label="Total recibido" value={formatCLP(selectedClosure.receivedTotal)}/><ReportMetric label="Efectivo" value={formatCLP(selectedClosure.totalsByMethod.cash)}/><ReportMetric label="Fiado" value={formatCLP(selectedClosure.creditTotal)} tone="warning"/><ReportMetric label="Anuladas" value={String(selectedClosure.cancelledSalesCount)}/></div><div className="list">{closureSales.map((sale) => <div className="row" key={sale.id}><div><strong>Venta #{sale.id.slice(0,8)}</strong><p>{formatDateTime(sale.createdAt)} · {paymentMethodLabel(sale.paymentMethod)}</p></div><strong>{formatCLP(sale.total)}</strong></div>)}</div></div>}
      </section>

      {canViewFullReports && (
        <>
          {activeSales.length > 0 && <section className="panel">
            <div className="section-heading">
              <div><span>DESEMPEÑO DEL PERÍODO</span><h2>Productos más vendidos</h2></div>
              <span>Por monto</span>
            </div>
            <div className="bars">
              {topProducts.map((product) => {
                const value = product.amount;
                const max = Math.max(...topProducts.map((item) => item.amount), 1);
                return (
                  <div className="bar-row" key={product.name}>
                    <span>{product.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(8, (value / max) * 100)}%` }} />
                    </div>
                    <strong>{formatCLP(value)} · {product.units} u.</strong>
                  </div>
                );
              })}
            </div>
          </section>}

          <section className="panel">
            <div className="section-heading">
              <div><span>VISTA GENERAL</span><h2>Resumen operativo</h2></div>
              <span>{monthSales.length} ventas</span>
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
              <div><span>HISTORIAL DEL PERÍODO</span><h2>Ventas, anulaciones y devoluciones</h2></div>
              <span>{monthSales.length} registros</span>
            </div>
            <div className="list">
              {monthSales.slice(0, 20).map((sale) => (
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
                    <button className="secondary-action small danger-soft" type="button" onClick={() => openSaleAction(sale, "cancel")} disabled={sale.status === "cancelled"}>
                      <Trash2 size={16} />
                      <span>Anular</span>
                    </button>
                    <button className="secondary-action small" type="button" onClick={() => openSaleAction(sale, "return")} disabled={sale.status === "cancelled" || sale.status === "refunded"}>
                      <RefreshCw size={16} /><span>Devolver</span>
                    </button>
                  </div>
                </div>
              ))}
              {monthSales.length === 0 && <EmptyState icon={ReceiptText} title="No hay ventas ni anulaciones" description="Cuando registres movimientos en este mes, podrás revisarlos y gestionar anulaciones o devoluciones desde aquí." />}
            </div>
          </section>
        </>
      )}
      {saleAction && <div className="modal-backdrop" role="presentation" onClick={() => setSaleAction(null)}><section className="panel sale-action-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-action-title" onClick={(event) => event.stopPropagation()}><div className="section-heading"><h2 id="sale-action-title">{saleAction.type === "cancel" ? "Anular venta" : "Registrar devolución"}</h2><button className="icon-button" type="button" onClick={() => setSaleAction(null)} aria-label="Cerrar"><X size={17}/></button></div><p className="helper-text">Venta #{saleAction.sale.id.slice(0,8)} · {formatCLP(saleAction.sale.total)}</p>{saleAction.type === "return" && <div className="list return-items">{saleAction.sale.items.map((item) => <label className="form-field" key={item.productId}><span>{item.productName} · máximo {item.quantity}</span><input type="number" min="0" max={item.quantity} value={returnQuantities[item.productId] ?? 0} onChange={(event) => setReturnQuantities((current) => ({ ...current, [item.productId]: Number(event.target.value) }))}/></label>)}</div>}<label className="form-field"><span>Motivo obligatorio</span><textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Explica brevemente el motivo"/></label><div className="action-grid"><button className="secondary-action" type="button" onClick={() => setSaleAction(null)}>Volver</button><button className="primary-action" type="button" onClick={confirmSaleAction} disabled={!actionReason.trim() || isBusy}>{isBusy ? "Procesando..." : saleAction.type === "cancel" ? "Confirmar anulación" : "Confirmar devolución"}</button></div></section></div>}
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
          <p>{tenant?.address ?? "Dirección no registrada"}</p>
          <p>{tenant?.phone ?? "Teléfono no registrado"}</p>
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

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="action-empty-state">
      <div className="action-empty-state-icon"><Icon size={22} /></div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel && onAction && <button className="secondary-action small" type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function ContextHelp({ title, tips }: { title: string; tips: string[] }) {
  return (
    <details className="context-help">
      <summary><CircleHelp size={18} /><span>{title}</span></summary>
      <ul>{tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
    </details>
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
