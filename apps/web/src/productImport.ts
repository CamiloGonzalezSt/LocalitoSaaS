import type { ProductImportIssue, ProductImportRow } from "@localito/shared";

const headerAliases: Record<string, keyof ProductImportRow> = {
  nombre: "name",
  name: "name",
  producto: "name",
  marca: "brand",
  brand: "brand",
  categoria: "category",
  category: "category",
  codigo: "barcode",
  codigo_barras: "barcode",
  barcode: "barcode",
  ean: "barcode",
  costo: "costPrice",
  precio_costo: "costPrice",
  costprice: "costPrice",
  precio: "salePrice",
  precio_venta: "salePrice",
  saleprice: "salePrice",
  stock: "stock",
  existencia: "stock",
  cantidad: "stock",
  minimo: "minimumStock",
  stock_minimo: "minimumStock",
  minimumstock: "minimumStock",
  sku: "sku",
  unidad: "unit",
  unit: "unit",
  unidades_por_pack: "unitsPerPack",
  unitsperpack: "unitsPerPack"
};

function normalizeHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function countDelimiter(line: string, delimiter: string) {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') quoted = !quoted;
    else if (!quoted && line[index] === delimiter) count += 1;
  }
  return count;
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  return [";", ",", "\t"].sort((left, right) => countDelimiter(firstLine, right) - countDelimiter(firstLine, left))[0];
}

function parseDelimited(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseNumber(value: string | undefined) {
  const clean = String(value ?? "").replace(/\s|\$|CLP/gi, "");
  if (!clean) return 0;
  if (clean.includes(",") && clean.includes(".")) return Number(clean.replace(/\./g, "").replace(",", "."));
  if (clean.includes(",")) return Number(clean.replace(",", "."));
  if (/^-?\d{1,3}(\.\d{3})+$/.test(clean)) return Number(clean.replace(/\./g, ""));
  return Number(clean);
}

export async function readProductImportFile(file: File): Promise<ProductImportRow[]> {
  if (file.size > 5_000_000) throw new Error("El archivo es demasiado pesado. El máximo es 5 MB.");
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const matrix = parseDelimited(text, detectDelimiter(text));
  const headerRow = matrix.shift();
  if (!headerRow) throw new Error("El archivo está vacío.");
  const headers = headerRow.map((header) => headerAliases[normalizeHeader(header)]);
  if (!headers.includes("name") || !headers.includes("salePrice")) {
    throw new Error("El archivo debe incluir al menos las columnas nombre y precio.");
  }
  if (matrix.length > 500) throw new Error("El archivo supera el máximo de 500 productos por carga.");
  return matrix.map((values, index) => {
    const raw = Object.fromEntries(headers.flatMap((header, column) => header ? [[header, values[column] ?? ""]] : [])) as Record<keyof ProductImportRow, string>;
    return {
      rowNumber: index + 2,
      name: raw.name?.trim() ?? "",
      brand: raw.brand?.trim() || undefined,
      category: raw.category?.trim() || "General",
      barcode: raw.barcode?.replace(/\.0$/, "").trim() || undefined,
      costPrice: parseNumber(raw.costPrice),
      salePrice: parseNumber(raw.salePrice),
      stock: parseNumber(raw.stock),
      minimumStock: parseNumber(raw.minimumStock),
      sku: raw.sku?.trim() || undefined,
      unit: ["unit", "kg", "gram", "liter", "pack", "box"].includes(raw.unit) ? raw.unit as ProductImportRow["unit"] : "unit",
      unitsPerPack: parseNumber(raw.unitsPerPack) || 1
    };
  });
}

function normalizedProductKey(row: ProductImportRow) {
  const text = [row.brand, row.name].filter(Boolean).join(" ");
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
}

export function validateProductImportRows(rows: ProductImportRow[]) {
  const issues: ProductImportIssue[] = [];
  const seen = new Set<string>();
  const validRows: ProductImportRow[] = [];
  for (const [index, row] of rows.entries()) {
    const rowNumber = row.rowNumber ?? index + 2;
    let reason = "";
    if (!row.name.trim()) reason = "Falta el nombre.";
    else if (!row.category.trim()) reason = "Falta la categoría.";
    else if (!Number.isFinite(row.salePrice) || row.salePrice <= 0) reason = "El precio de venta debe ser mayor que cero.";
    else if ([row.costPrice, row.stock, row.minimumStock].some((value) => value != null && (!Number.isFinite(value) || value < 0))) reason = "Costo, stock y mínimo no pueden ser negativos.";
    const normalizedBarcode = row.barcode?.replace(/\D/g, "");
    const duplicateKey = normalizedBarcode ? `barcode:${normalizedBarcode}` : `name:${normalizedProductKey(row)}`;
    if (!reason && seen.has(duplicateKey)) reason = "Está repetido dentro del archivo.";
    if (reason) issues.push({ rowNumber, name: row.name || undefined, reason });
    else {
      seen.add(duplicateKey);
      validRows.push(row);
    }
  }
  return { validRows, issues };
}

export function downloadProductTemplate(businessType: string) {
  const header = "nombre;marca;categoria;codigo_barras;costo;precio;stock;minimo;sku;unidad;unidades_por_pack";
  const content = `\uFEFF${header}\n`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  link.download = `plantilla-inventario-${businessType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "localito"}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
