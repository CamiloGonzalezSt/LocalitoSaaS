import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";
import type {
  BootstrapData,
  CashRegisterClosure,
  CashRegisterSummary,
  Customer,
  PaymentMethod,
  Product,
  RecognitionLog,
  RecognitionResult,
  Sale,
  SaleItem,
  Tenant,
  User
} from "@localito/shared";
import {
  demoOwnerId,
  demoSellerId,
  demoTenantId,
  getCashRegisterSummary,
  getReportSummary,
  getStockAlerts,
  getTenantCustomers,
  getTenantProducts,
  store
} from "./store.js";

const { Pool } = pg;

type Queryable = pg.Pool | pg.PoolClient;

type ProductMatch = {
  product?: Product;
  confidence: number;
  source: RecognitionResult["source"];
};

export interface PaymentRecord {
  id: string;
  tenantId: string;
  saleId?: string;
  customerId?: string;
  amount: number;
  method: PaymentMethod;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  externalTransactionId?: string;
  createdAt: string;
}

export interface DataRepository {
  mode: "memory" | "postgres";
  bootstrap(tenantId: string): Promise<BootstrapData>;
  getUsers(tenantId: string): Promise<User[]>;
  createUser(tenantId: string, user: Partial<User> & { password?: string }): Promise<User>;
  updateUser(tenantId: string, userId: string, user: Partial<User>): Promise<User | null>;
  getProducts(tenantId: string): Promise<Product[]>;
  createProduct(tenantId: string, product: Partial<Product>): Promise<Product>;
  updateProduct(tenantId: string, productId: string, product: Partial<Product>): Promise<Product | null>;
  deactivateProduct(tenantId: string, productId: string): Promise<Product | null>;
  updateStock(tenantId: string, productId: string, quantity: number): Promise<Product | null>;
  getCustomers(tenantId: string): Promise<Customer[]>;
  createCustomer(tenantId: string, customer: Partial<Customer>): Promise<Customer>;
  updateCustomer(tenantId: string, customerId: string, customer: Partial<Customer>): Promise<Customer | null>;
  deactivateCustomer(tenantId: string, customerId: string): Promise<Customer | null>;
  getSales(tenantId: string): Promise<Sale[]>;
  createSale(
    tenantId: string,
    payload: { customerId?: string; paymentMethod: PaymentMethod; items: Array<{ productId: string; quantity: number }> }
  ): Promise<Sale>;
  cancelSale(tenantId: string, saleId: string, reason?: string): Promise<Sale | null>;
  getCashRegister(tenantId: string, date?: string): Promise<CashRegisterSummary>;
  getCashClosures(tenantId: string): Promise<CashRegisterClosure[]>;
  closeCashRegister(
    tenantId: string,
    payload: { date?: string; note?: string; closedByUserId?: string }
  ): Promise<CashRegisterClosure>;
  payCustomerDebt(
    tenantId: string,
    customerId: string,
    amount: number,
    method: PaymentMethod
  ): Promise<{ customer: Customer; payment: PaymentRecord } | null>;
  recognizeProduct(tenantId: string, payload: { barcode?: string; hint?: string }): Promise<RecognitionResult>;
  getRecognitionHistory(tenantId: string): Promise<RecognitionLog[]>;
  confirmRecognition(
    tenantId: string,
    recognitionId: string,
    payload: { confirmed?: boolean; userCorrection?: string; productId?: string }
  ): Promise<RecognitionLog | null>;
  createWebpayPayment(
    tenantId: string,
    payload: { amount: number; saleId?: string; customerId?: string }
  ): Promise<{ payment: PaymentRecord; redirectUrl: string }>;
  confirmWebpayPayment(tenantId: string, paymentId: string): Promise<PaymentRecord | null>;
}

export async function createRepository() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return new MemoryRepository();
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query("select 1");
    const repository = new PostgresRepository(pool);
    await repository.init();
    return repository;
  } catch (error) {
    await pool.end().catch(() => undefined);
    console.warn(
      `[localito-api] PostgreSQL no disponible, usando memoria. Motivo: ${
        error instanceof Error ? error.message : "error desconocido"
      }`
    );
    return new MemoryRepository();
  }
}

function buildMemoryBootstrap(tenantId: string): BootstrapData {
  const tenant = store.tenants.find((candidate) => candidate.id === tenantId) ?? store.tenants[0];
  const user =
    store.users.find((candidate) => candidate.tenantId === tenant.id && candidate.id === demoOwnerId) ??
    store.users.find((candidate) => candidate.tenantId === tenant.id) ??
    store.users[0];

  return {
    tenant,
    user,
    users: store.users.filter((candidate) => candidate.tenantId === tenant.id && candidate.active !== false),
    products: getTenantProducts(tenant.id),
    customers: getTenantCustomers(tenant.id),
    sales: store.sales.filter((sale) => sale.tenantId === tenant.id),
    recognitionHistory: store.recognitionLogs
      .filter((recognition) => recognition.tenantId === tenant.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12),
    cashRegister: getCashRegisterSummary(tenant.id),
    cashClosures: store.cashClosures
      .filter((closure) => closure.tenantId === tenant.id)
      .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
      .slice(0, 5),
    alerts: getStockAlerts(tenant.id),
    summary: getReportSummary(tenant.id)
  };
}

function toOptional(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeSearchValue(value?: string | number) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeBarcode(value?: string | number) {
  return String(value ?? "").replace(/\D/g, "");
}

function findBestProductMatch(products: Product[], payload: { barcode?: string; hint?: string }): ProductMatch {
  const barcode = normalizeBarcode(payload.barcode);
  if (barcode) {
    const exactBarcode = products.find((product) => normalizeBarcode(product.barcode) === barcode);
    if (exactBarcode) return { product: exactBarcode, confidence: 0.99, source: "barcode" };

    const partialBarcode = products.find((product) => {
      const productBarcode = normalizeBarcode(product.barcode);
      return productBarcode.length >= 5 && (productBarcode.includes(barcode) || barcode.includes(productBarcode));
    });
    if (partialBarcode) return { product: partialBarcode, confidence: 0.94, source: "barcode" };
  }

  const hint = normalizeSearchValue(payload.hint);
  if (!hint) return { confidence: 0.35, source: "vision" };

  const hintTokens = hint.split(" ").filter((token) => token.length > 1);
  let best: ProductMatch = { confidence: 0.35, source: "vision" };

  for (const product of products) {
    const name = normalizeSearchValue(product.name);
    const brand = normalizeSearchValue(product.brand);
    const category = normalizeSearchValue(product.category);
    const productBarcode = normalizeBarcode(product.barcode);
    const searchable = [name, brand, category, productBarcode].filter(Boolean).join(" ");

    let score = 0;
    if (name === hint) score = 0.96;
    else if (name.includes(hint)) score = 0.92;
    else if (brand && brand.includes(hint)) score = 0.88;
    else if (category && category.includes(hint)) score = 0.78;
    else if (hintTokens.length > 0) {
      const matches = hintTokens.filter((token) => searchable.includes(token)).length;
      const ratio = matches / hintTokens.length;
      if (ratio >= 1) score = 0.9;
      else if (ratio >= 0.67) score = 0.84;
      else if (ratio >= 0.5) score = 0.76;
      else if (matches > 0) score = 0.62;
    }

    if (score > best.confidence) {
      best = { product, confidence: score, source: "vision" };
    }
  }

  if (!best.product || best.confidence < 0.6) return { confidence: 0.35, source: "vision" };
  return best;
}

function readPositiveNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback;
}

function readUserRole(value: unknown): User["role"] {
  return value === "seller" ? "seller" : "owner";
}

function salesDateFromInput(value?: string) {
  if (!value) return new Date();
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildCashRegisterFromSales(sales: Sale[], date = new Date()): CashRegisterSummary {
  const dayKey = date.toISOString().slice(0, 10);
  const salesForDay = sales.filter((sale) => sale.createdAt.slice(0, 10) === dayKey);
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

  return {
    date: dayKey,
    salesCount: activeSales.length,
    cancelledSalesCount: salesForDay.length - activeSales.length,
    grossTotal,
    receivedTotal: grossTotal - creditTotal,
    creditTotal,
    averageTicket: activeSales.length > 0 ? Math.round(grossTotal / activeSales.length) : 0,
    totalsByMethod
  };
}

class MemoryRepository implements DataRepository {
  mode = "memory" as const;

  async bootstrap(tenantId: string) {
    return buildMemoryBootstrap(tenantId);
  }

  async getUsers(tenantId: string) {
    return store.users.filter((user) => user.tenantId === tenantId && user.active !== false);
  }

  async createUser(tenantId: string, body: Partial<User> & { password?: string }) {
    const user: User = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      role: readUserRole(body.role),
      active: true
    };
    store.users.push(user);
    return user;
  }

  async updateUser(tenantId: string, userId: string, body: Partial<User>) {
    const user = store.users.find((candidate) => candidate.id === userId && candidate.tenantId === tenantId);
    if (!user) return null;

    if (body.name != null && body.name.trim().length > 0) user.name = body.name.trim();
    if (body.email != null && body.email.trim().length > 0) user.email = body.email.trim().toLowerCase();
    if (body.role != null) user.role = readUserRole(body.role);
    if (body.active != null) user.active = Boolean(body.active);
    return user;
  }

  async getProducts(tenantId: string) {
    return getTenantProducts(tenantId);
  }

  async createProduct(tenantId: string, body: Partial<Product>) {
    const product: Product = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      brand: toOptional(body.brand),
      category: String(body.category).trim(),
      barcode: toOptional(body.barcode),
      costPrice: readPositiveNumber(body.costPrice),
      salePrice: readPositiveNumber(body.salePrice),
      stock: readPositiveNumber(body.stock),
      minimumStock: readPositiveNumber(body.minimumStock),
      imageUrl: toOptional(body.imageUrl),
      active: true
    };
    store.products.push(product);
    return product;
  }

  async updateProduct(tenantId: string, productId: string, body: Partial<Product>) {
    const product = store.products.find((candidate) => candidate.id === productId && candidate.tenantId === tenantId);
    if (!product) return null;

    if (body.name != null && body.name.trim().length > 0) product.name = body.name.trim();
    if (body.brand != null) product.brand = toOptional(body.brand);
    if (body.category != null && body.category.trim().length > 0) product.category = body.category.trim();
    if (body.barcode != null) product.barcode = toOptional(body.barcode);
    if (body.costPrice != null) product.costPrice = readPositiveNumber(body.costPrice, product.costPrice);
    if (body.salePrice != null) product.salePrice = readPositiveNumber(body.salePrice, product.salePrice);
    if (body.stock != null) product.stock = readPositiveNumber(body.stock, product.stock);
    if (body.minimumStock != null) product.minimumStock = readPositiveNumber(body.minimumStock, product.minimumStock);
    if (body.active != null) product.active = Boolean(body.active);

    return product;
  }

  async deactivateProduct(tenantId: string, productId: string) {
    return this.updateProduct(tenantId, productId, { active: false });
  }

  async updateStock(tenantId: string, productId: string, quantity: number) {
    const product = store.products.find((candidate) => candidate.id === productId && candidate.tenantId === tenantId);
    if (!product) return null;
    product.stock = quantity;
    return product;
  }

  async getCustomers(tenantId: string) {
    return getTenantCustomers(tenantId);
  }

  async createCustomer(tenantId: string, body: Partial<Customer>) {
    const customer: Customer = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      phone: toOptional(body.phone),
      email: toOptional(body.email),
      address: toOptional(body.address),
      debtBalance: 0,
      active: true
    };
    store.customers.push(customer);
    return customer;
  }

  async updateCustomer(tenantId: string, customerId: string, body: Partial<Customer>) {
    const customer = store.customers.find((candidate) => candidate.id === customerId && candidate.tenantId === tenantId);
    if (!customer) return null;

    if (body.name != null && body.name.trim().length > 0) customer.name = body.name.trim();
    if (body.phone != null) customer.phone = toOptional(body.phone);
    if (body.email != null) customer.email = toOptional(body.email);
    if (body.address != null) customer.address = toOptional(body.address);
    if (body.active != null) customer.active = Boolean(body.active);
    return customer;
  }

  async deactivateCustomer(tenantId: string, customerId: string) {
    return this.updateCustomer(tenantId, customerId, { active: false });
  }

  async getSales(tenantId: string) {
    return store.sales.filter((sale) => sale.tenantId === tenantId);
  }

  async createSale(
    tenantId: string,
    body: { customerId?: string; paymentMethod: PaymentMethod; items: Array<{ productId: string; quantity: number }> }
  ) {
    const saleItems: SaleItem[] = [];

    for (const item of body.items) {
      const product = store.products.find((candidate) => candidate.id === item.productId && candidate.tenantId === tenantId);
      if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
      if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);

      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal: product.salePrice * item.quantity
      });
    }

    const total = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const isCredit = body.paymentMethod === "credit";

    if (isCredit && !body.customerId) {
      throw new Error("Una venta fiada debe estar asociada a un cliente.");
    }

    const sale: Sale = {
      id: randomUUID(),
      tenantId,
      sellerId: demoSellerId,
      customerId: body.customerId,
      items: saleItems,
      total,
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentMethod === "webpay" ? "pending" : "approved",
      saleType: isCredit ? "credit" : "normal",
      status: "active",
      createdAt: new Date().toISOString()
    };

    for (const item of saleItems) {
      const product = store.products.find((candidate) => candidate.id === item.productId);
      if (product) product.stock -= item.quantity;
    }

    if (isCredit && body.customerId) {
      const customer = store.customers.find((candidate) => candidate.id === body.customerId && candidate.tenantId === tenantId);
      if (customer) customer.debtBalance += total;
    }

    store.sales.push(sale);
    return sale;
  }

  async cancelSale(tenantId: string, saleId: string, reason?: string) {
    const sale = store.sales.find((candidate) => candidate.id === saleId && candidate.tenantId === tenantId);
    if (!sale) return null;
    if (sale.status === "cancelled") return sale;

    sale.status = "cancelled";
    sale.paymentStatus = "cancelled";
    sale.cancellationReason = toOptional(reason) ?? "Anulada desde Localito";
    sale.cancelledAt = new Date().toISOString();

    for (const item of sale.items) {
      const product = store.products.find((candidate) => candidate.id === item.productId && candidate.tenantId === tenantId);
      if (product) product.stock += item.quantity;
    }

    if (sale.saleType === "credit" && sale.customerId) {
      const customer = store.customers.find((candidate) => candidate.id === sale.customerId && candidate.tenantId === tenantId);
      if (customer) customer.debtBalance = Math.max(0, customer.debtBalance - sale.total);
    }

    return sale;
  }

  async getCashRegister(tenantId: string, date?: string) {
    return getCashRegisterSummary(tenantId, salesDateFromInput(date));
  }

  async getCashClosures(tenantId: string) {
    return store.cashClosures
      .filter((closure) => closure.tenantId === tenantId)
      .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
      .slice(0, 20);
  }

  async closeCashRegister(tenantId: string, payload: { date?: string; note?: string; closedByUserId?: string }) {
    const summary = await this.getCashRegister(tenantId, payload.date);
    const user = store.users.find((candidate) => candidate.id === payload.closedByUserId && candidate.tenantId === tenantId);
    const closure: CashRegisterClosure = {
      ...summary,
      id: randomUUID(),
      tenantId,
      closedByUserId: user?.id,
      closedByName: user?.name,
      note: toOptional(payload.note),
      closedAt: new Date().toISOString()
    };

    store.cashClosures.unshift(closure);
    return closure;
  }

  async payCustomerDebt(tenantId: string, customerId: string, amount: number, method: PaymentMethod) {
    const customer = store.customers.find((candidate) => candidate.id === customerId && candidate.tenantId === tenantId);
    if (!customer) return null;

    customer.debtBalance = Math.max(0, customer.debtBalance - amount);
    const payment: PaymentRecord = {
      id: randomUUID(),
      tenantId,
      customerId,
      amount,
      method,
      status: "approved",
      createdAt: new Date().toISOString()
    };
    store.payments.push(payment);
    return { customer, payment };
  }

  async recognizeProduct(tenantId: string, payload: { barcode?: string; hint?: string }) {
    const products = getTenantProducts(tenantId);
    const match = findBestProductMatch(products, payload);

    const recognition: RecognitionLog = {
      id: randomUUID(),
      tenantId,
      productId: match.product?.id,
      productName: match.product?.name ?? "Producto no reconocido",
      confidence: match.confidence,
      source: match.source,
      stock: match.product?.stock,
      salePrice: match.product?.salePrice,
      needsConfirmation: match.confidence < 0.9,
      confirmed: false,
      createdAt: new Date().toISOString()
    };
    store.recognitionLogs.unshift(recognition);
    return recognition;
  }

  async getRecognitionHistory(tenantId: string) {
    return store.recognitionLogs
      .filter((recognition) => recognition.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  }

  async confirmRecognition(
    tenantId: string,
    recognitionId: string,
    payload: { confirmed?: boolean; userCorrection?: string; productId?: string }
  ) {
    const recognition = store.recognitionLogs.find((candidate) => candidate.id === recognitionId && candidate.tenantId === tenantId);
    if (!recognition) return null;

    const correctedProduct = payload.productId
      ? store.products.find((product) => product.id === payload.productId && product.tenantId === tenantId)
      : undefined;

    recognition.confirmed = payload.confirmed ?? true;
    recognition.userCorrection = toOptional(payload.userCorrection);
    if (correctedProduct) {
      recognition.productId = correctedProduct.id;
      recognition.productName = correctedProduct.name;
      recognition.stock = correctedProduct.stock;
      recognition.salePrice = correctedProduct.salePrice;
    }

    return recognition;
  }

  async createWebpayPayment(tenantId: string, payload: { amount: number; saleId?: string; customerId?: string }) {
    const payment: PaymentRecord = {
      id: randomUUID(),
      tenantId,
      saleId: payload.saleId,
      customerId: payload.customerId,
      amount: payload.amount,
      method: "webpay",
      status: "pending",
      externalTransactionId: `WEBPAY-DEMO-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    store.payments.push(payment);

    return {
      payment,
      redirectUrl: `https://webpay3gint.transbank.cl/demo?token=${payment.externalTransactionId}`
    };
  }

  async confirmWebpayPayment(tenantId: string, paymentId: string) {
    const payment = store.payments.find((candidate) => candidate.id === paymentId && candidate.tenantId === tenantId);
    if (!payment) return null;
    const shouldApplyPayment = payment.status !== "approved";
    payment.status = "approved";

    if (shouldApplyPayment && payment.customerId) {
      const customer = store.customers.find((candidate) => candidate.id === payment.customerId && candidate.tenantId === tenantId);
      if (customer) customer.debtBalance = Math.max(0, customer.debtBalance - payment.amount);
    }

    if (shouldApplyPayment && payment.saleId) {
      const sale = store.sales.find((candidate) => candidate.id === payment.saleId && candidate.tenantId === tenantId);
      if (sale) sale.paymentStatus = "approved";
    }

    return payment;
  }
}

class PostgresRepository implements DataRepository {
  mode = "postgres" as const;

  constructor(private readonly pool: pg.Pool) {}

  async init() {
    const schemaPath = join(process.cwd(), "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");
    await this.pool.query(schema);
    await this.seedDemoData();
  }

  async bootstrap(tenantId: string) {
    const tenant = (await this.findTenant(tenantId)) ?? (await this.findTenant(demoTenantId));
    if (!tenant) throw new Error("No hay negocios registrados en PostgreSQL.");

    const user = await this.findUser(tenant.id);
    const users = await this.getUsers(tenant.id);
    const products = await this.getProducts(tenant.id);
    const customers = await this.getCustomers(tenant.id);
    const sales = await this.getSales(tenant.id);
    const activeSales = sales.filter((sale) => sale.status !== "cancelled");

    return {
      tenant,
      user,
      users,
      products,
      customers,
      sales,
      recognitionHistory: await this.getRecognitionHistory(tenant.id),
      cashRegister: buildCashRegisterFromSales(sales),
      cashClosures: await this.getCashClosures(tenant.id),
      alerts: products
        .filter((product) => product.stock <= product.minimumStock)
        .map((product) => ({
          id: randomUUID(),
          tenantId: tenant.id,
          productId: product.id,
          productName: product.name,
          stock: product.stock,
          minimumStock: product.minimumStock,
          severity: product.stock === 0 ? ("critical" as const) : ("warning" as const)
        })),
      summary: {
        totalSales: activeSales.reduce((sum, sale) => sum + sale.total, 0),
        salesCount: activeSales.length,
        pendingDebt: customers.reduce((sum, customer) => sum + customer.debtBalance, 0),
        lowStockCount: products.filter((product) => product.stock <= product.minimumStock).length,
        stockValue: products.reduce((sum, product) => sum + product.stock * product.salePrice, 0)
      }
    };
  }

  async getUsers(tenantId: string) {
    const result = await this.pool.query(
      `select * from usuarios where negocio_id = $1 and estado = 'activo' order by fecha_creacion asc, nombre asc`,
      [tenantId]
    );
    return result.rows.map(mapUser);
  }

  async createUser(tenantId: string, body: Partial<User> & { password?: string }) {
    const user: User = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      role: readUserRole(body.role),
      active: true
    };

    await this.pool.query(
      `insert into usuarios (id, negocio_id, nombre, email, password_hash, rol, estado)
       values ($1, $2, $3, $4, $5, $6, 'activo')`,
      [user.id, tenantId, user.name, user.email, body.password ? `demo-hash:${body.password}` : "demo-hash", user.role]
    );

    return user;
  }

  async updateUser(tenantId: string, userId: string, body: Partial<User>) {
    const current = (await this.getUsers(tenantId)).find((candidate) => candidate.id === userId);
    if (!current) return null;

    const updated: User = {
      ...current,
      name: body.name?.trim() || current.name,
      email: body.email?.trim().toLowerCase() || current.email,
      role: body.role ? readUserRole(body.role) : current.role,
      active: body.active ?? current.active
    };

    await this.pool.query(
      `update usuarios set nombre = $1, email = $2, rol = $3, estado = $4 where id = $5 and negocio_id = $6`,
      [updated.name, updated.email, updated.role, updated.active === false ? "inactivo" : "activo", userId, tenantId]
    );

    return updated;
  }

  async getProducts(tenantId: string) {
    const result = await this.pool.query(
      `select * from productos where negocio_id = $1 and activo = true order by fecha_creacion desc, nombre asc`,
      [tenantId]
    );
    return result.rows.map(mapProduct);
  }

  async createProduct(tenantId: string, body: Partial<Product>) {
    const product: Product = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      brand: toOptional(body.brand),
      category: String(body.category).trim(),
      barcode: toOptional(body.barcode),
      costPrice: readPositiveNumber(body.costPrice),
      salePrice: readPositiveNumber(body.salePrice),
      stock: readPositiveNumber(body.stock),
      minimumStock: readPositiveNumber(body.minimumStock),
      imageUrl: toOptional(body.imageUrl),
      active: true
    };

    await this.pool.query(
      `insert into productos (
        id, negocio_id, nombre, marca, categoria_id, descripcion, codigo_barras,
        precio_costo, precio_venta, stock_actual, stock_minimo, imagen_url, activo
      ) values ($1, $2, $3, $4, null, $5, $6, $7, $8, $9, $10, $11, true)`,
      [
        product.id,
        tenantId,
        product.name,
        product.brand,
        product.category,
        product.barcode,
        product.costPrice,
        product.salePrice,
        product.stock,
        product.minimumStock,
        product.imageUrl
      ]
    );

    return product;
  }

  async updateProduct(tenantId: string, productId: string, body: Partial<Product>) {
    const product = (await this.getProducts(tenantId)).find((candidate) => candidate.id === productId);
    if (!product) return null;

    const updated = {
      ...product,
      name: body.name?.trim() || product.name,
      brand: body.brand != null ? toOptional(body.brand) : product.brand,
      category: body.category?.trim() || product.category,
      barcode: body.barcode != null ? toOptional(body.barcode) : product.barcode,
      costPrice: body.costPrice != null ? readPositiveNumber(body.costPrice, product.costPrice) : product.costPrice,
      salePrice: body.salePrice != null ? readPositiveNumber(body.salePrice, product.salePrice) : product.salePrice,
      stock: body.stock != null ? readPositiveNumber(body.stock, product.stock) : product.stock,
      minimumStock: body.minimumStock != null ? readPositiveNumber(body.minimumStock, product.minimumStock) : product.minimumStock,
      active: body.active ?? product.active
    };

    await this.pool.query(
      `update productos
       set nombre = $1, marca = $2, descripcion = $3, codigo_barras = $4,
           precio_costo = $5, precio_venta = $6, stock_actual = $7, stock_minimo = $8, activo = $9
       where id = $10 and negocio_id = $11`,
      [
        updated.name,
        updated.brand,
        updated.category,
        updated.barcode,
        updated.costPrice,
        updated.salePrice,
        updated.stock,
        updated.minimumStock,
        updated.active,
        productId,
        tenantId
      ]
    );

    return updated;
  }

  async deactivateProduct(tenantId: string, productId: string) {
    return this.updateProduct(tenantId, productId, { active: false });
  }

  async updateStock(tenantId: string, productId: string, quantity: number) {
    const result = await this.pool.query(
      `update productos set stock_actual = $1 where id = $2 and negocio_id = $3 returning *`,
      [quantity, productId, tenantId]
    );
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  async getCustomers(tenantId: string) {
    const result = await this.pool.query(
      `select c.*, coalesce(sum(cf.saldo_pendiente) filter (where cf.estado = 'pendiente'), 0) as debt_balance
       from clientes c
       left join cuentas_fiado cf on cf.cliente_id = c.id
       where c.negocio_id = $1 and c.activo = true
       group by c.id
       order by c.fecha_creacion desc, c.nombre asc`,
      [tenantId]
    );
    return result.rows.map(mapCustomer);
  }

  async createCustomer(tenantId: string, body: Partial<Customer>) {
    const customer: Customer = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      phone: toOptional(body.phone),
      email: toOptional(body.email),
      address: toOptional(body.address),
      debtBalance: 0,
      active: true
    };

    await this.pool.query(
      `insert into clientes (id, negocio_id, nombre, telefono, email, direccion, activo)
       values ($1, $2, $3, $4, $5, $6, true)`,
      [customer.id, tenantId, customer.name, customer.phone, customer.email, customer.address]
    );

    return customer;
  }

  async updateCustomer(tenantId: string, customerId: string, body: Partial<Customer>) {
    const current = (await this.getCustomers(tenantId)).find((candidate) => candidate.id === customerId);
    if (!current) return null;

    const updated: Customer = {
      ...current,
      name: body.name?.trim() || current.name,
      phone: body.phone != null ? toOptional(body.phone) : current.phone,
      email: body.email != null ? toOptional(body.email) : current.email,
      address: body.address != null ? toOptional(body.address) : current.address,
      active: body.active ?? current.active
    };

    await this.pool.query(
      `update clientes
       set nombre = $1, telefono = $2, email = $3, direccion = $4, activo = $5
       where id = $6 and negocio_id = $7`,
      [updated.name, updated.phone, updated.email, updated.address, updated.active, customerId, tenantId]
    );

    return updated;
  }

  async deactivateCustomer(tenantId: string, customerId: string) {
    return this.updateCustomer(tenantId, customerId, { active: false });
  }

  async getSales(tenantId: string) {
    const saleResult = await this.pool.query(`select * from ventas where negocio_id = $1 order by fecha_creacion desc`, [tenantId]);
    const detailResult = await this.pool.query(
      `select dv.*, p.nombre as product_name
       from detalle_ventas dv
       join ventas v on v.id = dv.venta_id
       join productos p on p.id = dv.producto_id
       where v.negocio_id = $1
       order by dv.id asc`,
      [tenantId]
    );

    const detailsBySale = new Map<string, SaleItem[]>();
    for (const row of detailResult.rows) {
      const list = detailsBySale.get(row.venta_id) ?? [];
      list.push({
        productId: row.producto_id,
        productName: row.product_name,
        quantity: Number(row.cantidad),
        unitPrice: Number(row.precio_unitario),
        subtotal: Number(row.subtotal)
      });
      detailsBySale.set(row.venta_id, list);
    }

    return saleResult.rows.map((row) => mapSale(row, detailsBySale.get(row.id) ?? []));
  }

  async createSale(
    tenantId: string,
    body: { customerId?: string; paymentMethod: PaymentMethod; items: Array<{ productId: string; quantity: number }> }
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const sale = await this.createSaleWithClient(client, tenantId, body);
      await client.query("commit");
      return sale;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelSale(tenantId: string, saleId: string, reason?: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const saleResult = await client.query(`select * from ventas where id = $1 and negocio_id = $2 for update`, [saleId, tenantId]);
      const saleRow = saleResult.rows[0];
      if (!saleRow) {
        await client.query("rollback");
        return null;
      }

      if (String(saleRow.estado_venta ?? "active") === "cancelled") {
        await client.query("rollback");
        return (await this.getSales(tenantId)).find((sale) => sale.id === saleId) ?? null;
      }

      const detailResult = await client.query(`select * from detalle_ventas where venta_id = $1`, [saleId]);
      for (const detail of detailResult.rows) {
        await client.query(`update productos set stock_actual = stock_actual + $1 where id = $2 and negocio_id = $3`, [
          Number(detail.cantidad),
          detail.producto_id,
          tenantId
        ]);
      }

      await client.query(
        `update ventas
         set estado_venta = 'cancelled', estado_pago = 'cancelled', motivo_anulacion = $1, fecha_anulacion = CURRENT_TIMESTAMP
         where id = $2 and negocio_id = $3`,
        [toOptional(reason) ?? "Anulada desde Localito", saleId, tenantId]
      );

      await client.query(
        `update cuentas_fiado
         set saldo_pendiente = 0, estado = 'anulada'
         where negocio_id = $1 and venta_id = $2`,
        [tenantId, saleId]
      );

      await client.query("commit");
      return (await this.getSales(tenantId)).find((sale) => sale.id === saleId) ?? null;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getCashRegister(tenantId: string, date?: string) {
    return buildCashRegisterFromSales(await this.getSales(tenantId), salesDateFromInput(date));
  }

  async getCashClosures(tenantId: string) {
    const result = await this.pool.query(
      `select cc.*, u.nombre as closed_by_name
       from cierres_caja cc
       left join usuarios u on u.id = cc.usuario_id
       where cc.negocio_id = $1
       order by cc.fecha_cierre desc
       limit 20`,
      [tenantId]
    );
    return result.rows.map(mapCashRegisterClosure);
  }

  async closeCashRegister(tenantId: string, payload: { date?: string; note?: string; closedByUserId?: string }) {
    const summary = await this.getCashRegister(tenantId, payload.date);
    const closure: CashRegisterClosure = {
      ...summary,
      id: randomUUID(),
      tenantId,
      closedByUserId: payload.closedByUserId,
      note: toOptional(payload.note),
      closedAt: new Date().toISOString()
    };

    await this.pool.query(
      `insert into cierres_caja (
        id, negocio_id, usuario_id, fecha_caja, cantidad_ventas, cantidad_anuladas,
        total_bruto, total_recibido, total_fiado, ticket_promedio,
        total_efectivo, total_tarjeta, total_transferencia, total_webpay,
        observacion, fecha_cierre
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        closure.id,
        tenantId,
        closure.closedByUserId,
        closure.date,
        closure.salesCount,
        closure.cancelledSalesCount,
        closure.grossTotal,
        closure.receivedTotal,
        closure.creditTotal,
        closure.averageTicket,
        closure.totalsByMethod.cash,
        closure.totalsByMethod.card,
        closure.totalsByMethod.transfer,
        closure.totalsByMethod.webpay,
        closure.note,
        closure.closedAt
      ]
    );

    return {
      ...closure,
      closedByName: payload.closedByUserId
        ? (await this.getUsers(tenantId)).find((user) => user.id === payload.closedByUserId)?.name
        : undefined
    };
  }

  async payCustomerDebt(tenantId: string, customerId: string, amount: number, method: PaymentMethod) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const customerResult = await client.query(`select * from clientes where id = $1 and negocio_id = $2`, [customerId, tenantId]);
      if (!customerResult.rows[0]) {
        await client.query("rollback");
        return null;
      }

      let remaining = amount;
      const debts = await client.query(
        `select * from cuentas_fiado
         where negocio_id = $1 and cliente_id = $2 and estado = 'pendiente' and saldo_pendiente > 0
         order by fecha_creacion asc
         for update`,
        [tenantId, customerId]
      );

      for (const debt of debts.rows) {
        if (remaining <= 0) break;

        const currentBalance = Number(debt.saldo_pendiente);
        const paid = Math.min(currentBalance, remaining);
        const nextBalance = currentBalance - paid;
        remaining -= paid;

        await client.query(
          `update cuentas_fiado
           set saldo_pendiente = $1, estado = $2
           where id = $3`,
          [nextBalance, nextBalance === 0 ? "pagada" : "pendiente", debt.id]
        );

        await client.query(
          `insert into abonos_fiado (id, cuenta_fiado_id, monto, metodo_pago)
           values ($1, $2, $3, $4)`,
          [randomUUID(), debt.id, paid, method]
        );
      }

      const payment = await this.insertPayment(client, {
        tenantId,
        customerId,
        amount,
        method,
        status: "approved"
      });

      await client.query("commit");
      const updatedCustomer = (await this.getCustomers(tenantId)).find((candidate) => candidate.id === customerId);
      return {
        customer: updatedCustomer ?? mapCustomer(customerResult.rows[0]),
        payment
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async recognizeProduct(tenantId: string, payload: { barcode?: string; hint?: string }) {
    const products = await this.getProducts(tenantId);
    const match = findBestProductMatch(products, payload);
    const recognition: RecognitionLog = {
      id: randomUUID(),
      tenantId,
      productId: match.product?.id,
      productName: match.product?.name ?? "Producto no reconocido",
      confidence: match.confidence,
      source: match.source,
      stock: match.product?.stock,
      salePrice: match.product?.salePrice,
      needsConfirmation: match.confidence < 0.9,
      confirmed: false,
      createdAt: new Date().toISOString()
    };

    await this.pool.query(
      `insert into reconocimientos_ia (id, negocio_id, producto_id, resultado, confianza, fuente, confirmado, fecha_creacion)
       values ($1, $2, $3, $4, $5, $6, false, $7)`,
      [
        recognition.id,
        tenantId,
        recognition.productId,
        recognition.productName,
        recognition.confidence,
        recognition.source,
        recognition.createdAt
      ]
    );

    return recognition;
  }

  async getRecognitionHistory(tenantId: string) {
    const result = await this.pool.query(
      `select r.*, p.stock_actual, p.precio_venta
       from reconocimientos_ia r
       left join productos p on p.id = r.producto_id
       where r.negocio_id = $1
       order by r.fecha_creacion desc
       limit 20`,
      [tenantId]
    );
    return result.rows.map(mapRecognitionLog);
  }

  async confirmRecognition(
    tenantId: string,
    recognitionId: string,
    payload: { confirmed?: boolean; userCorrection?: string; productId?: string }
  ) {
    const correctedProduct = payload.productId ? (await this.getProducts(tenantId)).find((product) => product.id === payload.productId) : undefined;
    const result = await this.pool.query(
      `update reconocimientos_ia
       set confirmado = $1,
           correccion_usuario = $2,
           producto_id = coalesce($3, producto_id),
           resultado = coalesce($4, resultado)
       where id = $5 and negocio_id = $6
       returning *`,
      [
        payload.confirmed ?? true,
        toOptional(payload.userCorrection),
        correctedProduct?.id,
        correctedProduct?.name,
        recognitionId,
        tenantId
      ]
    );

    if (!result.rows[0]) return null;
    const stockAndPrice = correctedProduct ? { stock_actual: correctedProduct.stock, precio_venta: correctedProduct.salePrice } : {};
    return mapRecognitionLog({ ...result.rows[0], ...stockAndPrice });
  }

  async createWebpayPayment(tenantId: string, payload: { amount: number; saleId?: string; customerId?: string }) {
    const payment = await this.insertPayment(this.pool, {
      tenantId,
      saleId: payload.saleId,
      customerId: payload.customerId,
      amount: payload.amount,
      method: "webpay",
      status: "pending",
      externalTransactionId: `WEBPAY-DEMO-${Date.now()}`
    });

    return {
      payment,
      redirectUrl: `https://webpay3gint.transbank.cl/demo?token=${payment.externalTransactionId}`
    };
  }

  async confirmWebpayPayment(tenantId: string, paymentId: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query(`select * from pagos where id = $1 and negocio_id = $2 for update`, [paymentId, tenantId]);
      if (!result.rows[0]) {
        await client.query("rollback");
        return null;
      }

      const payment = mapPayment(result.rows[0]);
      if (payment.status !== "approved") {
        await client.query(`update pagos set estado = 'approved' where id = $1 and negocio_id = $2`, [paymentId, tenantId]);
        payment.status = "approved";

        if (payment.saleId) {
          await client.query(`update ventas set estado_pago = 'approved' where id = $1 and negocio_id = $2`, [payment.saleId, tenantId]);
        }

        if (payment.customerId) {
          let remaining = payment.amount;
          const debts = await client.query(
            `select * from cuentas_fiado
             where negocio_id = $1 and cliente_id = $2 and estado = 'pendiente' and saldo_pendiente > 0
             order by fecha_creacion asc
             for update`,
            [tenantId, payment.customerId]
          );

          for (const debt of debts.rows) {
            if (remaining <= 0) break;

            const currentBalance = Number(debt.saldo_pendiente);
            const paid = Math.min(currentBalance, remaining);
            const nextBalance = currentBalance - paid;
            remaining -= paid;

            await client.query(
              `update cuentas_fiado
               set saldo_pendiente = $1, estado = $2
               where id = $3`,
              [nextBalance, nextBalance === 0 ? "pagada" : "pendiente", debt.id]
            );

            await client.query(
              `insert into abonos_fiado (id, cuenta_fiado_id, monto, metodo_pago)
               values ($1, $2, $3, $4)`,
              [randomUUID(), debt.id, paid, "webpay"]
            );
          }
        }
      }

      await client.query("commit");
      return payment;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async createSaleWithClient(
    client: pg.PoolClient,
    tenantId: string,
    body: { customerId?: string; paymentMethod: PaymentMethod; items: Array<{ productId: string; quantity: number }> }
  ) {
    const saleItems: SaleItem[] = [];

    for (const item of body.items) {
      const productResult = await client.query(`select * from productos where id = $1 and negocio_id = $2 for update`, [
        item.productId,
        tenantId
      ]);
      const product = productResult.rows[0] ? mapProduct(productResult.rows[0]) : null;
      if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
      if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);

      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal: product.salePrice * item.quantity
      });
    }

    const total = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const isCredit = body.paymentMethod === "credit";
    if (isCredit && !body.customerId) throw new Error("Una venta fiada debe estar asociada a un cliente.");

    const sale: Sale = {
      id: randomUUID(),
      tenantId,
      sellerId: demoSellerId,
      customerId: body.customerId,
      items: saleItems,
      total,
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentMethod === "webpay" ? "pending" : "approved",
      saleType: isCredit ? "credit" : "normal",
      status: "active",
      createdAt: new Date().toISOString()
    };

    await client.query(
      `insert into ventas (id, negocio_id, usuario_id, cliente_id, total, metodo_pago, estado_pago, tipo_venta, estado_venta, fecha_creacion)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        sale.id,
        tenantId,
        sale.sellerId,
        sale.customerId,
        sale.total,
        sale.paymentMethod,
        sale.paymentStatus,
        sale.saleType,
        sale.status,
        sale.createdAt
      ]
    );

    for (const item of saleItems) {
      await client.query(
        `insert into detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
         values ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), sale.id, item.productId, item.quantity, item.unitPrice, item.subtotal]
      );
      await client.query(`update productos set stock_actual = stock_actual - $1 where id = $2 and negocio_id = $3`, [
        item.quantity,
        item.productId,
        tenantId
      ]);
    }

    if (isCredit && body.customerId) {
      await client.query(`update clientes set observacion = observacion where id = $1 and negocio_id = $2`, [body.customerId, tenantId]);
      await client.query(
        `insert into cuentas_fiado (id, negocio_id, cliente_id, venta_id, monto_original, saldo_pendiente, estado)
         values ($1, $2, $3, $4, $5, $6, 'pendiente')`,
        [randomUUID(), tenantId, body.customerId, sale.id, total, total]
      );
    }

    return sale;
  }

  private async seedDemoData() {
    const result = await this.pool.query(`select count(*)::int as count from negocios`);
    if (Number(result.rows[0]?.count ?? 0) > 0) return;

    await this.pool.query(
      `insert into negocios (id, nombre, rubro, direccion, telefono, email_contacto, estado)
       values ($1, 'Almacen Don Pepe', 'Almacen', 'Pasaje Los Aromos 123', '+56 9 1234 5678', 'demo@localito.cl', 'activo')`,
      [demoTenantId]
    );
    for (const user of store.users) {
      await this.pool.query(
        `insert into usuarios (id, negocio_id, nombre, email, password_hash, rol, estado)
         values ($1, $2, $3, $4, 'demo-hash', $5, 'activo')`,
        [user.id, demoTenantId, user.name, user.email, user.role]
      );
    }

    for (const product of store.products) {
      await this.createProduct(demoTenantId, product);
    }

    for (const customer of store.customers) {
      const created = await this.createCustomer(demoTenantId, customer);
      if (customer.debtBalance > 0) {
        await this.pool.query(
          `insert into cuentas_fiado (id, negocio_id, cliente_id, venta_id, monto_original, saldo_pendiente, estado)
           values ($1, $2, $3, null, $4, $4, 'pendiente')`,
          [randomUUID(), demoTenantId, created.id, customer.debtBalance]
        );
      }
    }
  }

  private async findTenant(tenantId: string): Promise<Tenant | null> {
    const result = await this.pool.query(`select * from negocios where id = $1`, [tenantId]);
    return result.rows[0] ? mapTenant(result.rows[0]) : null;
  }

  private async findUser(tenantId: string): Promise<User> {
    const result = await this.pool.query(`select * from usuarios where negocio_id = $1 order by fecha_creacion asc limit 1`, [tenantId]);
    if (result.rows[0]) return mapUser(result.rows[0]);
    throw new Error("No hay usuarios asociados al negocio.");
  }

  private async insertPayment(
    queryable: Queryable,
    input: {
      tenantId: string;
      saleId?: string;
      customerId?: string;
      amount: number;
      method: PaymentMethod;
      status: PaymentRecord["status"];
      externalTransactionId?: string;
    }
  ) {
    const payment: PaymentRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      saleId: input.saleId,
      customerId: input.customerId,
      amount: input.amount,
      method: input.method,
      status: input.status,
      externalTransactionId: input.externalTransactionId,
      createdAt: new Date().toISOString()
    };

    await queryable.query(
      `insert into pagos (id, negocio_id, venta_id, cliente_id, monto, metodo, estado, transaccion_externa_id, fecha_creacion)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        payment.id,
        payment.tenantId,
        payment.saleId,
        payment.customerId,
        payment.amount,
        payment.method,
        payment.status,
        payment.externalTransactionId,
        payment.createdAt
      ]
    );

    return payment;
  }
}

function mapTenant(row: Record<string, unknown>): Tenant {
  return {
    id: String(row.id),
    name: String(row.nombre),
    businessType: String(row.rubro),
    address: toOptional(row.direccion),
    phone: toOptional(row.telefono)
  };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    name: String(row.nombre),
    email: String(row.email),
    role: String(row.rol) as User["role"],
    active: String(row.estado ?? "activo") === "activo"
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    name: String(row.nombre),
    brand: toOptional(row.marca),
    category: String(row.descripcion ?? "General"),
    barcode: toOptional(row.codigo_barras),
    costPrice: Number(row.precio_costo),
    salePrice: Number(row.precio_venta),
    stock: Number(row.stock_actual),
    minimumStock: Number(row.stock_minimo),
    imageUrl: toOptional(row.imagen_url),
    active: Boolean(row.activo)
  };
}

function parseInitialDebt(row: Record<string, unknown>) {
  if (row.debt_balance != null) return Number(row.debt_balance) || 0;
  const note = toOptional(row.observacion);
  if (!note?.startsWith("deuda_inicial:")) return 0;
  return Number(note.replace("deuda_inicial:", "")) || 0;
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    name: String(row.nombre),
    phone: toOptional(row.telefono),
    email: toOptional(row.email),
    address: toOptional(row.direccion),
    debtBalance: parseInitialDebt(row),
    active: Boolean(row.activo)
  };
}

function mapSale(row: Record<string, unknown>, items: SaleItem[]): Sale {
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    sellerId: String(row.usuario_id),
    customerId: toOptional(row.cliente_id),
    items,
    total: Number(row.total),
    paymentMethod: String(row.metodo_pago) as PaymentMethod,
    paymentStatus: String(row.estado_pago) as Sale["paymentStatus"],
    saleType: String(row.tipo_venta) as Sale["saleType"],
    status: String(row.estado_venta ?? "active") as Sale["status"],
    cancellationReason: toOptional(row.motivo_anulacion),
    cancelledAt: row.fecha_anulacion ? new Date(String(row.fecha_anulacion)).toISOString() : undefined,
    createdAt: new Date(String(row.fecha_creacion)).toISOString()
  };
}

function mapRecognitionLog(row: Record<string, unknown>): RecognitionLog {
  const confidence = Number(row.confianza);
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    productId: toOptional(row.producto_id),
    productName: String(row.resultado ?? "Producto no reconocido"),
    confidence: confidence > 1 ? confidence / 100 : confidence,
    source: String(row.fuente) as RecognitionLog["source"],
    stock: row.stock_actual != null ? Number(row.stock_actual) : undefined,
    salePrice: row.precio_venta != null ? Number(row.precio_venta) : undefined,
    needsConfirmation: confidence > 1 ? confidence < 90 : confidence < 0.9,
    confirmed: Boolean(row.confirmado),
    userCorrection: toOptional(row.correccion_usuario),
    createdAt: new Date(String(row.fecha_creacion)).toISOString()
  };
}

function mapCashRegisterClosure(row: Record<string, unknown>): CashRegisterClosure {
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    date: new Date(String(row.fecha_caja)).toISOString().slice(0, 10),
    salesCount: Number(row.cantidad_ventas),
    cancelledSalesCount: Number(row.cantidad_anuladas),
    grossTotal: Number(row.total_bruto),
    receivedTotal: Number(row.total_recibido),
    creditTotal: Number(row.total_fiado),
    averageTicket: Number(row.ticket_promedio),
    totalsByMethod: {
      cash: Number(row.total_efectivo),
      card: Number(row.total_tarjeta),
      transfer: Number(row.total_transferencia),
      webpay: Number(row.total_webpay),
      credit: Number(row.total_fiado)
    },
    closedByUserId: toOptional(row.usuario_id),
    closedByName: toOptional(row.closed_by_name),
    note: toOptional(row.observacion),
    closedAt: new Date(String(row.fecha_cierre)).toISOString()
  };
}

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    saleId: toOptional(row.venta_id),
    customerId: toOptional(row.cliente_id),
    amount: Number(row.monto),
    method: String(row.metodo) as PaymentMethod,
    status: String(row.estado) as PaymentRecord["status"],
    externalTransactionId: toOptional(row.transaccion_externa_id),
    createdAt: new Date(String(row.fecha_creacion)).toISOString()
  };
}
