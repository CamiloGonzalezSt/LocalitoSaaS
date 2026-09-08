import type {
  ApiResponse,
  AuditEvent,
  AuditPage,
  AuditQuery,
  CashRegisterClosure,
  BootstrapData,
  CashMovement,
  CashRegisterSummary,
  CashSession,
  Customer,
  DebtAccount,
  InvoiceAnalysis,
  InvoiceImportPayload,
  InvoiceImportResult,
  PaymentMethod,
  PlatformTenantSummary,
  Product,
  ProductBulkImportPayload,
  ProductBulkImportResult,
  PurchaseOrder,
  QuickSaleAnalysis,
  RecognitionLog,
  RecognitionResult,
  Sale,
  SalePayment,
  SaleReturn,
  Subscription,
  SubscriptionPlan,
  StockMovement,
  Supplier,
  Tenant,
  User
} from "@localito/shared";

import { enqueueSale, queueEntries, syncQueue, syncScope, SyncHttpError, type SyncOptions } from "./offline";
import { cacheWorkspace } from "./workspaceCache";

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredUrl) return configuredUrl;

  if (typeof window === "undefined") return "http://localhost:3000";

  if (window.location.protocol === "https:") return "/api";

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const apiPort = window.location.port === "5174" ? "3001" : "3000";
  return `${protocol}//${window.location.hostname}:${apiPort}`;
}

const API_BASE_URL = resolveApiBaseUrl();
function reservePendingStock(data: BootstrapData, key?: string) {
  const reserved = new Map<string, number>();
  for (const entry of queueEntries(key)) {
    const payload = JSON.parse(entry.body) as SalePayload;
    for (const item of payload.items) reserved.set(item.productId, (reserved.get(item.productId) ?? 0) + item.quantity);
  }
  return { ...data, products: data.products.map(product => product.trackStock === false ? product : { ...product, stock: Math.max(0, product.stock - (reserved.get(product.id) ?? 0)) }) };
}
type SalePayload = {
  customerId?: string;
  paymentMethod: PaymentMethod;
  payments?: SalePayment[];
  discount?: number;
  notes?: string;
  idempotencyKey?: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type AuthSession = {
  user: User;
  tenant: Tenant;
  token: string;
};


export class OfflineQueuedError extends Error {
  constructor() {
    super("Sin conexión: la operación quedó guardada y se sincronizará automáticamente.");
    this.name = "OfflineQueuedError";
  }
}

async function request<T>(path: string, options: RequestInit = {}, queueWhenOffline = false) {
  const token = localStorage.getItem("localito-token");
  const scope = syncScope();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
    });
  } catch (error) {
    if (queueWhenOffline && path === "/sales" && scope && typeof options.body === "string") {
      await enqueueSale(scope, options.body);
      throw new OfflineQueuedError();
    }
    throw error;
  }

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & { message?: string };

  if (!response.ok) {
    throw new SyncHttpError(payload.message ?? "No se pudo completar la operacion.", response.status);
  }

  return payload;
}

export async function flushOfflineQueue(options: SyncOptions = {}) {
  return syncQueue(async (entry, token) => {
    await request(entry.path, { method: "POST", body: entry.body, headers: { Authorization: `Bearer ${token}`, "Idempotency-Key": entry.id } });
  }, options);
}

export const api = {
  async savePreferences(preferences: import("@localito/shared").BusinessPreferences) { return request<Tenant>("/tenant/preferences", { method: "PATCH", body: JSON.stringify(preferences) }); },
  async getReconciliation() { return request<{ sessionId: string; opening: number; salesCash: number; debtCash: number; deposits: number; expenses: number; withdrawals: number; expected: number } | null>("/cash/reconciliation"); },
  async getStatement(customerId: string) { return request<{ customer: Customer; debts: DebtAccount[]; payments: Array<{ id: string; amount: number; method: PaymentMethod; status: string; createdAt: string }> }>(`/customers/${encodeURIComponent(customerId)}/statement`); },
  async login(email: string, password: string) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  async register(payload: { businessName: string; businessType: string; ownerName: string; email: string; password: string }) {
    return request<AuthSession>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },

  async requestPasswordReset(email: string) {
    return request<{ message: string; delivery: "email" | "unavailable" }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  async confirmPasswordReset(token: string, password: string) {
    return request<void>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
  },

  async logout() { return request<void>("/auth/logout", { method: "POST" }); },

  async bootstrap() {
    const scope = syncScope();
    try {
      const response = await request<BootstrapData>("/bootstrap");
      if (scope) { try { await cacheWorkspace(scope.key, response.data); } catch { /* The live workspace remains usable if local storage is full. */ } }
      window.dispatchEvent(new CustomEvent("localito-cache", { detail: false }));
      return { ...response, data: reservePendingStock(response.data, scope?.key) };
    } catch (error) {
      if (!(error instanceof TypeError) || !scope || syncScope()?.key !== scope.key) throw error;
      const saved = await cacheWorkspace(scope.key);
      if (!saved) throw error;
      window.dispatchEvent(new CustomEvent("localito-cache", { detail: true }));
      return { data: reservePendingStock(saved, scope.key) };
    }
  },

  async getPlatformTenants() { return request<PlatformTenantSummary[]>("/platform/tenants"); },

  async createPlatformTenant(payload: { businessName: string; businessType: string; ownerName: string; ownerEmail: string; ownerPassword: string }) {
    return request<{ tenant: Tenant; user: User }>("/platform/tenants", { method: "POST", body: JSON.stringify(payload) });
  },

  async updatePlatformTenant(tenantId: string, payload: Partial<Tenant>) {
    return request<Tenant>(`/platform/tenants/${tenantId}`, { method: "PATCH", body: JSON.stringify(payload) });
  },

  async deletePlatformTenant(tenantId: string) {
    return request<{ id: string; name: string; deleted: true }>(`/platform/tenants/${tenantId}`, { method: "DELETE" });
  },

  async getPlatformTenantUsers(tenantId: string) { return request<User[]>(`/platform/tenants/${tenantId}/users`); },

  async createPlatformTenantUser(tenantId: string, payload: { name: string; email: string; password: string; role: "owner" | "seller" }) {
    return request<User>(`/platform/tenants/${tenantId}/users`, { method: "POST", body: JSON.stringify(payload) });
  },

  async updatePlatformTenantUser(tenantId: string, userId: string, payload: Partial<User>) {
    return request<User>(`/platform/tenants/${tenantId}/users/${userId}`, { method: "PATCH", body: JSON.stringify(payload) });
  },

  async deletePlatformTenantUser(tenantId: string, userId: string) {
    return request<{ id: string; deleted: true }>(`/platform/tenants/${tenantId}/users/${userId}`, { method: "DELETE" });
  },

  async resetPlatformTenantUserPassword(tenantId: string, userId: string, password: string) {
    return request<{ updated: true }>(`/platform/tenants/${tenantId}/users/${userId}/password`, { method: "POST", body: JSON.stringify({ password }) });
  },

  async updatePlatformTenantSubscription(tenantId: string, payload: { plan?: SubscriptionPlan; status?: Subscription["status"] }) {
    return request<Subscription>(`/platform/tenants/${tenantId}/subscription`, { method: "PATCH", body: JSON.stringify(payload) });
  },

  async getSubscription() { return request<Subscription>("/subscription"); },

  async changePlan(plan: SubscriptionPlan, provider: "webpay_sandbox" | "mercadopago_sandbox" | "transfer") {
    return request<Subscription>("/subscription/change-plan", { method: "POST", body: JSON.stringify({ plan, provider }) });
  },

  async updateTenant(payload: Pick<Tenant, "name" | "businessType" | "address" | "phone">) {
    return request<Tenant>("/tenant", { method: "PATCH", body: JSON.stringify(payload) });
  },

  async createUser(user: Partial<User> & { password?: string }) {
    return request<User>("/users", {
      method: "POST",
      body: JSON.stringify(user)
    });
  },

  async updateUser(userId: string, user: Partial<User>) {
    return request<User>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(user)
    });
  },

  async deleteUser(userId: string) {
    return request<{ id: string; deleted: true }>(`/users/${userId}`, { method: "DELETE" });
  },

  async resetUserPassword(userId: string, password: string) {
    return request<{ updated: true }>(`/users/${userId}/password`, { method: "POST", body: JSON.stringify({ password }) });
  },

  async createProduct(product: Partial<Product>) {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product)
    });
  },

  async importProducts(payload: ProductBulkImportPayload) {
    return request<ProductBulkImportResult>("/products/import", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateProduct(productId: string, product: Partial<Product>) {
    return request<Product>(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(product)
    });
  },

  async deactivateProduct(productId: string) {
    return request<Product>(`/products/${productId}`, {
      method: "DELETE"
    });
  },

  async updateStock(productId: string, quantity: number) {
    return request<Product>(`/products/${productId}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity })
    });
  },

  async createCustomer(customer: Partial<Customer>) {
    return request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(customer)
    });
  },

  async updateCustomer(customerId: string, customer: Partial<Customer>) {
    return request<Customer>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(customer)
    });
  },

  async deactivateCustomer(customerId: string) {
    return request<Customer>(`/customers/${customerId}`, {
      method: "DELETE"
    });
  },

  async createSale(payload: SalePayload) {
    const idempotencyKey = payload.idempotencyKey ?? crypto.randomUUID();
    return request<Sale>("/sales", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ ...payload, idempotencyKey })
    }, true);
  },

  async cancelSale(saleId: string, reason: string) {
    return request<Sale>(`/sales/${saleId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  },

  async payCustomerDebt(customerId: string, amount: number, method: PaymentMethod) {
    return request<{ customer: Customer }>(`/customers/${customerId}/payments`, {
      method: "POST",
      body: JSON.stringify({ amount, method })
    });
  },

  async recognizeProduct(payload: { barcode?: string; hint?: string }) {
    return request<RecognitionResult>("/ai/recognize", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async recognizeProductImage(imageDataUrl: string, hint?: string) {
    return request<RecognitionResult>("/ai/recognize", { method: "POST", body: JSON.stringify({ imageDataUrl, hint }) });
  },

  async analyzeQuickSaleImage(imageDataUrl: string) {
    return request<QuickSaleAnalysis>("/ai/quick-sale/analyze", { method: "POST", body: JSON.stringify({ imageDataUrl }) });
  },

  async analyzeInvoiceImage(imageDataUrl: string) {
    return request<InvoiceAnalysis>("/ai/invoices/analyze", { method: "POST", body: JSON.stringify({ imageDataUrl }) });
  },

  async importInvoice(payload: InvoiceImportPayload) {
    return request<InvoiceImportResult>("/ai/invoices/import", { method: "POST", body: JSON.stringify(payload) });
  },

  async getRecognitionHistory() {
    return request<RecognitionLog[]>("/ai/history");
  },

  async confirmRecognition(recognitionId: string, payload: { confirmed?: boolean; userCorrection?: string; productId?: string }) {
    return request<RecognitionLog>(`/ai/recognitions/${recognitionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  async getCashRegister(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return request<CashRegisterSummary>(`/reports/cash-register${query}`);
  },

  async getCashClosures() {
    return request<CashRegisterClosure[]>("/cash-closures");
  },

  async closeCashRegister(payload: { date?: string; note?: string; closedByUserId?: string }) {
    return request<CashRegisterClosure>("/cash-closures", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async createWebpayPayment(amount: number, customerId?: string, saleId?: string) {
    return request<{ payment: { id: string; status: string }; redirectUrl: string }>("/payments/webpay/create", {
      method: "POST",
      body: JSON.stringify({ amount, customerId, saleId })
    });
  },

  async confirmWebpayPayment(paymentId: string) {
    return request<{ id: string; status: string }>(`/payments/webpay/${paymentId}/confirm`, {
      method: "POST"
    });
  },

  async returnSale(saleId: string, items: Array<{ productId: string; quantity: number }>, reason: string) { return request<SaleReturn>(`/sales/${saleId}/returns`, { method: "POST", body: JSON.stringify({ items, reason }) }); },
  async getSuppliers() { return request<Supplier[]>("/suppliers"); },
  async createSupplier(supplier: Partial<Supplier>) { return request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(supplier) }); },
  async updateSupplier(id: string, supplier: Partial<Supplier>) { return request<Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(supplier) }); },
  async getPurchases() { return request<PurchaseOrder[]>("/purchases"); },
  async createPurchase(purchase: { supplierId: string; expectedAt?: string; notes?: string; items: Array<{ productId: string; quantity: number; unitCost: number }> }) { return request<PurchaseOrder>("/purchases", { method: "POST", body: JSON.stringify(purchase) }); },
  async receivePurchase(id: string, quantities?: Record<string, number>) { return request<PurchaseOrder>(`/purchases/${id}/receive`, { method: "POST", body: JSON.stringify({ quantities }) }); },
  async getDebts() { return request<DebtAccount[]>("/debts"); },
  async getDebtReminders() { return request<Array<{ debt: DebtAccount; customer?: Customer; message: string; whatsappUrl?: string }>>("/debts/reminders"); },
  async getCashSession() { return request<CashSession | null>("/cash/session"); },
  async openCashSession(openingAmount: number) { return request<CashSession>("/cash/session/open", { method: "POST", body: JSON.stringify({ openingAmount }) }); },
  async addCashMovement(type: CashMovement["type"], amount: number, reason: string, category?: string) { return request<CashMovement>("/cash/movements", { method: "POST", body: JSON.stringify({ type, amount, reason, category }) }); },
  async getCashMovements() { return request<CashMovement[]>("/cash/movements"); },
  async closeCashSession(countedAmount: number, note?: string) { return request<CashSession>("/cash/session/close", { method: "POST", body: JSON.stringify({ countedAmount, note }) }); },
  async getStockMovements(productId?: string) { return request<StockMovement[]>(`/stock-movements${productId ? `?productId=${encodeURIComponent(productId)}` : ""}`); },
  async getAuditHistory(query: AuditQuery) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    return request<AuditPage>(`/audit/history?${params}`);
  },
  async getAuditEvents() { return request<AuditEvent[]>("/audit"); }
};
