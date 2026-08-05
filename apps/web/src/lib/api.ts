import type {
  ApiResponse,
  AuditEvent,
  CashRegisterClosure,
  BootstrapData,
  CashMovement,
  CashRegisterSummary,
  CashSession,
  Customer,
  DebtAccount,
  PaymentMethod,
  Product,
  PurchaseOrder,
  RecognitionLog,
  RecognitionResult,
  Sale,
  SalePayment,
  SaleReturn,
  StockMovement,
  Supplier,
  Tenant,
  User
} from "@localito/shared";

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

type OfflineRequest = { id: string; path: string; options: { method: string; body?: string; headers?: Record<string, string> }; createdAt: string };

function readOfflineQueue(): OfflineRequest[] {
  try { return JSON.parse(localStorage.getItem("localito-offline-queue") ?? "[]") as OfflineRequest[]; } catch { return []; }
}

function queueOfflineRequest(path: string, options: RequestInit) {
  const queue = readOfflineQueue();
  queue.push({ id: crypto.randomUUID(), path, options: { method: options.method ?? "POST", body: typeof options.body === "string" ? options.body : undefined, headers: options.headers as Record<string, string> | undefined }, createdAt: new Date().toISOString() });
  localStorage.setItem("localito-offline-queue", JSON.stringify(queue));
}

async function request<T>(path: string, options: RequestInit = {}, queueWhenOffline = false) {
  const token = localStorage.getItem("localito-token");
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
    });
  } catch (error) {
    if (queueWhenOffline && options.method && options.method !== "GET") {
      queueOfflineRequest(path, options);
      throw new Error("Sin conexión: la operación quedó guardada y se sincronizará automáticamente.");
    }
    throw error;
  }

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? "No se pudo completar la operacion.");
  }

  return payload;
}

export async function flushOfflineQueue() {
  if (!navigator.onLine) return { synced: 0, pending: readOfflineQueue().length };
  const queue = readOfflineQueue(); const pending: OfflineRequest[] = []; let synced = 0;
  for (const entry of queue) {
    try { await request(entry.path, { ...entry.options, headers: entry.options.headers }); synced += 1; } catch { pending.push(entry); }
  }
  localStorage.setItem("localito-offline-queue", JSON.stringify(pending));
  return { synced, pending: pending.length };
}

export const api = {
  async login(email: string, password: string) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  async register(payload: { name: string; email: string; password: string; businessName: string; businessType: string }) {
    return request<AuthSession>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },

  async logout() { return request<void>("/auth/logout", { method: "POST" }); },

  async bootstrap() {
    return request<BootstrapData>("/bootstrap");
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

  async createProduct(product: Partial<Product>) {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product)
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
    }, true);
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
  async addCashMovement(type: CashMovement["type"], amount: number, reason: string) { return request<CashMovement>("/cash/movements", { method: "POST", body: JSON.stringify({ type, amount, reason }) }); },
  async getCashMovements() { return request<CashMovement[]>("/cash/movements"); },
  async closeCashSession(countedAmount: number, note?: string) { return request<CashSession>("/cash/session/close", { method: "POST", body: JSON.stringify({ countedAmount, note }) }); },
  async getStockMovements(productId?: string) { return request<StockMovement[]>(`/stock-movements${productId ? `?productId=${encodeURIComponent(productId)}` : ""}`); },
  async getAuditEvents() { return request<AuditEvent[]>("/audit"); }
};
