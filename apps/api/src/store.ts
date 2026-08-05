import { randomUUID } from "node:crypto";
import type {
  AuditEvent,
  CashMovement,
  CashRegisterClosure,
  CashRegisterSummary,
  CashSession,
  Customer,
  DebtAccount,
  PaymentMethod,
  PaymentStatus,
  Product,
  PurchaseOrder,
  RecognitionLog,
  ReportSummary,
  Sale,
  SaleReturn,
  StockAlert,
  StockMovement,
  Supplier,
  Tenant,
  User
} from "@localito/shared";
import { buildDemoProducts, buildDemoUsers } from "./demoData.js";
import { hashPassword } from "./auth.js";

export interface PaymentRecord {
  id: string;
  tenantId: string;
  saleId?: string;
  customerId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  externalTransactionId?: string;
  createdAt: string;
}

export interface Store {
  tenants: Tenant[];
  users: User[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  payments: PaymentRecord[];
  recognitionLogs: RecognitionLog[];
  cashClosures: CashRegisterClosure[];
  passwordHashes: Record<string, string>;
  sessions: Array<{ tokenHash: string; userId: string; expiresAt: string; revokedAt?: string }>;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  debts: DebtAccount[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  stockMovements: StockMovement[];
  auditEvents: AuditEvent[];
  saleReturns: SaleReturn[];
  idempotencyKeys: Record<string, string>;
}

export const demoTenantId = "00000000-0000-4000-8000-000000000001";
export const demoOwnerId = "00000000-0000-4000-8000-000000000101";
export const demoSellerId = "00000000-0000-4000-8000-000000000201";

export const store: Store = {
  tenants: [
    {
      id: demoTenantId,
      name: "Almacen Don Pepe",
      businessType: "Almacen",
      address: "Pasaje Los Aromos 123",
      phone: "+56 9 1234 5678"
    }
  ],
  users: buildDemoUsers(demoTenantId),
  products: buildDemoProducts(demoTenantId),
  customers: [
    {
      id: "cust-ana",
      tenantId: demoTenantId,
      name: "Ana Riquelme",
      phone: "+56 9 8765 4321",
      debtBalance: 14500,
      active: true
    },
    {
      id: "cust-juan",
      tenantId: demoTenantId,
      name: "Juan Perez",
      phone: "+56 9 1122 3344",
      debtBalance: 6200,
      active: true
    }
  ],
  sales: [
    {
      id: "sale-001",
      tenantId: demoTenantId,
      sellerId: demoSellerId,
      items: [
        {
          productId: "prod-coca-15",
          productName: "Coca-Cola Bebida Original Botella 1,5 L",
          quantity: 2,
          unitPrice: 2150,
          subtotal: 4300
        }
      ],
      total: 4300,
      paymentMethod: "cash",
      paymentStatus: "approved",
      saleType: "normal",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "sale-002",
      tenantId: demoTenantId,
      sellerId: demoSellerId,
      customerId: "cust-ana",
      items: [
        {
          productId: "prod-pan-molde",
          productName: "Ideal Pan de Molde Integral Bolsa 580 g",
          quantity: 1,
          unitPrice: 2390,
          subtotal: 2390
        }
      ],
      total: 2390,
      paymentMethod: "credit",
      paymentStatus: "approved",
      saleType: "credit",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ],
  payments: [],
  recognitionLogs: [],
  cashClosures: [],
  passwordHashes: {
    [demoOwnerId]: hashPassword(process.env.OWNER_DEMO_PASSWORD ?? process.env.DEMO_PASSWORD ?? "Duoc2026"),
    [demoSellerId]: hashPassword(process.env.SELLER_DEMO_PASSWORD ?? "Duoc2026V")
  },
  sessions: [],
  suppliers: [
    {
      id: "supplier-demo-001",
      tenantId: demoTenantId,
      name: "Distribuidora Barrio Sur",
      contactName: "María Soto",
      phone: "+56 9 5555 1200",
      active: true
    }
  ],
  purchaseOrders: [],
  debts: [
    {
      id: "debt-demo-ana",
      tenantId: demoTenantId,
      customerId: "cust-ana",
      customerName: "Ana Riquelme",
      originalAmount: 14500,
      balance: 14500,
      dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
      status: "pending",
      createdAt: new Date().toISOString()
    },
    {
      id: "debt-demo-juan",
      tenantId: demoTenantId,
      customerId: "cust-juan",
      customerName: "Juan Perez",
      originalAmount: 6200,
      balance: 6200,
      dueDate: new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10),
      status: "overdue",
      createdAt: new Date().toISOString()
    }
  ],
  cashSessions: [],
  cashMovements: [],
  stockMovements: [],
  auditEvents: [],
  saleReturns: [],
  idempotencyKeys: {}
};

export function getTenantProducts(tenantId: string) {
  return store.products.filter((product) => product.tenantId === tenantId && product.active);
}

export function getTenantCustomers(tenantId: string) {
  return store.customers.filter((customer) => customer.tenantId === tenantId && customer.active);
}

export function getStockAlerts(tenantId: string): StockAlert[] {
  return getTenantProducts(tenantId)
    .filter((product) => product.trackStock !== false && product.stock <= product.minimumStock)
    .map((product) => ({
      id: randomUUID(),
      tenantId,
      productId: product.id,
      productName: product.name,
      stock: product.stock,
      minimumStock: product.minimumStock,
      severity: product.stock === 0 ? "critical" : "warning"
    }));
}

export function getReportSummary(tenantId: string): ReportSummary {
  const products = getTenantProducts(tenantId);
  const customers = getTenantCustomers(tenantId);
  const sales = store.sales.filter((sale) => sale.tenantId === tenantId && sale.status !== "cancelled");
  const netSales = sales.map((sale) => ({ sale, total: netSaleTotal(sale) })).filter((entry) => entry.total > 0);

  return {
    totalSales: netSales.reduce((sum, entry) => sum + entry.total, 0),
    salesCount: netSales.length,
    pendingDebt: customers.reduce((sum, customer) => sum + customer.debtBalance, 0),
    lowStockCount: getStockAlerts(tenantId).length,
    stockValue: products.reduce((sum, product) => sum + product.stock * product.salePrice, 0)
  };
}

export function getCashRegisterSummary(tenantId: string, date = new Date(), openedAt?: string): CashRegisterSummary {
  const dayKey = date.toISOString().slice(0, 10);
  const salesForDay = store.sales.filter(
    (sale) => sale.tenantId === tenantId && sale.createdAt.slice(0, 10) === dayKey && (!openedAt || sale.createdAt >= openedAt)
  );
  const activeSales = salesForDay
    .filter((sale) => sale.status !== "cancelled")
    .map((sale) => ({ sale, total: netSaleTotal(sale) }))
    .filter((entry) => entry.total > 0);
  const totalsByMethod = {
    cash: 0,
    card: 0,
    transfer: 0,
    webpay: 0,
    credit: 0,
    mixed: 0
  } satisfies Record<PaymentMethod, number>;

  for (const entry of activeSales) {
    addNetPaymentTotals(totalsByMethod, entry.sale, entry.total);
  }

  const grossTotal = activeSales.reduce((sum, entry) => sum + entry.total, 0);
  const creditTotal = totalsByMethod.credit;
  const receivedTotal = grossTotal - creditTotal;

  return {
    date: dayKey,
    salesCount: activeSales.length,
    cancelledSalesCount: salesForDay.length - activeSales.length,
    grossTotal,
    receivedTotal,
    creditTotal,
    averageTicket: activeSales.length > 0 ? Math.round(grossTotal / activeSales.length) : 0,
    totalsByMethod
  };
}

function netSaleTotal(sale: Sale) {
  const returned = store.saleReturns
    .filter((entry) => entry.tenantId === sale.tenantId && entry.saleId === sale.id)
    .reduce((sum, entry) => sum + entry.total, 0);
  return Math.max(0, sale.total - returned);
}

function addNetPaymentTotals(totals: Record<PaymentMethod, number>, sale: Sale, netTotal: number) {
  if (!sale.payments?.length || sale.total <= 0) {
    totals[sale.paymentMethod] += netTotal;
    return;
  }

  let remaining = netTotal;
  sale.payments.forEach((payment, index) => {
    const amount = index === sale.payments!.length - 1
      ? remaining
      : Math.min(remaining, Math.round((payment.amount / sale.total) * netTotal));
    totals[payment.method] += amount;
    remaining -= amount;
  });
}
