import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import type {
  AuditEvent,
  BootstrapData,
  CashMovement,
  CashRegisterClosure,
  CashRegisterSummary,
  CashSession,
  Customer,
  DebtAccount,
  PaymentMethod,
  PlatformTenantSummary,
  Product,
  PurchaseOrder,
  PurchaseStatus,
  RecognitionLog,
  RecognitionResult,
  Sale,
  SalePayment,
  SaleReturn,
  SaleItem,
  StockMovement,
  StockMovementType,
  Supplier,
  Tenant,
  User
} from "@localito/shared";
import {
  buildDemoCustomers,
  buildDemoProducts,
  buildDemoSuppliers,
  buildDemoUsers,
  demoTenantSeeds
} from "./demoData.js";
import {
  demoOwnerId,
  demoSellerId,
  demoTenantId,
  getCashRegisterSummary,
  getReportSummary,
  getStockAlerts,
  getTenantCustomers,
  getTenantProducts,
  store,
  systemAdminEmail,
  systemAdminId,
  systemTenantId
} from "./store.js";
import { hashPassword, verifyPassword } from "./auth.js";

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
  registerTenant(input: { name: string; email: string; password: string; businessName: string; businessType: string }): Promise<{ tenant: Tenant; user: User }>;
  bootstrap(tenantId: string): Promise<BootstrapData>;
  listTenants(): Promise<PlatformTenantSummary[]>;
  updateTenant(tenantId: string, tenant: Partial<Tenant>): Promise<Tenant | null>;
  getUsers(tenantId: string, includeInactive?: boolean): Promise<User[]>;
  createUser(tenantId: string, user: Partial<User> & { password?: string }): Promise<User>;
  updateUser(tenantId: string, userId: string, user: Partial<User>): Promise<User | null>;
  authenticate(email: string, password: string): Promise<{ user: User; tenant: Tenant } | null>;
  createSession(userId: string, tokenHash: string, expiresAt: string): Promise<void>;
  getSession(tokenHash: string): Promise<User | null>;
  revokeSession(tokenHash: string): Promise<void>;
  createPasswordResetToken(email: string, tokenHash: string, expiresAt: string): Promise<{ email: string } | null>;
  completePasswordReset(tokenHash: string, newPassword: string): Promise<boolean>;
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
    payload: SaleCreationPayload
  ): Promise<Sale>;
  cancelSale(tenantId: string, saleId: string, reason?: string): Promise<Sale | null>;
  returnSale(tenantId: string, saleId: string, payload: { items: Array<{ productId: string; quantity: number }>; reason: string; userId?: string }): Promise<SaleReturn | null>;
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
  getSuppliers(tenantId: string): Promise<Supplier[]>;
  createSupplier(tenantId: string, supplier: Partial<Supplier>): Promise<Supplier>;
  updateSupplier(tenantId: string, supplierId: string, supplier: Partial<Supplier>): Promise<Supplier | null>;
  getPurchaseOrders(tenantId: string): Promise<PurchaseOrder[]>;
  createPurchaseOrder(tenantId: string, purchase: PurchaseCreationPayload): Promise<PurchaseOrder>;
  receivePurchaseOrder(tenantId: string, purchaseId: string, quantities?: Record<string, number>, userId?: string): Promise<PurchaseOrder | null>;
  getDebts(tenantId: string): Promise<DebtAccount[]>;
  getOpenCashSession(tenantId: string): Promise<CashSession | undefined>;
  openCashSession(tenantId: string, amount: number, userId: string): Promise<CashSession>;
  addCashMovement(tenantId: string, movement: { type: CashMovement["type"]; amount: number; reason: string; userId: string }): Promise<CashMovement>;
  closeCashSession(tenantId: string, countedAmount: number, note: string | undefined, userId: string): Promise<CashSession | null>;
  getCashMovements(tenantId: string): Promise<CashMovement[]>;
  getStockMovements(tenantId: string, productId?: string): Promise<StockMovement[]>;
  recordAudit(event: Omit<AuditEvent, "id" | "createdAt">): Promise<AuditEvent>;
  getAuditEvents(tenantId: string): Promise<AuditEvent[]>;
}

export type SaleCreationPayload = {
  sellerId?: string;
  customerId?: string;
  paymentMethod: PaymentMethod;
  payments?: SalePayment[];
  discount?: number;
  notes?: string;
  idempotencyKey?: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type PurchaseCreationPayload = {
  supplierId: string;
  status?: PurchaseStatus;
  expectedAt?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
};

type RepositoryEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, "DATABASE_URL" | "POSTGRES_URL" | "SUPABASE_DB_URL" | "NODE_ENV" | "VERCEL">
>;

export function resolveDatabaseUrl(environment: RepositoryEnvironment = process.env) {
  return [environment.DATABASE_URL, environment.POSTGRES_URL, environment.SUPABASE_DB_URL]
    .find((value) => typeof value === "string" && value.trim().length > 0)
    ?.trim();
}

export function requiresPersistentRepository(environment: RepositoryEnvironment = process.env) {
  return environment.NODE_ENV === "production" || environment.VERCEL === "1";
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Convierte los identificadores legibles de las semillas en UUID estables para PostgreSQL. */
export function persistentDemoId(sourceId: string) {
  if (uuidPattern.test(sourceId)) return sourceId;
  const hash = createHash("sha256").update(`localito-demo:${sourceId}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function shouldSeedDemoData(existingNonSystemTenants: number) {
  return existingNonSystemTenants === 0;
}

function persistentRepositoryError(reason: string, cause?: unknown) {
  return new Error(
    `[localito-api] PostgreSQL es obligatorio en producción. ${reason} Configure DATABASE_URL (o POSTGRES_URL/SUPABASE_DB_URL) con una conexión PostgreSQL persistente.`,
    cause === undefined ? undefined : { cause }
  );
}

export async function createRepository() {
  const databaseUrl = resolveDatabaseUrl();
  const persistenceRequired = requiresPersistentRepository();

  if (!databaseUrl) {
    if (persistenceRequired) {
      throw persistentRepositoryError("No se encontró una URL de base de datos.");
    }
    return new MemoryRepository();
  }

  const isSupabase = /supabase\.(co|com)|pooler\.supabase\.com/i.test(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: process.env.VERCEL === "1" ? 1 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true
  });

  try {
    await pool.query("select 1");
    const repository = new PostgresRepository(pool);
    await repository.init();
    return repository;
  } catch (error) {
    await pool.end().catch(() => undefined);
    if (persistenceRequired) {
      throw persistentRepositoryError(
        `No fue posible conectar o inicializar la base de datos: ${error instanceof Error ? error.message : "error desconocido"}.`,
        error
      );
    }
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
  const cashSession = store.cashSessions.find((session) => session.tenantId === tenant.id && session.status === "open");
  const cashSummary = getCashRegisterSummary(tenant.id, new Date(), cashSession?.openedAt);
  const sessionMovements = store.cashMovements.filter((movement) => movement.tenantId === tenant.id && (cashSession ? movement.sessionId === cashSession.id : movement.createdAt.slice(0, 10) === cashSummary.date));
  const deposits = sessionMovements.filter((movement) => movement.type === "deposit").reduce((sum, movement) => sum + movement.amount, 0);
  const withdrawals = sessionMovements.filter((movement) => movement.type !== "deposit").reduce((sum, movement) => sum + movement.amount, 0);

  return {
    tenant,
    user,
    users: store.users.filter((candidate) => candidate.tenantId === tenant.id && candidate.active !== false),
    products: getTenantProducts(tenant.id),
    customers: getTenantCustomers(tenant.id),
    sales: store.sales.filter((sale) => sale.tenantId === tenant.id),
    suppliers: store.suppliers.filter((supplier) => supplier.tenantId === tenant.id && supplier.active),
    purchaseOrders: store.purchaseOrders.filter((purchase) => purchase.tenantId === tenant.id),
    debts: store.debts.filter((debt) => debt.tenantId === tenant.id),
    cashSession,
    cashMovements: store.cashMovements.filter((movement) => movement.tenantId === tenant.id).slice(-20).reverse(),
    auditEvents: store.auditEvents.filter((event) => event.tenantId === tenant.id).slice(-20).reverse(),
    recognitionHistory: store.recognitionLogs
      .filter((recognition) => recognition.tenantId === tenant.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12),
    cashRegister: { ...cashSummary, openingAmount: cashSession?.openingAmount ?? 0, cashDeposits: deposits, cashWithdrawals: withdrawals, expectedCash: (cashSession?.openingAmount ?? 0) + cashSummary.totalsByMethod.cash + deposits - withdrawals },
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

function buildCashRegisterFromSales(sales: Sale[], date = new Date(), returnedTotals = new Map<string, number>(), openedAt?: string): CashRegisterSummary {
  const dayKey = date.toISOString().slice(0, 10);
  const salesForDay = sales.filter((sale) => sale.createdAt.slice(0, 10) === dayKey && (!openedAt || sale.createdAt >= openedAt));
  const activeSales = salesForDay
    .filter((sale) => sale.status !== "cancelled")
    .map((sale) => ({ sale, total: Math.max(0, sale.total - (returnedTotals.get(sale.id) ?? 0)) }))
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
    const { sale, total } = entry;
    if (sale.payments?.length && sale.total > 0) {
      let remaining = total;
      sale.payments.forEach((payment, index) => {
        const amount = index === sale.payments!.length - 1 ? remaining : Math.min(remaining, Math.round((payment.amount / sale.total) * total));
        totalsByMethod[payment.method] += amount;
        remaining -= amount;
      });
    } else {
      totalsByMethod[sale.paymentMethod] += total;
    }
  }

  const grossTotal = activeSales.reduce((sum, entry) => sum + entry.total, 0);
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

export class MemoryRepository implements DataRepository {
  mode = "memory" as const;

  async bootstrap(tenantId: string) {
    return buildMemoryBootstrap(tenantId);
  }

  async listTenants() {
    return store.tenants
      .filter((tenant) => tenant.id !== systemTenantId)
      .map((tenant) => ({
        ...tenant,
        active: tenant.active !== false,
        userCount: store.users.filter((user) => user.tenantId === tenant.id && user.active !== false).length,
        ownerCount: store.users.filter((user) => user.tenantId === tenant.id && user.role === "owner" && user.active !== false).length,
        productCount: store.products.filter((product) => product.tenantId === tenant.id && product.active).length
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async updateTenant(tenantId: string, body: Partial<Tenant>) {
    const tenant = store.tenants.find((candidate) => candidate.id === tenantId && candidate.id !== systemTenantId);
    if (!tenant) return null;
    if (body.name?.trim()) tenant.name = body.name.trim();
    if (body.businessType?.trim()) tenant.businessType = body.businessType.trim();
    if (body.address != null) tenant.address = toOptional(body.address);
    if (body.phone != null) tenant.phone = toOptional(body.phone);
    if (body.active != null) tenant.active = body.active;
    return tenant;
  }

  async getUsers(tenantId: string, includeInactive = false) {
    return store.users.filter((user) => user.tenantId === tenantId && (includeInactive || user.active !== false));
  }

  async createUser(tenantId: string, body: Partial<User> & { password?: string }) {
    if (store.users.some((user) => user.email.toLowerCase() === String(body.email).trim().toLowerCase())) {
      throw new Error("El correo ya está registrado.");
    }
    const user: User = {
      id: randomUUID(),
      tenantId,
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      role: readUserRole(body.role),
      active: true
    };
    store.users.push(user);
    store.passwordHashes[user.id] = hashPassword(String(body.password));
    return user;
  }

  async registerTenant(input: { name: string; email: string; password: string; businessName: string; businessType: string }) {
    if (store.users.some((user) => user.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new Error("El correo ya está registrado.");
    }
    const tenant: Tenant = { id: randomUUID(), name: input.businessName.trim(), businessType: input.businessType.trim() };
    store.tenants.push(tenant);
    const user = await this.createUser(tenant.id, { name: input.name, email: input.email, password: input.password, role: "owner" });
    return { tenant, user };
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

  async authenticate(email: string, password: string) {
    const user = store.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.active !== false);
    if (!user) return null;
    if (store.tenants.find((tenant) => tenant.id === user.tenantId)?.active === false) return null;
    const storedHash = store.passwordHashes[user.id] ?? hashPassword(user.role === "seller" ? "Duoc2026V" : "Duoc2026");
    store.passwordHashes[user.id] = storedHash;
    if (!verifyPassword(password, storedHash)) return null;
    const tenant = store.tenants.find((candidate) => candidate.id === user.tenantId);
    return tenant ? { user, tenant } : null;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: string) {
    store.sessions.push({ userId, tokenHash, expiresAt });
  }

  async getSession(tokenHash: string) {
    const session = store.sessions.find((candidate) => candidate.tokenHash === tokenHash && !candidate.revokedAt);
    if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
    return store.users.find((candidate) => candidate.id === session.userId && candidate.active !== false) ?? null;
  }

  async revokeSession(tokenHash: string) {
    const session = store.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (session) session.revokedAt = new Date().toISOString();
  }

  async createPasswordResetToken(email: string, tokenHash: string, expiresAt: string) {
    const user = store.users.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.active !== false
    );
    if (!user || store.tenants.find((tenant) => tenant.id === user.tenantId)?.active === false) return null;

    const nowDate = new Date();
    const recentlyCreated = store.passwordResetTokens.some(
      (token) => token.userId === user.id && !token.usedAt && nowDate.getTime() - Date.parse(token.createdAt) < 60_000
    );
    if (recentlyCreated) return null;

    const now = nowDate.toISOString();
    store.passwordResetTokens.push({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
      createdAt: now
    });
    return { email: user.email };
  }

  async completePasswordReset(tokenHash: string, newPassword: string) {
    const now = new Date();
    const resetToken = store.passwordResetTokens.find(
      (candidate) => candidate.tokenHash === tokenHash && !candidate.usedAt && Date.parse(candidate.expiresAt) > now.getTime()
    );
    if (!resetToken) return false;

    const user = store.users.find((candidate) => candidate.id === resetToken.userId && candidate.active !== false);
    if (!user) return false;

    const passwordHash = hashPassword(newPassword);
    const usedAt = now.toISOString();
    store.passwordHashes[user.id] = passwordHash;
    for (const token of store.passwordResetTokens) {
      if (token.userId === user.id && !token.usedAt) token.usedAt = usedAt;
    }
    for (const session of store.sessions) {
      if (session.userId === user.id && !session.revokedAt) session.revokedAt = usedAt;
    }
    return true;
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
      sku: toOptional(body.sku),
      variant: toOptional(body.variant),
      unit: body.unit ?? "unit",
      unitsPerPack: readPositiveNumber(body.unitsPerPack, 1),
      supplierId: toOptional(body.supplierId),
      expiryDate: toOptional(body.expiryDate),
      trackStock: body.trackStock ?? true,
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
    if (body.sku != null) product.sku = toOptional(body.sku);
    if (body.variant != null) product.variant = toOptional(body.variant);
    if (body.unit != null) product.unit = body.unit;
    if (body.unitsPerPack != null) product.unitsPerPack = readPositiveNumber(body.unitsPerPack, product.unitsPerPack ?? 1);
    if (body.supplierId != null) product.supplierId = toOptional(body.supplierId);
    if (body.expiryDate != null) product.expiryDate = toOptional(body.expiryDate);
    if (body.trackStock != null) product.trackStock = body.trackStock;
    if (body.active != null) product.active = Boolean(body.active);

    return product;
  }

  async deactivateProduct(tenantId: string, productId: string) {
    return this.updateProduct(tenantId, productId, { active: false });
  }

  async updateStock(tenantId: string, productId: string, quantity: number) {
    const product = store.products.find((candidate) => candidate.id === productId && candidate.tenantId === tenantId);
    if (!product) return null;
    const delta = quantity - product.stock;
    product.stock = quantity;
    store.stockMovements.push({ id: randomUUID(), tenantId, productId, productName: product.name, type: "adjustment", quantity: delta, resultingStock: quantity, reason: "Ajuste manual", createdAt: new Date().toISOString() });
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
      notes: toOptional(body.notes),
      creditLimit: readPositiveNumber(body.creditLimit),
      creditDays: readPositiveNumber(body.creditDays, 30),
      creditBlocked: Boolean(body.creditBlocked),
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
    if (body.notes != null) customer.notes = toOptional(body.notes);
    if (body.creditLimit != null) customer.creditLimit = readPositiveNumber(body.creditLimit);
    if (body.creditDays != null) customer.creditDays = readPositiveNumber(body.creditDays, 30);
    if (body.creditBlocked != null) customer.creditBlocked = body.creditBlocked;
    if (body.active != null) customer.active = Boolean(body.active);
    return customer;
  }

  async deactivateCustomer(tenantId: string, customerId: string) {
    return this.updateCustomer(tenantId, customerId, { active: false });
  }

  async getSales(tenantId: string) {
    return store.sales.filter((sale) => sale.tenantId === tenantId);
  }

  async createSale(tenantId: string, body: SaleCreationPayload) {
    if (body.idempotencyKey) {
      const existingId = store.idempotencyKeys[`${tenantId}:${body.idempotencyKey}`];
      const existing = store.sales.find((sale) => sale.id === existingId && sale.tenantId === tenantId);
      if (existing) return existing;
    }
    const saleItems: SaleItem[] = [];

    for (const item of body.items) {
      const product = store.products.find((candidate) => candidate.id === item.productId && candidate.tenantId === tenantId);
      if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
      if (product.trackStock !== false && product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);

      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal: product.salePrice * item.quantity
      });
    }

    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Math.min(readPositiveNumber(body.discount), subtotal);
    const total = subtotal - discount;
    const payments = body.payments?.filter((payment) => payment.amount > 0);
    if (payments?.length && payments.reduce((sum, payment) => sum + payment.amount, 0) !== total) {
      throw new Error("La suma de los medios de pago debe coincidir con el total de la venta.");
    }
    const creditAmount = payments?.find((payment) => payment.method === "credit")?.amount ?? (body.paymentMethod === "credit" ? total : 0);
    const isCredit = creditAmount > 0;

    if (isCredit && !body.customerId) {
      throw new Error("Una venta fiada debe estar asociada a un cliente.");
    }
    const creditCustomer = isCredit && body.customerId
      ? store.customers.find((candidate) => candidate.id === body.customerId && candidate.tenantId === tenantId)
      : undefined;
    if (isCredit && !creditCustomer) throw new Error("Cliente no encontrado.");
    if (creditCustomer?.creditBlocked) throw new Error("El fiado de este cliente está bloqueado.");
    if (creditCustomer && (creditCustomer.creditLimit ?? 0) > 0 && creditCustomer.debtBalance + creditAmount > (creditCustomer.creditLimit ?? 0)) throw new Error("La venta supera el límite de crédito del cliente.");

    const sale: Sale = {
      id: randomUUID(),
      tenantId,
      sellerId: body.sellerId ?? demoSellerId,
      customerId: body.customerId,
      items: saleItems,
      subtotal,
      discount,
      total,
      paymentMethod: payments && payments.length > 1 ? "mixed" : body.paymentMethod,
      payments,
      notes: toOptional(body.notes),
      paymentStatus: body.paymentMethod === "webpay" ? "pending" : "approved",
      saleType: isCredit ? "credit" : "normal",
      status: "active",
      createdAt: new Date().toISOString()
    };

    for (const item of saleItems) {
      const product = store.products.find((candidate) => candidate.id === item.productId);
      if (product && product.trackStock !== false) {
        product.stock -= item.quantity;
        store.stockMovements.push({ id: randomUUID(), tenantId, productId: product.id, productName: product.name, type: "sale", quantity: -item.quantity, resultingStock: product.stock, createdByUserId: body.sellerId, createdAt: new Date().toISOString() });
      }
    }

    if (isCredit && body.customerId) {
      const customer = creditCustomer;
      if (customer) {
        customer.debtBalance += creditAmount;
        const dueDate = new Date(Date.now() + (customer.creditDays ?? 30) * 86_400_000).toISOString().slice(0, 10);
        store.debts.push({ id: randomUUID(), tenantId, customerId: customer.id, customerName: customer.name, saleId: sale.id, originalAmount: creditAmount, balance: creditAmount, dueDate, status: "pending", createdAt: sale.createdAt });
      }
    }

    store.sales.push(sale);
    if (body.idempotencyKey) store.idempotencyKeys[`${tenantId}:${body.idempotencyKey}`] = sale.id;
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
      const alreadyReturned = store.saleReturns
        .filter((entry) => entry.saleId === saleId && entry.tenantId === tenantId)
        .flatMap((entry) => entry.items)
        .filter((entry) => entry.productId === item.productId)
        .reduce((sum, entry) => sum + entry.quantity, 0);
      const quantityToRestore = Math.max(0, item.quantity - alreadyReturned);
      if (product && product.trackStock !== false && quantityToRestore > 0) {
        product.stock += quantityToRestore;
        store.stockMovements.push({ id: randomUUID(), tenantId, productId: product.id, productName: product.name, type: "return", quantity: quantityToRestore, resultingStock: product.stock, reason: sale.cancellationReason, createdAt: new Date().toISOString() });
      }
    }

    if (sale.saleType === "credit" && sale.customerId) {
      const customer = store.customers.find((candidate) => candidate.id === sale.customerId && candidate.tenantId === tenantId);
      const debts = store.debts.filter((candidate) => candidate.saleId === sale.id && candidate.tenantId === tenantId);
      const outstanding = debts.reduce((sum, debt) => sum + debt.balance, 0);
      if (customer) customer.debtBalance = Math.max(0, customer.debtBalance - outstanding);
      for (const debt of debts) { debt.balance = 0; debt.status = "cancelled"; }
    }

    return sale;
  }

  async returnSale(tenantId: string, saleId: string, payload: { items: Array<{ productId: string; quantity: number }>; reason: string; userId?: string }) {
    const sale = store.sales.find((candidate) => candidate.id === saleId && candidate.tenantId === tenantId);
    if (!sale || sale.status === "cancelled" || sale.status === "refunded") return null;
    const returnedItems = payload.items.map((item) => {
      const original = sale.items.find((candidate) => candidate.productId === item.productId);
      const alreadyReturned = store.saleReturns.filter((entry) => entry.saleId === saleId).flatMap((entry) => entry.items).filter((entry) => entry.productId === item.productId).reduce((sum, entry) => sum + entry.quantity, 0);
      if (!original || item.quantity <= 0 || item.quantity + alreadyReturned > original.quantity) throw new Error("Cantidad de devolución inválida.");
      const product = store.products.find((candidate) => candidate.id === item.productId && candidate.tenantId === tenantId);
      if (product && product.trackStock !== false) {
        product.stock += item.quantity;
        store.stockMovements.push({ id: randomUUID(), tenantId, productId: product.id, productName: product.name, type: "return", quantity: item.quantity, resultingStock: product.stock, reason: payload.reason, createdByUserId: payload.userId, createdAt: new Date().toISOString() });
      }
      return { productId: original.productId, productName: original.productName, quantity: item.quantity, amount: original.unitPrice * item.quantity };
    });
    const result: SaleReturn = { id: randomUUID(), tenantId, saleId, items: returnedItems, total: returnedItems.reduce((sum, item) => sum + item.amount, 0), reason: payload.reason, createdByUserId: payload.userId, createdAt: new Date().toISOString() };
    store.saleReturns.push(result);
    if (sale.saleType === "credit" && sale.customerId) {
      let remaining = result.total;
      let debtReduction = 0;
      for (const debt of store.debts.filter((candidate) => candidate.tenantId === tenantId && candidate.saleId === sale.id && candidate.balance > 0)) {
        const reduction = Math.min(debt.balance, remaining);
        debt.balance -= reduction;
        remaining -= reduction;
        debtReduction += reduction;
        debt.status = debt.balance === 0 ? "paid" : debt.status;
        if (remaining <= 0) break;
      }
      const customer = store.customers.find((candidate) => candidate.tenantId === tenantId && candidate.id === sale.customerId);
      if (customer) customer.debtBalance = Math.max(0, customer.debtBalance - debtReduction);
    }
    const returnedAll = sale.items.every((item) => store.saleReturns.filter((entry) => entry.saleId === saleId).flatMap((entry) => entry.items).filter((entry) => entry.productId === item.productId).reduce((sum, entry) => sum + entry.quantity, 0) >= item.quantity);
    sale.status = returnedAll ? "refunded" : "partially_refunded";
    return result;
  }

  async getCashRegister(tenantId: string, date?: string) {
    const session = await this.getOpenCashSession(tenantId);
    const selectedDate = salesDateFromInput(date);
    const dayKey = selectedDate.toISOString().slice(0, 10);
    const summary = getCashRegisterSummary(tenantId, selectedDate, date ? undefined : session?.openedAt);
    const movements = store.cashMovements.filter((movement) => movement.tenantId === tenantId && (session ? movement.sessionId === session.id : movement.createdAt.slice(0, 10) === dayKey));
    const deposits = movements.filter((movement) => movement.type === "deposit").reduce((sum, movement) => sum + movement.amount, 0);
    const withdrawals = movements.filter((movement) => movement.type !== "deposit").reduce((sum, movement) => sum + movement.amount, 0);
    return { ...summary, openingAmount: session?.openingAmount ?? 0, cashDeposits: deposits, cashWithdrawals: withdrawals, expectedCash: (session?.openingAmount ?? 0) + summary.totalsByMethod.cash + deposits - withdrawals };
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
    if (amount > customer.debtBalance) throw new Error("El abono no puede superar la deuda pendiente.");

    customer.debtBalance = Math.max(0, customer.debtBalance - amount);
    let remaining = amount;
    for (const debt of store.debts.filter((candidate) => candidate.tenantId === tenantId && candidate.customerId === customerId && candidate.balance > 0).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const paid = Math.min(debt.balance, remaining);
      debt.balance -= paid;
      remaining -= paid;
      debt.status = debt.balance === 0 ? "paid" : debt.dueDate && debt.dueDate < new Date().toISOString().slice(0, 10) ? "overdue" : "pending";
      if (remaining <= 0) break;
    }
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

  async getSuppliers(tenantId: string) {
    return store.suppliers.filter((supplier) => supplier.tenantId === tenantId && supplier.active);
  }

  async createSupplier(tenantId: string, body: Partial<Supplier>) {
    const supplier: Supplier = { id: randomUUID(), tenantId, name: String(body.name).trim(), contactName: toOptional(body.contactName), phone: toOptional(body.phone), email: toOptional(body.email), notes: toOptional(body.notes), active: true };
    store.suppliers.push(supplier);
    return supplier;
  }

  async updateSupplier(tenantId: string, supplierId: string, body: Partial<Supplier>) {
    const supplier = store.suppliers.find((candidate) => candidate.id === supplierId && candidate.tenantId === tenantId);
    if (!supplier) return null;
    if (body.name?.trim()) supplier.name = body.name.trim();
    if (body.contactName != null) supplier.contactName = toOptional(body.contactName);
    if (body.phone != null) supplier.phone = toOptional(body.phone);
    if (body.email != null) supplier.email = toOptional(body.email);
    if (body.notes != null) supplier.notes = toOptional(body.notes);
    if (body.active != null) supplier.active = body.active;
    return supplier;
  }

  async getPurchaseOrders(tenantId: string) {
    return store.purchaseOrders.filter((purchase) => purchase.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createPurchaseOrder(tenantId: string, body: PurchaseCreationPayload) {
    const supplier = store.suppliers.find((candidate) => candidate.id === body.supplierId && candidate.tenantId === tenantId);
    if (!supplier) throw new Error("Proveedor no encontrado.");
    const items = body.items.map((item) => {
      const product = store.products.find((candidate) => candidate.id === item.productId && candidate.tenantId === tenantId);
      if (!product) throw new Error("Producto no encontrado en la orden.");
      return { productId: product.id, productName: product.name, quantity: item.quantity, receivedQuantity: 0, unitCost: item.unitCost, subtotal: item.quantity * item.unitCost };
    });
    const purchase: PurchaseOrder = { id: randomUUID(), tenantId, supplierId: supplier.id, supplierName: supplier.name, status: body.status ?? "ordered", items, total: items.reduce((sum, item) => sum + item.subtotal, 0), expectedAt: toOptional(body.expectedAt), notes: toOptional(body.notes), createdAt: new Date().toISOString() };
    store.purchaseOrders.push(purchase);
    return purchase;
  }

  async receivePurchaseOrder(tenantId: string, purchaseId: string, quantities?: Record<string, number>, userId?: string) {
    const purchase = store.purchaseOrders.find((candidate) => candidate.id === purchaseId && candidate.tenantId === tenantId);
    if (!purchase || purchase.status === "cancelled" || purchase.status === "received") return purchase ?? null;
    for (const item of purchase.items) {
      const remaining = item.quantity - item.receivedQuantity;
      const received = Math.min(remaining, Math.max(0, quantities?.[item.productId] ?? remaining));
      if (received <= 0) continue;
      item.receivedQuantity += received;
      const product = store.products.find((candidate) => candidate.id === item.productId && candidate.tenantId === tenantId);
      if (product) {
        const previousValue = product.stock * product.costPrice;
        product.stock += received;
        product.costPrice = product.stock > 0 ? Math.round((previousValue + received * item.unitCost) / product.stock) : item.unitCost;
        store.stockMovements.push({ id: randomUUID(), tenantId, productId: product.id, productName: product.name, type: "purchase", quantity: received, resultingStock: product.stock, reason: `Recepción ${purchase.id.slice(0, 8)}`, createdByUserId: userId, createdAt: new Date().toISOString() });
      }
    }
    purchase.status = purchase.items.every((item) => item.receivedQuantity >= item.quantity) ? "received" : "partially_received";
    if (purchase.status === "received") purchase.receivedAt = new Date().toISOString();
    return purchase;
  }

  async getDebts(tenantId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return store.debts.filter((debt) => debt.tenantId === tenantId).map((debt) => ({ ...debt, status: debt.balance === 0 ? "paid" as const : debt.dueDate && debt.dueDate < today ? "overdue" as const : "pending" as const }));
  }

  async getOpenCashSession(tenantId: string) {
    return store.cashSessions.find((session) => session.tenantId === tenantId && session.status === "open");
  }

  async openCashSession(tenantId: string, amount: number, userId: string) {
    if (await this.getOpenCashSession(tenantId)) throw new Error("Ya existe una caja abierta.");
    const user = store.users.find((candidate) => candidate.id === userId);
    const session: CashSession = { id: randomUUID(), tenantId, openedByUserId: userId, openedByName: user?.name, openedAt: new Date().toISOString(), openingAmount: amount, status: "open" };
    store.cashSessions.push(session);
    return session;
  }

  async addCashMovement(tenantId: string, body: { type: CashMovement["type"]; amount: number; reason: string; userId: string }) {
    const session = await this.getOpenCashSession(tenantId);
    if (!session) throw new Error("Debes abrir la caja antes de registrar movimientos.");
    const user = store.users.find((candidate) => candidate.id === body.userId);
    const movement: CashMovement = { id: randomUUID(), tenantId, sessionId: session.id, type: body.type, amount: body.amount, reason: body.reason, createdByUserId: body.userId, createdByName: user?.name, createdAt: new Date().toISOString() };
    store.cashMovements.push(movement);
    return movement;
  }

  async closeCashSession(tenantId: string, countedAmount: number, note: string | undefined, userId: string) {
    const session = await this.getOpenCashSession(tenantId);
    if (!session) return null;
    const summary = await this.getCashRegister(tenantId);
    const movements = store.cashMovements.filter((movement) => movement.sessionId === session.id);
    const deposits = movements.filter((movement) => movement.type === "deposit").reduce((sum, movement) => sum + movement.amount, 0);
    const withdrawals = movements.filter((movement) => movement.type !== "deposit").reduce((sum, movement) => sum + movement.amount, 0);
    const expected = session.openingAmount + summary.totalsByMethod.cash + deposits - withdrawals;
    Object.assign(session, { status: "closed", closedAt: new Date().toISOString(), closedByUserId: userId, countedAmount, expectedCash: expected, difference: countedAmount - expected, note: toOptional(note) });
    return session;
  }

  async getCashMovements(tenantId: string) {
    return store.cashMovements.filter((movement) => movement.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getStockMovements(tenantId: string, productId?: string) {
    return store.stockMovements.filter((movement) => movement.tenantId === tenantId && (!productId || movement.productId === productId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async recordAudit(body: Omit<AuditEvent, "id" | "createdAt">) {
    const event: AuditEvent = { ...body, id: randomUUID(), createdAt: new Date().toISOString() };
    store.auditEvents.push(event);
    return event;
  }

  async getAuditEvents(tenantId: string) {
    return store.auditEvents.filter((event) => event.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
  }
}

class PostgresRepository implements DataRepository {
  mode = "postgres" as const;

  constructor(private readonly pool: pg.Pool) {}

  async init() {
    // La URL literal permite que el empaquetador serverless incluya el esquema
    // junto a la función, independientemente de su directorio de ejecución.
    const schema = readFileSync(new URL("../../../db/schema.sql", import.meta.url), "utf8");
    await this.pool.query(schema);
    await this.seedDemoData();
    await this.ensureSystemAdmin();
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
    const returnRows = await this.pool.query(`select venta_id, coalesce(sum(total), 0) as total from devoluciones_venta where negocio_id = $1 group by venta_id`, [tenant.id]);
    const returnedTotals = new Map(returnRows.rows.map((row) => [String(row.venta_id), Number(row.total)]));
    const netSales = activeSales.map((sale) => ({ sale, total: Math.max(0, sale.total - (returnedTotals.get(sale.id) ?? 0)) })).filter((entry) => entry.total > 0);
    const cashSession = await this.getOpenCashSession(tenant.id);

    return {
      tenant,
      user,
      users,
      products,
      customers,
      sales,
      suppliers: await this.getSuppliers(tenant.id),
      purchaseOrders: await this.getPurchaseOrders(tenant.id),
      debts: await this.getDebts(tenant.id),
      cashSession,
      cashMovements: (await this.getCashMovements(tenant.id)).slice(0, 20),
      auditEvents: (await this.getAuditEvents(tenant.id)).slice(0, 20),
      recognitionHistory: await this.getRecognitionHistory(tenant.id),
      cashRegister: await this.getCashRegister(tenant.id),
      cashClosures: await this.getCashClosures(tenant.id),
      alerts: products
        .filter((product) => product.trackStock !== false && product.stock <= product.minimumStock)
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
        totalSales: netSales.reduce((sum, entry) => sum + entry.total, 0),
        salesCount: netSales.length,
        pendingDebt: customers.reduce((sum, customer) => sum + customer.debtBalance, 0),
        lowStockCount: products.filter((product) => product.trackStock !== false && product.stock <= product.minimumStock).length,
        stockValue: products.reduce((sum, product) => sum + product.stock * product.salePrice, 0)
      }
    };
  }

  async getUsers(tenantId: string, includeInactive = false) {
    const result = await this.pool.query(
      `select * from usuarios where negocio_id = $1 and ($2::boolean = true or estado = 'activo') order by fecha_creacion asc, nombre asc`,
      [tenantId, includeInactive]
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
      [user.id, tenantId, user.name, user.email, hashPassword(String(body.password)), user.role]
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

  async listTenants() {
    const result = await this.pool.query(
      `select n.*,
       count(distinct u.id) filter (where u.estado = 'activo')::int as user_count,
       count(distinct u.id) filter (where u.estado = 'activo' and u.rol = 'owner')::int as owner_count,
       count(distinct p.id) filter (where p.activo = true)::int as product_count
       from negocios n
       left join usuarios u on u.negocio_id = n.id
       left join productos p on p.negocio_id = n.id
       where n.id <> $1
       group by n.id
       order by n.nombre`,
      [systemTenantId]
    );
    return result.rows.map((row) => ({ ...mapTenant(row), active: String(row.estado) === "activo", userCount: Number(row.user_count), ownerCount: Number(row.owner_count), productCount: Number(row.product_count) }));
  }

  async updateTenant(tenantId: string, body: Partial<Tenant>) {
    if (tenantId === systemTenantId) return null;
    const current = await this.findTenant(tenantId);
    if (!current) return null;
    const updated = { ...current, name: body.name?.trim() || current.name, businessType: body.businessType?.trim() || current.businessType, address: body.address != null ? toOptional(body.address) : current.address, phone: body.phone != null ? toOptional(body.phone) : current.phone, active: body.active ?? current.active ?? true };
    const result = await this.pool.query(
      `update negocios set nombre=$1,rubro=$2,direccion=$3,telefono=$4,estado=$5 where id=$6 returning *`,
      [updated.name, updated.businessType, updated.address, updated.phone, updated.active ? "activo" : "inactivo", tenantId]
    );
    return result.rows[0] ? mapTenant(result.rows[0]) : null;
  }

  async registerTenant(input: { name: string; email: string; password: string; businessName: string; businessType: string }) {
    const tenant: Tenant = { id: randomUUID(), name: input.businessName.trim(), businessType: input.businessType.trim() };
    const user: User = { id: randomUUID(), tenantId: tenant.id, name: input.name.trim(), email: input.email.trim().toLowerCase(), role: "owner", active: true };
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const duplicate = await client.query(`select 1 from usuarios where lower(email) = lower($1) limit 1`, [user.email]);
      if (duplicate.rows[0]) throw new Error("El correo ya está registrado.");
      await client.query(`insert into negocios (id,nombre,rubro,estado) values ($1,$2,$3,'activo')`, [tenant.id, tenant.name, tenant.businessType]);
      await client.query(
        `insert into usuarios (id, negocio_id, nombre, email, password_hash, rol, estado) values ($1,$2,$3,$4,$5,'owner','activo')`,
        [user.id, tenant.id, user.name, user.email, hashPassword(input.password)]
      );
      await client.query("commit");
      return { tenant, user };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async authenticate(email: string, password: string) {
    const result = await this.pool.query(
      `select u.*, n.nombre as negocio_nombre, n.rubro, n.direccion, n.telefono
       from usuarios u join negocios n on n.id = u.negocio_id
       where lower(u.email) = lower($1) and u.estado = 'activo' and n.estado = 'activo' limit 1`,
      [email]
    );
    const row = result.rows[0];
    if (!row || !verifyPassword(password, String(row.password_hash))) return null;
    if (String(row.password_hash).startsWith("demo-hash:")) {
      await this.pool.query(`update usuarios set password_hash = $1 where id = $2`, [hashPassword(password), row.id]);
    }
    return {
      user: mapUser(row),
      tenant: { id: row.negocio_id, name: row.negocio_nombre, businessType: row.rubro, address: toOptional(row.direccion), phone: toOptional(row.telefono) }
    };
  }

  async createSession(userId: string, tokenHash: string, expiresAt: string) {
    await this.pool.query(
      `insert into sesiones (id, usuario_id, token_hash, expira_en) values ($1, $2, $3, $4)`,
      [randomUUID(), userId, tokenHash, expiresAt]
    );
  }

  async getSession(tokenHash: string) {
    const result = await this.pool.query(
      `select u.* from sesiones s join usuarios u on u.id = s.usuario_id
       where s.token_hash = $1 and s.revocada_en is null and s.expira_en > CURRENT_TIMESTAMP and u.estado = 'activo' limit 1`,
      [tokenHash]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async revokeSession(tokenHash: string) {
    await this.pool.query(`update sesiones set revocada_en = CURRENT_TIMESTAMP where token_hash = $1`, [tokenHash]);
  }

  async createPasswordResetToken(email: string, tokenHash: string, expiresAt: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const userResult = await client.query(
        `select u.id, u.email
         from usuarios u
         join negocios n on n.id = u.negocio_id
         where lower(u.email) = lower($1) and u.estado = 'activo' and n.estado = 'activo'
         limit 1
         for update of u`,
        [email]
      );
      const user = userResult.rows[0];
      if (!user) {
        await client.query("commit");
        return null;
      }

      const recentToken = await client.query(
        `select 1 from password_reset_tokens
         where usuario_id = $1 and usado_en is null
           and fecha_creacion > CURRENT_TIMESTAMP - INTERVAL '60 seconds'
         limit 1`,
        [user.id]
      );
      if (recentToken.rows[0]) {
        await client.query("commit");
        return null;
      }

      await client.query(
        `insert into password_reset_tokens (id, usuario_id, token_hash, expira_en)
         values ($1, $2, $3, $4)`,
        [randomUUID(), user.id, tokenHash, expiresAt]
      );
      await client.query("commit");
      return { email: String(user.email) };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async completePasswordReset(tokenHash: string, newPassword: string) {
    const preflight = await this.pool.query(
      `select 1 from password_reset_tokens t
       join usuarios u on u.id = t.usuario_id
       where t.token_hash = $1 and t.usado_en is null and t.expira_en > CURRENT_TIMESTAMP
         and u.estado = 'activo'
       limit 1`,
      [tokenHash]
    );
    if (!preflight.rows[0]) return false;

    const passwordHash = hashPassword(newPassword);
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const tokenResult = await client.query(
        `select id, usuario_id
         from password_reset_tokens
         where token_hash = $1 and usado_en is null and expira_en > CURRENT_TIMESTAMP
         for update`,
        [tokenHash]
      );
      const resetToken = tokenResult.rows[0];
      if (!resetToken) {
        await client.query("rollback");
        return false;
      }

      const updatedUser = await client.query(
        `update usuarios set password_hash = $1 where id = $2 and estado = 'activo' returning id`,
        [passwordHash, resetToken.usuario_id]
      );
      if (!updatedUser.rows[0]) {
        await client.query("rollback");
        return false;
      }

      await client.query(
        `update password_reset_tokens set usado_en = CURRENT_TIMESTAMP where usuario_id = $1 and usado_en is null`,
        [resetToken.usuario_id]
      );
      await client.query(
        `update sesiones set revocada_en = CURRENT_TIMESTAMP where usuario_id = $1 and revocada_en is null`,
        [resetToken.usuario_id]
      );
      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
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
      sku: toOptional(body.sku),
      variant: toOptional(body.variant),
      unit: body.unit ?? "unit",
      unitsPerPack: readPositiveNumber(body.unitsPerPack, 1),
      supplierId: toOptional(body.supplierId),
      expiryDate: toOptional(body.expiryDate),
      trackStock: body.trackStock ?? true,
      active: true
    };

    await this.pool.query(
      `insert into productos (
        id, negocio_id, nombre, marca, categoria_id, descripcion, codigo_barras,
        precio_costo, precio_venta, stock_actual, stock_minimo, imagen_url, activo,
        sku, variante, unidad, unidades_por_pack, proveedor_id, fecha_vencimiento, controla_stock
      ) values ($1, $2, $3, $4, null, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, $15, $16, $17, $18)`,
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
        product.imageUrl,
        product.sku,
        product.variant,
        product.unit,
        product.unitsPerPack,
        product.supplierId,
        product.expiryDate,
        product.trackStock
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
      sku: body.sku != null ? toOptional(body.sku) : product.sku,
      variant: body.variant != null ? toOptional(body.variant) : product.variant,
      unit: body.unit ?? product.unit,
      unitsPerPack: body.unitsPerPack != null ? readPositiveNumber(body.unitsPerPack, product.unitsPerPack ?? 1) : product.unitsPerPack,
      supplierId: body.supplierId != null ? toOptional(body.supplierId) : product.supplierId,
      expiryDate: body.expiryDate != null ? toOptional(body.expiryDate) : product.expiryDate,
      trackStock: body.trackStock ?? product.trackStock,
      active: body.active ?? product.active
    };

    await this.pool.query(
      `update productos
       set nombre = $1, marca = $2, descripcion = $3, codigo_barras = $4,
           precio_costo = $5, precio_venta = $6, stock_actual = $7, stock_minimo = $8, activo = $9,
           sku = $10, variante = $11, unidad = $12, unidades_por_pack = $13, proveedor_id = $14,
           fecha_vencimiento = $15, controla_stock = $16
       where id = $17 and negocio_id = $18`,
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
        updated.sku,
        updated.variant,
        updated.unit,
        updated.unitsPerPack,
        updated.supplierId,
        updated.expiryDate,
        updated.trackStock,
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
    const client=await this.pool.connect();
    try{await client.query("begin"); const before=await client.query(`select * from productos where id=$1 and negocio_id=$2 for update`,[productId,tenantId]); if(!before.rows[0]){await client.query("rollback");return null;} const delta=quantity-Number(before.rows[0].stock_actual); const result=await client.query(`update productos set stock_actual=$1 where id=$2 and negocio_id=$3 returning *`,[quantity,productId,tenantId]); await client.query(`insert into movimientos_stock (id,negocio_id,producto_id,tipo,cantidad,stock_resultante,motivo) values ($1,$2,$3,'adjustment',$4,$5,'Ajuste manual')`,[randomUUID(),tenantId,productId,delta,quantity]); await client.query("commit"); return mapProduct(result.rows[0]);}catch(error){await client.query("rollback");throw error;}finally{client.release();}
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
      notes: toOptional(body.notes),
      creditLimit: readPositiveNumber(body.creditLimit),
      creditDays: readPositiveNumber(body.creditDays, 30),
      creditBlocked: Boolean(body.creditBlocked),
      debtBalance: 0,
      active: true
    };

    await this.pool.query(
      `insert into clientes (id, negocio_id, nombre, telefono, email, direccion, observacion, limite_credito, dias_credito, credito_bloqueado, activo)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [customer.id, tenantId, customer.name, customer.phone, customer.email, customer.address, customer.notes, customer.creditLimit, customer.creditDays, customer.creditBlocked]
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
      notes: body.notes != null ? toOptional(body.notes) : current.notes,
      creditLimit: body.creditLimit != null ? readPositiveNumber(body.creditLimit) : current.creditLimit,
      creditDays: body.creditDays != null ? readPositiveNumber(body.creditDays, 30) : current.creditDays,
      creditBlocked: body.creditBlocked ?? current.creditBlocked,
      active: body.active ?? current.active
    };

    await this.pool.query(
      `update clientes
       set nombre = $1, telefono = $2, email = $3, direccion = $4, observacion = $5,
           limite_credito = $6, dias_credito = $7, credito_bloqueado = $8, activo = $9
       where id = $10 and negocio_id = $11`,
      [updated.name, updated.phone, updated.email, updated.address, updated.notes, updated.creditLimit, updated.creditDays, updated.creditBlocked, updated.active, customerId, tenantId]
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

  async createSale(tenantId: string, body: SaleCreationPayload) {
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
      const previousReturnRows = await client.query(`select detalle from devoluciones_venta where venta_id = $1 and negocio_id = $2`, [saleId, tenantId]);
      const previousReturnedItems = previousReturnRows.rows.flatMap((row) =>
        Array.isArray(row.detalle) ? row.detalle as Array<{ productId: string; quantity: number }> : []
      );
      for (const detail of detailResult.rows) {
        const alreadyReturned = previousReturnedItems
          .filter((item) => item.productId === String(detail.producto_id))
          .reduce((sum, item) => sum + Number(item.quantity), 0);
        const quantityToRestore = Math.max(0, Number(detail.cantidad) - alreadyReturned);
        if (quantityToRestore <= 0) continue;
        const stockResult = await client.query(`update productos set stock_actual = stock_actual + $1 where id = $2 and negocio_id = $3 and controla_stock = true returning stock_actual`, [
          quantityToRestore,
          detail.producto_id,
          tenantId
        ]);
        if (stockResult.rows[0]) {
          await client.query(
            `insert into movimientos_stock (id, negocio_id, producto_id, tipo, cantidad, stock_resultante, motivo)
             values ($1, $2, $3, 'return', $4, $5, $6)`,
            [randomUUID(), tenantId, detail.producto_id, quantityToRestore, Number(stockResult.rows[0].stock_actual), toOptional(reason) ?? "Anulación de venta"]
          );
        }
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

  async returnSale(tenantId: string, saleId: string, payload: { items: Array<{ productId: string; quantity: number }>; reason: string; userId?: string }) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(`select id from ventas where id = $1 and negocio_id = $2 for update`, [saleId, tenantId]);
      const sale = (await this.getSales(tenantId)).find((candidate) => candidate.id === saleId);
      if (!sale || sale.status === "cancelled" || sale.status === "refunded") {
        await client.query("rollback");
        return null;
      }
      const returnedItems: SaleReturn["items"] = [];
      const previousRows = await client.query(`select detalle from devoluciones_venta where venta_id=$1 and negocio_id=$2`, [saleId, tenantId]);
      const previousItems = previousRows.rows.flatMap((row) => Array.isArray(row.detalle) ? row.detalle as Array<{ productId: string; quantity: number }> : []);
      for (const requested of payload.items) {
        const original = sale.items.find((item) => item.productId === requested.productId);
        const alreadyReturned = previousItems.filter((item) => item.productId === requested.productId).reduce((sum, item) => sum + Number(item.quantity), 0);
        if (!original || requested.quantity <= 0 || requested.quantity + alreadyReturned > original.quantity) throw new Error("Cantidad de devolución inválida.");
        const stockResult = await client.query(
          `update productos set stock_actual = stock_actual + $1 where id = $2 and negocio_id = $3 and controla_stock = true returning stock_actual`,
          [requested.quantity, requested.productId, tenantId]
        );
        if (stockResult.rows[0]) {
          await client.query(
            `insert into movimientos_stock (id, negocio_id, producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id)
             values ($1, $2, $3, 'return', $4, $5, $6, $7)`,
            [randomUUID(), tenantId, requested.productId, requested.quantity, Number(stockResult.rows[0].stock_actual), payload.reason, payload.userId]
          );
        }
        returnedItems.push({ productId: requested.productId, productName: original.productName, quantity: requested.quantity, amount: requested.quantity * original.unitPrice });
      }
      const result: SaleReturn = { id: randomUUID(), tenantId, saleId, items: returnedItems, total: returnedItems.reduce((sum, item) => sum + item.amount, 0), reason: payload.reason, createdByUserId: payload.userId, createdAt: new Date().toISOString() };
      await client.query(
        `insert into devoluciones_venta (id, negocio_id, venta_id, usuario_id, total, motivo, detalle, fecha_creacion)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
        [result.id, tenantId, saleId, payload.userId, result.total, result.reason, JSON.stringify(result.items), result.createdAt]
      );
      if (sale.saleType === "credit") {
        const debtResult = await client.query(
          `select id, saldo_pendiente from cuentas_fiado where negocio_id = $1 and venta_id = $2 and saldo_pendiente > 0 for update`,
          [tenantId, saleId]
        );
        let remaining = result.total;
        for (const debt of debtResult.rows) {
          const reduction = Math.min(Number(debt.saldo_pendiente), remaining);
          const balance = Number(debt.saldo_pendiente) - reduction;
          await client.query(`update cuentas_fiado set saldo_pendiente = $1, estado = $2 where id = $3`, [balance, balance === 0 ? "pagada" : "pendiente", debt.id]);
          remaining -= reduction;
          if (remaining <= 0) break;
        }
      }
      const returnedAll = sale.items.every((item) => previousItems.filter((entry) => entry.productId === item.productId).reduce((sum, entry) => sum + Number(entry.quantity), 0) + returnedItems.filter((entry) => entry.productId === item.productId).reduce((sum, entry) => sum + entry.quantity, 0) >= item.quantity);
      await client.query(`update ventas set estado_venta = $1 where id = $2 and negocio_id = $3`, [returnedAll ? "refunded" : "partially_refunded", saleId, tenantId]);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getCashRegister(tenantId: string, date?: string) {
    const returnRows = await this.pool.query(`select venta_id, coalesce(sum(total), 0) as total from devoluciones_venta where negocio_id = $1 group by venta_id`, [tenantId]);
    const returnedTotals = new Map(returnRows.rows.map((row) => [String(row.venta_id), Number(row.total)]));
    const session = await this.getOpenCashSession(tenantId);
    const selectedDate = salesDateFromInput(date);
    const dayKey = selectedDate.toISOString().slice(0, 10);
    const summary = buildCashRegisterFromSales(await this.getSales(tenantId), selectedDate, returnedTotals, date ? undefined : session?.openedAt);
    const movements = await this.getCashMovements(tenantId);
    const active = movements.filter((movement) => session ? movement.sessionId === session.id : movement.createdAt.slice(0, 10) === dayKey);
    const deposits = active.filter((movement) => movement.type === "deposit").reduce((sum, movement) => sum + movement.amount, 0);
    const withdrawals = active.filter((movement) => movement.type !== "deposit").reduce((sum, movement) => sum + movement.amount, 0);
    return { ...summary, openingAmount: session?.openingAmount ?? 0, cashDeposits: deposits, cashWithdrawals: withdrawals, expectedCash: (session?.openingAmount ?? 0) + summary.totalsByMethod.cash + deposits - withdrawals };
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
      const totalDebt = debts.rows.reduce((sum, debt) => sum + Number(debt.saldo_pendiente), 0);
      if (amount > totalDebt) throw new Error("El abono no puede superar la deuda pendiente.");

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

  async getSuppliers(tenantId: string) {
    const result = await this.pool.query(`select * from proveedores where negocio_id = $1 and activo = true order by nombre`, [tenantId]);
    return result.rows.map(mapSupplier);
  }

  async createSupplier(tenantId: string, body: Partial<Supplier>) {
    const supplier: Supplier = { id: randomUUID(), tenantId, name: String(body.name).trim(), contactName: toOptional(body.contactName), phone: toOptional(body.phone), email: toOptional(body.email), notes: toOptional(body.notes), active: true };
    await this.pool.query(
      `insert into proveedores (id, negocio_id, nombre, nombre_contacto, telefono, email, observacion) values ($1,$2,$3,$4,$5,$6,$7)`,
      [supplier.id, tenantId, supplier.name, supplier.contactName, supplier.phone, supplier.email, supplier.notes]
    );
    return supplier;
  }

  async updateSupplier(tenantId: string, supplierId: string, body: Partial<Supplier>) {
    const current = (await this.getSuppliers(tenantId)).find((supplier) => supplier.id === supplierId);
    if (!current) return null;
    const updated: Supplier = { ...current, name: body.name?.trim() || current.name, contactName: body.contactName != null ? toOptional(body.contactName) : current.contactName, phone: body.phone != null ? toOptional(body.phone) : current.phone, email: body.email != null ? toOptional(body.email) : current.email, notes: body.notes != null ? toOptional(body.notes) : current.notes, active: body.active ?? current.active };
    await this.pool.query(
      `update proveedores set nombre=$1,nombre_contacto=$2,telefono=$3,email=$4,observacion=$5,activo=$6 where id=$7 and negocio_id=$8`,
      [updated.name, updated.contactName, updated.phone, updated.email, updated.notes, updated.active, supplierId, tenantId]
    );
    return updated;
  }

  async getPurchaseOrders(tenantId: string) {
    const orders = await this.pool.query(
      `select oc.*, p.nombre as supplier_name from ordenes_compra oc join proveedores p on p.id=oc.proveedor_id where oc.negocio_id=$1 order by oc.fecha_creacion desc`,
      [tenantId]
    );
    const details = await this.pool.query(
      `select d.*, p.nombre as product_name from detalle_ordenes_compra d join ordenes_compra o on o.id=d.orden_id join productos p on p.id=d.producto_id where o.negocio_id=$1`,
      [tenantId]
    );
    return orders.rows.map((order) => mapPurchaseOrder(order, details.rows.filter((detail) => detail.orden_id === order.id)));
  }

  async createPurchaseOrder(tenantId: string, body: PurchaseCreationPayload) {
    const supplier = (await this.getSuppliers(tenantId)).find((candidate) => candidate.id === body.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado.");
    const products = await this.getProducts(tenantId);
    const items = body.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new Error("Producto no encontrado en la orden.");
      return { productId: product.id, productName: product.name, quantity: item.quantity, receivedQuantity: 0, unitCost: item.unitCost, subtotal: item.quantity * item.unitCost };
    });
    const purchase: PurchaseOrder = { id: randomUUID(), tenantId, supplierId: supplier.id, supplierName: supplier.name, status: body.status ?? "ordered", items, total: items.reduce((sum, item) => sum + item.subtotal, 0), expectedAt: toOptional(body.expectedAt), notes: toOptional(body.notes), createdAt: new Date().toISOString() };
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(`insert into ordenes_compra (id,negocio_id,proveedor_id,estado,total,fecha_esperada,observacion,fecha_creacion) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [purchase.id,tenantId,purchase.supplierId,purchase.status,purchase.total,purchase.expectedAt,purchase.notes,purchase.createdAt]);
      for (const item of items) await client.query(`insert into detalle_ordenes_compra (id,orden_id,producto_id,cantidad,cantidad_recibida,costo_unitario,subtotal) values ($1,$2,$3,$4,0,$5,$6)`, [randomUUID(),purchase.id,item.productId,item.quantity,item.unitCost,item.subtotal]);
      await client.query("commit");
      return purchase;
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }

  async receivePurchaseOrder(tenantId: string, purchaseId: string, quantities?: Record<string, number>, userId?: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const orderResult = await client.query(`select * from ordenes_compra where id=$1 and negocio_id=$2 for update`, [purchaseId,tenantId]);
      if (!orderResult.rows[0]) { await client.query("rollback"); return null; }
      const details = await client.query(`select * from detalle_ordenes_compra where orden_id=$1 for update`, [purchaseId]);
      for (const item of details.rows) {
        const remaining = Number(item.cantidad)-Number(item.cantidad_recibida);
        const received = Math.min(remaining, Math.max(0, quantities?.[item.producto_id] ?? remaining));
        if (received <= 0) continue;
        const product = await client.query(`select * from productos where id=$1 and negocio_id=$2 for update`, [item.producto_id,tenantId]);
        const oldStock=Number(product.rows[0].stock_actual); const oldCost=Number(product.rows[0].precio_costo); const nextStock=oldStock+received;
        const nextCost=nextStock>0?Math.round((oldStock*oldCost+received*Number(item.costo_unitario))/nextStock):Number(item.costo_unitario);
        await client.query(`update productos set stock_actual=$1,precio_costo=$2 where id=$3 and negocio_id=$4`, [nextStock,nextCost,item.producto_id,tenantId]);
        await client.query(`update detalle_ordenes_compra set cantidad_recibida=cantidad_recibida+$1 where id=$2`, [received,item.id]);
        await client.query(`insert into movimientos_stock (id,negocio_id,producto_id,tipo,cantidad,stock_resultante,motivo,usuario_id) values ($1,$2,$3,'purchase',$4,$5,$6,$7)`, [randomUUID(),tenantId,item.producto_id,received,nextStock,`Recepción ${purchaseId.slice(0,8)}`,userId]);
      }
      const pending = await client.query(`select count(*)::int as count from detalle_ordenes_compra where orden_id=$1 and cantidad_recibida<cantidad`, [purchaseId]);
      const status = Number(pending.rows[0].count)===0?"received":"partially_received";
      await client.query(`update ordenes_compra set estado=$1,fecha_recepcion=case when $1='received' then CURRENT_TIMESTAMP else fecha_recepcion end where id=$2`, [status,purchaseId]);
      await client.query("commit");
      return (await this.getPurchaseOrders(tenantId)).find((purchase)=>purchase.id===purchaseId)??null;
    } catch(error){await client.query("rollback");throw error;} finally{client.release();}
  }

  async getDebts(tenantId: string) {
    const result = await this.pool.query(
      `select cf.*, c.nombre as customer_name,
       case when cf.saldo_pendiente=0 then 'paid' when cf.fecha_vencimiento<CURRENT_DATE then 'overdue' else 'pending' end as computed_status
       from cuentas_fiado cf join clientes c on c.id=cf.cliente_id where cf.negocio_id=$1 order by cf.fecha_creacion desc`,
      [tenantId]
    );
    return result.rows.map(mapDebt);
  }

  async getOpenCashSession(tenantId: string) {
    const result = await this.pool.query(`select s.*,u.nombre as opened_by_name from sesiones_caja s left join usuarios u on u.id=s.usuario_apertura_id where s.negocio_id=$1 and s.estado='open' limit 1`, [tenantId]);
    return result.rows[0]?mapCashSession(result.rows[0]):undefined;
  }

  async openCashSession(tenantId: string, amount: number, userId: string) {
    if(await this.getOpenCashSession(tenantId)) throw new Error("Ya existe una caja abierta.");
    const result=await this.pool.query(`insert into sesiones_caja (id,negocio_id,usuario_apertura_id,monto_inicial) values ($1,$2,$3,$4) returning *`,[randomUUID(),tenantId,userId,amount]);
    const user=(await this.getUsers(tenantId)).find((candidate)=>candidate.id===userId);
    return mapCashSession({...result.rows[0],opened_by_name:user?.name});
  }

  async addCashMovement(tenantId: string, body: { type: CashMovement["type"]; amount: number; reason: string; userId: string }) {
    const session=await this.getOpenCashSession(tenantId); if(!session) throw new Error("Debes abrir la caja antes de registrar movimientos.");
    const result=await this.pool.query(`insert into movimientos_caja (id,negocio_id,sesion_caja_id,usuario_id,tipo,monto,motivo) values ($1,$2,$3,$4,$5,$6,$7) returning *`,[randomUUID(),tenantId,session.id,body.userId,body.type,body.amount,body.reason]);
    const user=(await this.getUsers(tenantId)).find((candidate)=>candidate.id===body.userId);
    return mapCashMovement({...result.rows[0],created_by_name:user?.name});
  }

  async closeCashSession(tenantId: string, countedAmount: number, note: string | undefined, userId: string) {
    const session=await this.getOpenCashSession(tenantId); if(!session) return null;
    const summary=await this.getCashRegister(tenantId); const movements=await this.getCashMovements(tenantId);
    const active=movements.filter((movement)=>movement.sessionId===session.id); const deposits=active.filter((m)=>m.type==="deposit").reduce((s,m)=>s+m.amount,0); const withdrawals=active.filter((m)=>m.type!=="deposit").reduce((s,m)=>s+m.amount,0);
    const expected=session.openingAmount+summary.totalsByMethod.cash+deposits-withdrawals;
    const result=await this.pool.query(`update sesiones_caja set estado='closed',usuario_cierre_id=$1,fecha_cierre=CURRENT_TIMESTAMP,efectivo_contado=$2,efectivo_esperado=$3,diferencia=$4,observacion=$5 where id=$6 and negocio_id=$7 returning *`,[userId,countedAmount,expected,countedAmount-expected,toOptional(note),session.id,tenantId]);
    return result.rows[0]?mapCashSession(result.rows[0]):null;
  }

  async getCashMovements(tenantId: string) {
    const result=await this.pool.query(`select m.*,u.nombre as created_by_name from movimientos_caja m left join usuarios u on u.id=m.usuario_id where m.negocio_id=$1 order by m.fecha_creacion desc limit 100`,[tenantId]); return result.rows.map(mapCashMovement);
  }

  async getStockMovements(tenantId: string, productId?: string) {
    const result=await this.pool.query(`select m.*,p.nombre as product_name from movimientos_stock m join productos p on p.id=m.producto_id where m.negocio_id=$1 and ($2::uuid is null or m.producto_id=$2::uuid) order by m.fecha_creacion desc limit 200`,[tenantId,productId??null]); return result.rows.map(mapStockMovement);
  }

  async recordAudit(body: Omit<AuditEvent,"id"|"createdAt">) {
    const id=randomUUID(); const result=await this.pool.query(`insert into auditoria (id,negocio_id,usuario_id,accion,entidad,entidad_id,detalle) values ($1,$2,$3,$4,$5,$6,$7::jsonb) returning *`,[id,body.tenantId,body.userId,body.action,body.entity,body.entityId,JSON.stringify(body.details??{})]); return mapAuditEvent({...result.rows[0],user_name:body.userName});
  }

  async getAuditEvents(tenantId: string) {
    const result=await this.pool.query(`select a.*,u.nombre as user_name from auditoria a left join usuarios u on u.id=a.usuario_id where a.negocio_id=$1 order by a.fecha_creacion desc limit 100`,[tenantId]); return result.rows.map(mapAuditEvent);
  }

  private async createSaleWithClient(
    client: pg.PoolClient,
    tenantId: string,
    body: SaleCreationPayload
  ) {
    if (body.idempotencyKey) {
      const existing = await client.query(`select id from ventas where negocio_id=$1 and idempotency_key=$2`, [tenantId, body.idempotencyKey]);
      if (existing.rows[0]) return (await this.getSales(tenantId)).find((sale) => sale.id === existing.rows[0].id)!;
    }
    const saleItems: SaleItem[] = [];

    for (const item of body.items) {
      const productResult = await client.query(`select * from productos where id = $1 and negocio_id = $2 for update`, [
        item.productId,
        tenantId
      ]);
      const product = productResult.rows[0] ? mapProduct(productResult.rows[0]) : null;
      if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
      if (product.trackStock !== false && product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);

      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal: product.salePrice * item.quantity
      });
    }

    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Math.min(readPositiveNumber(body.discount), subtotal);
    const total = subtotal - discount;
    const payments = body.payments?.filter((payment) => payment.amount > 0);
    if (payments?.length && payments.reduce((sum, payment) => sum + payment.amount, 0) !== total) throw new Error("La suma de los medios de pago debe coincidir con el total de la venta.");
    const creditAmount = payments?.find((payment) => payment.method === "credit")?.amount ?? (body.paymentMethod === "credit" ? total : 0);
    const isCredit = creditAmount > 0;
    if (isCredit && !body.customerId) throw new Error("Una venta fiada debe estar asociada a un cliente.");

    if (isCredit && body.customerId) {
      const customerResult = await client.query(`select * from clientes where id=$1 and negocio_id=$2 for update`, [body.customerId, tenantId]);
      const balanceResult = await client.query(`select coalesce(sum(saldo_pendiente),0) as debt_balance from cuentas_fiado where cliente_id=$1 and negocio_id=$2 and estado='pendiente'`, [body.customerId, tenantId]);
      const customer = customerResult.rows[0] ? mapCustomer({ ...customerResult.rows[0], debt_balance: balanceResult.rows[0]?.debt_balance }) : null;
      if (!customer) throw new Error("Cliente no encontrado.");
      if (customer.creditBlocked) throw new Error("El fiado de este cliente está bloqueado.");
      if ((customer.creditLimit ?? 0) > 0 && customer.debtBalance + creditAmount > (customer.creditLimit ?? 0)) throw new Error("La venta supera el límite de crédito del cliente.");
    }

    const sale: Sale = {
      id: randomUUID(),
      tenantId,
      sellerId: body.sellerId ?? demoSellerId,
      customerId: body.customerId,
      items: saleItems,
      subtotal,
      discount,
      total,
      paymentMethod: payments && payments.length > 1 ? "mixed" : body.paymentMethod,
      payments,
      notes: toOptional(body.notes),
      paymentStatus: body.paymentMethod === "webpay" ? "pending" : "approved",
      saleType: isCredit ? "credit" : "normal",
      status: "active",
      createdAt: new Date().toISOString()
    };

    await client.query(
      `insert into ventas (id, negocio_id, usuario_id, cliente_id, subtotal, descuento, total, metodo_pago, detalle_pagos, observacion, idempotency_key, estado_pago, tipo_venta, estado_venta, fecha_creacion)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15)`,
      [
        sale.id,
        tenantId,
        sale.sellerId,
        sale.customerId,
        sale.subtotal,
        sale.discount,
        sale.total,
        sale.paymentMethod,
        JSON.stringify(sale.payments ?? []),
        sale.notes,
        body.idempotencyKey,
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
      const stockResult = await client.query(`update productos set stock_actual = case when controla_stock then stock_actual - $1 else stock_actual end where id = $2 and negocio_id = $3 returning stock_actual,controla_stock`, [item.quantity,item.productId,tenantId]);
      if (stockResult.rows[0]?.controla_stock) await client.query(
        `insert into movimientos_stock (id,negocio_id,producto_id,tipo,cantidad,stock_resultante,motivo,usuario_id) values ($1,$2,$3,'sale',$4,$5,$6,$7)`,
        [randomUUID(),tenantId,item.productId,-item.quantity,Number(stockResult.rows[0].stock_actual),`Venta ${sale.id.slice(0,8)}`,sale.sellerId]
      );
    }

    if (isCredit && body.customerId) {
      const customerResult=await client.query(`select dias_credito from clientes where id=$1 and negocio_id=$2`,[body.customerId,tenantId]);
      const dueDate=new Date(Date.now()+Number(customerResult.rows[0]?.dias_credito??30)*86_400_000).toISOString().slice(0,10);
      await client.query(
        `insert into cuentas_fiado (id, negocio_id, cliente_id, venta_id, monto_original, saldo_pendiente, estado, fecha_vencimiento)
         values ($1, $2, $3, $4, $5, $6, 'pendiente', $7)`,
        [randomUUID(), tenantId, body.customerId, sale.id, creditAmount, creditAmount, dueDate]
      );
    }

    return sale;
  }

  private async seedDemoData() {
    const tenantCount = await this.pool.query(
      `select count(*)::int as count from negocios where id <> $1`,
      [systemTenantId]
    );
    if (!shouldSeedDemoData(Number(tenantCount.rows[0]?.count ?? 0))) return;

    const demoUsers = buildDemoUsers();
    const client = await this.pool.connect();

    try {
      await client.query("begin");

      for (const tenant of demoTenantSeeds) {
        await client.query(
          `insert into negocios (id, nombre, rubro, direccion, telefono, email_contacto, estado)
           values ($1, $2, $3, $4, $5, $6, 'activo')
           on conflict (id) do nothing`,
          [tenant.id, tenant.name, tenant.businessType, tenant.address, tenant.phone, tenant.emailContact]
        );
      }

      for (const user of demoUsers) {
        const password = user.role === "seller"
          ? process.env.SELLER_DEMO_PASSWORD ?? "Duoc2026V"
          : process.env.OWNER_DEMO_PASSWORD ?? process.env.DEMO_PASSWORD ?? "Duoc2026";
        await client.query(
          `insert into usuarios (id, negocio_id, nombre, email, password_hash, rol, estado)
           values ($1, $2, $3, $4, $5, $6, 'activo')
           on conflict (id) do nothing`,
          [user.id, user.tenantId, user.name, user.email, hashPassword(password), user.role]
        );
      }

      for (const supplier of buildDemoSuppliers()) {
        await client.query(
          `insert into proveedores (id, negocio_id, nombre, nombre_contacto, telefono, email, observacion, activo)
           values ($1, $2, $3, $4, $5, $6, $7, true)
           on conflict (id) do nothing`,
          [persistentDemoId(supplier.id), supplier.tenantId, supplier.name, supplier.contactName, supplier.phone, supplier.email, supplier.notes]
        );
      }

      for (const product of buildDemoProducts()) {
        await client.query(
          `insert into productos (
            id, negocio_id, nombre, marca, categoria_id, descripcion, codigo_barras,
            precio_costo, precio_venta, stock_actual, stock_minimo, imagen_url, activo,
            sku, variante, unidad, unidades_por_pack, proveedor_id, fecha_vencimiento, controla_stock
          ) values ($1, $2, $3, $4, null, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, $15, $16, $17, $18)
          on conflict (id) do nothing`,
          [
            persistentDemoId(product.id),
            product.tenantId,
            product.name,
            product.brand,
            product.category,
            product.barcode,
            product.costPrice,
            product.salePrice,
            product.stock,
            product.minimumStock,
            product.imageUrl,
            product.sku,
            product.variant,
            product.unit ?? "unit",
            product.unitsPerPack ?? 1,
            product.supplierId ? persistentDemoId(product.supplierId) : undefined,
            product.expiryDate,
            product.trackStock ?? true
          ]
        );
      }

      for (const customer of buildDemoCustomers()) {
        await client.query(
          `insert into clientes (id, negocio_id, nombre, telefono, email, direccion, observacion, limite_credito, dias_credito, credito_bloqueado, activo)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
           on conflict (id) do nothing`,
          [
            persistentDemoId(customer.id),
            customer.tenantId,
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.notes,
            customer.creditLimit ?? 0,
            customer.creditDays ?? 30,
            customer.creditBlocked ?? false
          ]
        );
      }

      for (const debt of store.debts.filter((candidate) => demoTenantSeeds.some((tenant) => tenant.id === candidate.tenantId))) {
        await client.query(
          `insert into cuentas_fiado (id, negocio_id, cliente_id, venta_id, monto_original, saldo_pendiente, estado, fecha_vencimiento)
           values ($1, $2, $3, null, $4, $5, $6, $7)
           on conflict (id) do nothing`,
          [persistentDemoId(debt.id), debt.tenantId, persistentDemoId(debt.customerId), debt.originalAmount, debt.balance, debt.status === "overdue" ? "pendiente" : debt.status, debt.dueDate]
        );
      }

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureSystemAdmin() {
    const adminPassword =
      process.env.PLATFORM_ADMIN_PASSWORD ??
      (process.env.NODE_ENV === "production" ? undefined : "AdminLocalito2026");

    if (!adminPassword) {
      console.warn("[localito-api] Falta PLATFORM_ADMIN_PASSWORD; el administrador de plataforma no fue creado.");
      return;
    }

    await this.pool.query(
      `insert into negocios (id,nombre,rubro,estado) values ($1,'Administración Localito','Plataforma','activo')
       on conflict (id) do update set nombre=excluded.nombre,rubro=excluded.rubro,estado='activo'`,
      [systemTenantId]
    );
    await this.pool.query(
       `insert into usuarios (id,negocio_id,nombre,email,password_hash,rol,estado)
        values ($1,$2,'Camilo Gonzalez',$3,$4,'system_admin','activo')
        on conflict (email) do update set negocio_id=excluded.negocio_id,nombre=excluded.nombre,rol='system_admin',estado='activo'`,
      [systemAdminId, systemTenantId, systemAdminEmail, hashPassword(adminPassword)]
    );
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
    phone: toOptional(row.telefono),
    active: String(row.estado ?? "activo") === "activo",
    createdAt: row.fecha_creacion ? new Date(String(row.fecha_creacion)).toISOString() : undefined
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
    sku: toOptional(row.sku),
    variant: toOptional(row.variante),
    unit: (toOptional(row.unidad) as Product["unit"]) ?? "unit",
    unitsPerPack: Number(row.unidades_por_pack ?? 1),
    supplierId: toOptional(row.proveedor_id),
    expiryDate: row.fecha_vencimiento ? new Date(String(row.fecha_vencimiento)).toISOString().slice(0, 10) : undefined,
    trackStock: row.controla_stock == null ? true : Boolean(row.controla_stock),
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
    notes: toOptional(row.observacion),
    creditLimit: Number(row.limite_credito ?? 0),
    creditDays: Number(row.dias_credito ?? 30),
    creditBlocked: Boolean(row.credito_bloqueado),
    debtBalance: parseInitialDebt(row),
    active: Boolean(row.activo)
  };
}

function mapSale(row: Record<string, unknown>, items: SaleItem[]): Sale {
  const payments = Array.isArray(row.detalle_pagos)
    ? row.detalle_pagos
    : typeof row.detalle_pagos === "string"
      ? JSON.parse(row.detalle_pagos)
      : [];
  return {
    id: String(row.id),
    tenantId: String(row.negocio_id),
    sellerId: String(row.usuario_id),
    customerId: toOptional(row.cliente_id),
    items,
    subtotal: Number(row.subtotal ?? row.total),
    discount: Number(row.descuento ?? 0),
    total: Number(row.total),
    paymentMethod: String(row.metodo_pago) as PaymentMethod,
    payments: payments as SalePayment[],
    notes: toOptional(row.observacion),
    paymentStatus: String(row.estado_pago) as Sale["paymentStatus"],
    saleType: String(row.tipo_venta) as Sale["saleType"],
    status: String(row.estado_venta ?? "active") as Sale["status"],
    cancellationReason: toOptional(row.motivo_anulacion),
    cancelledAt: row.fecha_anulacion ? new Date(String(row.fecha_anulacion)).toISOString() : undefined,
    createdAt: new Date(String(row.fecha_creacion)).toISOString()
  };
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return { id: String(row.id), tenantId: String(row.negocio_id), name: String(row.nombre), contactName: toOptional(row.nombre_contacto), phone: toOptional(row.telefono), email: toOptional(row.email), notes: toOptional(row.observacion), active: Boolean(row.activo) };
}

function mapPurchaseOrder(row: Record<string, unknown>, detailRows: Array<Record<string, unknown>>): PurchaseOrder {
  const items = detailRows.map((detail) => ({ productId: String(detail.producto_id), productName: toOptional(detail.product_name), quantity: Number(detail.cantidad), receivedQuantity: Number(detail.cantidad_recibida), unitCost: Number(detail.costo_unitario), subtotal: Number(detail.subtotal) }));
  return { id: String(row.id), tenantId: String(row.negocio_id), supplierId: String(row.proveedor_id), supplierName: toOptional(row.supplier_name), status: String(row.estado) as PurchaseStatus, items, total: Number(row.total), expectedAt: row.fecha_esperada ? new Date(String(row.fecha_esperada)).toISOString().slice(0, 10) : undefined, notes: toOptional(row.observacion), createdAt: new Date(String(row.fecha_creacion)).toISOString(), receivedAt: row.fecha_recepcion ? new Date(String(row.fecha_recepcion)).toISOString() : undefined };
}

function mapDebt(row: Record<string, unknown>): DebtAccount {
  return { id: String(row.id), tenantId: String(row.negocio_id), customerId: String(row.cliente_id), customerName: toOptional(row.customer_name), saleId: toOptional(row.venta_id), originalAmount: Number(row.monto_original), balance: Number(row.saldo_pendiente), dueDate: row.fecha_vencimiento ? new Date(String(row.fecha_vencimiento)).toISOString().slice(0, 10) : undefined, status: String(row.computed_status ?? row.estado) as DebtAccount["status"], createdAt: new Date(String(row.fecha_creacion)).toISOString() };
}

function mapCashSession(row: Record<string, unknown>): CashSession {
  return { id: String(row.id), tenantId: String(row.negocio_id), openedByUserId: toOptional(row.usuario_apertura_id), openedByName: toOptional(row.opened_by_name), openedAt: new Date(String(row.fecha_apertura)).toISOString(), openingAmount: Number(row.monto_inicial), status: String(row.estado) as CashSession["status"], closedAt: row.fecha_cierre ? new Date(String(row.fecha_cierre)).toISOString() : undefined, closedByUserId: toOptional(row.usuario_cierre_id), countedAmount: row.efectivo_contado == null ? undefined : Number(row.efectivo_contado), expectedCash: row.efectivo_esperado == null ? undefined : Number(row.efectivo_esperado), difference: row.diferencia == null ? undefined : Number(row.diferencia), note: toOptional(row.observacion) };
}

function mapCashMovement(row: Record<string, unknown>): CashMovement {
  return { id: String(row.id), tenantId: String(row.negocio_id), sessionId: toOptional(row.sesion_caja_id), type: String(row.tipo) as CashMovement["type"], amount: Number(row.monto), reason: String(row.motivo), createdByUserId: toOptional(row.usuario_id), createdByName: toOptional(row.created_by_name), createdAt: new Date(String(row.fecha_creacion)).toISOString() };
}

function mapStockMovement(row: Record<string, unknown>): StockMovement {
  return { id: String(row.id), tenantId: String(row.negocio_id), productId: String(row.producto_id), productName: toOptional(row.product_name), type: String(row.tipo) as StockMovementType, quantity: Number(row.cantidad), resultingStock: Number(row.stock_resultante), reason: toOptional(row.motivo), createdByUserId: toOptional(row.usuario_id), createdAt: new Date(String(row.fecha_creacion)).toISOString() };
}

function mapAuditEvent(row: Record<string, unknown>): AuditEvent {
  const details = typeof row.detalle === "object" && row.detalle ? row.detalle as Record<string, unknown> : undefined;
  return { id: String(row.id), tenantId: String(row.negocio_id), userId: toOptional(row.usuario_id), userName: toOptional(row.user_name), action: String(row.accion), entity: String(row.entidad), entityId: toOptional(row.entidad_id), details, createdAt: new Date(String(row.fecha_creacion)).toISOString() };
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
      credit: Number(row.total_fiado),
      mixed: 0
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
