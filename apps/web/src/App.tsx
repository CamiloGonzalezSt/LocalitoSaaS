import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
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
  Star,
  Pause,
  Play,
  Sun,
  TrendingUp,
  Trash2,
  Users,
  WalletCards,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type {
  BootstrapData,
  CashRegisterClosure,
  CashRegisterSummary,
  CashSession,
  DebtAccount,
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
import { api, flushOfflineQueue, OfflineQueuedError } from "./lib/api";
import { useSaleWorkspace, reconcileDraft } from "./useSaleWorkspace";
import type { SaleDraft } from "./useSaleWorkspace";
import type { AuthSession } from "./lib/api";
import { formatCLP, formatDateTime } from "./lib/format";
import { OperationsView } from "./OperationsView";
import { PlatformAdminView } from "./PlatformAdminView";
import { InventorySetupView } from "./InventorySetupView";
import { QuickSaleView } from "./QuickSaleView";
import { DashboardView } from "./DashboardView";
import { businessDay, matchesInventoryFilter, overdueDebts } from "./lib/dashboard";
import type { CustomerFilter, InventoryFilter } from "./lib/dashboard";
import type { PurchaseProposalLine } from "./lib/inventory";
import { suggestedReplenishment } from "./lib/inventory";
import { FormField, FormSurface } from "./FormControls";
import { InventoryRow } from "./InventoryRow";
import { CheckoutPayment } from "./CheckoutPayment";
import { ProductPhoto } from "./ProductPhoto";
import { SyncStatus } from "./SyncStatus";
import { syncScope } from "./lib/offline";
import { BusinessSettings } from "./BusinessSettings";
import { CustomerStatement } from "./ManagementPanels";
import { defaultBusinessPreferences } from "@localito/shared";
import { SearchView } from "./SearchView";
import { PlanView, SettingsView } from "./AccountViews";
import type { BusinessFormState, ProfileFormState, ThemePreference, UserFormState } from "./AccountViews";

type View = "dashboard" | "search" | "sale" | "scan" | "product_create" | "setup" | "invoice" | "products" | "customers" | "operations" | "reports" | "settings" | "plan" | "platform";

type NoticeTone = "success" | "warning" | "error";

type ProductFormState = {
  changeReason: string;
  imageUrl: string;
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

type CriticalActionState = {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
};

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
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
  changeReason: "",
  imageUrl: "",
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

function CatalogProductImage({ product }: { product: Product }) {
  const source = productImageUrl(product);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return failedSource === source
    ? <span className="product-image-fallback" aria-hidden="true"><Package size={28}/></span>
    : <img src={source} alt="" aria-hidden="true" loading="lazy" decoding="async" width={512} height={512} onError={() => setFailedSource(source)}/>;
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
  const [cashSession, setCashSession] = useState<CashSession>();
  const [debts, setDebts] = useState<DebtAccount[]>([]);
  const [purchaseProposal, setPurchaseProposal] = useState<PurchaseProposalLine[]>([]);
  const [inventoryEntryFilter, setInventoryEntryFilter] = useState<InventoryFilter>("all");
  const [customerEntryFilter, setCustomerEntryFilter] = useState<CustomerFilter>("clients");
  const [cashClosures, setCashClosures] = useState<CashRegisterClosure[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [theme, setTheme] = useState<ThemePreference>("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileActionsRef = useRef<HTMLDivElement>(null);
  const saleWorkspace = useSaleWorkspace(tenant?.id, currentUser?.id);
  const { active: saleDraft, setTicket, setPaymentMethod, setCustomerId: setSelectedCustomerId } = saleWorkspace;
  const { items: ticket, paymentMethod, customerId: selectedCustomerId } = saleDraft;
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);
  const [lastReceivedCash, setLastReceivedCash] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>(null);
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
  const [criticalAction, setCriticalAction] = useState<CriticalActionState | null>(null);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock),
    [products]
  );

  const ticketTotal = useMemo(() => ticket.reduce((sum, item) => sum + item.subtotal, 0), [ticket]);
  const activeSales = useMemo(() => sales.filter((sale) => sale.status !== "cancelled"), [sales]);
  const cancelledSales = useMemo(() => sales.filter((sale) => sale.status === "cancelled"), [sales]);
  const isOwner = isOwnerUser(currentUser);
  const isSystemAdmin = isSystemAdminUser(currentUser);
  const canOperate = !subscription || subscriptionCanMutate(subscription);
  const compactPlanName = subscription ? LOCALITO_PLANS[subscription.plan].name.replace("Localito ", "") : "";
  const compactPlanStatus = subscription
    ? effectiveSubscriptionStatus(subscription) === "trialing"
      ? `${subscriptionDaysRemaining(subscription)} días de prueba`
      : subscription.status === "active" ? "Activo" : "Revisar"
    : "";
  const visibleNavItems: NavItem[] = isSystemAdmin
    ? [{ id: "platform", label: "Locales y usuarios", icon: Store }]
    : navItems
        .filter((item) => isOwner || ["search", "sale", "products", "customers", "operations"].includes(item.id))
        .filter((item) => item.id !== "customers" || !subscription || hasEntitlement(subscription, "customers"))
        .filter((item) => item.id !== "reports" || !subscription || hasEntitlement(subscription, "advancedReports"));
  const mobilePrimaryIds: View[] = isOwner
    ? ["dashboard", "sale", "products", "customers", "operations"]
    : ["sale", "products", "customers", "operations"];
  const mobileNavItems = isSystemAdmin ? [] : visibleNavItems.filter((item) => mobilePrimaryIds.includes(item.id));

  function navigateTo(view: View) {
    setInventoryEntryFilter("all");
    setCustomerEntryFilter("clients");
    if (view !== activeView) setPreviousView(activeView);
    setMobileMenuOpen(false);
    setActiveView(view);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function openGlobalSearch() {
    setMobileMenuOpen(false);
    navigateTo("search");
  }

  function selectGlobalProduct(product: Product) {
    setSearchTerm(product.name);
    navigateTo("sale");
  }

  function selectGlobalCustomer(_customer?: Customer) {
    navigateTo("customers");
  }

  function requestCriticalAction(title: string, description: string, confirmLabel: string, action: () => Promise<void>) {
    setCriticalAction({ title, description, confirmLabel, action });
  }

  async function confirmCriticalAction() {
    if (!criticalAction) return;
    const action = criticalAction.action;
    setCriticalAction(null);
    await action();
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
    const scopeKey = syncScope()?.key;
    try {
      if (sessionUser?.role === "system_admin") {
        setActiveView("platform");
        if (message) setNotice({ message, tone: "success" });
        return;
      }
      const syncResult = await flushOfflineQueue();
      const response = await api.bootstrap();
      if (syncScope()?.key !== scopeKey) return;
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
    setCashSession(data.cashSession);
    setDebts(data.debts ?? []);
    setCashClosures(data.cashClosures);
    setSummary(data.summary);
    setSubscription(data.subscription);
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
      setIsLoading(false);
      return;
    }

    try {
      const restored = JSON.parse(storedSession) as AuthSession;
      saveSession(restored);
      if (restored.user.role === "seller") setActiveView("sale");
      void loadWorkspace(undefined, restored.user);
    } catch {
      localStorage.removeItem("localito-session");
      localStorage.removeItem("localito-token");
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
    }, notice.tone === "error" ? 6_000 : notice.tone === "warning" ? 4_200 : 3_000);

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
    setLastReceipt(null);
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
    setNotice(null);
  }

  function addToTicket(product: Product) {
    if (isBusy) return;
    setLastReceipt(null);
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

  async function confirmSale(options?: { receivedCash?: number; discount?: number; notes?: string; payments?: Array<{ method: Exclude<PaymentMethod, "mixed">; amount: number }> }) {
    const scopeKey = syncScope()?.key;
    if (isBusy) return;
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
        idempotencyKey: saleDraft.id,
        paymentMethod,
        customerId: paymentMethod === "credit" || options?.payments?.some((payment) => payment.method === "credit") ? selectedCustomerId : undefined,
        discount: options?.discount,
        notes: options?.notes,
        payments: options?.payments,
        items: ticket.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      });
      if (syncScope()?.key !== scopeKey) return;
      setLastReceipt(saleResponse.data);
      setLastReceivedCash(options?.receivedCash);

      setNotice({
        message: `Venta registrada por ${formatCLP(saleResponse.data.total)}.`,
        tone: "success"
      });

      saleWorkspace.reset();
      await loadWorkspace();
    } catch (error) {
      if (syncScope()?.key !== scopeKey) return;
      if (error instanceof OfflineQueuedError) {
        setProducts(current => current.map(product => product.trackStock === false ? product : { ...product, stock: Math.max(0, product.stock - ticket.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0)) }));
        setLastReceipt(null);
        saleWorkspace.reset();
      }
      setNotice({ message: error instanceof Error ? error.message : "No se pudo registrar la venta.", tone: error instanceof OfflineQueuedError ? "warning" : "error" });
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

  function requestCloseCashRegister() {
    requestCriticalAction(
      "Registrar cierre de caja",
      `Se guardará el período actual con un total recibido de ${formatCLP(cashRegister.receivedTotal)}. El panel comenzará desde cero y las próximas ventas abrirán un nuevo período.`,
      "Confirmar cierre",
      closeCashRegister
    );
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
        reason: productForm.changeReason.trim() || undefined,
        imageUrl: productForm.imageUrl,
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
      changeReason: "",
      imageUrl: product.imageUrl ?? "",
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

  function requestDeactivateProduct(product: Product) {
    requestCriticalAction(
      "Desactivar producto",
      `${product.name} dejará de aparecer para vender y en el inventario activo. Su historial se conserva.`,
      "Sí, desactivar producto",
      () => deactivateProduct(product)
    );
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

  async function bulkAdjustStock(productsToAdjust: Product[], delta: number) {
    if (!isOwner || !productsToAdjust.length) return;
    setIsBusy(true);
    try {
      await Promise.all(productsToAdjust.map(product => api.updateStock(product.id, Math.max(0, product.stock + delta))));
      await loadWorkspace(`${productsToAdjust.length} productos actualizados.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo actualizar el stock seleccionado.", tone: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  async function quickUpdateProduct(product: Product, salePrice: number, stock: number) {
    if (!isOwner || !canOperate) throw new Error("No tienes permiso para guardar cambios.");
    setIsBusy(true);
    try {
      const results = await Promise.allSettled([
        salePrice !== product.salePrice ? api.updateProduct(product.id, { salePrice }) : Promise.resolve(),
        stock !== product.stock ? api.updateStock(product.id, Math.max(0, stock)) : Promise.resolve()
      ]);
      const failure = results.find(result => result.status === "rejected");
      if (failure?.status === "rejected") {
        await loadWorkspace();
        throw failure.reason;
      }
      await loadWorkspace(`${product.name} actualizado.`);
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

  function requestDeactivateCustomer(customer: Customer) {
    requestCriticalAction(
      "Desactivar cliente",
      `${customer.name} dejará de estar disponible para nuevos fiados. Sus abonos e historial se conservan.`,
      "Sí, desactivar cliente",
      () => deactivateCustomer(customer)
    );
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

  async function deleteManagedUserNow(user: User) {
    if (!isOwner) return;
    setIsBusy(true);
    try {
      await api.deleteUser(user.id);
      await loadWorkspace(`${user.name} fue eliminado definitivamente.`);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "No se pudo eliminar el usuario.", tone: "error" });
    } finally { setIsBusy(false); }
  }

  function deleteManagedUser(user: User) {
    if (!isOwner) return;
    requestCriticalAction(
      "Eliminar acceso de usuario",
      `Eliminarás definitivamente el acceso de ${user.name}. Esta acción no se puede deshacer.`,
      "Eliminar usuario",
      () => deleteManagedUserNow(user)
    );
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
        onDismissNotice={() => setNotice(null)}
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
          {!isSystemAdmin && <button className="icon-button" type="button" onClick={openGlobalSearch} aria-label="Buscar en el negocio"><Search size={20} /></button>}
          {isOwner && subscription && <button className="topbar-plan-button" type="button" onClick={() => navigateTo("plan")} aria-label={`Mi plan: ${compactPlanName}, ${compactPlanStatus}`}><CreditCard size={17}/><span><strong>{compactPlanName}</strong><small>{compactPlanStatus}</small></span></button>}
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
          {!isSystemAdmin && <button className="icon-button mobile-search-button" type="button" onClick={openGlobalSearch} aria-label="Buscar en el negocio"><Search size={19}/></button>}
          {!isSystemAdmin && <button className="icon-button mobile-theme-button" type="button" role="switch" aria-checked={theme === "dark"} onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>{theme === "dark" ? <Sun size={19}/> : <Moon size={19}/>}</button>}
          <div className="mobile-actions-wrap" ref={mobileActionsRef}>
            <button className="icon-button mobile-menu-trigger" type="button" aria-label="Abrir acciones" aria-haspopup="menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><EllipsisVertical size={21}/></button>
            {mobileMenuOpen && <div className="mobile-actions-menu" role="menu">
              {isOwner && subscription && <button className="mobile-plan-menu-item" type="button" role="menuitem" onClick={() => navigateTo("plan")}><CreditCard size={18}/><span><strong>Mi plan · {compactPlanName}</strong><small>{compactPlanStatus}</small></span></button>}
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
        {!isSystemAdmin && <SyncStatus key={`${tenant?.id}:${currentUser.id}`} onSynced={() => loadWorkspace("Ventas pendientes sincronizadas.")} />}
        {notice && <NoticeToast notice={notice} onDismiss={() => setNotice(null)} />}

        {!isSystemAdmin && subscription && !subscriptionCanMutate(subscription) && <section className="subscription-lock-banner"><AlertTriangle size={18}/><span>Tu suscripción no está activa. Puedes revisar toda tu información, pero las acciones están pausadas.</span>{isOwner && <button className="secondary-action small" type="button" onClick={() => navigateTo("plan")}>Elegir plan</button>}</section>}

        {isLoading && <p className="empty-state">Conectando con la API de Localito...</p>}

        {!isLoading && activeView === "platform" && isSystemAdmin && <PlatformAdminView />}

        {!isLoading && activeView === "dashboard" && (
          <DashboardView
            businessName={tenant?.name ?? "Localito"}
            userName={currentUser.name}
            products={products}
            summary={summary}
            sales={activeSales}
            cashRegister={cashRegister}
            cashSession={cashSession}
            debts={debts}
            canOperate={canOperate}
            canViewCustomers={!subscription || hasEntitlement(subscription, "customers")}
            onStartSale={() => navigateTo("sale")}
            onAddProduct={() => navigateTo("product_create")}
            onOpenCash={() => navigateTo("operations")}
            onOpenStock={(filter) => { navigateTo("products"); setSearchTerm(""); setInventoryEntryFilter(filter); }}
            onOpenCustomers={(filter) => { navigateTo("customers"); setCustomerEntryFilter(filter); }}
          />
        )}

        {!isLoading && activeView === "search" && (
          <SearchView
            products={products}
            customers={customers}
            sales={sales}
            users={users}
            canViewBusinessRecords={isOwner}
            onProduct={selectGlobalProduct}
            onCustomer={selectGlobalCustomer}
          />
        )}

        {!isLoading && activeView === "sale" && (
          <SaleView
            workspace={saleWorkspace}
            onResume={(draft) => {
              const result = reconcileDraft(draft, products);
              if (result.draft.customerId && !customers.some(customer => customer.id === result.draft.customerId && customer.active !== false)) {
                result.draft.customerId = "";
                result.changes.push("Selecciona nuevamente el cliente");
              }
              saleWorkspace.resume(draft.id, result.draft);
              setNotice({ message: result.changes.length ? `Venta retomada. ${result.changes.join(". ")}.` : "Venta retomada. El ticket anterior quedó en espera si tenía productos.", tone: result.changes.length ? "warning" : "success" });
            }}
            onDiscard={(id) => requestCriticalAction("Descartar venta en espera", "Se eliminará este ticket guardado. Esta acción no registra una venta ni modifica el stock.", "Descartar", async () => { saleWorkspace.discard(id); })}
            products={products}
            sales={activeSales}
            ticket={ticket}
            ticketTotal={ticketTotal}
            paymentMethod={paymentMethod}
            paymentOptions={(tenant?.preferences ?? defaultBusinessPreferences).paymentMethods.map(id => paymentOptions.find(option => option.id === id)!).filter(option => option && (option.id !== "credit" || !subscription || hasEntitlement(subscription, "credit")))}
            bank={(tenant?.preferences ?? defaultBusinessPreferences).bank}
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
            onScan={() => !canOperate || (subscription && !hasEntitlement(subscription, "aiPhotoSale")) ? navigateTo("plan") : navigateTo("scan")}
            lastReceipt={lastReceipt}
            lastReceivedCash={lastReceivedCash}
            onNewSale={() => setLastReceipt(null)}
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
            onDeactivate={requestDeactivateProduct}
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
          <div className="stack"><header className="inventory-actions ui-work-toolbar"><div><h2>Catálogo del local</h2><span>{products.length} productos activos</span></div><div className="ui-toolbar-actions">{isOwner && canOperate && <><button className="primary-action" type="button" onClick={() => navigateTo("product_create")}><Plus size={18}/> Agregar producto</button><button className="secondary-action" type="button" onClick={() => navigateTo("setup")}><ListPlus size={18}/> Cargar varios</button>{(!subscription || hasEntitlement(subscription, "purchases")) && <button className="secondary-action" type="button" onClick={() => navigateTo("invoice")}><ReceiptText size={18}/> Ingresar factura</button>}</>}</div></header><ProductsView
            mode="stock"
            initialFilter={inventoryEntryFilter}
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
            onDeactivate={requestDeactivateProduct}
            onAdjustStock={(product, delta) => void adjustStock(product, delta)}
            onBulkAdjustStock={(selected, delta) => void bulkAdjustStock(selected, delta)}
            onQuickUpdate={quickUpdateProduct}
            onOpenPurchases={(lines) => { setPurchaseProposal(lines); navigateTo("operations"); }}
          /></div>
        )}

        {!isLoading && activeView === "customers" && (
          <CustomersView
            initialFilter={customerEntryFilter}
            debts={debts}
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
            onDeactivate={requestDeactivateCustomer}
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
            tenantId={tenant?.id ?? "local"}
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
            onCloseCashRegister={requestCloseCashRegister}
            onCancelSale={(sale, reason) => void cancelSale(sale, reason)}
            onReturnSale={(sale, items, reason) => void returnSale(sale, items, reason)}
          />
        )}

        {!isLoading && activeView === "operations" && (
          <OperationsView products={products} sales={sales} preferences={tenant?.preferences} purchaseProposal={purchaseProposal} onPurchaseProposalConsumed={() => setPurchaseProposal([])} canManage={isOwner && canOperate && (!subscription || hasEntitlement(subscription, "purchases"))} onRefresh={() => loadWorkspace()} />
        )}

        {!isLoading && activeView === "invoice" && isOwner && (
          <OperationsView mode="invoice" products={products} canManage={canOperate && (!subscription || hasEntitlement(subscription, "purchases"))} onRefresh={() => loadWorkspace()} />
        )}

        {!isLoading && activeView === "settings" && (
          <>{tenant && isOwner && canOperate && <BusinessSettings key={tenant.id} tenant={tenant} onSaved={updated => { setTenant(updated); }} />}<SettingsView
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
          /></>
        )}

        {!isLoading && activeView === "plan" && isOwner && subscription && <PlanView subscription={subscription} isBusy={isBusy} onSelect={(plan, provider) => void changePlan(plan, provider)} />}
      </main>

      {criticalAction && <CriticalActionDialog action={criticalAction} isBusy={isBusy} onCancel={() => setCriticalAction(null)} onConfirm={() => void confirmCriticalAction()} />}
      <ReceiptPrintArea sale={lastReceipt} tenant={tenant} user={currentUser} customers={customers} />

    </div>
  );
}

function viewTitle(view: View, isOwner: boolean, isSystemAdmin: boolean) {
  const labels: Record<View, string> = {
    dashboard: "Panel del día",
    search: "Buscar",
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

function CriticalActionDialog({ action, isBusy, onCancel, onConfirm }: { action: CriticalActionState; isBusy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={isBusy ? undefined : onCancel}><section className="panel critical-action-dialog" role="dialog" aria-modal="true" aria-labelledby="critical-action-title" onClick={(event) => event.stopPropagation()}><AlertTriangle size={25}/><div><span>CONFIRMACIÓN REQUERIDA</span><h2 id="critical-action-title">{action.title}</h2><p>{action.description}</p></div><div className="action-grid"><button className="secondary-action" type="button" onClick={onCancel} disabled={isBusy}>Volver</button><button className="primary-action danger-action" type="button" onClick={onConfirm} disabled={isBusy}>{isBusy ? "Procesando..." : action.confirmLabel}</button></div></section></div>;
}

function NoticeToast({ notice, onDismiss }: { notice: NoticeState; onDismiss: () => void }) {
  return <section className={`notice app-snackbar ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"} aria-atomic="true">
    {notice.tone === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
    <span>{notice.message}</span>
    <button className="notice-dismiss" type="button" onClick={onDismiss} aria-label="Cerrar aviso"><X size={16}/></button>
  </section>;
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
  onDismissNotice,
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
  onDismissNotice: () => void;
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

        {notice && <NoticeToast notice={notice} onDismiss={onDismissNotice} />}

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
  workspace,
  onResume,
  onDiscard,
  products,
  sales,
  ticket,
  ticketTotal,
  paymentMethod,
  paymentOptions,
  bank,
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
  lastReceivedCash,
  onNewSale,
  onPrintReceipt,
  onShareReceipt
}: {
  workspace: ReturnType<typeof useSaleWorkspace>;
  onResume: (draft: SaleDraft) => void;
  onDiscard: (id: string) => void;
  products: Product[];
  sales: Sale[];
  ticket: SaleItem[];
  ticketTotal: number;
  paymentMethod: PaymentMethod;
  paymentOptions: Array<{ id: PaymentMethod; label: string; icon: LucideIcon }>;
  bank: import("@localito/shared").BusinessPreferences["bank"];
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
  onConfirm: (options?: { receivedCash?: number; discount?: number; notes?: string; payments?: Array<{ method: Exclude<PaymentMethod, "mixed">; amount: number }> }) => void;
  onScan: () => void;
  lastReceipt: Sale | null;
  lastReceivedCash?: number;
  onNewSale: () => void;
  onPrintReceipt: () => void;
  onShareReceipt: () => void;
}) {
  const { discount, notes, cashPart } = workspace.active;
  const { setDiscount, setNotes, setCashPart } = workspace;
  const [mobileTicketOpen, setMobileTicketOpen] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(60);
  const [isChoosingPayment, setIsChoosingPayment] = useState(false);
  const [externalPaymentConfirmed, setExternalPaymentConfirmed] = useState(false);
  const [receivedCash, setReceivedCash] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [featuredMode, setFeaturedMode] = useState<"popular" | "recent" | "favorites">("favorites");
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
    if (featuredMode === "favorites") return workspace.favorites.map(id => productsById.get(id)).filter((product): product is Product => Boolean(product && product.active !== false));
    if (featuredMode === "popular") {
      const quantities = new Map<string, number>();
      sales.forEach((sale) => sale.items.forEach((item) => quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)));
      return [...quantities.entries()].sort((a, b) => b[1] - a[1]).map(([productId]) => productsById.get(productId)).filter((product): product is Product => Boolean(product)).slice(0, 6);
    }

    const recentIds = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).flatMap((sale) => sale.items.map((item) => item.productId));
    return [...new Set(recentIds)].map((productId) => productsById.get(productId)).filter((product): product is Product => Boolean(product)).slice(0, 6);
  }, [featuredMode, products, sales, workspace.favorites]);
  const selectedCategoryLabel = selectedCategory === "all" ? "Todos" : categoryOptions.find((category) => category.id === selectedCategory)?.label ?? "Todos";
  const visibleProducts = categoryProducts.slice(0, visibleCount);
  const discountedTotal = Math.max(0, ticketTotal - numberFromInput(discount));
  const cardPart = Math.max(0, discountedTotal - numberFromInput(cashPart));
  const invalidCash = paymentMethod === "cash" && (receivedCash.trim() === "" || !Number.isSafeInteger(Number(receivedCash)) || Number(receivedCash) < discountedTotal);
  const unavailableMethod = !paymentOptions.some(option => option.id === paymentMethod);
  const isExternalPayment = ["card", "transfer", "webpay", "mercadopago"].includes(paymentMethod) || (paymentMethod === "mixed" && cardPart > 0);
  const invalidAmounts = !Number.isSafeInteger(Number(discount)) || Number(discount) < 0 || Number(discount) > ticketTotal || (isChoosingPayment && paymentMethod === "mixed" && (!Number.isSafeInteger(Number(cashPart)) || Number(cashPart) <= 0 || Number(cashPart) >= discountedTotal));

  useEffect(() => { setVisibleCount(60); }, [searchTerm, selectedCategory]);
  useEffect(() => { setIsChoosingPayment(false); setExternalPaymentConfirmed(false); setReceivedCash(""); setReviewMessage(""); }, [workspace.active.id]);
  useEffect(() => { setReceivedCash(""); }, [paymentMethod]);
  useEffect(() => { setExternalPaymentConfirmed(false); }, [ticket, discount, cashPart, paymentMethod]);

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
    if (isBusy || !canSell || unavailableMethod || invalidAmounts || invalidCash || !ticket.length || (paymentMethod === "credit" && !selectedCustomerId) || (isExternalPayment && !externalPaymentConfirmed)) return;
    const result = reconcileDraft(workspace.active, products);
    if (result.changes.length) {
      workspace.replaceActive(result.draft);
      setExternalPaymentConfirmed(false);
      setReviewMessage(`${result.changes.join(". ")}. Revisa el ticket antes de confirmar.`);
      return;
    }
    const payments = paymentMethod === "mixed" ? [{ method: "cash" as const, amount: numberFromInput(cashPart) }, { method: "card" as const, amount: cardPart }].filter((payment) => payment.amount > 0) : undefined;
    onConfirm({ receivedCash: paymentMethod === "cash" ? Number(receivedCash) : undefined, discount: numberFromInput(discount), notes: notes.trim() || undefined, payments });
  }

  function scrollToTicket() {
    setMobileTicketOpen(true);
  }

  function openMobileCheckout() {
    setIsChoosingPayment(true);
    setExternalPaymentConfirmed(false);
    setMobileTicketOpen(true);
  }

  return (
    <div className="workspace-grid sale-workspace">
      <div className="sale-session-tools">
        <button className="secondary-action" type="button" onClick={() => { workspace.hold(); setMobileTicketOpen(false); }} disabled={!ticket.length || isBusy || !canSell}><Pause size={18}/> Dejar en espera</button>
        <button className="secondary-action" type="button" aria-expanded={showHeld} onClick={() => setShowHeld(value => !value)}><ReceiptText size={18}/> En espera ({workspace.held.length})</button>
        {workspace.storageError && <p className="sale-storage-error" role="alert">{workspace.storageError}</p>}
        {showHeld && <div className="held-sales-list">
          {!workspace.held.length && <p className="empty-state">No hay ventas en espera.</p>}
          {workspace.held.map(draft => <div className="held-sale" key={draft.id}>
            <div><strong>{customers.find(customer => customer.id === draft.customerId)?.name || draft.items[0]?.productName || "Venta en espera"}</strong><small>{formatDateTime(draft.savedAt)} · {draft.items.reduce((sum, item) => sum + item.quantity, 0)} unidades</small>{draft.notes && <small>{draft.notes}</small>}</div>
            <strong>{formatCLP(Math.max(0, draft.items.reduce((sum, item) => sum + item.subtotal, 0) - numberFromInput(draft.discount)))}</strong>
            <button className="secondary-action small" type="button" onClick={() => { onResume(draft); setShowHeld(false); }} disabled={isBusy || !canSell}><Play size={16}/> Retomar</button>
            <button className="icon-button danger" type="button" aria-label="Descartar venta en espera" title="Descartar venta en espera" onClick={() => onDiscard(draft.id)} disabled={isBusy || !canSell}><Trash2 size={17}/></button>
          </div>)}
        </div>}
      </div>
      <section className="panel sale-products-panel" id="sale-product-picker">
        <div className="section-heading compact-heading">
          <div className="flow-title"><span>1</span><h2>Elige productos</h2></div>
          <span>{categoryProducts.length} disponibles</span>
        </div>
        <div className="sale-catalog-tools"><div className="search-box">
          <Search size={18} />
          <input aria-label="Buscar producto, marca o código" value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar producto, marca o código" />
        </div><button className="icon-button" type="button" aria-label="Venta Rápida con foto" title="Venta Rápida con foto" onClick={onScan} disabled={!canSell}><Camera size={20}/></button></div>
        {!searchTerm.trim() && <section className="sale-featured-products" aria-label="Productos frecuentes">
          <div className="sale-featured-heading"><strong>Accesos rápidos</strong><div role="group" aria-label="Tipo de productos frecuentes"><button className={featuredMode === "favorites" ? "active" : ""} type="button" aria-pressed={featuredMode === "favorites"} onClick={() => setFeaturedMode("favorites")}><Star size={14}/> Favoritos</button><button className={featuredMode === "popular" ? "active" : ""} type="button" aria-pressed={featuredMode === "popular"} onClick={() => setFeaturedMode("popular")}><TrendingUp size={14}/> Más vendidos</button><button className={featuredMode === "recent" ? "active" : ""} type="button" aria-pressed={featuredMode === "recent"} onClick={() => setFeaturedMode("recent")}>Recientes</button></div></div>
          {!featuredProducts.length && <p className="empty-state">{featuredMode === "favorites" ? "Aún no hay favoritos." : "Aún no hay ventas registradas."}</p>}
          <div className="sale-featured-list">
            {featuredProducts.map((product) => <button className="sale-featured-product" type="button" key={product.id} title={product.name} onClick={() => onAdd(product)} disabled={!canSell}><CatalogProductImage product={product}/><span><strong>{product.name}</strong><small>{formatCLP(product.salePrice)}</small></span></button>)}
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
        <div className="list product-list">
          {visibleProducts.map((product) => (
            <div className="sale-product-entry" key={product.id}><button className="product-button" type="button" onClick={() => onAdd(product)} disabled={!canSell || isBusy || (product.trackStock !== false && product.stock <= 0)}>
              <span className="product-thumb">
                <CatalogProductImage product={product}/>
              </span>
              <div className="product-button-copy">
                <strong title={product.name}>{product.name}</strong>
                <p className="product-category" title={product.category}>{product.category}</p>
                <p className="product-availability" data-low={product.trackStock !== false && product.stock <= product.minimumStock}>{product.trackStock === false ? "Disponible" : product.stock <= 0 ? "Agotado" : `Stock ${product.stock}`}</p>
              </div>
              <span className="product-price">{formatCLP(product.salePrice)}</span>
            </button><button className="icon-button sale-favorite" type="button" aria-label={`${workspace.favorites.includes(product.id) ? "Quitar de" : "Agregar a"} favoritos: ${product.name}`} title={workspace.favorites.includes(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"} aria-pressed={workspace.favorites.includes(product.id)} onClick={() => workspace.toggleFavorite(product.id)}><Star size={19} fill={workspace.favorites.includes(product.id) ? "currentColor" : "none"}/></button></div>
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
            <button className="secondary-action full" type="button" onClick={() => setVisibleCount(value => value + 60)}><Plus size={18}/> Mostrar más ({visibleProducts.length} de {categoryProducts.length})</button>
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

      <SaleTicketSurface open={mobileTicketOpen} onClose={() => setMobileTicketOpen(false)} isBusy={isBusy}>
        {reviewMessage && <p role="alert" className="sale-storage-error">{reviewMessage}</p>}
        {(ticket.length > 0 || !lastReceipt) && <>
        <div className="section-heading">
          <div className="flow-title"><span>{isChoosingPayment ? "3" : "2"}</span><h2>{isChoosingPayment ? "Cobrar venta" : "Revisa el ticket"}</h2></div>
          <span>{ticket.length} items</span>
        </div>
        <div className={isChoosingPayment ? "list ticket-list checkout-ticket-summary" : "list ticket-list"}>
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
                {!isChoosingPayment && <><button className="icon-button" type="button" onClick={() => { const product = products.find((entry) => entry.id === item.productId); if (product) onAdd(product); }} aria-label="Agregar uno" disabled={!canSell || isBusy}>
                  <Plus size={17} />
                </button>
                <button className="icon-button danger" type="button" onClick={() => onRemoveOne(item.productId)} aria-label="Quitar uno" disabled={!canSell || isBusy}>
                  <Minus size={17} />
                </button></>}
              </div>
            </div>
          ))}
          {ticket.length === 0 && <EmptyState icon={ShoppingCart} title="Tu ticket está vacío" description="" actionLabel="Elegir productos" onAction={() => { setMobileTicketOpen(false); document.querySelector<HTMLInputElement>(".sale-products-panel .search-box input")?.focus(); }} />}
        </div>

        <div className="ticket-total checkout-total"><span>Total a {paymentMethod === "credit" && isChoosingPayment ? "fiar" : "cobrar"}</span><strong>{formatCLP(discountedTotal)}</strong></div>
        {isChoosingPayment && <div className="checkout-payment-body">
        <CheckoutPayment value={paymentMethod} allowed={paymentOptions.map(option => option.id)} disabled={isBusy || !canSell}
          onChange={method => { onPaymentMethod(method); setExternalPaymentConfirmed(false); }}/>
        {paymentMethod === "transfer" && <div className="bank-details"><strong>Transferencia al local</strong>{bank.accountNumber ? <dl>{Object.entries({ Banco: bank.name, Titular: bank.holder, RUT: bank.taxId, Cuenta: `${bank.accountType} ${bank.accountNumber}`, Correo: bank.email }).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p>Datos bancarios aún no configurados.</p>}</div>}
        {unavailableMethod && <p role="alert" className="sale-storage-error">Selecciona un medio de pago disponible.</p>}
        {paymentMethod === "cash" && <div className="checkout-cash">
          <label className="field">Efectivo recibido<input type="number" min={discountedTotal} step="1" inputMode="numeric" value={receivedCash}
            aria-invalid={receivedCash !== "" && invalidCash} aria-describedby="checkout-cash-status" disabled={isBusy}
            onChange={event => setReceivedCash(event.target.value)} placeholder="0"/></label>
          <div className="checkout-cash-presets" role="group" aria-label="Montos de efectivo">
            {[discountedTotal, ...[1000, 2000, 5000, 10000, 20000].filter(amount => amount > discountedTotal).slice(0, 2)].map((amount, index) =>
              <button className="secondary-action small" type="button" key={amount} disabled={isBusy} onClick={() => setReceivedCash(String(amount))}>{index === 0 ? "Monto exacto" : formatCLP(amount)}</button>)}
          </div>
          <div className="checkout-change" id="checkout-cash-status" data-insufficient={receivedCash !== "" && Number(receivedCash) < discountedTotal} aria-live="polite"><span>{receivedCash !== "" && Number(receivedCash) < discountedTotal ? "Faltan" : "Vuelto"}</span>
            <strong>{receivedCash === "" || !Number.isFinite(Number(receivedCash)) ? "—" : formatCLP(Math.abs(Number(receivedCash) - discountedTotal))}</strong></div>
          {receivedCash !== "" && invalidCash && <p className="sale-storage-error" role="alert">Ingresa pesos enteros que cubran el total.</p>}
        </div>}

        {paymentMethod === "credit" && (
          <label className="field">
            Cliente para fiado
            <select value={selectedCustomerId} disabled={isBusy} onChange={(event) => onCustomer(event.target.value)}>
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option value={customer.id} key={customer.id}>
                  {customer.name} - deuda {formatCLP(customer.debtBalance)}
                </option>
              ))}
            </select>
          </label>
        )}

        {paymentMethod === "credit" && <p className="checkout-credit-status">{selectedCustomerId ? "Se registrará una deuda a nombre del cliente." : "Selecciona un cliente para continuar."}</p>}
        {paymentMethod === "mixed" && <div className="checkout-split"><label className="field">Parte en efectivo<input type="number" min="0" max={discountedTotal} step="1" disabled={isBusy} value={cashPart} onChange={(event) => setCashPart(event.target.value)} inputMode="numeric" placeholder="0" /></label><div className="checkout-change"><span>Parte en tarjeta</span><strong>{formatCLP(cardPart)}</strong></div></div>}
        {isExternalPayment && <label className="external-payment-confirm checkout-verification"><input type="checkbox" disabled={isBusy} checked={externalPaymentConfirmed} onChange={(event) => setExternalPaymentConfirmed(event.target.checked)}/><span><strong>{paymentMethod === "transfer" ? "Confirmo que recibí la transferencia" : "Confirmo que el pago fue aprobado"}</strong><small>{paymentMethod === "transfer" ? "Recepción verificada en la cuenta del local." : "Aprobación verificada en el terminal o proveedor externo."}</small></span></label>}
        </div>}

        {!isChoosingPayment && <div className="form-grid"><label className="field">Descuento<input type="number" min="0" max={ticketTotal} step="1" disabled={isBusy} value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="numeric" placeholder="0" /></label><label className="field">Nota de venta<input disabled={isBusy} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pedido, encargo u observación" /></label></div>}
        {isChoosingPayment && (numberFromInput(discount) > 0 || notes.trim()) && <div className="checkout-meta">{numberFromInput(discount) > 0 && <span>Descuento: {formatCLP(numberFromInput(discount))}</span>}{notes.trim() && <span>{notes}</span>}</div>}

        {invalidAmounts && <p role="alert" className="sale-storage-error">Revisa los montos en pesos enteros. El descuento no puede superar el subtotal; en pago mixto ambas partes deben ser mayores que cero.</p>}
        {!isChoosingPayment ? <button className="primary-action full" type="button" onClick={() => setIsChoosingPayment(true)} disabled={isBusy || !canSell || ticket.length === 0 || invalidAmounts}>
          <CheckCircle2 size={20} />
          <span>{`Cobrar ${formatCLP(discountedTotal)}`}</span>
        </button> : <div className="stack compact-stack checkout-submit"><button className="primary-action full" type="button" onClick={submitSale} disabled={isBusy || !canSell || unavailableMethod || !ticket.length || invalidAmounts || invalidCash || (paymentMethod === "credit" && !selectedCustomerId) || (isExternalPayment && !externalPaymentConfirmed)}><CheckCircle2 size={20}/><span>{isBusy ? "Registrando..." : paymentMethod === "credit" ? "Registrar fiado" : "Confirmar cobro"}</span></button><button className="secondary-action full" type="button" disabled={isBusy} onClick={() => { setIsChoosingPayment(false); setExternalPaymentConfirmed(false); }}><ArrowLeft size={17}/>Volver al ticket</button></div>}
        {ticket.length > 0 && !isChoosingPayment && <button className="secondary-action full" type="button" disabled={isBusy || !canSell} onClick={() => { workspace.hold(); setMobileTicketOpen(false); }}><Pause size={18}/> Dejar en espera</button>}
        </>}
        {lastReceipt && ticket.length === 0 && (
          <div className="checkout-complete" role="status">
            <div>
              <CheckCircle2 size={28}/><h2>{lastReceipt.paymentMethod === "credit" ? "Fiado registrado" : "Venta registrada"}</h2>
              <p>Venta #{lastReceipt.id.slice(0, 8)}</p>
            </div>
            <strong className="checkout-receipt-total">{formatCLP(lastReceipt.total)}</strong>
            <div className="checkout-receipt-lines"><span>Medio</span><strong>{paymentMethodLabel(lastReceipt.paymentMethod)}</strong>
              {lastReceipt.payments?.map((payment, index) => <div className="checkout-receipt-part" key={index}><span>{paymentMethodLabel(payment.method)}</span><strong>{formatCLP(payment.amount)}</strong></div>)}
              {lastReceipt.paymentMethod === "cash" && lastReceivedCash !== undefined && <><span>Recibido</span><strong>{formatCLP(lastReceivedCash)}</strong><span>Vuelto</span><strong>{formatCLP(Math.max(0, lastReceivedCash - lastReceipt.total))}</strong></>}
              {lastReceipt.customerId && <><span>Cliente</span><strong>{customers.find(customer => customer.id === lastReceipt.customerId)?.name ?? "Cliente"}</strong></>}
            </div>
            <div className="checkout-receipt-actions">
            <button className="secondary-action small" type="button" onClick={onPrintReceipt}>
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button className="secondary-action small" type="button" onClick={onShareReceipt}>
              <Share2 size={16} />
              <span>Compartir</span>
            </button>
            </div>
          </div>
        )}
        {lastReceipt && ticket.length === 0 && <button className="primary-action full" type="button" onClick={() => { onNewSale(); setMobileTicketOpen(false); document.querySelector<HTMLInputElement>(".sale-products-panel .search-box input")?.focus(); }}><Plus size={19}/> Nueva venta</button>}
      </SaleTicketSurface>
    </div>
  );
}

function SaleTicketSurface({ open, onClose, isBusy, children }: { open: boolean; onClose: () => void; isBusy: boolean; children: ReactNode }) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 959px)").matches);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 959px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mobile || !open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [mobile, open]);
  const content = <section className="panel ticket-panel" id="sale-ticket" aria-busy={isBusy}>
    {mobile && <div className="mobile-ticket-heading"><strong id="mobile-ticket-title">Ticket de venta</strong><button className="icon-button" type="button" aria-label="Volver al catálogo" title="Volver al catálogo" onClick={onClose} disabled={isBusy}><X size={21}/></button></div>}
    <fieldset className="sale-ticket-fields" disabled={isBusy}>{children}</fieldset>
  </section>;
  return mobile ? createPortal(<dialog ref={dialogRef} className="mobile-ticket-dialog" aria-labelledby="mobile-ticket-title" onKeyDown={event => {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']")).filter(control => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }} onCancel={event => { event.preventDefault(); if (!isBusy) onClose(); }}>{content}</dialog>, document.body) : content;
}

function ProductsView({
  mode,
  initialFilter = "all",
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
  onAdjustStock,
  onBulkAdjustStock,
  onQuickUpdate,
  onOpenPurchases
}: {
  mode: "create" | "stock";
  initialFilter?: InventoryFilter;
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
  onBulkAdjustStock?: (products: Product[], delta: number) => void;
  onQuickUpdate?: (product: Product, salePrice: number, stock: number) => Promise<void>;
  onOpenPurchases?: (lines: PurchaseProposalLine[]) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<InventoryFilter>(initialFilter);
  const [inventoryLimit, setInventoryLimit] = useState(60);
  const today = businessDay();
  const [showAdvancedProductFields, setShowAdvancedProductFields] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [proposalLines, setProposalLines] = useState<PurchaseProposalLine[]>([]);
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
      const matchesStock = matchesInventoryFilter(product, stockFilter, today);
      const matchesSearch = !normalizedSearch || [product.name, product.brand, product.category, product.barcode, product.sku]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch));

      return matchesCategory && matchesStock && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory, stockFilter, today]);
  const visibleLowStock = inventoryProducts.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock).length;
  const visibleStockValue = inventoryProducts.reduce((sum, product) => sum + product.stock * product.salePrice, 0);
  const renderedInventoryProducts = inventoryProducts.slice(0, inventoryLimit);
  const selectedProducts = products.filter(product => selectedProductIds.includes(product.id));
  const allVisibleSelected = renderedInventoryProducts.length > 0 && renderedInventoryProducts.every(product => selectedProductIds.includes(product.id));

  useEffect(() => { setInventoryLimit(60); }, [searchTerm, selectedCategory, stockFilter]);
  useEffect(() => { setSelectedProductIds(current => current.filter(id => products.some(product => product.id === id))); }, [products]);

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

  function toggleProduct(productId: string) {
    setSelectedProductIds(current => current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId]);
  }

  function toggleVisibleProducts() {
    setSelectedProductIds(current => allVisibleSelected ? current.filter(id => !renderedInventoryProducts.some(product => product.id === id)) : [...new Set([...current, ...renderedInventoryProducts.map(product => product.id)])]);
  }

  function createProposal() {
    setProposalLines(selectedProducts.filter(product => product.trackStock !== false && product.active !== false).map(product => ({ productId: product.id, productName: product.name, quantity: suggestedReplenishment(product), unitCost: product.costPrice })));
  }

  function updateProposalQuantity(productId: string, value: string) {
    const quantity = Math.max(1, Number(value) || 1);
    setProposalLines(current => current.map(line => line.productId === productId ? { ...line, quantity } : line));
  }

  return (
    <div className="stack">
      {mode === "create" && canManageProducts && (
        <FormSurface className="panel product-form-panel" label="Datos del producto" busy={isBusy} onSave={onCreate}>
          <div className="section-heading">
            <h2>{editingProductId ? "Editar producto" : "Crear producto"}</h2>
            <span>{editingProductId ? "Actualización" : "Catálogo del local"}</span>
          </div>
          <div className="progressive-form-heading"><span>Datos principales</span></div>
          <ProductPhoto value={productForm.imageUrl} disabled={isBusy} onChange={value => onForm({ ...productForm, imageUrl: value })}/>
          {editingProductId && <FormField label="Motivo del cambio (opcional)" value={productForm.changeReason} maxLength={300} onChange={value => onForm({ ...productForm, changeReason: value })}/>}
          <div className="form-grid product-form-primary-grid">
            <FormField label="Nombre del producto" value={productForm.name} onChange={value => onForm({ ...productForm, name: value })} required pattern=".*\S.*" placeholder="Ej. Bebida cola 1,5 L" />
            <FormField label="Categoría" value={productForm.category} onChange={value => onForm({ ...productForm, category: value })} required pattern=".*\S.*" list="product-category-options" placeholder="Ej. Bebidas" />
            <datalist id="product-category-options">
              {categoryOptions.map((category) => <option value={category.label} key={category.id} />)}
            </datalist>
            <FormField label="Precio de venta" value={productForm.salePrice} onChange={value => onForm({ ...productForm, salePrice: value })} type="number" min="1" step="1" required placeholder="$0" />
            <FormField label="Stock inicial" value={productForm.stock} onChange={value => onForm({ ...productForm, stock: value })} type="number" min="0" step="any" placeholder="0" />
          </div>
          <details className="progressive-form-additional" open={showAdvancedProductFields || Boolean(editingProductId)} onToggle={event => setShowAdvancedProductFields(event.currentTarget.open)}><summary>Información adicional</summary><div className="progressive-form-heading"><span>Información adicional</span><p>Completa solo lo que te ayude a ordenar mejor el inventario.</p></div><div className="form-grid advanced-product-fields"><label className="form-field"><span>Marca</span><input value={productForm.brand} onChange={(event) => onForm({ ...productForm, brand: event.target.value })} placeholder="Ej. Coca-Cola" /></label><label className="form-field"><span>Código de barras</span><input value={productForm.barcode} onChange={(event) => onForm({ ...productForm, barcode: event.target.value })} placeholder="Código del envase" inputMode="numeric" /></label><FormField label="Costo" value={productForm.costPrice} onChange={value => onForm({ ...productForm, costPrice: value })} type="number" min="0" step="1" placeholder="$0" /><FormField label="Stock mínimo" value={productForm.minimumStock} onChange={value => onForm({ ...productForm, minimumStock: value })} type="number" min="0" step="any" placeholder="0" /><label className="form-field"><span>SKU interno</span><input value={productForm.sku} onChange={(event) => onForm({ ...productForm, sku: event.target.value })} placeholder="Código interno" /></label><label className="form-field"><span>Variante o formato</span><input value={productForm.variant} onChange={(event) => onForm({ ...productForm, variant: event.target.value })} placeholder="Ej. Sin azúcar, pack 6" /></label><label className="form-field"><span>Unidad de venta</span><select value={productForm.unit} onChange={(event) => onForm({ ...productForm, unit: event.target.value as ProductFormState["unit"] })}><option value="unit">Unidad</option><option value="kg">Kilogramo</option><option value="gram">Gramo</option><option value="liter">Litro</option><option value="pack">Pack</option><option value="box">Caja</option></select></label><FormField label="Unidades por pack" value={productForm.unitsPerPack} onChange={value => onForm({ ...productForm, unitsPerPack: value })} type="number" min="1" step="1" placeholder="Ej. 6" /><label className="form-field"><span>Vencimiento</span><input type="date" value={productForm.expiryDate} onChange={(event) => onForm({ ...productForm, expiryDate: event.target.value })} /></label><label className="field checkbox-field"><input type="checkbox" checked={productForm.trackStock} onChange={(event) => onForm({ ...productForm, trackStock: event.target.checked })} /> Controlar stock de este producto</label></div></details>
          <button className="primary-action full" type="submit" disabled={isBusy}>
            {editingProductId ? <Save size={19} /> : <Plus size={19} />}
            <span>{isBusy ? "Guardando..." : editingProductId ? "Guardar producto" : "Crear producto"}</span>
          </button>
          {editingProductId && (
            <button className="secondary-action full" type="button" onClick={onCancelEdit}>
              Cancelar edición
            </button>
          )}
        </FormSurface>
      )}

      {mode === "stock" && <section className="panel inventory-panel">
        <div className="section-heading compact-heading">
          <h2>Inventario</h2>
          <span>{inventoryProducts.length === products.length ? `${products.length} productos` : `${inventoryProducts.length} de ${products.length}`}</span>
        </div>
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
          <div className="stock-filter-list" role="group" aria-label="Filtrar inventario por stock">
            {([["all", "Todo stock"], ["low", "Stock bajo"], ["out", "Sin stock"], ["expired", "Vencidos"], ["expiring", "Por vencer (30 días)"]] as const).map(([filter, label]) => <button className={stockFilter === filter ? "category-filter active" : "category-filter"} type="button" aria-pressed={stockFilter === filter} onClick={() => setStockFilter(filter)} key={filter}>{label}</button>)}
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
        {canManageProducts && <div className="inventory-selection-actions">
          <button className="secondary-action small" type="button" onClick={toggleVisibleProducts}>{allVisibleSelected ? "Quitar selección visible" : "Seleccionar visibles"}</button>
          {selectedProductIds.length > 0 && <button className="secondary-action small" type="button" onClick={() => setSelectedProductIds([])}>Limpiar selección ({selectedProductIds.length})</button>}
        </div>}
        {canManageProducts && selectedProductIds.length > 0 && <div className="inventory-bulk-bar" role="region" aria-label="Acciones para productos seleccionados">
          <span>{selectedProductIds.length} producto{selectedProductIds.length === 1 ? "" : "s"} seleccionado{selectedProductIds.length === 1 ? "" : "s"}</span>
          <div className="inventory-bulk-actions"><button className="secondary-action small" type="button" disabled={isBusy} onClick={() => onBulkAdjustStock?.(selectedProducts, 1)}><Plus size={16}/> Sumar 1</button><button className="secondary-action small" type="button" disabled={isBusy} onClick={() => onBulkAdjustStock?.(selectedProducts, -1)}><Minus size={16}/> Restar 1</button><button className="primary-action small" type="button" onClick={createProposal}><ReceiptText size={16}/> Proponer reposición</button></div>
        </div>}
        {proposalLines.length > 0 && <section className="inventory-proposal" aria-label="Propuesta de reposición">
          <div className="inventory-proposal-heading"><div><span>Propuesta revisable</span><h3>Reposición sugerida</h3><p>Revisa cantidades antes de convertirla en una orden de compra.</p></div><button className="icon-button" type="button" aria-label="Cerrar propuesta" onClick={() => setProposalLines([])}><X size={17}/></button></div>
          <div className="inventory-proposal-lines">{proposalLines.map(line => <div className="inventory-proposal-line" key={line.productId}><span><strong>{line.productName}</strong><small>Costo referencial {formatCLP(line.unitCost)}</small></span><label><span>Cantidad</span><input aria-label={`Cantidad de ${line.productName}`} type="number" min="1" value={line.quantity} onChange={event => updateProposalQuantity(line.productId, event.target.value)}/></label><button className="icon-button danger" type="button" aria-label={`Quitar ${line.productName}`} onClick={() => setProposalLines(current => current.filter(item => item.productId !== line.productId))}><Trash2 size={16}/></button></div>)}</div>
          <div className="inventory-proposal-actions"><button className="primary-action" type="button" onClick={() => onOpenPurchases?.(proposalLines)}><ReceiptText size={18}/> Revisar en Compras</button><button className="secondary-action" type="button" onClick={() => setProposalLines([])}>Descartar propuesta</button></div>
        </section>}
        <div className="list stock-list">
          <div className="inventory-table-header" aria-hidden="true"><span></span><span>Producto</span><span>Stock</span><span>Mínimo</span><span>Costo</span><span>Precio</span><span>Acciones</span></div>
          {renderedInventoryProducts.map((product) => (
            <InventoryRow
              imageUrl={productImageUrl(product)}
              isBusy={isBusy}
              product={product}
              key={product.id}
              canManageProducts={canManageProducts}
              onAdjustStock={onAdjustStock}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              selected={selectedProductIds.includes(product.id)}
              onSelect={() => toggleProduct(product.id)}
              onQuickUpdate={onQuickUpdate}
            />
          ))}
          {inventoryProducts.length > 0 && <div className="inventory-pagination"><span>Mostrando {renderedInventoryProducts.length} de {inventoryProducts.length}</span>{inventoryProducts.length > renderedInventoryProducts.length && <button className="secondary-action small" type="button" onClick={() => setInventoryLimit(limit => limit + 60)}>Mostrar más</button>}</div>}
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
  initialFilter = "clients",
  debts,
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
  initialFilter?: CustomerFilter;
  debts: DebtAccount[];
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
  const [customerTab, setCustomerTab] = useState<CustomerFilter>(initialFilter);
  const [debtMethods, setDebtMethods] = useState<Record<string, Exclude<PaymentMethod, "credit" | "mixed">>>({});
  const overdue = overdueDebts(debts);
  const overdueCustomerIds = new Set(overdue.map(debt => debt.customerId));
  const visibleCustomers = customerTab === "clients" ? customers : customers.filter(customer => customer.debtBalance > 0 && (customerTab !== "overdue" || overdueCustomerIds.has(customer.id)));
  return (
    <div className="stack">
      <nav className="section-tabs" aria-label="Secciones de clientes">
        {([["clients", "Clientes", customers.length], ["credit", "Fiado", customers.filter(customer => customer.debtBalance > 0).length], ["pending", "Pendientes", customers.filter(customer => customer.debtBalance > 0).length], ["overdue", "Vencidos", customers.filter(customer => customer.debtBalance > 0 && overdueCustomerIds.has(customer.id)).length]] as const).map(([tab, label, count]) => <button className={customerTab === tab ? "active" : ""} type="button" aria-pressed={customerTab === tab} onClick={() => setCustomerTab(tab)} key={tab}>{label} <span>{count}</span></button>)}
      </nav><div className="workspace-grid customer-workspace">
      {customerTab === "clients" && <FormSurface className="panel customer-form-panel" label="Datos del cliente" busy={isBusy || !canOperate} onSave={onCreate}>
        <div className="section-heading">
          <h2>{editingCustomerId ? "Editar cliente" : "Nuevo cliente"}</h2>
          <span>{canManageCustomers ? "Fiado" : "Alta rápida"}</span>
        </div>
        <div className="form-grid customer-form-grid customer-form-primary-grid">
          <FormField label="Nombre completo" value={customerForm.name} onChange={value => onForm({ ...customerForm, name: value })} id="customer-name" required pattern=".*\S.*" placeholder="Ej. María González" />
          <FormField label="Teléfono" value={customerForm.phone} onChange={value => onForm({ ...customerForm, phone: value })} type="tel" placeholder="+56 9..." />
          <FormField label="Límite de fiado" value={customerForm.creditLimit} onChange={value => onForm({ ...customerForm, creditLimit: value })} type="number" min="0" step="1" placeholder="0 = sin límite" />
          <FormField label="Días para pagar" value={customerForm.creditDays} onChange={value => onForm({ ...customerForm, creditDays: value })} type="number" min="1" step="1" placeholder="30" />
          {canManageCustomers && <label className="field checkbox-field"><input type="checkbox" checked={customerForm.creditBlocked} onChange={(event) => onForm({ ...customerForm, creditBlocked: event.target.checked })} /> Bloquear nuevos fiados</label>}
        </div>
        <details className="customer-additional-fields">
          <summary><span>Información adicional</span><small>Correo, dirección y observaciones</small></summary>
          <div className="form-grid customer-form-grid">
            <FormField label="Correo (opcional)" value={customerForm.email} onChange={value => onForm({ ...customerForm, email: value })} type="email" placeholder="cliente@correo.cl" />
            <label className="form-field"><span>Dirección (opcional)</span><input value={customerForm.address} onChange={(event) => onForm({ ...customerForm, address: event.target.value })} placeholder="Calle y número" /></label>
            <label className="form-field customer-notes-field"><span>Observaciones</span><input value={customerForm.notes} onChange={(event) => onForm({ ...customerForm, notes: event.target.value })} placeholder="Datos útiles del cliente" /></label>
          </div>
        </details>
        <button className="primary-action full" type="submit" disabled={isBusy || !canOperate}>
          {editingCustomerId ? <Save size={19} /> : <Plus size={19} />}
          <span>{isBusy ? "Guardando..." : editingCustomerId ? "Guardar cliente" : "Crear cliente"}</span>
        </button>
        {editingCustomerId && canManageCustomers && (
          <button className="secondary-action full" type="button" onClick={onCancelEdit}>
            Cancelar edición
          </button>
        )}
      </FormSurface>}

      {customerTab === "clients" && <CustomerOverview customers={customers} />}
      <CustomerStatement customers={customers}/>

      {lastDebtCharge && (
        <section className="panel payment-share-panel">
          <div className="section-heading">
            <div><span>Simulación académica</span><h2>Cobro de prueba listo</h2></div>
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
          <h2>{customerTab === "clients" ? "Todos los clientes" : customerTab === "credit" ? "Cuentas de fiado" : customerTab === "overdue" ? "Clientes con fiado vencido" : "Cobros pendientes"}</h2>
          <span>{visibleCustomers.length} registros</span>
        </div>
        <div className="list">
          {visibleCustomers.map((customer) => (
            <div className="customer-row" key={customer.id}>
              <div>
                <strong>{customer.name}</strong>
                <p>{customer.phone ?? "Sin teléfono"}</p>
                {customerTab === "overdue" && <p>Vencido: {formatCLP(overdue.filter(debt => debt.customerId === customer.id).reduce((total, debt) => total + debt.balance, 0))}</p>}
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
          {visibleCustomers.length === 0 && <EmptyState icon={Users} title={customerTab === "clients" ? "Aún no has registrado clientes" : customerTab === "overdue" ? "No hay fiados vencidos" : "No hay cuentas pendientes"} description={customerTab === "clients" ? "Crea tu primer cliente para guardar sus datos y administrar sus fiados." : customerTab === "overdue" ? "Ningún cliente tiene un saldo con fecha de pago vencida." : "Cuando un cliente tenga un fiado activo, aparecerá aquí para que puedas revisarlo."} actionLabel={customerTab === "clients" ? "Crear cliente" : undefined} onAction={customerTab === "clients" ? () => document.getElementById("customer-name")?.focus() : undefined} />}
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
    <div className="section-heading"><div><span>Vista rápida</span><h2>Resumen de clientes</h2></div><span>{activeCustomers.length} activos</span></div>
    <div className="customer-overview-metrics">
      <article><span>Clientes</span><strong>{activeCustomers.length}</strong><small>registrados</small></article>
      <article className={customersWithDebt.length ? "attention" : ""}><span>Con fiado</span><strong>{customersWithDebt.length}</strong><small>{formatCLP(totalDebt)} pendiente</small></article>
      <article><span>Bloqueados</span><strong>{blockedCustomers.length}</strong><small>sin nuevos fiados</small></article>
    </div>
    {activeCustomers.length ? <div className="customer-overview-list"><div><strong>Clientes recientes</strong><small>Accesos rápidos para revisar sus datos.</small></div>{activeCustomers.slice(0, 4).map((customer) => <div className="customer-overview-item" key={customer.id}><span>{customer.name}</span><strong className={customer.debtBalance > 0 ? "debt" : "paid"}>{customer.debtBalance > 0 ? formatCLP(customer.debtBalance) : "Al día"}</strong></div>)}</div> : <div className="customer-overview-empty"><Users size={23}/><strong>Comienza con tu primer cliente</strong><p>Cuando registres clientes, aquí verás sus fiados, deudas y datos más recientes.</p></div>}
  </aside>;
}

function ReportsView({
  tenantId,
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
  tenantId: string;
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
  const latestDate = sales[0]?.createdAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(`${latestDate.slice(0, 8)}01`);
  const [endDate, setEndDate] = useState(latestDate);
  const [selectedSellerId, setSelectedSellerId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [presetName, setPresetName] = useState("");
  const presetStorageKey = `localito-report-presets:${tenantId}`;
  const reminderStorageKey = `localito-report-reminder:${tenantId}`;
  const [savedPresets, setSavedPresets] = useState<Array<{ id: string; name: string; startDate?: string; endDate?: string; month?: string; sellerId: string; category: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(presetStorageKey) ?? "[]"); } catch { return []; }
  });
  const [weeklyReminderEnabled, setWeeklyReminderEnabled] = useState(() => localStorage.getItem(reminderStorageKey) === "enabled");
  const [selectedClosureId, setSelectedClosureId] = useState("");
  const [saleAction, setSaleAction] = useState<{ sale: Sale; type: "cancel" | "return" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [historyPage, setHistoryPage] = useState(0);
  useEffect(() => { localStorage.setItem(presetStorageKey, JSON.stringify(savedPresets)); }, [presetStorageKey, savedPresets]);
  useEffect(() => { localStorage.setItem(reminderStorageKey, weeklyReminderEnabled ? "enabled" : "disabled"); }, [reminderStorageKey, weeklyReminderEnabled]);
  useEffect(() => { setHistoryPage(0); }, [startDate, endDate, selectedSellerId, selectedCategory]);

  const formatRangeDate = (value: string) => new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  const selectedPeriodLabel = startDate === endDate ? formatRangeDate(startDate) : `${formatRangeDate(startDate)} — ${formatRangeDate(endDate)}`;
  const rangeLength = Math.max(1, Math.round((new Date(`${endDate}T12:00:00`).getTime() - new Date(`${startDate}T12:00:00`).getTime()) / 86_400_000) + 1);
  const previousEnd = new Date(`${startDate}T12:00:00`);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - rangeLength + 1);
  const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const previousStartDate = toDateKey(previousStart);
  const previousEndDate = toDateKey(previousEnd);
  const previousPeriodLabel = previousStartDate === previousEndDate ? formatRangeDate(previousStartDate) : `${formatRangeDate(previousStartDate)} — ${formatRangeDate(previousEndDate)}`;
  const productCategoryById = new Map(products.map((product) => [product.id, product.category || "Sin categoría"]));
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort((left, right) => left.localeCompare(right, "es"));
  const createFilteredSales = (from: string, to: string) => sales
    .filter((sale) => sale.createdAt.slice(0, 10) >= from && sale.createdAt.slice(0, 10) <= to)
    .filter((sale) => selectedSellerId === "all" || sale.sellerId === selectedSellerId)
    .map((sale) => {
      const items = selectedCategory === "all" ? sale.items : sale.items.filter((item) => productCategoryById.get(item.productId) === selectedCategory);
      const total = selectedCategory === "all" ? sale.total : items.reduce((sum, item) => sum + item.subtotal, 0);
      return { ...sale, items, total };
    })
    .filter((sale) => sale.items.length > 0);
  const monthSales = createFilteredSales(startDate, endDate);
  const historyPageSize = 3;
  const historyPageCount = Math.max(1, Math.ceil(monthSales.length / historyPageSize));
  const visibleHistoryPage = Math.min(historyPage, historyPageCount - 1);
  const visibleHistorySales = monthSales.slice(visibleHistoryPage * historyPageSize, (visibleHistoryPage + 1) * historyPageSize);
  const activeSales = monthSales.filter((sale) => sale.status !== "cancelled");
  const previousActiveSales = createFilteredSales(previousStartDate, previousEndDate).filter((sale) => sale.status !== "cancelled");
  const monthTotal = activeSales.reduce((sum, sale) => sum + sale.total, 0);
  const previousTotal = previousActiveSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDifference = monthTotal - previousTotal;
  const totalDifferencePercent = previousTotal ? Math.round(totalDifference / previousTotal * 100) : null;
  const monthUnits = activeSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const dailyTotals = [...activeSales.reduce((map, sale) => { const day = sale.createdAt.slice(0, 10); map.set(day, (map.get(day) ?? 0) + sale.total); return map; }, new Map<string, number>())].sort((a, b) => a[0].localeCompare(b[0]));
  const maxDaily = Math.max(...dailyTotals.map(([, total]) => total), 1);
  const methodTotals = activeSales.reduce((map, sale) => {
    if (sale.payments?.length) sale.payments.forEach((payment) => map.set(paymentMethodLabel(payment.method), (map.get(paymentMethodLabel(payment.method)) ?? 0) + payment.amount));
    else map.set(paymentMethodLabel(sale.paymentMethod), (map.get(paymentMethodLabel(sale.paymentMethod)) ?? 0) + sale.total);
    return map;
  }, new Map<string, number>());
  const productTotals = activeSales.reduce((map, sale) => { sale.items.forEach((item) => { const current = map.get(item.productId) ?? { name: item.productName, units: 0, amount: 0 }; current.units += item.quantity; current.amount += item.subtotal; map.set(item.productId, current); }); return map; }, new Map<string, { name: string; units: number; amount: number }>());
  const topProducts = [...productTotals.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const sellerTotals = [...activeSales.reduce((map, sale) => map.set(sale.sellerId, (map.get(sale.sellerId) ?? 0) + sale.total), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const categoryTotals = [...activeSales.reduce((map, sale) => { sale.items.forEach((item) => { const category = productCategoryById.get(item.productId) ?? "Sin categoría"; map.set(category, (map.get(category) ?? 0) + item.subtotal); }); return map; }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const hourTotals = [...activeSales.reduce((map, sale) => { const hour = new Date(sale.createdAt).getHours(); map.set(hour, (map.get(hour) ?? 0) + sale.total); return map; }, new Map<number, number>())].sort((a, b) => a[0] - b[0]);
  const maxHourly = Math.max(...hourTotals.map(([, total]) => total), 1);
  const alerts = [
    lowStockProducts.length ? { title: `${lowStockProducts.length} producto${lowStockProducts.length === 1 ? "" : "s"} con stock bajo`, detail: "Revisa reposición antes de que se agoten.", tone: "warning" } : null,
    previousTotal > 0 && monthTotal < previousTotal ? { title: "Las ventas bajaron respecto al período anterior", detail: `${formatCLP(Math.abs(totalDifference))} menos que ${previousPeriodLabel}.`, tone: "attention" } : null,
    activeSales.length === 0 ? { title: "Sin ventas en este período", detail: "Cambia el filtro o revisa si faltan registros.", tone: "attention" } : null,
    customers.some((customer) => customer.debtBalance > 0) ? { title: "Hay fiados pendientes por revisar", detail: "Puedes cobrar abonos desde Clientes.", tone: "warning" } : null
  ].filter((alert): alert is { title: string; detail: string; tone: string } => Boolean(alert));
  const selectedClosure = cashClosures.find((closure) => closure.id === selectedClosureId);
  const closureSales = selectedClosure ? sales.filter((sale) => sale.createdAt.slice(0, 10) === selectedClosure.date) : [];

  function applyPreset(preset: { startDate?: string; endDate?: string; month?: string; sellerId: string; category: string }) {
    const legacyStartDate = preset.month ? `${preset.month}-01` : startDate;
    const legacyEndDate = preset.month ? toDateKey(new Date(Number(preset.month.slice(0, 4)), Number(preset.month.slice(5, 7)), 0)) : endDate;
    setStartDate(preset.startDate ?? legacyStartDate); setEndDate(preset.endDate ?? legacyEndDate); setSelectedSellerId(preset.sellerId); setSelectedCategory(preset.category);
  }

  function savePreset() {
    const name = presetName.trim() || `Filtro ${selectedPeriodLabel}`;
    setSavedPresets((current) => [{ id: `${Date.now()}`, name, startDate, endDate, sellerId: selectedSellerId, category: selectedCategory }, ...current].slice(0, 6));
    setPresetName("");
  }

  function exportFilteredSales() {
    const rows = monthSales.flatMap((sale) => sale.items.map((item) => [
      sale.createdAt.slice(0, 10), new Date(sale.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }), sale.id,
      users.find((user) => user.id === sale.sellerId)?.name ?? "Usuario eliminado", productCategoryById.get(item.productId) ?? "Sin categoría",
      item.productName, String(item.quantity), String(item.unitPrice), String(item.subtotal), String(sale.total), paymentMethodLabel(sale.paymentMethod), sale.status
    ]));
    const csv = [["Fecha", "Hora", "Venta", "Vendedor", "Categoría", "Producto", "Cantidad", "Precio unitario", "Subtotal", "Total venta", "Medio de pago", "Estado"], ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = `localito-reporte-${startDate}-a-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function setQuickRange(range: "today" | "week" | "month") {
    const end = new Date(`${latestDate}T12:00:00`);
    const start = new Date(end);
    if (range === "week") start.setDate(start.getDate() - 6);
    if (range === "month") start.setDate(1);
    setStartDate(toDateKey(start)); setEndDate(toDateKey(end));
  }

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
      <section className="reports-toolbar"><div><span>Reportes</span><h2>Así va tu negocio</h2><p>Filtra, compara y exporta la información que necesitas para decidir.</p></div><div className="reports-toolbar-actions"><div className="report-range-picker"><span>Período a revisar</span><div className="report-quick-ranges" aria-label="Períodos rápidos"><button type="button" onClick={() => setQuickRange("today")}>Hoy</button><button type="button" onClick={() => setQuickRange("week")}>Últimos 7 días</button><button type="button" onClick={() => setQuickRange("month")}>Este mes</button></div><div className="report-date-fields"><label><span>Desde</span><input type="date" value={startDate} max={endDate} onChange={(event) => { const value = event.target.value; setStartDate(value); if (value > endDate) setEndDate(value); }}/></label><span aria-hidden="true">—</span><label><span>Hasta</span><input type="date" value={endDate} min={startDate} onChange={(event) => { const value = event.target.value; setEndDate(value); if (value < startDate) setStartDate(value); }}/></label></div></div><label className="month-filter"><span>Vendedor</span><select value={selectedSellerId} onChange={(event) => setSelectedSellerId(event.target.value)}><option value="all">Todo el equipo</option>{users.filter((user) => user.role !== "system_admin").map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label><label className="month-filter"><span>Categoría</span><select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label></div></section>
      {canViewFullReports && <section className="panel report-filter-workspace"><div><span>Filtros guardados</span><h3>Vuelve a una vista con un toque</h3><p>Los filtros se guardan solo para este local y este navegador.</p></div><div className="report-preset-actions"><input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Ej: revisión fin de mes"/><button className="secondary-action small" type="button" onClick={savePreset}><Save size={16}/> Guardar filtro</button><button className="secondary-action small" type="button" onClick={exportFilteredSales} disabled={monthSales.length === 0}><Share2 size={16}/> Exportar CSV</button></div>{savedPresets.length > 0 && <div className="report-preset-list">{savedPresets.map((preset) => <div key={preset.id}><button type="button" onClick={() => applyPreset(preset)}>{preset.name}</button><button className="icon-button preset-delete" type="button" onClick={() => setSavedPresets((current) => current.filter((item) => item.id !== preset.id))} aria-label={`Eliminar filtro ${preset.name}`}><X size={14}/></button></div>)}</div>}</section>}
      {canViewFullReports && (
        <section className="report-period-summary" aria-label={`Resultado de ${selectedPeriodLabel}`}><div className="report-period-copy"><span>Resultado del período</span><h3>{selectedPeriodLabel}</h3><p>{activeSales.length ? `${activeSales.length} ${activeSales.length === 1 ? "venta registrada" : "ventas registradas"} con los filtros seleccionados.` : "Aún no se han registrado ventas con estos filtros."}</p>{totalDifferencePercent !== null && <span className={totalDifference >= 0 ? "report-comparison positive" : "report-comparison negative"}>{totalDifference >= 0 ? "+" : "−"}{Math.abs(totalDifferencePercent)}% vs. período anterior</span>}</div><div className="report-period-total"><span>Ventas netas</span><strong>{formatCLP(monthTotal)}</strong><small>{previousTotal ? `Período anterior (${previousPeriodLabel}): ${formatCLP(previousTotal)}` : "Sin ventas comparables el período anterior"}</small></div><div className="stats-grid report-stats-grid"><StatCard label="Ventas" value={String(activeSales.length)} icon={ReceiptText} tone="blue" /><StatCard label="Unidades" value={String(monthUnits)} icon={Package} tone="amber" /><StatCard label="Ticket promedio" value={formatCLP(activeSales.length ? Math.round(monthTotal / activeSales.length) : 0)} icon={Banknote} tone="green" /></div></section>
      )}

      {canViewFullReports && <section className="report-alerts" aria-label="Alertas operativas"><div className="section-heading"><div><span>Alertas operativas</span><h2>Qué conviene revisar</h2><p>Se actualizan con los datos reales del local.</p></div><label className="report-reminder"><input type="checkbox" checked={weeklyReminderEnabled} onChange={(event) => setWeeklyReminderEnabled(event.target.checked)}/><span>Recordatorio semanal al abrir Reportes</span></label></div><div className="report-alert-grid">{alerts.length ? alerts.map((alert) => <article className={`report-alert ${alert.tone}`} key={alert.title}><AlertTriangle size={19}/><div><strong>{alert.title}</strong><p>{alert.detail}</p></div></article>) : <article className="report-alert success"><CheckCircle2 size={19}/><div><strong>Todo se ve en orden</strong><p>No hay alertas urgentes con los filtros actuales.</p></div></article>}</div>{weeklyReminderEnabled && <p className="helper-text">El recordatorio aparecerá como aviso dentro de Localito al iniciar una nueva semana. No envía correos ni notificaciones externas.</p>}</section>}

      {canViewFullReports && activeSales.length === 0 && <EmptyState icon={BarChart3} title="Aún no hay ventas en este período" description="Cambia el mes seleccionado o registra una venta para ver tendencias, medios de pago y productos más vendidos." />}

      {canViewFullReports && activeSales.length > 0 && <section className="panel report-overview"><div className="section-heading"><div><span>Análisis del período</span><h2>Evolución de ventas</h2><p>Cómo se distribuyeron las ventas durante {selectedPeriodLabel}.</p></div><span>{dailyTotals.length} días con ventas</span></div><div className="daily-chart" aria-label="Ventas diarias">{dailyTotals.map(([day, total]) => <div className="daily-column" key={day}><strong>{formatCLP(total)}</strong><div><span style={{ height: `${Math.max(5, total / maxDaily * 100)}%` }}/></div><small>{formatRangeDate(day)}</small></div>)}</div></section>}

      {canViewFullReports && activeSales.length > 0 && <div className="report-dashboard-grid report-dashboard-grid-extended"><section className="panel"><div className="section-heading"><div><h2>Medios de pago</h2><p>Cómo se pagaron las ventas del período.</p></div><span>{formatCLP(monthTotal)}</span></div><div className="horizontal-bars">{[...methodTotals.entries()].sort((a,b)=>b[1]-a[1]).map(([label,total]) => <div className="horizontal-bar" key={label}><span>{label}</span><div><i style={{ width: `${Math.max(4, total / Math.max(monthTotal,1) * 100)}%` }}/></div><strong>{formatCLP(total)}</strong></div>)}</div></section><section className="panel"><div className="section-heading"><div><h2>Ventas por vendedor</h2><p>Participación del equipo durante el período.</p></div><span>{sellerTotals.length}</span></div><div className="seller-breakdown">{sellerTotals.map(([sellerId,total]) => <div key={sellerId}><span>{users.find((item) => item.id === sellerId)?.name ?? "Usuario eliminado"}</span><strong>{formatCLP(total)}</strong></div>)}</div></section><section className="panel"><div className="section-heading"><div><span>Ritmo de venta</span><h2>Ventas por hora</h2><p>Detecta tus horas más activas para organizar la atención.</p></div><span>{hourTotals.length} horarios</span></div><div className="hourly-chart">{hourTotals.map(([hour, total]) => <div className="hour-column" key={hour}><strong>{formatCLP(total)}</strong><div><span style={{ height: `${Math.max(6, total / maxHourly * 100)}%` }}/></div><small>{String(hour).padStart(2, "0")}:00</small></div>)}</div></section><section className="panel"><div className="section-heading"><div><span>Mezcla de ventas</span><h2>Ventas por categoría</h2><p>Qué categorías aportan más al período.</p></div><span>{categoryTotals.length}</span></div><div className="horizontal-bars">{categoryTotals.map(([category,total]) => <div className="horizontal-bar" key={category}><span>{category}</span><div><i style={{ width: `${Math.max(4, total / Math.max(monthTotal,1) * 100)}%` }}/></div><strong>{formatCLP(total)}</strong></div>)}</div></section></div>}

      <section className="panel">
        <div className="section-heading">
          <div><span>Operación actual</span><h2>Caja de hoy</h2><p>Movimientos del turno abierto, independientes del período seleccionado.</p></div>
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
          El cierre guarda el período actual. Luego estos totales vuelven a cero y las próximas ventas comienzan un período nuevo.
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div><span>Historial</span><h2>Últimos cierres</h2><p>Selecciona un cierre para revisar las ventas que incluyó.</p></div>
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
              <div><span>Desempeño del período</span><h2>Productos más vendidos</h2></div>
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
              <div><span>Vista general</span><h2>Resumen operativo</h2></div>
              <span>{monthSales.length} ventas</span>
            </div>
            <div className="report-grid">
              <ReportMetric label="Clientes registrados" value={String(customers.length)} />
              <ReportMetric label="Productos activos" value={String(products.length)} />
              <ReportMetric label="Ventas fiadas" value={String(activeSales.filter((sale) => sale.saleType === "credit").length)} />
              <ReportMetric label="Stock bajo" value={String(lowStockProducts.length)} tone="warning" />
            </div>
          </section>

          <section className="panel period-sales-history">
            <div className="section-heading">
              <div><span>Historial del período</span><h2>Ventas, anulaciones y devoluciones</h2></div>
              <span>{monthSales.length} registros</span>
            </div>
            <div className="list period-sales-list">
              {visibleHistorySales.map((sale) => (
                <article className="period-sale-row" key={sale.id}>
                  <div className="period-sale-copy">
                    <strong>Venta #{sale.id.slice(0, 8)}</strong>
                    <p>
                      {formatDateTime(sale.createdAt)} - {paymentMethodLabel(sale.paymentMethod)}
                    </p>
                    {sale.status === "cancelled" && <p className="warning-text">Anulada: {sale.cancellationReason ?? "sin motivo"}</p>}
                  </div>
                  <span className={sale.status === "cancelled" ? "debt period-sale-amount" : "amount period-sale-amount"}>{formatCLP(sale.total)}</span>
                  <div className="period-sale-actions">
                    <button className="secondary-action small danger-soft" type="button" onClick={() => openSaleAction(sale, "cancel")} disabled={sale.status === "cancelled"}>
                      <Trash2 size={16} />
                      <span>Anular</span>
                    </button>
                    <button className="secondary-action small" type="button" onClick={() => openSaleAction(sale, "return")} disabled={sale.status === "cancelled" || sale.status === "refunded"}>
                      <RefreshCw size={16} /><span>Devolver</span>
                    </button>
                  </div>
                </article>
              ))}
              {monthSales.length === 0 && <EmptyState icon={ReceiptText} title="No hay ventas ni anulaciones" description="Cuando registres movimientos en este mes, podrás revisarlos y gestionar anulaciones o devoluciones desde aquí." />}
            </div>
            {historyPageCount > 1 && <nav className="history-pagination" aria-label="Páginas del historial de ventas">
              <button className="secondary-action small" type="button" onClick={() => setHistoryPage((page) => Math.max(0, page - 1))} disabled={visibleHistoryPage === 0}><ArrowLeft size={16}/><span>Anterior</span></button>
              <span>Página {visibleHistoryPage + 1} de {historyPageCount}</span>
              <button className="secondary-action small" type="button" onClick={() => setHistoryPage((page) => Math.min(historyPageCount - 1, page + 1))} disabled={visibleHistoryPage === historyPageCount - 1}><span>Siguiente</span><ArrowRight size={16}/></button>
            </nav>}
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

export default App;
