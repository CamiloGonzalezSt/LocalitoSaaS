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
  Subscription,
  Tenant,
  User
} from "@localito/shared";
import {
  buildDemoCustomers,
  buildDemoProducts,
  buildDemoSuppliers,
  buildDemoUsers,
  demoTenantIds,
  demoTenantSeeds,
  demoUserIds
} from "./demoData.js";
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
  passwordResetTokens: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    createdAt: string;
    usedAt?: string;
  }>;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  debts: DebtAccount[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  stockMovements: StockMovement[];
  auditEvents: AuditEvent[];
  saleReturns: SaleReturn[];
  idempotencyKeys: Record<string, string>;
  subscriptions: Subscription[];
}

export const demoTenantId = demoTenantIds.dondeJuanita;
export const demoOwnerId = demoUserIds.dondeJuanitaOwner;
export const demoSellerId = demoUserIds.dondeJuanitaSeller;
export const systemTenantId = "00000000-0000-4000-8000-000000009999";
export const systemAdminId = "00000000-0000-4000-8000-000000009901";
export const systemAdminEmail = process.env.PLATFORM_ADMIN_EMAIL ?? "caj.gonzalez.st@gmail.com";
const systemAdminPassword =
  process.env.PLATFORM_ADMIN_PASSWORD ??
  (process.env.NODE_ENV === "production" ? randomUUID() : "AdminLocalito2026");
const demoUsers = buildDemoUsers();
const demoPasswordHashes = Object.fromEntries(
  demoUsers.map((user) => [
    user.id,
    hashPassword(
      user.role === "seller"
        ? process.env.SELLER_DEMO_PASSWORD ?? "Duoc2026V"
        : process.env.OWNER_DEMO_PASSWORD ?? process.env.DEMO_PASSWORD ?? "Duoc2026"
    )
  ])
);

export const store: Store = {
  tenants: [
    ...demoTenantSeeds.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      businessType: tenant.businessType,
      address: tenant.address,
      phone: tenant.phone,
      active: tenant.active
    })),
    {
      id: systemTenantId,
      name: "Administración Localito",
      businessType: "Plataforma",
      active: true
    }
  ],
  users: [
    ...demoUsers,
    { id: systemAdminId, tenantId: systemTenantId, name: "Camilo Gonzalez", email: systemAdminEmail, role: "system_admin", active: true }
  ],
  products: buildDemoProducts(),
  customers: buildDemoCustomers(),
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
    ...demoPasswordHashes,
    [systemAdminId]: hashPassword(systemAdminPassword)
  },
  sessions: [],
  passwordResetTokens: [],
  suppliers: buildDemoSuppliers(),
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
  idempotencyKeys: {},
  subscriptions: demoTenantSeeds.map((tenant) => {
    const now = new Date();
    return {
      id: randomUUID(),
      tenantId: tenant.id,
      plan: "pro" as const,
      status: "active" as const,
      currentPeriodStartedAt: now.toISOString(),
      currentPeriodEndsAt: new Date(now.getTime() + 365 * 86_400_000).toISOString(),
      paymentProvider: "manual",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  })
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
  const productCosts = new Map(products.map((product) => [product.id, product.costPrice]));
  const estimatedCost = netSales.reduce((sum, entry) => {
    const originalCost = entry.sale.items.reduce((saleCost, item) => saleCost + (productCosts.get(item.productId) ?? 0) * item.quantity, 0);
    const retainedRatio = entry.sale.total > 0 ? entry.total / entry.sale.total : 0;
    return sum + Math.round(originalCost * retainedRatio);
  }, 0);
  const totalSales = netSales.reduce((sum, entry) => sum + entry.total, 0);
  const operatingExpenses = store.cashMovements.filter((movement) => movement.tenantId === tenantId && movement.type === "expense").reduce((sum, movement) => sum + movement.amount, 0);
  const estimatedGrossProfit = totalSales - estimatedCost;

  return {
    totalSales,
    salesCount: netSales.length,
    operatingExpenses,
    estimatedGrossProfit,
    estimatedNetResult: estimatedGrossProfit - operatingExpenses,
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
