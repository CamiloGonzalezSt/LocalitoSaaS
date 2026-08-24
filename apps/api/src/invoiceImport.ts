import { createHash } from "node:crypto";
import type { InvoiceImportItem, InvoiceImportPayload, InvoiceImportResult, Product, Supplier } from "@localito/shared";
import type { DataRepository } from "./repository.js";

function optionalText(value: unknown, maxLength = 180) {
  if (typeof value !== "string") return undefined;
  const text = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return text || undefined;
}

function requiredText(value: unknown, label: string, maxLength = 180) {
  const text = optionalText(value, maxLength);
  if (!text) throw new Error(`${label} es obligatorio.`);
  return text;
}

function positiveNumber(value: unknown, label: string, allowZero = false) {
  if (value == null || value === "") throw new Error(`${label} es inválido.`);
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0) || number > 1_000_000_000) {
    throw new Error(`${label} es inválido.`);
  }
  return number;
}

function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeItem(value: unknown, index: number): InvoiceImportItem {
  if (!value || typeof value !== "object") throw new Error(`El producto ${index + 1} es inválido.`);
  const item = value as Partial<InvoiceImportItem>;
  return {
    clientItemId: requiredText(item.clientItemId, `El identificador del producto ${index + 1}`, 100),
    existingProductId: optionalText(item.existingProductId, 100),
    name: requiredText(item.name, `El nombre del producto ${index + 1}`),
    brand: optionalText(item.brand, 100),
    category: requiredText(item.category, `La categoría del producto ${index + 1}`, 100),
    barcode: optionalText(item.barcode, 80),
    quantity: positiveNumber(item.quantity, `La cantidad del producto ${index + 1}`),
    unitCost: positiveNumber(item.unitCost, `El costo del producto ${index + 1}`, true),
    salePrice: positiveNumber(item.salePrice, `El precio de venta del producto ${index + 1}`)
  };
}

export function normalizeInvoiceImportPayload(value: unknown): InvoiceImportPayload {
  if (!value || typeof value !== "object") throw new Error("Los datos de la factura son inválidos.");
  const payload = value as Partial<InvoiceImportPayload>;
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (!rawItems.length || rawItems.length > 100) throw new Error("La factura debe tener entre 1 y 100 productos.");
  const items = rawItems.map(normalizeItem);
  if (new Set(items.map((item) => item.clientItemId)).size !== items.length) {
    throw new Error("La factura contiene productos duplicados sin identificar.");
  }

  const clientImportId = requiredText(payload.clientImportId, "El identificador de la importación", 100);
  if (!/^[a-z0-9-]{8,100}$/i.test(clientImportId)) throw new Error("El identificador de la importación es inválido.");
  const invoiceDate = optionalText(payload.invoiceDate, 10);
  const parsedDate = invoiceDate ? new Date(`${invoiceDate}T00:00:00.000Z`) : undefined;
  if (invoiceDate && (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) || Number.isNaN(parsedDate?.getTime()) || parsedDate?.toISOString().slice(0, 10) !== invoiceDate)) {
    throw new Error("La fecha de la factura es inválida.");
  }
  return {
    clientImportId,
    supplierId: optionalText(payload.supplierId, 100),
    supplierName: optionalText(payload.supplierName) ?? "",
    supplierTaxId: optionalText(payload.supplierTaxId, 40),
    invoiceNumber: optionalText(payload.invoiceNumber, 80),
    invoiceDate,
    total: payload.total == null ? undefined : positiveNumber(payload.total, "El total de la factura", true),
    items
  };
}

export function invoiceFingerprint(payload: InvoiceImportPayload) {
  if (!payload.invoiceNumber) return undefined;
  const identity = JSON.stringify({
    supplier: normalizedText(payload.supplierTaxId || payload.supplierName),
    invoice: normalizedText(payload.invoiceNumber),
    date: payload.invoiceDate ?? "",
    total: payload.total ?? 0
  });
  return createHash("sha256").update(identity).digest("hex").slice(0, 24);
}

function importMarker(clientImportId: string) {
  return `[LOCALITO-IMPORT:${clientImportId.replace(/[^a-z0-9-]/gi, "").slice(0, 100)}]`;
}

function invoiceMarker(payload: InvoiceImportPayload) {
  const fingerprint = invoiceFingerprint(payload);
  return fingerprint ? `[LOCALITO-FACTURA:${fingerprint}]` : undefined;
}

function productForItem(item: InvoiceImportItem, products: Product[]) {
  if (item.existingProductId) return products.find((product) => product.active && product.id === item.existingProductId);
  const barcode = item.barcode?.replace(/\D/g, "");
  return barcode ? products.find((product) => product.active && product.barcode?.replace(/\D/g, "") === barcode) : undefined;
}

async function resultFromExisting(
  repository: DataRepository,
  tenantId: string,
  purchase: InvoiceImportResult["purchase"],
  suppliers: Supplier[],
  products: Product[],
  userId: string
): Promise<InvoiceImportResult> {
  const received = purchase.status === "received" ? purchase : await repository.receivePurchaseOrder(tenantId, purchase.id, undefined, userId);
  if (!received) throw new Error("No se encontró la orden asociada a esta factura.");
  const supplier = suppliers.find((candidate) => candidate.id === received.supplierId);
  if (!supplier) throw new Error("No se encontró el proveedor asociado a esta factura.");
  const refreshedProducts = purchase.status === "received" ? products : await repository.getProducts(tenantId);
  const receivedProducts = refreshedProducts.filter((product) => received.items.some((item) => item.productId === product.id));
  return { purchase: received, supplier, products: receivedProducts, createdProductIds: [], alreadyImported: true };
}

export async function importInvoice(
  repository: DataRepository,
  tenantId: string,
  actor: { id: string; name: string },
  value: unknown
): Promise<InvoiceImportResult> {
  const payload = normalizeInvoiceImportPayload(value);
  let [products, suppliers, purchases] = await Promise.all([
    repository.getProducts(tenantId),
    repository.getSuppliers(tenantId),
    repository.getPurchaseOrders(tenantId)
  ]);

  const retryMarker = importMarker(payload.clientImportId);
  const previousAttempt = purchases.find((purchase) => purchase.notes?.includes(retryMarker));
  if (previousAttempt) return resultFromExisting(repository, tenantId, previousAttempt, suppliers, products, actor.id);

  const documentMarker = invoiceMarker(payload);
  if (documentMarker && purchases.some((purchase) => purchase.notes?.includes(documentMarker))) {
    throw new Error("Esta factura ya está registrada en el inventario.");
  }

  for (const [index, item] of payload.items.entries()) {
    if (item.existingProductId && !products.some((product) => product.active && product.id === item.existingProductId)) {
      throw new Error(`El producto seleccionado en la línea ${index + 1} no existe en este negocio.`);
    }
  }
  if (payload.supplierId && !suppliers.some((supplier) => supplier.active && supplier.id === payload.supplierId)) {
    throw new Error("El proveedor seleccionado no existe en este negocio.");
  }
  if (!payload.supplierId && !payload.supplierName) throw new Error("Confirma el proveedor de la factura.");

  let supplier = payload.supplierId ? suppliers.find((candidate) => candidate.id === payload.supplierId) : undefined;
  if (!supplier) {
    supplier = suppliers.find((candidate) => normalizedText(candidate.name) === normalizedText(payload.supplierName));
  }
  if (!supplier) {
    supplier = await repository.createSupplier(tenantId, {
      name: payload.supplierName,
      notes: payload.supplierTaxId ? `RUT ${payload.supplierTaxId} · Creado desde factura con IA` : "Creado desde factura con IA"
    });
    suppliers = [...suppliers, supplier];
  }

  const createdProductIds: string[] = [];
  const resolvedItems: Array<{ product: Product; quantity: number; unitCost: number }> = [];
  for (const [index, item] of payload.items.entries()) {
    let product = productForItem(item, products);
    const deterministicSku = `AI-${payload.clientImportId.replace(/[^a-z0-9]/gi, "").slice(0, 40)}-${index + 1}`;
    if (!product && !item.existingProductId) product = products.find((candidate) => candidate.sku === deterministicSku);
    if (!product) {
      product = await repository.createProduct(tenantId, {
        name: item.name,
        brand: item.brand,
        category: item.category,
        barcode: item.barcode,
        costPrice: 0,
        salePrice: item.salePrice,
        stock: 0,
        minimumStock: 0,
        supplierId: supplier.id,
        sku: deterministicSku
      });
      products = [...products, product];
      createdProductIds.push(product.id);
    } else {
      const updated = await repository.updateProduct(tenantId, product.id, { salePrice: item.salePrice, supplierId: supplier.id });
      if (!updated) throw new Error(`No se pudo actualizar el precio de “${product.name}”.`);
      product = updated;
      products = products.map((candidate) => candidate.id === updated.id ? updated : candidate);
    }
    resolvedItems.push({ product, quantity: item.quantity, unitCost: item.unitCost });
  }

  const noteParts = [
    retryMarker,
    documentMarker,
    payload.invoiceNumber ? `Factura ${payload.invoiceNumber}` : "Factura sin folio confirmado",
    payload.invoiceDate ? `fecha ${payload.invoiceDate}` : undefined,
    payload.supplierTaxId ? `RUT ${payload.supplierTaxId}` : undefined,
    "Ingreso revisado con IA"
  ].filter((part): part is string => Boolean(part));
  const purchase = await repository.createPurchaseOrder(tenantId, {
    supplierId: supplier.id,
    notes: noteParts.join(" · "),
    items: resolvedItems.map((item) => ({ productId: item.product.id, quantity: item.quantity, unitCost: item.unitCost }))
  });
  const received = await repository.receivePurchaseOrder(tenantId, purchase.id, undefined, actor.id);
  if (!received) throw new Error("No se pudo recibir la compra de la factura.");

  await repository.recordAudit({
    tenantId,
    userId: actor.id,
    userName: actor.name,
    action: "import_invoice_ai",
    entity: "purchase",
    entityId: received.id,
    details: { invoiceNumber: payload.invoiceNumber, supplierId: supplier.id, itemCount: resolvedItems.length, createdProductIds, total: received.total }
  });
  const importedProducts = products.filter((product) => resolvedItems.some((item) => item.product.id === product.id));
  return { purchase: received, supplier, products: importedProducts, createdProductIds, alreadyImported: false };
}
