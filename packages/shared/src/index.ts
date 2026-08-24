export type UserRole = "system_admin" | "owner" | "seller";

export type PaymentMethod = "cash" | "card" | "transfer" | "webpay" | "credit" | "mixed";

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";

export type SaleStatus = "active" | "cancelled" | "partially_refunded" | "refunded";

export type StockMovementType = "sale" | "return" | "purchase" | "adjustment" | "waste" | "transfer" | "count";
export type CashMovementType = "deposit" | "withdrawal" | "expense";
export type PurchaseStatus = "draft" | "ordered" | "partially_received" | "received" | "cancelled";
export type DebtStatus = "pending" | "overdue" | "paid" | "cancelled";

export interface Tenant {
  id: string;
  name: string;
  businessType: string;
  address?: string;
  phone?: string;
  active?: boolean;
  createdAt?: string;
}

export interface PlatformTenantSummary extends Tenant {
  active: boolean;
  userCount: number;
  productCount: number;
  ownerCount: number;
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
  sku?: string;
  variant?: string;
  unit?: "unit" | "kg" | "gram" | "liter" | "pack" | "box";
  unitsPerPack?: number;
  supplierId?: string;
  expiryDate?: string;
  trackStock?: boolean;
  active: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
  creditDays?: number;
  creditBlocked?: boolean;
  debtBalance: number;
  active: boolean;
}

export interface SalePayment {
  method: Exclude<PaymentMethod, "mixed" | "credit"> | "credit";
  amount: number;
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
  subtotal?: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments?: SalePayment[];
  notes?: string;
  paymentStatus: PaymentStatus;
  saleType: "normal" | "credit";
  status: SaleStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface SaleReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
}

export interface SaleReturn {
  id: string;
  tenantId: string;
  saleId: string;
  items: SaleReturnItem[];
  total: number;
  reason: string;
  createdByUserId?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  active: boolean;
}

export interface PurchaseItem {
  productId: string;
  productName?: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  total: number;
  expectedAt?: string;
  notes?: string;
  createdAt: string;
  receivedAt?: string;
}

export interface DebtAccount {
  id: string;
  tenantId: string;
  customerId: string;
  customerName?: string;
  saleId?: string;
  originalAmount: number;
  balance: number;
  dueDate?: string;
  status: DebtStatus;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  tenantId: string;
  sessionId?: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  tenantId: string;
  openedByUserId?: string;
  openedByName?: string;
  openedAt: string;
  openingAmount: number;
  status: "open" | "closed";
  closedAt?: string;
  closedByUserId?: string;
  countedAmount?: number;
  expectedCash?: number;
  difference?: number;
  note?: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  productName?: string;
  type: StockMovementType;
  quantity: number;
  resultingStock: number;
  reason?: string;
  createdByUserId?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
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

export type QuickSaleMatchStatus = "matched" | "needs_confirmation" | "unrecognized";

export interface QuickSaleCandidate {
  productId: string;
  name: string;
  brand?: string;
  variant?: string;
  salePrice: number;
  stock: number;
  trackStock: boolean;
}

export interface QuickSaleDetectedItem {
  id: string;
  observedLabel: string;
  productId?: string;
  productName?: string;
  quantity: number;
  confidence: number;
  status: QuickSaleMatchStatus;
  salePrice?: number;
  stock?: number;
  trackStock?: boolean;
  candidates: QuickSaleCandidate[];
}

export interface QuickSaleAnalysis {
  items: QuickSaleDetectedItem[];
  warnings: string[];
}

export function mergeQuickSaleTicket(
  products: Product[],
  currentTicket: SaleItem[],
  detectedItems: Array<{ productId: string; quantity: number }>
) {
  const grouped = new Map<string, number>();
  for (const item of detectedItems) {
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
    grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + quantity);
  }
  if (!grouped.size) throw new Error("Confirma al menos un producto antes de continuar.");

  const next = currentTicket.map((item) => ({ ...item }));
  for (const [productId, quantity] of grouped) {
    const product = products.find((candidate) => candidate.id === productId && candidate.active);
    if (!product) throw new Error("Uno de los productos ya no está disponible en el inventario.");
    const index = next.findIndex((item) => item.productId === productId);
    const totalQuantity = (index >= 0 ? next[index].quantity : 0) + quantity;
    if (product.trackStock !== false && totalQuantity > product.stock) {
      throw new Error(`${product.name}: la venta solicita ${totalQuantity}, pero el stock registrado es ${product.stock}.`);
    }
    const saleItem: SaleItem = {
      productId,
      productName: product.name,
      quantity: totalQuantity,
      unitPrice: product.salePrice,
      subtotal: totalQuantity * product.salePrice
    };
    if (index >= 0) next[index] = saleItem;
    else next.push(saleItem);
  }
  return { ticket: next, units: [...grouped.values()].reduce((sum, quantity) => sum + quantity, 0) };
}

export interface InvoiceAnalysisItem {
  id: string;
  rawDescription: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  existingProductId?: string;
  confidence: number;
}

export interface InvoiceAnalysis {
  supplierName: string;
  supplierTaxId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  netTotal?: number;
  taxTotal?: number;
  total: number;
  items: InvoiceAnalysisItem[];
  warnings: string[];
}

export interface InvoiceImportItem {
  clientItemId: string;
  existingProductId?: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  quantity: number;
  unitCost: number;
  salePrice: number;
}

export interface InvoiceImportPayload {
  clientImportId: string;
  supplierId?: string;
  supplierName: string;
  supplierTaxId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  total?: number;
  items: InvoiceImportItem[];
}

export interface InvoiceImportResult {
  purchase: PurchaseOrder;
  supplier: Supplier;
  products: Product[];
  createdProductIds: string[];
  alreadyImported: boolean;
}

export interface ProductImportRow {
  rowNumber?: number;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  costPrice?: number;
  salePrice: number;
  stock?: number;
  minimumStock?: number;
  sku?: string;
  unit?: Product["unit"];
  unitsPerPack?: number;
}

export interface ProductBulkImportPayload {
  clientImportId: string;
  rows: ProductImportRow[];
}

export interface ProductImportIssue {
  rowNumber: number;
  name?: string;
  reason: string;
}

export interface ProductBulkImportResult {
  created: Product[];
  existingProductIds: string[];
  skipped: ProductImportIssue[];
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
  openingAmount?: number;
  cashDeposits?: number;
  cashWithdrawals?: number;
  expectedCash?: number;
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
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  debts: DebtAccount[];
  cashSession?: CashSession;
  cashMovements: CashMovement[];
  auditEvents: AuditEvent[];
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
