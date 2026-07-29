import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";
import type { Customer, PaymentMethod, Product, User } from "@localito/shared";
import { demoTenantId, store } from "./store.js";
import { createRepository } from "./repository.js";

const app = express();
const port = Number(process.env.API_PORT ?? 3000);
const host = process.env.API_HOST ?? "0.0.0.0";
const configuredWebOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const ownerDemoPassword = process.env.OWNER_DEMO_PASSWORD ?? process.env.DEMO_PASSWORD ?? "Duoc2026";
const sellerDemoPassword = process.env.SELLER_DEMO_PASSWORD ?? "Duoc2026V";
const repository = await createRepository();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    }
  })
);
app.use(express.json({ limit: "2mb" }));
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

function tenantIdFromRequest(req: express.Request) {
  return String(req.header("x-tenant-id") ?? demoTenantId);
}

function tokenUserIdFromRequest(req: express.Request) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  return token?.startsWith("demo-token-") ? token.replace("demo-token-", "") : undefined;
}

async function userFromRequest(req: express.Request) {
  const userId = tokenUserIdFromRequest(req);
  if (!userId) return null;

  const users = await repository.getUsers(tenantIdFromRequest(req));
  return users.find((user) => user.id === userId && user.active !== false) ?? null;
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

function isValidDemoPassword(user: User, password?: string) {
  if (user.role === "seller") return password === sellerDemoPassword;
  return password === ownerDemoPassword;
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

app.post("/auth/register", (req, res) => {
  const { name, email, businessName, businessType } = req.body as {
    name?: string;
    email?: string;
    businessName?: string;
    businessType?: string;
  };

  if (!name || !email || !businessName || !businessType) {
    res.status(400).json({ message: "Faltan datos obligatorios para registrar el negocio." });
    return;
  }

  const tenant = {
    id: randomUUID(),
    name: businessName,
    businessType,
    address: "",
    phone: ""
  };

  const user = {
    id: randomUUID(),
    tenantId: tenant.id,
    name,
    email,
    role: "owner" as const
  };

  store.tenants.push(tenant);
  store.users.push(user);

  res.status(201).json({
    data: {
      tenant,
      user,
      token: `demo-token-${user.id}`
    }
  });
});

app.post(
  "/auth/login",
  asyncRoute(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const tenantId = tenantIdFromRequest(req);
    const normalizedEmail = email?.trim().toLowerCase();
    const users = await repository.getUsers(tenantId);
    const user = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    const workspace = await repository.bootstrap(user?.tenantId ?? tenantId);

    if (!user || user.active === false || !isValidDemoPassword(user, password)) {
      res.status(401).json({ message: "Credenciales invalidas." });
      return;
    }

    res.json({
      data: {
        user,
        tenant: workspace.tenant,
        token: `demo-token-${user.id}`
      }
    });
  })
);

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
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const { name, email, role, password } = req.body as Partial<User> & { password?: string };
    if (!name || !email) {
      res.status(400).json({ message: "Nombre y correo son obligatorios para crear usuario." });
      return;
    }

    res.status(201).json({
      data: await repository.createUser(tenantIdFromRequest(req), {
        name,
        email,
        role,
        password
      })
    });
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
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const tenantId = tenantIdFromRequest(req);
    const body = req.body as Partial<Product>;
    const salePrice = readPositiveNumber(body.salePrice);

    if (!body.name || !body.category || salePrice == null) {
      res.status(400).json({ message: "Nombre, categoria y precio de venta son obligatorios." });
      return;
    }

    res.status(201).json({ data: await repository.createProduct(tenantId, body) });
  })
);

app.patch(
  "/products/:id",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const product = await repository.updateProduct(tenantIdFromRequest(req), req.params.id, req.body as Partial<Product>);
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado." });
      return;
    }
    res.json({ data: product });
  })
);

app.delete(
  "/products/:id",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const product = await repository.deactivateProduct(tenantIdFromRequest(req), req.params.id);
    if (!product) {
      res.status(404).json({ message: "Producto no encontrado." });
      return;
    }

    res.json({ data: product });
  })
);

app.patch(
  "/products/:id/stock",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
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
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const body = req.body as {
      customerId?: string;
      paymentMethod?: PaymentMethod;
      items?: Array<{ productId: string; quantity: number }>;
    };

    if (!body.items?.length || !body.paymentMethod) {
      res.status(400).json({ message: "La venta requiere productos y metodo de pago." });
      return;
    }

    const sale = await repository.createSale(tenantIdFromRequest(req), {
      customerId: body.customerId,
      paymentMethod: body.paymentMethod,
      items: body.items
    });

    res.status(201).json({ data: sale });
  })
);

app.post(
  "/sales/:id/cancel",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner"]))) return;
    const { reason } = req.body as { reason?: string };
    const sale = await repository.cancelSale(tenantIdFromRequest(req), req.params.id, reason);
    if (!sale) {
      res.status(404).json({ message: "Venta no encontrada." });
      return;
    }

    res.json({ data: sale });
  })
);

app.post(
  "/customers/:id/payments",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
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

    res.json({ data: result });
  })
);

app.post(
  "/ai/recognize",
  asyncRoute(async (req, res) => {
    if (!(await requireRoles(req, res, ["owner", "seller"]))) return;
    const { barcode, hint } = req.body as { barcode?: string; hint?: string };
    res.json({ data: await repository.recognizeProduct(tenantIdFromRequest(req), { barcode, hint }) });
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
  const status = message.includes("Stock insuficiente") || message.includes("fiada") ? 409 : 500;
  res.status(status).json({ message });
});

if (process.env.VERCEL !== "1") {
  app.listen(port, host, () => {
    console.log(`Localito API escuchando en http://${host}:${port} (${repository.mode})`);
  });
}

export default app;
