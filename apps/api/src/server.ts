import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { Customer, PaymentMethod, Product, Tenant, User } from "@localito/shared";
import { createRepository } from "./repository.js";
import { createSessionToken, createSignedSessionToken, hashSessionToken, passwordPolicyError, verifySignedSessionToken } from "./auth.js";
import { isTransactionalEmailConfigured, sendPasswordResetEmail } from "./email.js";
import { importInvoice } from "./invoiceImport.js";
import { bulkImportProducts } from "./productImport.js";
import { extractInvoiceImage, extractQuickSaleImage, identifyProductImage, isInvoiceAiConfigured, isQuickSaleAiConfigured } from "./vision.js";

const app = express();
const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? "0.0.0.0";
const configuredWebOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const repository = await createRepository();
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const usesServerlessMemory = process.env.VERCEL === "1" && repository.mode === "memory";
const signedSessionSecret = process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? process.env.OWNER_DEMO_PASSWORD ?? "localito-demo-session-change-me";
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const passwordResetRequests = new Map<string, { count: number; resetAt: number }>();
const passwordResetConfirmations = new Map<string, { count: number; resetAt: number }>();
const invoiceAiRequests = new Map<string, { count: number; resetAt: number }>();
const quickSaleAiRequests = new Map<string, { count: number; resetAt: number }>();
const quickSaleAiHourlyLimit = 40;
const passwordResetDurationMs = 30 * 60 * 1000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    }
  })
);
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));

function isPrivateLanHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function isAllowedOrigin(origin?: string) {
  if (!origin || configuredWebOrigins.includes(origin)) return true;
  if (vercelOrigin && origin === vercelOrigin) return true;
  if (process.env.NODE_ENV === "production") return false;

  try {
    const url = new URL(origin);
    return isPrivateLanHost(url.hostname);
  } catch {
    return false;
  }
}

type AuthenticatedRequest = express.Request & { localitoUser?: User };

function tenantIdFromRequest(req: express.Request) {
  const user = (req as AuthenticatedRequest).localitoUser;
  if (!user) throw new Error("No existe una sesión autenticada.");
  return user.tenantId;
}

function tokenUserIdFromRequest(req: express.Request) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  return token;
}

async function userFromRequest(req: express.Request) {
  const token = tokenUserIdFromRequest(req);
  if (!token) return null;
  const request = req as AuthenticatedRequest;
  if (request.localitoUser) return request.localitoUser;
  const user = usesServerlessMemory && token.startsWith("v1.")
    ? verifySignedSessionToken(token, signedSessionSecret)
    : await repository.getSession(hashSessionToken(token));
  if (user) request.localitoUser = user;
  return user;
}

async function createAuthToken(user: User) {
  if (usesServerlessMemory) return createSignedSessionToken(user, sessionDurationMs, signedSessionSecret);
  const token = createSessionToken();
  await repository.createSession(user.id, hashSessionToken(token), new Date(Date.now() + sessionDurationMs).toISOString());
  return token;
}

async function requireRoles(req: express.Request, res: express.Response, roles: Array<User["role"]>) {
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ message: "Debes iniciar sesion para realizar esta accion." });
    return null;
  }

  if (!roles.includes(user.role)) {
    res.status(403).json({ message: "Tu rol no tiene permisos para realizar esta accion." });
    return null;
  }

  return user;
}

function loginRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.resetAt > now && attempt.count >= 10) {
    res.status(429).json({ message: "Demasiados intentos. Espera 15 minutos antes de volver a intentar." });
    return;
  }
  if (!attempt || attempt.resetAt <= now) loginAttempts.set(key, { count: 0, resetAt: now + 15 * 60_000 });
  next();
}

function registerFailedLogin(req: express.Request) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const attempt = loginAttempts.get(key);
  if (attempt) attempt.count += 1;
}

function consumeInvoiceAiRequest(userId: string) {
  const now = Date.now();
  const current = invoiceAiRequests.get(userId);
  if (!current || current.resetAt <= now) {
    invoiceAiRequests.set(userId, { count: 1, resetAt: now + 60 * 60_000 });
    return true;
  }
  if (current.count >= 20) return false;
  current.count += 1;
  return true;
}

function consumeQuickSaleAiRequest(userId: string) {
  const now = Date.now();
  const current = quickSaleAiRequests.get(userId);
  if (!current || current.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + 60 * 60_000 };
    quickSaleAiRequests.set(userId, fresh);
    return { allowed: true, remaining: quickSaleAiHourlyLimit - 1, resetAt: fresh.resetAt };
  }
  if (current.count >= quickSaleAiHourlyLimit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return { allowed: true, remaining: quickSaleAiHourlyLimit - current.count, resetAt: current.resetAt };
}

function rateLimitPasswordReset(
  attempts: Map<string, { count: number; resetAt: number }>,
  limit: number,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const attempt = attempts.get(key);
  if (attempt && attempt.resetAt > now && attempt.count >= limit) {
    res.status(429).json({ message: "Demasiadas solicitudes. Espera 15 minutos antes de volver a intentar." });
    return;
  }

  if (!attempt || attempt.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
  else attempt.count += 1;

  if (attempts.size > 5_000) {
    for (const [entryKey, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(entryKey);
    }
  }
  next();
}

function passwordResetRequestRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  rateLimitPasswordReset(passwordResetRequests, 5, req, res, next);
}

function passwordResetConfirmationRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  rateLimitPasswordReset(passwordResetConfirmations, 10, req, res, next);
}

function passwordResetUrl(token: string) {
  const configuredUrl =
    process.env.APP_URL ??
    process.env.PUBLIC_APP_URL ??
    configuredWebOrigins.find((origin) => origin.startsWith("https://")) ??
    vercelOrigin ??
    configuredWebOrigins[0] ??
    "http://localhost:5173";
  const url = new URL(configuredUrl);
  url.hash = `reset_token=${encodeURIComponent(token)}`;
  return url.toString();
}

function readPositiveNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

function asyncRoute(handler: (req: express.Request, res: express.Response) => Promise<void>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    handler(req, res).catch(next);
  };
}

async function bootstrapForRequest(req: express.Request) {
  const workspace = await repository.bootstrap(tenantIdFromRequest(req));
  const user = await userFromRequest(req);
  if (!user) return workspace;

  if (user.role === "seller") {
    return {
      ...workspace,
      user,
      users: [user],
      sales: [],
      summary: {
        ...workspace.summary,
        totalSales: 0,
        salesCount: 0,
        operatingExpenses: 0,
        estimatedGrossProfit: 0,
        estimatedNetResult: 0,
        pendingDebt: 0,
        stockValue: 0
      }
    };
  }

  return {
    ...workspace,
    user
  };
}

app.get("/health", (_req, res) => {
  res.json({
    data: {
      status: "ok",
      service: "localito-api",
      storage: repository.mode,
      timestamp: new Date().toISOString()
    }
  });
});

app.get(
  "/bootstrap",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    res.json({ data: await bootstrapForRequest(req) });
  })
);

app.post(
  "/auth/login",
  loginRateLimit,
  asyncRoute(async (req, res) => {
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password ||
      email.length > 254 ||
      password.length > 128
    ) {
      res.status(400).json({ message: "Correo y clave son obligatorios." });
      return;
    }
    const authenticated = await repository.authenticate(email.trim().toLowerCase(), password);
    if (!authenticated) {
      registerFailedLogin(req);
      res.status(401).json({ message: "Credenciales invalidas." });
      return;
    }
    const token = await createAuthToken(authenticated.user);

    res.json({
      data: {
        user: authenticated.user,
        tenant: authenticated.tenant,
        token
      }
    });
  })
);

app.post(
  "/auth/password-reset/request",
  passwordResetRequestRateLimit,
  asyncRoute(async (req, res) => {
    const { email } = (req.body ?? {}) as { email?: unknown };
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: "Ingresa un correo válido." });
      return;
    }
    if (usesServerlessMemory) {
      res.status(503).json({ message: "La recuperación de contraseña requiere la base de datos configurada." });
      return;
    }
    if (!isTransactionalEmailConfigured()) {
      res.status(503).json({ message: "El servicio de correo aún no está configurado." });
      return;
    }

    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const recipient = await repository.createPasswordResetToken(
      normalizedEmail,
      tokenHash,
      new Date(Date.now() + passwordResetDurationMs).toISOString()
    );

    if (recipient) {
      try {
        await sendPasswordResetEmail({
          to: recipient.email,
          resetUrl: passwordResetUrl(token),
          idempotencyKey: `password-reset-${tokenHash}`
        });
      } catch (error) {
        console.error(
          `[localito-api] No se pudo enviar un correo de recuperación: ${
            error instanceof Error ? error.message : "error desconocido"
          }`
        );
      }
    }

    res.status(202).json({
      data: {
        message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
      }
    });
  })
);

app.post(
  "/auth/password-reset/confirm",
  passwordResetConfirmationRateLimit,
  asyncRoute(async (req, res) => {
    const { token, password } = (req.body ?? {}) as { token?: unknown; password?: unknown };
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{64}$/.test(token) || typeof password !== "string") {
      res.status(400).json({ message: "El enlace de recuperación no es válido." });
      return;
    }
    const policyError = passwordPolicyError(password);
    if (policyError) {
      res.status(400).json({ message: policyError });
      return;
    }

    const completed = await repository.completePasswordReset(hashSessionToken(token), password);
    if (!completed) {
      res.status(400).json({ message: "El enlace venció o ya fue utilizado. Solicita uno nuevo." });
      return;
    }

    res.json({ data: { message: "Contraseña actualizada. Ya puedes iniciar sesión." } });
  })
);

app.post("/auth/logout", asyncRoute(async (req, res) => {
  const token = tokenUserIdFromRequest(req);
  if (token && !token.startsWith("v1.")) await repository.revokeSession(hashSessionToken(token));
  res.status(204).send();
}));

app.get("/platform/tenants", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["system_admin"]))) return;
  res.json({ data: await repository.listTenants() });
}));

app.post("/platform/tenants", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["system_admin"]); if (!actor) return;
  const { businessName, businessType, ownerName, ownerEmail, ownerPassword } = req.body as { businessName?: string; businessType?: string; ownerName?: string; ownerEmail?: string; ownerPassword?: string };
  if (!businessName?.trim() || !businessType?.trim() || !ownerName?.trim() || !ownerEmail?.trim() || !ownerPassword) {
    res.status(400).json({ message: "Nombre del local, rubro y datos del primer dueño son obligatorios." }); return;
  }
  const policyError = passwordPolicyError(ownerPassword); if (policyError) { res.status(400).json({ message: policyError }); return; }
  const created = await repository.registerTenant({ name: ownerName, email: ownerEmail.trim().toLowerCase(), password: ownerPassword, businessName, businessType });
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "tenant", entityId: created.tenant.id, details: { name: created.tenant.name, ownerEmail: created.user.email } });
  res.status(201).json({ data: created });
}));

app.patch("/platform/tenants/:id", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["system_admin"]); if (!actor) return;
  const tenant = await repository.updateTenant(req.params.id, req.body as Partial<Tenant>);
  if (!tenant) { res.status(404).json({ message: "Local no encontrado." }); return; }
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "update", entity: "tenant", entityId: tenant.id, details: { active: tenant.active } });
  res.json({ data: tenant });
}));

app.get("/platform/tenants/:id/users", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["system_admin"]))) return;
  const exists = (await repository.listTenants()).some((tenant) => tenant.id === req.params.id);
  if (!exists) { res.status(404).json({ message: "Local no encontrado." }); return; }
  res.json({ data: await repository.getUsers(req.params.id, true) });
}));

app.post("/platform/tenants/:id/users", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["system_admin"]); if (!actor) return;
  const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: User["role"] };
  if (!name?.trim() || !email?.trim() || !password || !["owner", "seller"].includes(String(role))) { res.status(400).json({ message: "Nombre, correo, clave y rol dueño/vendedor son obligatorios." }); return; }
  const policyError = passwordPolicyError(password); if (policyError) { res.status(400).json({ message: policyError }); return; }
  const exists = (await repository.listTenants()).some((tenant) => tenant.id === req.params.id);
  if (!exists) { res.status(404).json({ message: "Local no encontrado." }); return; }
  const user = await repository.createUser(req.params.id, { name, email, password, role });
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "tenant_user", entityId: user.id, details: { tenantId: req.params.id, role: user.role } });
  res.status(201).json({ data: user });
}));

app.patch("/platform/tenants/:id/users/:userId", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["system_admin"]); if (!actor) return;
  const body = req.body as Partial<User>;
  const safeBody: Partial<User> = { name: body.name, email: body.email, active: body.active, role: body.role === "seller" ? "seller" : body.role === "owner" ? "owner" : undefined };
  const user = await repository.updateUser(req.params.id, req.params.userId, safeBody);
  if (!user) { res.status(404).json({ message: "Usuario no encontrado en ese local." }); return; }
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "update", entity: "tenant_user", entityId: user.id, details: { tenantId: req.params.id, active: user.active, role: user.role } });
  res.json({ data: user });
}));

app.get(
  "/users",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    res.json({ data: await repository.getUsers(tenantIdFromRequest(req)) });
  })
);

app.post(
  "/users",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const { name, email, role, password } = req.body as Partial<User> & { password?: string };
    if (!name || !email || !password) {
      res.status(400).json({ message: "Nombre, correo y clave son obligatorios para crear usuario." });
      return;
    }
    const policyError = passwordPolicyError(password);
    if (policyError) { res.status(400).json({ message: policyError }); return; }

    const created = await repository.createUser(tenantIdFromRequest(req), {
        name,
        email,
        role,
        password
      });
    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "user", entityId: created.id });
    res.status(201).json({ data: created });
  })
);

app.patch(
  "/users/:id",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner", "seller"]);
    if (!actor) return;

    const isSelfUpdate = actor.id === req.params.id;
    if (actor.role !== "owner" && !isSelfUpdate) {
      res.status(403).json({ message: "Solo puedes editar tu propio perfil." });
      return;
    }

    const body = req.body as Partial<User>;
    const allowedBody =
      actor.role === "owner" && !isSelfUpdate
        ? body
        : {
            name: body.name,
            email: body.email
          };

    const user = await repository.updateUser(tenantIdFromRequest(req), req.params.id, allowedBody);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }

    res.json({ data: user });
  })
);

app.delete(
  "/users/:id",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const user = await repository.updateUser(tenantIdFromRequest(req), req.params.id, { active: false });
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }

    res.json({ data: user });
  })
);

app.get(
  "/products",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    res.json({ data: await repository.getProducts(tenantIdFromRequest(req)) });
  })
);

app.post(
  "/products",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const tenantId = tenantIdFromRequest(req);
    const body = req.body as Partial<Product>;
    const salePrice = readPositiveNumber(body.salePrice);

    if (!body.name || !body.category || salePrice == null) {
      res.status(400).json({ message: "Nombre, categoria y precio de venta son obligatorios." });
      return;
    }

    const product = await repository.createProduct(tenantId, body);
    await repository.recordAudit({ tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "product", entityId: product.id });
    res.status(201).json({ data: product });
  })
);

app.post(
  "/products/import",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const result = await bulkImportProducts(repository, actor.tenantId, { id: actor.id, name: actor.name }, req.body);
    res.status(result.created.length ? 201 : 200).json({
      data: result,
      message: result.created.length ? `${result.created.length} productos importados.` : "El archivo no agregó productos nuevos."
    });
  })
);

app.patch(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const product = await repository.updateProduct(tenantIdFromRequest(req), req.params.id, req.body as Partial<Product>);
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado." });
      return;
    }
    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "update", entity: "product", entityId: product.id });
    res.json({ data: product });
  })
);

app.delete(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const product = await repository.deactivateProduct(tenantIdFromRequest(req), req.params.id);
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado." });
      return;
    }

    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "deactivate", entity: "product", entityId: product.id });
    res.json({ data: product });
  })
);

app.patch(
  "/products/:id/stock",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const quantity = readPositiveNumber((req.body as { quantity?: number }).quantity);
    if (quantity == null) {
      res.status(400).json({ message: "Cantidad invalida." });
      return;
    }

    const product = await repository.updateStock(tenantIdFromRequest(req), req.params.id, quantity);
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado." });
      return;
    }
    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "adjust_stock", entity: "product", entityId: product.id, details: { quantity } });
    res.json({ data: product });
  })
);

app.get(
  "/customers",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    res.json({ data: await repository.getCustomers(tenantIdFromRequest(req)) });
  })
);

app.post(
  "/customers",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const { name } = req.body as { name?: string };

    if (!name) {
      res.status(400).json({ message: "El nombre del cliente es obligatorio." });
      return;
    }

    res.status(201).json({ data: await repository.createCustomer(tenantIdFromRequest(req), req.body) });
  })
);

app.patch(
  "/customers/:id",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const customer = await repository.updateCustomer(tenantIdFromRequest(req), req.params.id, req.body as Partial<Customer>);
    if (!customer) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    res.json({ data: customer });
  })
);

app.delete(
  "/customers/:id",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const customer = await repository.deactivateCustomer(tenantIdFromRequest(req), req.params.id);
    if (!customer) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    res.json({ data: customer });
  })
);

app.get(
  "/sales",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    res.json({ data: await repository.getSales(tenantIdFromRequest(req)) });
  })
);

app.post(
  "/sales",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner", "seller"]);
    if (!actor) return;
    const body = req.body as {
      customerId?: string;
      paymentMethod?: PaymentMethod;
      payments?: Array<{ method: Exclude<PaymentMethod, "mixed">; amount: number }>;
      discount?: number;
      notes?: string;
      idempotencyKey?: string;
      items?: Array<{ productId: string; quantity: number }>;
    };

    if (!body.items?.length || !body.paymentMethod) {
      res.status(400).json({ message: "La venta requiere productos y metodo de pago." });
      return;
    }

    const sale = await repository.createSale(tenantIdFromRequest(req), {
      sellerId: actor.id,
      customerId: body.customerId,
      paymentMethod: body.paymentMethod,
      payments: body.payments,
      discount: body.discount,
      notes: body.notes,
      idempotencyKey: body.idempotencyKey ?? req.header("idempotency-key") ?? undefined,
      items: body.items
    });

    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "sale", entityId: sale.id, details: { total: sale.total } });

    res.status(201).json({ data: sale });
  })
);

app.post(
  "/sales/:id/cancel",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const { reason } = req.body as { reason?: string };
    const sale = await repository.cancelSale(tenantIdFromRequest(req), req.params.id, reason);
    if (!sale) {
      res.status(404).json({ message: "Venta no encontrada." });
      return;
    }

    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "cancel", entity: "sale", entityId: sale.id, details: { reason } });
    res.json({ data: sale });
  })
);

app.post("/sales/:id/returns", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner"]); if (!actor) return;
  const { items, reason } = req.body as { items?: Array<{ productId: string; quantity: number }>; reason?: string };
  if (!items?.length || !reason?.trim()) { res.status(400).json({ message: "Indica productos y motivo de la devolución." }); return; }
  const result = await repository.returnSale(actor.tenantId, req.params.id, { items, reason, userId: actor.id });
  if (!result) { res.status(404).json({ message: "Venta no encontrada o no admite devolución." }); return; }
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "return", entity: "sale", entityId: req.params.id, details: { total: result.total } });
  res.status(201).json({ data: result });
}));

app.post(
  "/customers/:id/payments",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner", "seller"]);
    if (!actor) return;
    const { amount: rawAmount, method } = req.body as { amount?: number; method?: PaymentMethod };
    const amount = readPositiveNumber(rawAmount);

    if (amount == null || amount <= 0) {
      res.status(400).json({ message: "Cliente o monto invalido." });
      return;
    }

    const result = await repository.payCustomerDebt(tenantIdFromRequest(req), req.params.id, amount, method ?? "cash");
    if (!result) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "payment", entity: "customer", entityId: req.params.id, details: { amount, method: method ?? "cash" } });
    res.json({ data: result });
  })
);

app.post(
  "/ai/recognize",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const tenantId = tenantIdFromRequest(req);
    const { barcode, hint, imageDataUrl } = req.body as { barcode?: string; hint?: string; imageDataUrl?: string };
    let visionHint = hint;
    let visionProductId: string | undefined;
    if (imageDataUrl) {
      const products = await repository.getProducts(tenantId);
      const visual = await identifyProductImage(imageDataUrl, products);
      if (visual) {
        visionProductId = visual.inventoryProductId;
        const matched = products.find((product) => product.id === visionProductId);
        visionHint = matched?.name ?? [visual.brand, visual.name, visual.variant, visual.size].filter(Boolean).join(" ");
      }
    }
    const result = await repository.recognizeProduct(tenantId, { barcode, hint: visionHint });
    res.json({ data: result });
  })
);

app.post(
  "/ai/quick-sale/analyze",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner", "seller"]);
    if (!actor) return;
    if (!isQuickSaleAiConfigured()) {
      res.status(503).json({ message: "Venta Rápida aún no está configurada en el servidor." });
      return;
    }
    const { imageDataUrl } = req.body as { imageDataUrl?: unknown };
    if (typeof imageDataUrl !== "string" || !imageDataUrl) {
      res.status(400).json({ message: "Debes adjuntar una foto de los productos." });
      return;
    }
    const quota = consumeQuickSaleAiRequest(actor.id);
    res.setHeader("X-RateLimit-Limit", String(quickSaleAiHourlyLimit));
    res.setHeader("X-RateLimit-Remaining", String(quota.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(quota.resetAt / 1000)));
    if (!quota.allowed) {
      const waitMinutes = Math.max(1, Math.ceil((quota.resetAt - Date.now()) / 60_000));
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((quota.resetAt - Date.now()) / 1000))));
      res.status(429).json({ message: `Alcanzaste el límite de ${quickSaleAiHourlyLimit} análisis por hora. Podrás volver a probar en aproximadamente ${waitMinutes} minutos.` });
      return;
    }
    const products = await repository.getProducts(actor.tenantId);
    const analysis = await extractQuickSaleImage(imageDataUrl, products);
    res.json({ data: analysis });
  })
);

app.post(
  "/ai/invoices/analyze",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    if (!isInvoiceAiConfigured()) {
      res.status(503).json({ message: "La lectura de facturas con IA aún no está configurada en el servidor." });
      return;
    }
    const { imageDataUrl } = req.body as { imageDataUrl?: unknown };
    if (typeof imageDataUrl !== "string" || !imageDataUrl) {
      res.status(400).json({ message: "Debes adjuntar una foto de la factura." });
      return;
    }
    if (!consumeInvoiceAiRequest(actor.id)) {
      res.status(429).json({ message: "Alcanzaste el límite de 20 lecturas por hora. Intenta nuevamente más tarde." });
      return;
    }
    const products = await repository.getProducts(actor.tenantId);
    const analysis = await extractInvoiceImage(imageDataUrl, products);
    res.json({ data: analysis });
  })
);

app.post(
  "/ai/invoices/import",
  asyncRoute(async (req, res) => {
    const actor = await requireRoles(req, res, ["owner"]);
    if (!actor) return;
    const result = await importInvoice(repository, actor.tenantId, { id: actor.id, name: actor.name }, req.body);
    res.status(result.alreadyImported ? 200 : 201).json({
      data: result,
      message: result.alreadyImported ? "Esta importación ya estaba registrada." : "Factura ingresada y stock actualizado."
    });
  })
);

app.get(
  "/ai/history",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    res.json({ data: await repository.getRecognitionHistory(tenantIdFromRequest(req)) });
  })
);

app.patch(
  "/ai/recognitions/:id",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const recognition = await repository.confirmRecognition(tenantIdFromRequest(req), req.params.id, req.body as {
      confirmed?: boolean;
      userCorrection?: string;
      productId?: string;
    });

    if (!recognition) {
      res.status(404).json({ message: "Reconocimiento no encontrado." });
      return;
    }

    res.json({ data: recognition });
  })
);

app.post(
  "/payments/webpay/create",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const { amount: rawAmount, saleId, customerId } = req.body as { amount?: number; saleId?: string; customerId?: string };
    const amount = readPositiveNumber(rawAmount);

    if (amount == null || amount <= 0) {
      res.status(400).json({ message: "Monto invalido para Webpay." });
      return;
    }

    const result = await repository.createWebpayPayment(tenantIdFromRequest(req), { amount, saleId, customerId });
    res.status(201).json({
      data: result,
      message: `Pago demo creado por ${formatCurrency(amount)}.`
    });
  })
);

app.post(
  "/payments/webpay/:id/confirm",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const payment = await repository.confirmWebpayPayment(tenantIdFromRequest(req), req.params.id);
    if (!payment) {
      res.status(404).json({ message: "Pago no encontrado." });
      return;
    }

    res.json({ data: payment });
  })
);

app.get("/suppliers", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner"]))) return;
  res.json({ data: await repository.getSuppliers(tenantIdFromRequest(req)) });
}));

app.post("/suppliers", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner"]); if (!actor) return;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ message: "El nombre del proveedor es obligatorio." }); return; }
  const supplier = await repository.createSupplier(actor.tenantId, req.body);
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "supplier", entityId: supplier.id });
  res.status(201).json({ data: supplier });
}));

app.patch("/suppliers/:id", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner"]); if (!actor) return;
  const supplier = await repository.updateSupplier(actor.tenantId, req.params.id, req.body);
  if (!supplier) { res.status(404).json({ message: "Proveedor no encontrado." }); return; }
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "update", entity: "supplier", entityId: supplier.id });
  res.json({ data: supplier });
}));

app.get("/purchases", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner"]))) return;
  res.json({ data: await repository.getPurchaseOrders(tenantIdFromRequest(req)) });
}));

app.post("/purchases", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner"]); if (!actor) return;
  const body = req.body as { supplierId?: string; items?: Array<{ productId: string; quantity: number; unitCost: number }>; expectedAt?: string; notes?: string };
  if (!body.supplierId || !body.items?.length) { res.status(400).json({ message: "La orden requiere proveedor y productos." }); return; }
  const purchase = await repository.createPurchaseOrder(actor.tenantId, { supplierId: body.supplierId, items: body.items, expectedAt: body.expectedAt, notes: body.notes });
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "create", entity: "purchase", entityId: purchase.id, details: { total: purchase.total } });
  res.status(201).json({ data: purchase });
}));

app.post("/purchases/:id/receive", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner"]); if (!actor) return;
  const { quantities } = req.body as { quantities?: Record<string, number> };
  const purchase = await repository.receivePurchaseOrder(actor.tenantId, req.params.id, quantities, actor.id);
  if (!purchase) { res.status(404).json({ message: "Orden de compra no encontrada." }); return; }
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "receive", entity: "purchase", entityId: purchase.id });
  res.json({ data: purchase });
}));

app.get("/debts", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
  res.json({ data: await repository.getDebts(tenantIdFromRequest(req)) });
}));

app.get("/debts/reminders", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
  const tenantId = tenantIdFromRequest(req);
  const [debts, customers] = await Promise.all([repository.getDebts(tenantId), repository.getCustomers(tenantId)]);
  const reminders = debts.filter((debt) => debt.balance > 0).map((debt) => {
    const customer = customers.find((candidate) => candidate.id === debt.customerId);
    const message = `Hola ${customer?.name ?? ""}, te recordamos con cariño que tienes un fiado pendiente de ${formatCurrency(debt.balance)} en Localito. Puedes conversar con nosotros para coordinar tu abono.`;
    return { debt, customer, message, whatsappUrl: customer?.phone ? `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` : undefined };
  });
  res.json({ data: reminders });
}));

app.get("/cash/session", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
  res.json({ data: (await repository.getOpenCashSession(tenantIdFromRequest(req))) ?? null });
}));

app.post("/cash/session/open", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner", "seller"]); if (!actor) return;
  const amount = readPositiveNumber((req.body as { openingAmount?: number }).openingAmount);
  if (amount == null) { res.status(400).json({ message: "Monto inicial inválido." }); return; }
  const session = await repository.openCashSession(actor.tenantId, amount, actor.id);
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "open", entity: "cash_session", entityId: session.id, details: { openingAmount: amount } });
  res.status(201).json({ data: session });
}));

app.post("/cash/movements", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner", "seller"]); if (!actor) return;
  const { type, amount: rawAmount, reason, category } = req.body as { type?: "deposit" | "withdrawal" | "expense"; amount?: number; reason?: string; category?: string };
  const amount = readPositiveNumber(rawAmount);
  if (!type || !["deposit", "withdrawal", "expense"].includes(type) || !amount || !reason?.trim()) { res.status(400).json({ message: "Tipo, monto y motivo son obligatorios." }); return; }
  const movement = await repository.addCashMovement(actor.tenantId, { type, amount, reason, category, userId: actor.id });
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: type, entity: "cash_movement", entityId: movement.id, details: { amount } });
  res.status(201).json({ data: movement });
}));

app.get("/cash/movements", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
  res.json({ data: await repository.getCashMovements(tenantIdFromRequest(req)) });
}));

app.post("/cash/session/close", asyncRoute(async (req, res) => {
  const actor = await requireRoles(req, res, ["owner", "seller"]); if (!actor) return;
  const { countedAmount: rawCounted, note } = req.body as { countedAmount?: number; note?: string };
  const countedAmount = readPositiveNumber(rawCounted);
  if (countedAmount == null) { res.status(400).json({ message: "Efectivo contado inválido." }); return; }
  const session = await repository.closeCashSession(actor.tenantId, countedAmount, note, actor.id);
  if (!session) { res.status(404).json({ message: "No existe una caja abierta." }); return; }
  await repository.recordAudit({ tenantId: actor.tenantId, userId: actor.id, userName: actor.name, action: "close", entity: "cash_session", entityId: session.id, details: { countedAmount, difference: session.difference } });
  res.json({ data: session });
}));

app.get("/stock-movements", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner"]))) return;
  const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
  res.json({ data: await repository.getStockMovements(tenantIdFromRequest(req), productId) });
}));

app.get("/audit", asyncRoute(async (req, res) => {
  if (!(await requireRoles(req, res, ["owner"]))) return;
  res.json({ data: await repository.getAuditEvents(tenantIdFromRequest(req)) });
}));

app.get(
  "/alerts",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const workspace = await repository.bootstrap(tenantIdFromRequest(req));
    res.json({ data: workspace.alerts });
  })
);

app.get(
  "/reports/summary",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const workspace = await repository.bootstrap(tenantIdFromRequest(req));
    res.json({ data: workspace.summary });
  })
);

app.get(
  "/reports/cash-register",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    res.json({ data: await repository.getCashRegister(tenantIdFromRequest(req), date) });
  })
);

app.get(
  "/cash-closures",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    res.json({ data: await repository.getCashClosures(tenantIdFromRequest(req)) });
  })
);

app.post(
  "/cash-closures",
  asyncRoute(async (req, res) => {
    const user = await requireRoles(req, res, ["owner", "seller"]);
    if (!user) return;

    const { date, note } = req.body as { date?: string; note?: string; closedByUserId?: string };
    const closure = await repository.closeCashRegister(tenantIdFromRequest(req), { date, note, closedByUserId: user.id });
    res.status(201).json({
      data: closure,
      message: "Cierre de caja registrado."
    });
  })
);

app.use((_req, res) => {
  res.status(404).json({ message: "Ruta no encontrada." });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Error interno del servidor.";
  const normalized = message.toLocaleLowerCase("es");
  const databaseCode = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
  const explicitStatus = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
  const status =
    explicitStatus && [400, 413, 422, 429, 502, 503].includes(explicitStatus)
      ? explicitStatus
      : databaseCode === "23505"
      ? 409
      : databaseCode === "23503" || databaseCode === "22P02"
        ? 400
        : ["no se encontro", "no existe"].some((fragment) => normalized.includes(fragment))
      ? 404
      : ["stock insuficiente", "cupo", "deuda pendiente", "caja ya", "caja cerrada", "ya fue", "ya está registrad", "ya esta registrad"].some((fragment) =>
            normalized.includes(fragment)
          )
        ? 409
        : [
              "requerid",
              "inval",
              "incorrect",
              "debe",
              "cantidad",
              "monto",
              "no coincide",
              "no permite",
              "agotad",
              "formato",
              "demasiado pesada"
            ].some((fragment) => normalized.includes(fragment))
          ? 400
          : 500;

  if (status === 500) {
    console.error(error);
  }
  const publicMessage = status === 413 ? "La imagen es demasiado pesada. Usa una foto de menor resolución." : databaseCode === "23505" ? "Ya existe un registro con esos datos." : status === 500 ? "Error interno del servidor." : message;
  res.status(status).json({ message: publicMessage });
});

if (process.env.VERCEL !== "1") {
  app.listen(port, host, () => {
    console.log(`Localito API escuchando en http://${host}:${port} (${repository.mode})`);
  });
}

export default app;
