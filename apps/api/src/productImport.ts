import type { Product, ProductBulkImportResult, ProductImportIssue, ProductImportRow } from "@localito/shared";
import type { DataRepository } from "./repository.js";

const productUnits = new Set<NonNullable<Product["unit"]>>(["unit", "kg", "gram", "liter", "pack", "box"]);

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

function nonNegativeNumber(value: unknown, label: string, fallback = 0) {
  if (value == null || value === "") return fallback;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1_000_000_000) throw new Error(`${label} es inválido.`);
  return number;
}

function positiveNumber(value: unknown, label: string, fallback?: number) {
  if ((value == null || value === "") && fallback != null) return fallback;
  const number = nonNegativeNumber(value, label, 0);
  if (number <= 0) throw new Error(`${label} debe ser mayor que cero.`);
  return number;
}

function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeProductImportRow(value: unknown, fallbackRowNumber: number): ProductImportRow {
  if (!value || typeof value !== "object") throw new Error("La fila no contiene un producto válido.");
  const row = value as Partial<ProductImportRow>;
  const unit = optionalText(row.unit, 20) as Product["unit"] | undefined;
  if (unit && !productUnits.has(unit)) throw new Error("La unidad no es válida.");
  return {
    rowNumber: Math.max(1, Math.floor(nonNegativeNumber(row.rowNumber, "El número de fila", fallbackRowNumber))),
    name: requiredText(row.name, "El nombre"),
    brand: optionalText(row.brand, 100),
    category: requiredText(row.category, "La categoría", 100),
    barcode: optionalText(row.barcode, 80),
    costPrice: nonNegativeNumber(row.costPrice, "El costo"),
    salePrice: positiveNumber(row.salePrice, "El precio de venta"),
    stock: nonNegativeNumber(row.stock, "El stock"),
    minimumStock: nonNegativeNumber(row.minimumStock, "El stock mínimo"),
    sku: optionalText(row.sku, 100),
    unit: unit ?? "unit",
    unitsPerPack: positiveNumber(row.unitsPerPack, "Las unidades por pack", 1)
  };
}

function productMatchesRow(product: Product, row: ProductImportRow, deterministicSku: string) {
  const barcode = row.barcode?.replace(/\D/g, "");
  if (barcode && product.barcode?.replace(/\D/g, "") === barcode) return true;
  if (product.sku && (product.sku === row.sku || product.sku === deterministicSku)) return true;
  const importedName = normalizedText(row.name);
  const importedFullName = normalizedText([row.brand, row.name].filter(Boolean).join(" "));
  const productName = normalizedText(product.name);
  return productName === importedName || productName === importedFullName;
}

export async function bulkImportProducts(
  repository: DataRepository,
  tenantId: string,
  actor: { id: string; name: string },
  value: unknown
): Promise<ProductBulkImportResult> {
  if (!value || typeof value !== "object") throw new Error("La importación de productos es inválida.");
  const payload = value as { clientImportId?: unknown; rows?: unknown };
  const clientImportId = requiredText(payload.clientImportId, "El identificador de la importación", 100);
  if (!/^[a-z0-9-]{8,100}$/i.test(clientImportId)) throw new Error("El identificador de la importación es inválido.");
  if (!Array.isArray(payload.rows) || !payload.rows.length) throw new Error("La importación no contiene productos.");
  if (payload.rows.length > 500) throw new Error("Puedes importar un máximo de 500 productos por archivo.");

  let products = await repository.getProducts(tenantId);
  const created: Product[] = [];
  const existingProductIds = new Set<string>();
  const skipped: ProductImportIssue[] = [];

  for (const [index, rawRow] of payload.rows.entries()) {
    let row: ProductImportRow;
    try {
      row = normalizeProductImportRow(rawRow, index + 2);
    } catch (error) {
      const source = rawRow && typeof rawRow === "object" ? rawRow as Partial<ProductImportRow> : undefined;
      skipped.push({
        rowNumber: Number(source?.rowNumber) || index + 2,
        name: optionalText(source?.name),
        reason: error instanceof Error ? error.message : "Fila inválida."
      });
      continue;
    }

    const deterministicSku = row.sku ?? `CSV-${clientImportId.replace(/[^a-z0-9]/gi, "").slice(0, 40)}-${row.rowNumber}`;
    const existing = products.find((product) => product.active && productMatchesRow(product, row, deterministicSku));
    if (existing) {
      existingProductIds.add(existing.id);
      skipped.push({ rowNumber: row.rowNumber ?? index + 2, name: row.name, reason: `Ya existe como “${existing.name}”.` });
      continue;
    }

    const product = await repository.createProduct(tenantId, {
      name: row.name,
      brand: row.brand,
      category: row.category,
      barcode: row.barcode,
      costPrice: row.costPrice,
      salePrice: row.salePrice,
      stock: row.stock,
      minimumStock: row.minimumStock,
      sku: deterministicSku,
      unit: row.unit,
      unitsPerPack: row.unitsPerPack
    });
    products = [...products, product];
    created.push(product);
  }

  if (!created.length && !existingProductIds.size && skipped.length) {
    throw new Error(`No se pudo importar ningún producto. ${skipped[0]?.reason ?? "Revisa el archivo."}`);
  }
  await repository.recordAudit({
    tenantId,
    userId: actor.id,
    userName: actor.name,
    action: "bulk_import",
    entity: "product",
    details: { created: created.length, existing: existingProductIds.size, skipped: skipped.length, clientImportId }
  });
  return { created, existingProductIds: [...existingProductIds], skipped };
}
