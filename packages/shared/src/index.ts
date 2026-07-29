export type UserRole = "system_admin" | "owner" | "seller";

export type PaymentMethod = "cash" | "card" | "transfer" | "webpay" | "credit";

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";

export type SaleStatus = "active" | "cancelled";

export interface Tenant {
  id: string;
  name: string;
  businessType: string;
  address?: string;
  phone?: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  imageUrl?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  debtBalance: number;
  active: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  tenantId: string;
  sellerId: string;
  customerId?: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  saleType: "normal" | "credit";
  status: SaleStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  stock: number;
  minimumStock: number;
  severity: "info" | "warning" | "critical";
}

export interface RecognitionResult {
  id: string;
  productId?: string;
  productName: string;
  confidence: number;
  source: "barcode" | "vision" | "manual";
  stock?: number;
  salePrice?: number;
  needsConfirmation: boolean;
}

export interface RecognitionLog extends RecognitionResult {
  tenantId: string;
  confirmed: boolean;
  userCorrection?: string;
  createdAt: string;
}

export interface ReportSummary {
  totalSales: number;
  salesCount: number;
  pendingDebt: number;
  lowStockCount: number;
  stockValue: number;
}

export interface CashRegisterSummary {
  date: string;
  salesCount: number;
  cancelledSalesCount: number;
  grossTotal: number;
  receivedTotal: number;
  creditTotal: number;
  averageTicket: number;
  totalsByMethod: Record<PaymentMethod, number>;
}

export interface CashRegisterClosure extends CashRegisterSummary {
  id: string;
  tenantId: string;
  closedByUserId?: string;
  closedByName?: string;
  note?: string;
  closedAt: string;
}

export interface WebpayPayment {
  id: string;
  amount: number;
  status: PaymentStatus;
  redirectUrl: string;
  externalTransactionId?: string;
}

export interface BootstrapData {
  tenant: Tenant;
  user: User;
  users: User[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  recognitionHistory: RecognitionLog[];
  cashRegister: CashRegisterSummary;
  cashClosures: CashRegisterClosure[];
  alerts: StockAlert[];
  summary: ReportSummary;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
