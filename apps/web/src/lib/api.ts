import type {
  ApiResponse,
  CashRegisterClosure,
  BootstrapData,
  CashRegisterSummary,
  Customer,
  PaymentMethod,
  Product,
  RecognitionLog,
  RecognitionResult,
  Sale,
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
const TENANT_ID = "00000000-0000-4000-8000-000000000001";

type SalePayload = {
  customerId?: string;
  paymentMethod: PaymentMethod;
  items: Array<{ productId: string; quantity: number }>;
};

export type AuthSession = {
  user: User;
  tenant: Tenant;
  token: string;
};

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("localito-token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": TENANT_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? "No se pudo completar la operacion.");
  }

  return payload;
}

export const api = {
  async login(email: string, password: string) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

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
    return request<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(payload)
    });
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
  }
};
