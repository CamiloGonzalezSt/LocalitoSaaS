import { randomUUID } from "node:crypto";
import type {
  CashRegisterClosure,
  CashRegisterSummary,
  Customer,
  PaymentMethod,
  PaymentStatus,
  Product,
  RecognitionLog,
  ReportSummary,
  Sale,
  StockAlert,
  Tenant,
  User
} from "@localito/shared";
import { buildDemoProducts, buildDemoUsers } from "./demoData.js";

export interface PaymentRecord {
  id: string;
  tenantId: string;
  saleId?: string;
  customerId?: string;
  amount: number;
  method: "cash" | "card" | "transfer" | "webpay" | "credit";
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
  cashClosures: []
};

export function getTenantProducts(tenantId: string) {
  return store.products.filter((product) => product.tenantId === tenantId && product.active);
}

export function getTenantCustomers(tenantId: string) {
  return store.customers.filter((customer) => customer.tenantId === tenantId && customer.active);
}

export function getStockAlerts(tenantId: string): StockAlert[] {
  return getTenantProducts(tenantId)
    .filter((product) => product.stock <= product.minimumStock)
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

  return {
    totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
    salesCount: sales.length,
    pendingDebt: customers.reduce((sum, customer) => sum + customer.debtBalance, 0),
    lowStockCount: getStockAlerts(tenantId).length,
    stockValue: products.reduce((sum, product) => sum + product.stock * product.salePrice, 0)
  };
}

export function getCashRegisterSummary(tenantId: string, date = new Date()): CashRegisterSummary {
  const dayKey = date.toISOString().slice(0, 10);
  const salesForDay = store.sales.filter((sale) => sale.tenantId === tenantId && sale.createdAt.slice(0, 10) === dayKey);
  const activeSales = salesForDay.filter((sale) => sale.status !== "cancelled");
  const totalsByMethod = {
    cash: 0,
    card: 0,
    transfer: 0,
    webpay: 0,
    credit: 0
  } satisfies Record<PaymentMethod, number>;

  for (const sale of activeSales) {
    totalsByMethod[sale.paymentMethod] += sale.total;
  }

  const grossTotal = activeSales.reduce((sum, sale) => sum + sale.total, 0);
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
